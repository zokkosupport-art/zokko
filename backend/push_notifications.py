"""Web Push notifications via VAPID (pywebpush)."""
import asyncio
import json
import logging
import os
from typing import Any, Optional

logger = logging.getLogger("guinee-market")

VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "").strip()
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "").strip()
VAPID_SUBJECT = os.environ.get("VAPID_SUBJECT", "mailto:zokkosupport@zokko.net").strip()


def is_push_configured() -> bool:
    return bool(VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY)


def get_vapid_public_key() -> Optional[str]:
    return VAPID_PUBLIC_KEY or None


async def send_push_to_user(
    db: Any,
    user_id: str,
    title: str,
    body: str,
    *,
    link: Optional[str] = None,
) -> None:
    """Send Web Push to all subscriptions for user_id. No-op if VAPID not configured."""
    if not user_id or not is_push_configured():
        return

    try:
        from pywebpush import WebPushException, webpush
    except ImportError:
        logger.warning("pywebpush not installed — skipping push")
        return

    subs = await db.push_subscriptions.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    if not subs:
        return

    payload = json.dumps({"title": title, "body": body, "link": link or "/"}, ensure_ascii=False)
    vapid_claims = {"sub": VAPID_SUBJECT}
    expired_endpoints: list[str] = []

    for sub in subs:
        subscription_info = {
            "endpoint": sub["endpoint"],
            "keys": {"p256dh": sub["p256dh"], "auth": sub["auth"]},
        }
        try:
            await asyncio.to_thread(
                webpush,
                subscription_info,
                payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=vapid_claims,
                ttl=86400,
            )
        except WebPushException as exc:
            status = getattr(getattr(exc, "response", None), "status_code", None)
            if status in (404, 410):
                expired_endpoints.append(sub["endpoint"])
            else:
                logger.warning("Push failed for user %s: %s", user_id, exc)
        except Exception as exc:
            logger.warning("Push error for user %s: %s", user_id, exc)

    if expired_endpoints:
        await db.push_subscriptions.delete_many(
            {"user_id": user_id, "endpoint": {"$in": expired_endpoints}}
        )
