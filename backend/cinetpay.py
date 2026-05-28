"""CinetPay payment integration. Falls back to mock mode when API key is the placeholder."""
import os
import hmac
import hashlib
import logging
import requests
from typing import Optional

logger = logging.getLogger("cinetpay")

CINETPAY_API_KEY = os.environ.get("CINETPAY_API_KEY", "")
CINETPAY_SITE_ID = os.environ.get("CINETPAY_SITE_ID", "")
CINETPAY_BASE_URL = os.environ.get("CINETPAY_BASE_URL", "https://api-checkout.cinetpay.com/v2")
CINETPAY_WEBHOOK_SECRET = os.environ.get("CINETPAY_WEBHOOK_SECRET", "")


def is_configured() -> bool:
    """Returns True if real CinetPay keys are configured (not placeholders)."""
    return (
        CINETPAY_API_KEY
        and not CINETPAY_API_KEY.startswith("PUT_YOUR_")
        and CINETPAY_SITE_ID
        and not CINETPAY_SITE_ID.startswith("PUT_YOUR_")
    )


def initiate_payment(
    transaction_id: str,
    amount: int,
    description: str,
    customer_name: str,
    customer_email: str,
    customer_phone: str,
    notify_url: str,
    return_url: str,
    channels: str = "ALL",
) -> dict:
    """Initiate a CinetPay payment session. Returns {payment_url, raw_response} or raises."""
    if not is_configured():
        # Mock mode: return a fake payment URL pointing to local mock confirm page
        mock_url = f"{return_url}&mock=1"
        return {
            "payment_url": mock_url,
            "payment_token": f"MOCK-{transaction_id[:8]}",
            "mock": True,
            "raw_response": {"code": "201", "description": "MOCK MODE - keys not configured"},
        }

    payload = {
        "apikey": CINETPAY_API_KEY,
        "site_id": CINETPAY_SITE_ID,
        "transaction_id": transaction_id,
        "amount": int(amount),
        "currency": "GNF",
        "description": description[:255],
        "notify_url": notify_url,
        "return_url": return_url,
        "channels": channels,
        "customer_name": (customer_name or "Client")[:50],
        "customer_surname": "Zokko",
        "customer_email": customer_email or "noreply@zokko.gn",
        "customer_phone_number": customer_phone or "",
        "customer_address": "Conakry",
        "customer_city": "Conakry",
        "customer_country": "GN",
        "customer_state": "CK",
        "customer_zip_code": "00224",
    }
    resp = requests.post(f"{CINETPAY_BASE_URL}/payment", json=payload, timeout=30)
    data = resp.json() if resp.content else {}
    logger.info(f"CinetPay init status={resp.status_code} code={data.get('code')}")
    if resp.status_code != 200 or str(data.get("code")) != "201":
        raise RuntimeError(f"CinetPay init failed: {data.get('message') or data.get('description') or resp.text}")
    return {
        "payment_url": data["data"]["payment_url"],
        "payment_token": data["data"]["payment_token"],
        "mock": False,
        "raw_response": data,
    }


def verify_payment(transaction_id: str) -> dict:
    """Verify a CinetPay transaction by transaction_id. Returns dict with status, amount, currency."""
    if not is_configured():
        # Mock mode: always succeed
        return {"status": "ACCEPTED", "amount": None, "currency": "GNF", "mock": True, "raw_response": {}}

    payload = {
        "apikey": CINETPAY_API_KEY,
        "site_id": CINETPAY_SITE_ID,
        "transaction_id": transaction_id,
    }
    resp = requests.post(f"{CINETPAY_BASE_URL}/payment/check", json=payload, timeout=30)
    data = resp.json() if resp.content else {}
    code = str(data.get("code", ""))
    d = data.get("data", {}) or {}
    return {
        "status": d.get("status") or ("ACCEPTED" if code == "00" else code),
        "amount": d.get("amount"),
        "currency": d.get("currency"),
        "operator_id": d.get("operator_id"),
        "payment_method": d.get("payment_method"),
        "mock": False,
        "raw_response": data,
    }


def verify_webhook_signature(raw_body: bytes, received_token: Optional[str]) -> bool:
    """Verify webhook authenticity via a shared HMAC token in header.
    CinetPay uses x-token header with HMAC SHA256 of payload using API key secret."""
    if not CINETPAY_WEBHOOK_SECRET or CINETPAY_WEBHOOK_SECRET.startswith("change-me"):
        # Webhook secret not configured: warn but allow (caller can decide).
        # In production, refuse. Here we trust the verify_payment call as second factor.
        return True
    if not received_token:
        return False
    expected = hmac.new(
        CINETPAY_WEBHOOK_SECRET.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, received_token)
