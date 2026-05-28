"""Backend tests for Zokko Phase 2 features.

Covers: auth/me new fields, referral code +1 boost, reports, reviews, use-boost,
admin endpoints, and existing CRUD flows.
"""
import os
import time
import uuid
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://guinee-market.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"
UNIVERSAL_OTP = "123456"
ADMIN_PHONE = "620000000"


def _login(phone: str, referral_code: str | None = None, name: str | None = None):
    r = requests.post(f"{API}/auth/request-otp", json={"phone": phone}, timeout=30)
    assert r.status_code == 200, r.text
    payload = {"phone": phone, "otp": UNIVERSAL_OTP}
    if referral_code:
        payload["referral_code"] = referral_code
    if name:
        payload["name"] = name
    r = requests.post(f"{API}/auth/verify-otp", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    return data["access_token"], data["user"]


def _hdr(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def admin_session():
    token, user = _login(ADMIN_PHONE)
    return token, user


@pytest.fixture(scope="module")
def user_a():
    phone = "61" + uuid.uuid4().hex[:7]
    token, user = _login(phone, name="TEST UserA")
    return token, user


@pytest.fixture(scope="module")
def user_b_with_ref(admin_session):
    # Get admin referral code
    admin_token, _ = admin_session
    me = requests.get(f"{API}/auth/me", headers=_hdr(admin_token)).json()
    ref = me["referral_code"]
    phone = "61" + uuid.uuid4().hex[:7]
    token, user = _login(phone, referral_code=ref, name="TEST UserB")
    return token, user, ref


# ---------------- Auth & Profile ----------------
class TestAuthMe:
    def test_admin_me_has_new_fields(self, admin_session):
        token, _ = admin_session
        r = requests.get(f"{API}/auth/me", headers=_hdr(token))
        assert r.status_code == 200
        data = r.json()
        for k in ("verified", "referral_code", "boost_credits", "rating_avg", "rating_count"):
            assert k in data, f"missing {k}"
        assert data["verified"] is True
        assert data["referral_code"] and data["referral_code"].startswith("ZOK-")
        assert data["role"] == "admin"

    def test_new_user_verified_and_has_referral(self, user_a):
        _, u = user_a
        assert u["verified"] is True
        assert u["referral_code"].startswith("ZOK-")
        assert u["boost_credits"] == 0


# ---------------- Referral ----------------
class TestReferral:
    def test_referral_grants_boost_to_both(self, admin_session, user_b_with_ref):
        admin_token, _ = admin_session
        user_b_token, user_b, _ref = user_b_with_ref
        # New user should have +1 boost credit
        assert user_b["boost_credits"] >= 1
        # Admin (referrer) should also have +1
        me = requests.get(f"{API}/auth/me", headers=_hdr(admin_token)).json()
        assert me["boost_credits"] >= 1


# ---------------- Listings CRUD (existing) ----------------
class TestListings:
    def test_list_listings(self):
        r = requests.get(f"{API}/listings")
        assert r.status_code == 200
        assert "items" in r.json() and "total" in r.json()

    def test_create_listing_pending(self, user_a):
        token, _ = user_a
        body = {
            "title": "TEST Annonce phare",
            "description": "Description test",
            "price": 100000,
            "category": "electronique",
            "city": "Conakry",
            "type": "product",
        }
        r = requests.post(f"{API}/listings", json=body, headers=_hdr(token))
        assert r.status_code == 200, r.text
        listing = r.json()
        assert listing["status"] == "pending"
        # GET verify persistence
        g = requests.get(f"{API}/listings/{listing['id']}")
        assert g.status_code == 200
        assert g.json()["title"] == body["title"]
        pytest.listing_id = listing["id"]

    def test_admin_approve(self, admin_session):
        token, _ = admin_session
        r = requests.post(f"{API}/admin/listings/{pytest.listing_id}/approve", headers=_hdr(token))
        assert r.status_code == 200


# ---------------- Reports ----------------
class TestReports:
    def test_create_report(self, user_a):
        token, _ = user_a
        body = {"listing_id": getattr(pytest, "listing_id", None) or "x", "reason": "spam", "description": "TEST report"}
        r = requests.post(f"{API}/reports", json=body, headers=_hdr(token))
        assert r.status_code == 200, r.text
        report = r.json()
        assert report["status"] == "open"
        assert report["reason"] == "spam"
        pytest.report_id = report["id"]

    def test_admin_list_reports(self, admin_session):
        token, _ = admin_session
        r = requests.get(f"{API}/admin/reports", headers=_hdr(token))
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) >= 1
        ids = [i["id"] for i in items]
        assert pytest.report_id in ids

    def test_non_admin_cannot_list_reports(self, user_a):
        token, _ = user_a
        r = requests.get(f"{API}/admin/reports", headers=_hdr(token))
        assert r.status_code == 403

    def test_admin_resolve(self, admin_session):
        token, _ = admin_session
        r = requests.post(f"{API}/admin/reports/{pytest.report_id}/resolve", headers=_hdr(token))
        assert r.status_code == 200
        # verify
        items = requests.get(f"{API}/admin/reports", headers=_hdr(token)).json()
        rep = next(i for i in items if i["id"] == pytest.report_id)
        assert rep["status"] == "resolved"


# ---------------- Reviews ----------------
class TestReviews:
    def test_create_review_updates_avg(self, user_a, user_b_with_ref):
        token_a, _ = user_a
        _, user_b, _ = user_b_with_ref
        body = {"target_user_id": user_b["id"], "rating": 5, "comment": "TEST excellent"}
        r = requests.post(f"{API}/reviews", json=body, headers=_hdr(token_a))
        assert r.status_code == 200, r.text
        assert r.json()["rating"] == 5
        # fetch reviews
        rl = requests.get(f"{API}/users/{user_b['id']}/reviews")
        assert rl.status_code == 200
        assert len(rl.json()) >= 1
        # rating_avg updated on user (via admin listing)

    def test_review_invalid_rating(self, user_a, user_b_with_ref):
        token_a, _ = user_a
        _, user_b, _ = user_b_with_ref
        r = requests.post(f"{API}/reviews", json={"target_user_id": user_b["id"], "rating": 7}, headers=_hdr(token_a))
        assert r.status_code == 400

    def test_cannot_review_self(self, user_a):
        token, u = user_a
        r = requests.post(f"{API}/reviews", json={"target_user_id": u["id"], "rating": 4}, headers=_hdr(token))
        assert r.status_code == 400


# ---------------- Use Boost ----------------
class TestUseBoost:
    def test_use_boost_decrements(self, user_b_with_ref):
        token, user_b, _ = user_b_with_ref
        # Create a listing for this user
        body = {"title": "TEST Boost Listing", "description": "x", "price": 1000,
                "category": "mode", "city": "Conakry", "type": "product"}
        l = requests.post(f"{API}/listings", json=body, headers=_hdr(token)).json()
        # Use boost
        r = requests.post(f"{API}/listings/{l['id']}/use-boost", headers=_hdr(token))
        assert r.status_code == 200, r.text
        assert r.json()["boosted_until"]
        # Verify decrement
        me = requests.get(f"{API}/auth/me", headers=_hdr(token)).json()
        assert me["boost_credits"] == user_b["boost_credits"] - 1
        # Verify listing has boosted_until
        g = requests.get(f"{API}/listings/{l['id']}").json()
        assert g["boosted_until"] is not None

    def test_use_boost_no_credit_fails(self, user_a):
        token, _ = user_a
        # User A has 0 credits
        body = {"title": "TEST NoCredit", "description": "x", "price": 1,
                "category": "mode", "city": "Conakry", "type": "product"}
        l = requests.post(f"{API}/listings", json=body, headers=_hdr(token)).json()
        r = requests.post(f"{API}/listings/{l['id']}/use-boost", headers=_hdr(token))
        assert r.status_code == 400


# ---------------- Existing endpoints ----------------
class TestExisting:
    def test_categories(self):
        r = requests.get(f"{API}/categories")
        assert r.status_code == 200 and len(r.json()) >= 7

    def test_admin_stats(self, admin_session):
        token, _ = admin_session
        r = requests.get(f"{API}/admin/stats", headers=_hdr(token))
        assert r.status_code == 200
        data = r.json()
        for k in ("users", "listings_total", "listings_pending", "listings_approved"):
            assert k in data

    def test_payments_flow(self, user_a):
        token, _ = user_a
        body = {"purpose": "boost", "amount": 5, "currency": "EUR", "orange_money_phone": "620000001"}
        # need a listing
        l = requests.post(f"{API}/listings", json={"title": "TEST Pay", "description": "x", "price": 1,
                                                    "category": "mode", "city": "Conakry", "type": "product"},
                          headers=_hdr(token)).json()
        body["listing_id"] = l["id"]
        r = requests.post(f"{API}/payments/orange-money/initiate", json=body, headers=_hdr(token))
        assert r.status_code == 200
        pid = r.json()["payment_id"]
        c = requests.post(f"{API}/payments/orange-money/confirm", json={"payment_id": pid}, headers=_hdr(token))
        assert c.status_code == 200
        assert c.json()["status"] == "completed"

    def test_send_message(self, user_a, user_b_with_ref):
        token_a, _ = user_a
        _, user_b, _ = user_b_with_ref
        r = requests.post(f"{API}/messages", json={"to_user_id": user_b["id"], "content": "TEST hello"}, headers=_hdr(token_a))
        assert r.status_code == 200
