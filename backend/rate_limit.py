"""Simple rate limiting backed by MongoDB. Production-ready for low/medium scale."""
import os
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

_client = AsyncIOMotorClient(os.environ['MONGO_URL'])
_db = _client[os.environ['DB_NAME']]


async def enforce_limit(key: str, max_requests: int, window_seconds: int, error_msg: str = None):
    """Sliding window rate limit. Raises HTTPException 429 if exceeded.
    `key` should uniquely identify the actor (e.g., f'otp:{phone}', f'msg:{user_id}').
    """
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(seconds=window_seconds)
    # Remove old entries + add new one
    await _db.rate_limit.update_one(
        {"key": key},
        {
            "$pull": {"timestamps": {"$lt": cutoff.isoformat()}},
        },
        upsert=True,
    )
    record = await _db.rate_limit.find_one({"key": key}, {"_id": 0, "timestamps": 1})
    recent = (record or {}).get("timestamps", [])
    if len(recent) >= max_requests:
        raise HTTPException(
            status_code=429,
            detail=error_msg or f"Trop de requêtes. Réessayez dans {window_seconds // 60} min.",
        )
    await _db.rate_limit.update_one(
        {"key": key},
        {"$push": {"timestamps": now.isoformat()}, "$set": {"updated_at": now.isoformat()}},
        upsert=True,
    )
