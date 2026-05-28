"""Simple rate limiting backed by MongoDB. Production-ready for low/medium scale."""
import os
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

_client: Optional[AsyncIOMotorClient] = None
_db = None


def _get_db():
    global _client, _db
    if _db is None:
        url = os.environ.get("MONGO_URL", "").strip()
        name = os.environ.get("DB_NAME", "").strip()
        if not url or not name:
            raise RuntimeError("MONGO_URL and DB_NAME required for rate limiting")
        _client = AsyncIOMotorClient(url)
        _db = _client[name]
    return _db


async def enforce_limit(key: str, max_requests: int, window_seconds: int, error_msg: str = None):
    """Sliding window rate limit. Raises HTTPException 429 if exceeded.
    `key` should uniquely identify the actor (e.g., f'otp:{phone}', f'msg:{user_id}').
    """
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(seconds=window_seconds)
    db = _get_db()
    # Remove old entries + add new one
    await db.rate_limit.update_one(
        {"key": key},
        {
            "$setOnInsert": {"timestamps": []},
            "$pull": {"timestamps": {"$lt": cutoff.isoformat()}},
        },
        upsert=True,
    )
    record = await db.rate_limit.find_one({"key": key}, {"_id": 0, "timestamps": 1})
    recent = (record or {}).get("timestamps") or []
    if not isinstance(recent, list):
        recent = []
    if len(recent) >= max_requests:
        raise HTTPException(
            status_code=429,
            detail=error_msg or f"Trop de requêtes. Réessayez dans {window_seconds // 60} min.",
        )
    await db.rate_limit.update_one(
        {"key": key},
        {"$push": {"timestamps": now.isoformat()}, "$set": {"updated_at": now.isoformat()}},
        upsert=True,
    )
