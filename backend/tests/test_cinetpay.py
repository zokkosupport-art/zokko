"""Backend tests for Zokko Phase 4: CinetPay payment integration (mock mode).

Covers: /payments/cinetpay/config, /initiate, /check/:tx (idempotent),
/webhook (idempotent for already-completed), payment effects on listing & user.
"""
import os
import uuid
import pytest
import requests

def _load_base_url():
    url = os.environ.get("REACT_APP_BACKEND_URL", "").strip()
    if not url:
        try:
            with open("/app/frontend/.env") as f:
                for line in f:
                    if line.startswith("REACT_APP_BACKEND_URL="):
                        url = line.split("=", 1)[1].strip().strip('"').strip("'")
                        break
        except Exception:
            pass
    return url.rstrip("/")


BASE = _load_base_url()
API = f"{BASE}/api"
UNIVERSAL_OTP = "123456"
ADMIN_PHONE = "620000000"


def _login(phone: str, name: str | None = None):
    r = requests.post(f"{API}/auth/request-otp", json={"phone": phone}, timeout=30)
    assert r.status_code == 200, r.text
    payload = {"phone": phone, "otp": UNIVERSAL_OTP}
    if name:
        payload["name"] = name
    r = requests.post(f"{API}/auth/verify-otp", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    return data["access_token"], data["user"]


def _hdr(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def user_session():
    phone = "61" + uuid.uuid4().hex[:7]
    token, user = _login(phone, name="TEST CinetPay User")
    return token, user


@pytest.fixture(scope="module")
def test_listing(user_session):
    """Create a TEST listing owned by user_session for boost/premium tests."""
    token, _ = user_session
    payload = {
        "title": "TEST CinetPay Listing",
        "description": "Listing used by CinetPay tests - safe to delete",
        "category": "vehicules",
        "subcategory": "voitures",
        "price": 5000000,
        "currency": "GNF",
        "city": "Conakry",
        "photos": [],
    }
    r = requests.post(f"{API}/listings", json=payload, headers=_hdr(token), timeout=30)
    assert r.status_code in (200, 201), r.text
    return r.json()


# ---------------- Config ----------------
class TestConfig:
    def test_config_public(self):
        r = requests.get(f"{API}/payments/cinetpay/config", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["configured"] is False  # placeholder keys
        assert data["currency"] == "GNF"
        assert data["prices_gnf"]["boost"] == 10000
        assert data["prices_gnf"]["premium"] == 20000
        assert data["prices_gnf"]["pro_subscription"] == 50000
        assert "labels" in data


# ---------------- Initiate ----------------
class TestInitiate:
    def test_initiate_requires_auth(self):
        r = requests.post(f"{API}/payments/cinetpay/initiate", json={"purpose": "boost"}, timeout=30)
        assert r.status_code in (401, 403)

    def test_initiate_wrong_purpose_returns_400(self, user_session):
        token, _ = user_session
        r = requests.post(
            f"{API}/payments/cinetpay/initiate",
            json={"purpose": "invalid_purpose"},
            headers=_hdr(token),
            timeout=30,
        )
        assert r.status_code == 400, r.text

    def test_initiate_boost_returns_mock_payment_url(self, user_session, test_listing):
        token, _ = user_session
        r = requests.post(
            f"{API}/payments/cinetpay/initiate",
            json={"purpose": "boost", "listing_id": test_listing["id"], "channels": "ALL"},
            headers=_hdr(token),
            timeout=30,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["mock"] is True
        assert data["amount"] == 10000
        assert data["currency"] == "GNF"
        assert "payment_url" in data and data["payment_url"]
        assert "mock=1" in data["payment_url"]
        assert data["transaction_id"].startswith("ZOK-")


# ---------------- Check (idempotent) + Boost effect ----------------
class TestCheckBoost:
    def test_check_activates_boost_and_idempotent(self, user_session, test_listing):
        token, _ = user_session
        # 1. Initiate
        r = requests.post(
            f"{API}/payments/cinetpay/initiate",
            json={"purpose": "boost", "listing_id": test_listing["id"]},
            headers=_hdr(token),
            timeout=30,
        )
        assert r.status_code == 200
        tx = r.json()["transaction_id"]

        # 2. First check -> should complete and apply effect
        r1 = requests.post(f"{API}/payments/cinetpay/check/{tx}", headers=_hdr(token), timeout=30)
        assert r1.status_code == 200, r1.text
        d1 = r1.json()
        assert d1["status"] == "completed"
        assert d1["transaction_ref"] == tx
        assert d1["amount"] == 10000

        # 3. Verify listing was boosted
        listing = requests.get(f"{API}/listings/{test_listing['id']}", timeout=30).json()
        assert listing.get("boosted_until"), "boosted_until should be set"
        assert listing["status"] == "approved"

        # 4. Second check -> idempotent, still completed (no re-applying)
        r2 = requests.post(f"{API}/payments/cinetpay/check/{tx}", headers=_hdr(token), timeout=30)
        assert r2.status_code == 200
        d2 = r2.json()
        assert d2["status"] == "completed"
        assert d2["transaction_ref"] == tx


# ---------------- Premium effect ----------------
class TestPremium:
    def test_check_activates_premium(self, user_session, test_listing):
        token, _ = user_session
        r = requests.post(
            f"{API}/payments/cinetpay/initiate",
            json={"purpose": "premium", "listing_id": test_listing["id"]},
            headers=_hdr(token),
            timeout=30,
        )
        assert r.status_code == 200
        tx = r.json()["transaction_id"]
        r1 = requests.post(f"{API}/payments/cinetpay/check/{tx}", headers=_hdr(token), timeout=30)
        assert r1.status_code == 200
        assert r1.json()["status"] == "completed"

        listing = requests.get(f"{API}/listings/{test_listing['id']}", timeout=30).json()
        assert listing.get("premium") is True


# ---------------- Pro subscription effect ----------------
class TestProSubscription:
    def test_check_activates_pro(self, user_session):
        token, _ = user_session
        r = requests.post(
            f"{API}/payments/cinetpay/initiate",
            json={"purpose": "pro_subscription"},
            headers=_hdr(token),
            timeout=30,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["amount"] == 50000
        tx = d["transaction_id"]

        r1 = requests.post(f"{API}/payments/cinetpay/check/{tx}", headers=_hdr(token), timeout=30)
        assert r1.status_code == 200
        assert r1.json()["status"] == "completed"

        # Verify user.is_pro=true
        me = requests.get(f"{API}/auth/me", headers=_hdr(token), timeout=30).json()
        assert me.get("is_pro") is True
        # Note: pro_until is set in DB but not exposed by public_user; do not assert here


# ---------------- Webhook (idempotent) ----------------
class TestWebhook:
    def test_webhook_already_processed_for_completed_payment(self, user_session, test_listing):
        token, _ = user_session
        # Create + complete a payment
        r = requests.post(
            f"{API}/payments/cinetpay/initiate",
            json={"purpose": "boost", "listing_id": test_listing["id"]},
            headers=_hdr(token),
            timeout=30,
        )
        tx = r.json()["transaction_id"]
        # Complete via check
        rc = requests.post(f"{API}/payments/cinetpay/check/{tx}", headers=_hdr(token), timeout=30)
        assert rc.status_code == 200
        assert rc.json()["status"] == "completed"

        # Now fire webhook -> already_processed
        wh = requests.post(
            f"{API}/payments/cinetpay/webhook",
            json={"cpm_trans_id": tx},
            timeout=30,
        )
        assert wh.status_code == 200, wh.text
        data = wh.json()
        assert data.get("already_processed") is True

    def test_webhook_missing_tx_returns_400(self):
        r = requests.post(f"{API}/payments/cinetpay/webhook", json={}, timeout=30)
        assert r.status_code == 400


# ---------------- /payments/me lists CinetPay payments ----------------
class TestPaymentsHistory:
    def test_payments_me_contains_cinetpay(self, user_session):
        token, _ = user_session
        r = requests.get(f"{API}/payments/me", headers=_hdr(token), timeout=30)
        assert r.status_code == 200
        items = r.json()
        cp = [p for p in items if p.get("provider") == "cinetpay"]
        assert len(cp) >= 1, "Expected at least one CinetPay payment"
        sample = cp[0]
        assert sample["currency"] == "GNF"
        assert sample.get("mock") is True
        assert sample["transaction_ref"].startswith("ZOK-")
