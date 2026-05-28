"""SMS OTP delivery via Twilio (Guinea +224 and France +33)."""
import logging
import os

import requests

logger = logging.getLogger("zokko-sms")

TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.environ.get("TWILIO_FROM_NUMBER", "")


def is_configured() -> bool:
    return bool(
        TWILIO_ACCOUNT_SID
        and TWILIO_AUTH_TOKEN
        and TWILIO_FROM_NUMBER
        and not TWILIO_ACCOUNT_SID.startswith("PUT_YOUR_")
    )


def send_otp_sms(to_e164_digits: str, otp: str) -> bool:
    """Send OTP SMS. `to_e164_digits` without '+' (e.g. 33659497111)."""
    if not is_configured():
        logger.warning("Twilio not configured — SMS not sent")
        return False

    to_number = f"+{to_e164_digits}"
    body = f"Votre code Zokko : {otp}. Valide 10 minutes. Ne le partagez pas."
    url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
    try:
        resp = requests.post(
            url,
            auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
            data={"To": to_number, "From": TWILIO_FROM_NUMBER, "Body": body},
            timeout=30,
        )
        if resp.status_code >= 400:
            logger.error("Twilio SMS failed: %s %s", resp.status_code, resp.text[:300])
            return False
        logger.info("OTP SMS sent to %s", to_number[-4:].rjust(len(to_number), "*"))
        return True
    except Exception as e:
        logger.error("Twilio SMS error: %s", e)
        return False
