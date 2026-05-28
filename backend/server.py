"""GuinéeMarket backend - FastAPI + MongoDB."""
print("ZOKKO_BOOT: importing server.py", flush=True)
from dotenv import load_dotenv
from pathlib import Path
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import io
import uuid
import asyncio
import logging
import secrets
from contextlib import asynccontextmanager, suppress
import jwt
import bcrypt
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File, Header, Query, Response
from fastapi.responses import StreamingResponse, HTMLResponse, JSONResponse
from pymongo.errors import PyMongoError
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

import cinetpay
import sms
import storage
from phone_utils import normalize_phone, phone_lookup_keys, format_phone_display
from rate_limit import enforce_limit

logger = logging.getLogger("guinee-market")
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# ---------------- MongoDB (lazy — import must not crash if env missing; start.sh validates) ----------------
_mongo_client: Optional[AsyncIOMotorClient] = None
_db = None


def _mongo_url() -> str:
    url = os.environ.get("MONGO_URL", "").strip()
    if not url:
        raise RuntimeError("MONGO_URL is not set")
    return url


def _db_name() -> str:
    name = os.environ.get("DB_NAME", "").strip()
    if not name:
        raise RuntimeError("DB_NAME is not set")
    return name


def get_db():
    global _mongo_client, _db
    if _db is None:
        _mongo_client = AsyncIOMotorClient(_mongo_url())
        _db = _mongo_client[_db_name()]
    return _db


class _DbProxy:
    """Defer Motor connection until first DB use (after uvicorn binds)."""

    def __getattr__(self, name):
        return getattr(get_db(), name)


db = _DbProxy()

# ---------------- Constants --------------
JWT_SECRET = os.environ.get("JWT_SECRET") or ""
JWT_ALGORITHM = "HS256"
ADMIN_NAME = os.environ.get('ADMIN_NAME', 'Admin Zokko')
APP_NAME = os.environ.get('APP_NAME', 'zokko')
OTP_DEV_MODE = os.environ.get("OTP_DEV_MODE", "true").lower() in ("1", "true", "yes")
FRONTEND_BUILD = Path(os.environ.get("FRONTEND_BUILD", ROOT_DIR.parent / "frontend" / "build"))
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin").strip().lower()
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "300890")


def _parse_admin_phones() -> List[str]:
    raw = os.environ.get("ADMIN_PHONES") or os.environ.get("ADMIN_PHONE", "612516488,659497111")
    phones = []
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        country = "FR" if part.startswith("33") or part.startswith("+33") or part.startswith("0") else "GN"
        phones.append(normalize_phone(part, country))
    return list(dict.fromkeys(phones))


ADMIN_PHONES = _parse_admin_phones()
ADMIN_PHONE = ADMIN_PHONES[0] if ADMIN_PHONES else normalize_phone("612516488", "GN")
ORANGE_MONEY_NUMBER = os.environ.get('ORANGE_MONEY_NUMBER', '+224612516488')
ORANGE_MONEY_HOLDER = os.environ.get('ORANGE_MONEY_HOLDER', 'Zokko')
AUTO_APPROVE_LISTINGS = os.environ.get("AUTO_APPROVE_LISTINGS", "false").lower() in ("1", "true", "yes")

_DEFAULT_CORS_ORIGINS = [
    "https://zokko-production.up.railway.app",
    "https://zokko.net",
    "https://www.zokko.net",
    "http://localhost:3000",
]


def _cors_origins() -> List[str]:
    raw = os.environ.get("CORS_ORIGINS", "").strip()
    if not raw:
        return _DEFAULT_CORS_ORIGINS
    if raw == "*":
        return ["*"]
    return [o.strip() for o in raw.split(",") if o.strip()]

CATEGORIES = [
    {"slug": "immobilier", "name": "Immobilier", "icon": "House"},
    {"slug": "vehicules", "name": "Véhicules", "icon": "Car"},
    {"slug": "electronique", "name": "Électronique", "icon": "DeviceMobile"},
    {"slug": "mode", "name": "Mode", "icon": "TShirt"},
    {"slug": "services", "name": "Services", "icon": "Wrench"},
    {"slug": "emploi", "name": "Emploi", "icon": "Briefcase"},
    {"slug": "alimentation", "name": "Alimentation", "icon": "ForkKnife"},
]

GUINEA_CITIES = ["Conakry", "Kankan", "Labé", "Kindia", "Nzérékoré", "Boké", "Faranah", "Mamou", "Siguiri", "Kissidougou"]

def init_storage():
    return storage.init_storage()

def put_object(path: str, data: bytes, content_type: str) -> dict:
    return storage.put_object(path, data, content_type)

def get_object(path: str):
    return storage.get_object(path)

# ---------------- Models ----------------
class OTPRequest(BaseModel):
    phone: str
    country: str = "GN"  # GN | FR

class OTPVerify(BaseModel):
    phone: str
    otp: str
    country: str = "GN"
    name: Optional[str] = None
    city: Optional[str] = None
    referral_code: Optional[str] = None

class AdminLogin(BaseModel):
    username: str
    password: str

class PhoneCheck(BaseModel):
    phone: str
    country: str = "GN"

class PhonePinAuth(BaseModel):
    phone: str
    country: str = "GN"
    pin: str
    pin_confirm: Optional[str] = None
    name: Optional[str] = None
    username: Optional[str] = None
    city: Optional[str] = "Conakry"
    referral_code: Optional[str] = None
    account_type: Optional[str] = "particulier"  # particulier | entreprise
    avatar: Optional[str] = None  # storage path after upload

class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    city: Optional[str] = None
    quartier: Optional[str] = None
    whatsapp: Optional[str] = None
    avatar: Optional[str] = None
    is_pro: Optional[bool] = None

class ListingCreate(BaseModel):
    title: str
    description: str
    price: float
    currency: str = "GNF"
    category: str
    city: str
    quartier: Optional[str] = ""
    photos: List[str] = []  # storage paths
    type: str = "product"  # product | service
    whatsapp: Optional[str] = ""

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    city: Optional[str] = None
    quartier: Optional[str] = None
    photos: Optional[List[str]] = None
    whatsapp: Optional[str] = None
    status: Optional[str] = None

class MessageCreate(BaseModel):
    to_user_id: str
    listing_id: Optional[str] = None
    content: str

class PaymentInitiate(BaseModel):
    purpose: str  # premium | boost | pro_subscription
    listing_id: Optional[str] = None
    amount: float  # in EUR or GNF
    currency: str = "EUR"
    orange_money_phone: str

class CinetPayInitiate(BaseModel):
    purpose: str  # premium | boost | pro_subscription
    listing_id: Optional[str] = None
    channels: str = "ALL"  # ALL | MOBILE_MONEY | CREDIT_CARD | WALLET

class ManualOMSubmit(BaseModel):
    purpose: str  # premium | boost | pro_subscription
    listing_id: Optional[str] = None
    sender_phone: str  # phone used to pay
    transaction_code: str  # OM transaction code
    proof_image_path: Optional[str] = None  # uploaded screenshot storage path

class PaymentConfirm(BaseModel):
    payment_id: str

class ReportCreate(BaseModel):
    listing_id: Optional[str] = None
    reported_user_id: Optional[str] = None
    reason: str
    description: Optional[str] = ""

class ReviewCreate(BaseModel):
    target_user_id: str
    listing_id: Optional[str] = None
    rating: int  # 1-5
    comment: Optional[str] = ""

# Demo listing cover URLs (used at seed + backfill when photos are empty)
DEMO_LISTING_PHOTOS = {
    "Toyota": "https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Appartement": "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800",
    "iPhone": "https://images.pexels.com/photos/4158/apple-iphone-smartphone-desk.jpg?auto=compress&cs=tinysrgb&w=800",
    "Coiffure": "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Bazin": "https://images.pexels.com/photos/29168547/pexels-photo-29168547.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Livraison": "https://images.pexels.com/photos/4391470/pexels-photo-4391470.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Riz": "https://images.pexels.com/photos/4113899/pexels-photo-4113899.jpeg?auto=compress&cs=tinysrgb&w=800",
    "Chauffeur": "https://images.pexels.com/photos/4484078/pexels-photo-4484078.jpeg?auto=compress&cs=tinysrgb&w=800",
}

def demo_photo_for_title(title: str) -> List[str]:
    for key, url in DEMO_LISTING_PHOTOS.items():
        if key.lower() in title.lower():
            return [url]
    return []


async def backfill_demo_listing_photos():
    """Ensure seeded demo ads show thumbnails in listing grids."""
    patched = 0
    async for listing in db.listings.find({"$or": [{"photos": {"$exists": False}}, {"photos": []}, {"photos": None}]}):
        urls = demo_photo_for_title(listing.get("title", ""))
        if urls:
            await db.listings.update_one({"id": listing["id"]}, {"$set": {"photos": urls, "updated_at": now_iso()}})
            patched += 1
    if patched:
        logger.info(f"Backfilled photos on {patched} demo listing(s)")


# ---------------- Helpers ----------------
def now_iso():
    return datetime.now(timezone.utc).isoformat()

def create_jwt(user_id: str, role: str) -> str:
    if not JWT_SECRET or len(JWT_SECRET) < 16:
        raise HTTPException(503, "JWT_SECRET manquant ou trop court sur le serveur")
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def is_admin_phone(normalized: str) -> bool:
    if not normalized:
        return False
    keys = set(phone_lookup_keys(normalized))
    for ap in ADMIN_PHONES:
        if keys & set(phone_lookup_keys(ap)):
            return True
    return False


async def find_user_by_phone(normalized: str):
    for key in phone_lookup_keys(normalized):
        user = await db.users.find_one({"phone": key}, {"_id": 0})
        if user:
            return user
    alias = await db.admin_phone_aliases.find_one({"phone": normalized}, {"_id": 0})
    if alias:
        return await db.users.find_one({"id": alias["user_id"]}, {"_id": 0})
    return None


async def get_admin_primary_user():
    for ap in ADMIN_PHONES:
        user = await find_user_by_phone(ap)
        if user and user.get("role") == "admin":
            return user
    return None


async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Non authentifié")
    token = authorization[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expirée")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    if user.get("blocked"):
        raise HTTPException(status_code=403, detail="Compte bloqué")
    return user

async def get_admin_user(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès admin requis")
    return user

def normalize_username(raw: Optional[str]) -> Optional[str]:
    if not raw or not str(raw).strip():
        return None
    u = re.sub(r"[^a-z0-9_]", "", str(raw).strip().lower().replace(" ", "_"))
    if len(u) < 3 or len(u) > 24:
        raise HTTPException(400, "Identifiant : 3 à 24 caractères (lettres, chiffres, _)")
    return u


def public_user(u: dict) -> dict:
    return {
        "id": u["id"], "name": u.get("name"), "username": u.get("username"),
        "phone": u.get("phone"), "avatar": u.get("avatar"),
        "city": u.get("city"), "quartier": u.get("quartier"),
        "whatsapp": u.get("whatsapp"), "is_pro": u.get("is_pro", False),
        "pro_until": u.get("pro_until"),
        "role": u.get("role", "user"), "created_at": u.get("created_at"),
        "blocked": u.get("blocked", False),
        "verified": u.get("verified", False),
        "account_type": u.get("account_type", "particulier"),
        "referral_code": u.get("referral_code"),
        "boost_credits": u.get("boost_credits", 0),
        "rating_avg": u.get("rating_avg", 0),
        "rating_count": u.get("rating_count", 0),
    }

def gen_referral_code() -> str:
    return f"ZOK-{uuid.uuid4().hex[:5].upper()}"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    if not password or not password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except ValueError:
        return False


def normalize_pin(pin: str) -> str:
    p = re.sub(r"\D", "", pin or "")
    if len(p) != 6:
        raise HTTPException(400, "Code à 6 chiffres requis")
    return p


def require_guinea_user_country(country: str):
    if (country or "GN").upper() != "GN":
        raise HTTPException(400, "Zokko est réservé aux numéros guinéens (+224)")

# ---------------- App ----------------
api = APIRouter(prefix="/api")


async def _run_startup():
    try:
        await _initialize_app()
    except Exception as e:
        logger.exception("Startup initialization failed (app remains up for health): %s", e)


async def _initialize_app():
    # Indexes
    await db.users.create_index("phone", unique=True)
    await db.users.create_index("id", unique=True)
    await db.users.create_index("referral_code", sparse=True)
    await db.users.create_index("admin_username", sparse=True, unique=True)
    await db.users.create_index("username", sparse=True, unique=True)
    await db.listings.create_index("id", unique=True)
    await db.listings.create_index("owner_id")
    await db.listings.create_index("category")
    await db.listings.create_index("city")
    await db.messages.create_index("conversation_key")
    await db.payments.create_index("user_id")
    await db.reports.create_index("created_at")
    await db.reviews.create_index([("from_user_id", 1), ("target_user_id", 1)], unique=True)
    await db.admin_phone_aliases.create_index("phone", unique=True)
    # Init storage (non-blocking on failure)
    try:
        storage.init_storage()
    except Exception as e:
        logger.warning(f"Storage not available at startup: {e}")
    # Seed / sync admin account (Guinea + optional France alias)
    admin_user = await get_admin_primary_user()
    legacy_admin = await db.users.find_one({"phone": "620000000"}, {"_id": 0})
    if not admin_user and legacy_admin:
        await db.users.update_one(
            {"id": legacy_admin["id"]},
            {"$set": {"phone": ADMIN_PHONE, "name": ADMIN_NAME, "role": "admin", "verified": True, "whatsapp": ADMIN_PHONE[3:] if ADMIN_PHONE.startswith("224") else ADMIN_PHONE}},
        )
        admin_user = await db.users.find_one({"id": legacy_admin["id"]}, {"_id": 0})
    if not admin_user:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "phone": ADMIN_PHONE,
            "name": ADMIN_NAME,
            "role": "admin",
            "city": "Conakry",
            "is_pro": True,
            "blocked": False,
            "verified": True,
            "referral_code": gen_referral_code(),
            "boost_credits": 0,
            "rating_avg": 0,
            "rating_count": 0,
            "whatsapp": ADMIN_PHONE[3:] if ADMIN_PHONE.startswith("224") else ADMIN_PHONE,
            "created_at": now_iso(),
        })
        admin_user = await db.users.find_one({"phone": ADMIN_PHONE}, {"_id": 0})
        logger.info(f"Admin seeded: {ADMIN_PHONE}")
    else:
        upd = {"role": "admin", "verified": True, "name": ADMIN_NAME}
        if not admin_user.get("referral_code"):
            upd["referral_code"] = gen_referral_code()
        await db.users.update_one({"id": admin_user["id"]}, {"$set": upd})

    if ADMIN_PASSWORD:
        await db.users.update_one(
            {"id": admin_user["id"]},
            {"$set": {
                "admin_username": ADMIN_USERNAME,
                "password_hash": hash_password(ADMIN_PASSWORD),
            }},
        )
        logger.info(f"Admin login synced for username: {ADMIN_USERNAME}")

    for alt in ADMIN_PHONES[1:]:
        await db.admin_phone_aliases.update_one(
            {"phone": alt},
            {"$set": {"phone": alt, "user_id": admin_user["id"], "updated_at": now_iso()}},
            upsert=True,
        )
        logger.info(f"Admin alias phone linked: {alt}")
    # Seed demo listings
    if await db.listings.count_documents({}) == 0:
        admin = admin_user or await db.users.find_one({"role": "admin"}, {"_id": 0})
        demo = [
            {"title": "Toyota Corolla 2015 - Excellent état", "description": "Voiture en bon état, climatisation, vitres électriques. Faible kilométrage.", "price": 75000000, "category": "vehicules", "city": "Conakry", "quartier": "Kaloum", "type": "product", "photos": demo_photo_for_title("Toyota Corolla 2015 - Excellent état")},
            {"title": "Appartement 3 pièces à louer", "description": "Bel appartement meublé à Kipé, sécurisé, eau et électricité 24/24.", "price": 4500000, "category": "immobilier", "city": "Conakry", "quartier": "Kipé", "type": "product", "photos": demo_photo_for_title("Appartement 3 pièces à louer")},
            {"title": "iPhone 13 - Comme neuf", "description": "iPhone 13 128Go, garantie restante, avec accessoires originaux.", "price": 8500000, "category": "electronique", "city": "Conakry", "quartier": "Ratoma", "type": "product", "photos": demo_photo_for_title("iPhone 13 - Comme neuf")},
            {"title": "Coiffure à domicile - Mariages", "description": "Coiffeuse professionnelle, déplacements à domicile, mariages et événements.", "price": 500000, "category": "services", "city": "Conakry", "quartier": "Matam", "type": "service", "photos": demo_photo_for_title("Coiffure à domicile - Mariages")},
            {"title": "Robe traditionnelle Bazin", "description": "Tenue traditionnelle Bazin riche, couture sur mesure, qualité supérieure.", "price": 850000, "category": "mode", "city": "Kankan", "quartier": "Centre", "type": "product", "photos": demo_photo_for_title("Robe traditionnelle Bazin")},
            {"title": "Livraison de courses - Conakry", "description": "Service de livraison rapide partout à Conakry. Moto disponible 7/7.", "price": 50000, "category": "services", "city": "Conakry", "quartier": "Dixinn", "type": "service", "photos": demo_photo_for_title("Livraison de courses - Conakry")},
            {"title": "Riz local 50kg", "description": "Riz produit en Guinée, qualité premium. Disponible immédiatement.", "price": 400000, "category": "alimentation", "city": "Faranah", "quartier": "Marché central", "type": "product", "photos": demo_photo_for_title("Riz local 50kg")},
            {"title": "Chauffeur recherché - Permis B", "description": "Société cherche chauffeur expérimenté pour véhicules légers. CDI.", "price": 3000000, "category": "emploi", "city": "Conakry", "quartier": "Almamya", "type": "service", "photos": demo_photo_for_title("Chauffeur recherché - Permis B")},
        ]
        for d in demo:
            d["id"] = str(uuid.uuid4())
            d["owner_id"] = admin["id"]
            d["owner_name"] = ADMIN_NAME
            d["currency"] = "GNF"
            d["status"] = "approved"
            d["boosted_until"] = None
            d["premium"] = False
            d["views"] = secrets.randbelow(491) + 10
            d["whatsapp"] = ADMIN_PHONE
            d["created_at"] = now_iso()
            d["updated_at"] = now_iso()
            await db.listings.insert_one(d)
        logger.info(f"Seeded {len(demo)} demo listings")
    await backfill_demo_listing_photos()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_task = asyncio.create_task(_run_startup())
    yield
    if not init_task.done():
        init_task.cancel()
        with suppress(asyncio.CancelledError):
            await init_task
    if _mongo_client is not None:
        _mongo_client.close()


app = FastAPI(title="GuinéeMarket API", lifespan=lifespan)


@app.exception_handler(RuntimeError)
async def runtime_error_handler(request: Request, exc: RuntimeError):
    if "MONGO" in str(exc).upper() or "DB_NAME" in str(exc).upper():
        logger.error("DB config error: %s", exc)
        return JSONResponse(status_code=503, content={"detail": "Base de données non configurée (MONGO_URL / DB_NAME)"})
    logger.exception("RuntimeError")
    return JSONResponse(status_code=500, content={"detail": "Erreur serveur"})


@app.exception_handler(PyMongoError)
async def mongo_error_handler(request: Request, exc: PyMongoError):
    logger.error("MongoDB error on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=503,
        content={"detail": "Base de données inaccessible. Vérifiez MONGO_URL sur Railway et Atlas (IP 0.0.0.0/0)."},
    )


@app.get("/health")
@app.head("/health")
async def health():
    """Liveness for Railway — must not depend on Mongo or startup task."""
    return {"status": "ok", "service": APP_NAME}


@app.get("/health/db")
async def health_db():
    """Diagnostic MongoDB (Railway / Atlas)."""
    if not os.environ.get("MONGO_URL", "").strip():
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "detail": "MONGO_URL is not set",
                "hint": "Railway → service zokko → Variables → Raw Editor : une ligne par variable, sans texte en plus.",
            },
        )
    try:
        await get_db().command("ping")
        users = await db.users.count_documents({})
        return {"status": "ok", "db": _db_name(), "users": users}
    except RuntimeError as e:
        return JSONResponse(status_code=503, content={"status": "error", "detail": str(e)})
    except PyMongoError as e:
        return JSONResponse(
            status_code=503,
            content={"status": "error", "detail": "MongoDB injoignable", "type": type(e).__name__},
        )


@app.get("/health/env")
async def health_env():
    """Vérifie que Railway injecte les variables (sans afficher les secrets)."""
    mongo = os.environ.get("MONGO_URL", "").strip()
    zokko_keys = sorted(
        k for k in os.environ
        if k.startswith(("MONGO_", "DB_", "JWT_", "ADMIN_", "STORAGE_", "OTP_", "CORS_", "FRONTEND_"))
    )
    return {
        "MONGO_URL_set": bool(mongo),
        "MONGO_URL_length": len(mongo),
        "DB_NAME": os.environ.get("DB_NAME", "").strip() or None,
        "JWT_SECRET_set": len(os.environ.get("JWT_SECRET", "").strip()) >= 16,
        "ADMIN_PASSWORD_set": bool(os.environ.get("ADMIN_PASSWORD", "").strip()),
        "PORT": os.environ.get("PORT"),
        "RAILWAY_ENVIRONMENT": os.environ.get("RAILWAY_ENVIRONMENT"),
        "zokko_env_keys_found": zokko_keys,
        "hint": (
            "Si tout est vide : Variables sur le service zokko (pas Shared seul), "
            "bouton + New Variable, puis Redeploy."
        ),
    }


@app.get("/api")
async def api_root_no_slash():
    return {"name": "GuinéeMarket API", "version": "1.0.0"}

# ---------------- Auth ----------------
@api.post("/auth/check-phone")
async def check_phone(body: PhoneCheck):
    require_guinea_user_country(body.country)
    phone = normalize_phone(body.phone, body.country)
    if not phone or len(phone) < 9:
        raise HTTPException(400, "Numéro de téléphone invalide")
    if is_admin_phone(phone):
        raise HTTPException(400, "Connexion admin via /admin-login")
    user = await find_user_by_phone(phone)
    has_pin = bool(user and user.get("pin_hash"))
    return {"exists": bool(user), "has_pin": has_pin}

@api.post("/auth/phone-pin")
async def phone_pin_auth(body: PhonePinAuth):
    require_guinea_user_country(body.country)
    phone = normalize_phone(body.phone, body.country)
    if not phone or len(phone) < 9:
        raise HTTPException(400, "Numéro de téléphone invalide")
    if is_admin_phone(phone):
        raise HTTPException(400, "Connexion admin via /admin-login")
    pin = normalize_pin(body.pin)
    await _safe_rate_limit(
        f"pin:{phone}", max_requests=15, window_seconds=3600,
        error_msg="Trop de tentatives. Réessayez dans 1 heure.",
    )
    user = await find_user_by_phone(phone)
    is_new = user is None

    if user:
        if user.get("role") == "admin":
            raise HTTPException(400, "Connexion admin via /admin-login")
        if user.get("blocked"):
            raise HTTPException(403, "Compte bloqué")
        if not user.get("pin_hash"):
            confirm = normalize_pin(body.pin_confirm or "")
            if pin != confirm:
                raise HTTPException(400, "Confirmez votre code à 6 chiffres")
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"pin_hash": hash_password(pin), "verified": True}},
            )
            user["pin_hash"] = hash_password(pin)
            user["verified"] = True
        elif not verify_password(pin, user.get("pin_hash", "")):
            raise HTTPException(401, "Code incorrect")
    else:
        if not body.name or len(body.name.strip()) < 2:
            raise HTTPException(400, "Nom requis pour créer un compte")
        confirm = normalize_pin(body.pin_confirm or "")
        if pin != confirm:
            raise HTTPException(400, "Les deux codes doivent être identiques")
        is_business = (body.account_type or "").strip().lower() in ("entreprise", "business", "pro")
        username = normalize_username(body.username)
        if username:
            taken = await db.users.find_one({"username": username}, {"_id": 1})
            if taken:
                raise HTTPException(400, "Cet identifiant est déjà pris")
        user = {
            "id": str(uuid.uuid4()),
            "phone": phone,
            "name": body.name.strip(),
            "username": username,
            "avatar": (body.avatar or "").strip() or None,
            "city": body.city or "Conakry",
            "quartier": "",
            "whatsapp": phone[3:] if phone.startswith("224") else phone,
            "role": "user",
            "account_type": "entreprise" if is_business else "particulier",
            "is_pro": is_business,
            "blocked": False,
            "verified": True,
            "pin_hash": hash_password(pin),
            "referral_code": gen_referral_code(),
            "referred_by": None,
            "boost_credits": 0,
            "rating_avg": 0,
            "rating_count": 0,
            "created_at": now_iso(),
        }
        if body.referral_code:
            ref_code = body.referral_code.strip().upper()
            referrer = await db.users.find_one({"referral_code": ref_code})
            if referrer:
                user["referred_by"] = referrer["id"]
                user["boost_credits"] = 1
                await db.users.update_one({"id": referrer["id"]}, {"$inc": {"boost_credits": 1}})
        await db.users.insert_one(user)
        user.pop("_id", None)

    token = create_jwt(user["id"], user.get("role", "user"))
    return {"access_token": token, "token_type": "bearer", "user": public_user(user), "is_new": is_new}

@api.post("/auth/request-otp")
async def request_otp(body: OTPRequest):
    require_guinea_user_country(body.country)
    phone = normalize_phone(body.phone, body.country)
    if not phone or len(phone) < 9:
        raise HTTPException(400, "Numéro de téléphone invalide")
    if is_admin_phone(phone):
        raise HTTPException(400, "Connexion admin via /admin-login (identifiant + mot de passe)")
    await _safe_rate_limit(
        f"otp:{phone}", max_requests=3, window_seconds=3600,
        error_msg="Trop de demandes de code. Réessayez dans 1 heure.",
    )
    otp = f"{secrets.randbelow(900000) + 100000}"
    expires = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    await db.otp_codes.update_one(
        {"phone": phone},
        {"$set": {"phone": phone, "otp": otp, "expires_at": expires, "created_at": now_iso()}},
        upsert=True,
    )
    sent = sms.send_otp_sms(phone, otp)
    logger.info(f"OTP for {phone}: {'SMS sent' if sent else 'dev/log only'}")
    payload = {
        "success": True,
        "sms_sent": sent,
        "message": f"Code envoyé par SMS au {format_phone_display(phone)}" if sent else "Code OTP généré",
    }
    if OTP_DEV_MODE and not sent:
        payload["dev_otp"] = otp
        payload["message"] = "Mode test — code affiché à l'écran (SMS désactivé pour le moment)"
    return payload

async def _safe_rate_limit(key: str, max_requests: int, window_seconds: int, error_msg: str = None):
    """Rate limit when Mongo is ready; never block login if rate_limit collection fails."""
    try:
        await enforce_limit(key, max_requests, window_seconds, error_msg=error_msg)
    except PyMongoError as e:
        logger.warning("Rate limit skipped (%s): %s", key, e)
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("Rate limit skipped (%s): %s", key, e)


@api.post("/auth/admin-login")
async def admin_login(body: AdminLogin):
    username = (body.username or "").strip().lower()
    if not username or not body.password:
        raise HTTPException(400, "Identifiant et mot de passe requis")
    await _safe_rate_limit(
        f"admin-login:{username}", max_requests=10, window_seconds=3600,
        error_msg="Trop de tentatives. Réessayez dans 1 heure.",
    )
    user = await db.users.find_one({"admin_username": username, "role": "admin"}, {"_id": 0})
    if not user:
        raise HTTPException(401, "Identifiant ou mot de passe incorrect")
    if user.get("blocked"):
        raise HTTPException(403, "Compte bloqué")
    if not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(401, "Identifiant ou mot de passe incorrect")
    token = create_jwt(user["id"], "admin")
    return {"access_token": token, "token_type": "bearer", "user": public_user(user)}

@api.post("/auth/verify-otp")
async def verify_otp(body: OTPVerify):
    require_guinea_user_country(body.country)
    phone = normalize_phone(body.phone, body.country)
    if is_admin_phone(phone):
        raise HTTPException(400, "Connexion admin réservée à /admin-login (identifiant + mot de passe)")
    record = await db.otp_codes.find_one({"phone": phone}, {"_id": 0})
    if not record:
        raise HTTPException(400, "Aucun code OTP demandé pour ce numéro")
    if record["otp"] != body.otp:
        raise HTTPException(400, "Code OTP incorrect")
    if datetime.fromisoformat(record["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(400, "Code OTP expiré")

    user = await find_user_by_phone(phone)

    if not user:
        user = {
            "id": str(uuid.uuid4()),
            "phone": phone,
            "name": body.name or f"Utilisateur {phone[-4:]}",
            "city": body.city or "Conakry",
            "quartier": "",
            "whatsapp": phone[3:] if phone.startswith("224") else phone,
            "role": "user",
            "is_pro": False,
            "blocked": False,
            "verified": True,
            "referral_code": gen_referral_code(),
            "referred_by": None,
            "boost_credits": 0,
            "rating_avg": 0,
            "rating_count": 0,
            "created_at": now_iso(),
        }
        if body.referral_code:
            ref_code = body.referral_code.strip().upper()
            referrer = await db.users.find_one({"referral_code": ref_code})
            if referrer:
                user["referred_by"] = referrer["id"]
                user["boost_credits"] = 1
                await db.users.update_one({"id": referrer["id"]}, {"$inc": {"boost_credits": 1}})
        await db.users.insert_one(user)
        user.pop("_id", None)
    else:
        updates = {"verified": True}
        if not user.get("referral_code"):
            updates["referral_code"] = gen_referral_code()
        if body.name and (not user.get("name") or user.get("name", "").startswith("Utilisateur")):
            updates["name"] = body.name
        if body.city and not user.get("city"):
            updates["city"] = body.city
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
        user.update(updates)

    await db.otp_codes.delete_one({"phone": phone})
    token = create_jwt(user["id"], user.get("role", "user"))
    return {"access_token": token, "token_type": "bearer", "user": public_user(user)}

@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return public_user(user)

@api.patch("/auth/me")
async def update_me(body: UserUpdate, user=Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if "username" in updates:
        raw_u = updates.get("username")
        if raw_u is None or (isinstance(raw_u, str) and not raw_u.strip()):
            updates["username"] = None
        else:
            uname = normalize_username(raw_u)
            taken = await db.users.find_one({"username": uname, "id": {"$ne": user["id"]}}, {"_id": 1})
            if taken:
                raise HTTPException(400, "Cet identifiant est déjà pris")
            updates["username"] = uname
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
        user.update(updates)
    return public_user(user)

# ---------------- Categories ----------------
@api.get("/categories")
async def list_categories():
    return CATEGORIES

@api.get("/public/stats")
async def public_stats():
    """Honest public counters for the landing page."""
    users = await db.users.count_documents({})
    listings = await db.listings.count_documents({"status": "approved"})
    return {"users": users, "listings": listings}

@api.get("/cities")
async def list_cities():
    return GUINEA_CITIES

# ---------------- Listings ----------------
@api.get("/listings")
async def list_listings(
    category: Optional[str] = None,
    city: Optional[str] = None,
    quartier: Optional[str] = None,
    q: Optional[str] = None,
    type: Optional[str] = None,
    owner_id: Optional[str] = None,
    status: Optional[str] = "approved",
    skip: int = 0,
    limit: int = 50,
):
    query = {}
    if status and status != "all":
        query["status"] = status
    if category:
        query["category"] = category
    if city:
        query["city"] = city
    if quartier:
        query["quartier"] = {"$regex": f"^{re.escape(quartier)}$", "$options": "i"}
    if type:
        query["type"] = type
    if owner_id:
        query["owner_id"] = owner_id
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
        ]
    cursor = db.listings.find(query, {"_id": 0}).sort([("premium", -1), ("boosted_until", -1), ("created_at", -1)]).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db.listings.count_documents(query)
    return {"items": items, "total": total}

@api.get("/listings/{listing_id}")
async def get_listing(listing_id: str):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Annonce introuvable")
    await db.listings.update_one({"id": listing_id}, {"$inc": {"views": 1}})
    owner = await db.users.find_one({"id": listing["owner_id"]}, {"_id": 0})
    listing["owner"] = public_user(owner) if owner else None
    return listing

@api.post("/listings")
async def create_listing(body: ListingCreate, user=Depends(get_current_user)):
    if body.category not in [c["slug"] for c in CATEGORIES]:
        raise HTTPException(400, "Catégorie invalide")
    # Rate limit: max 10 listings per day per user (anti-flood)
    await enforce_limit(
        f"listing:{user['id']}", max_requests=10, window_seconds=86400,
        error_msg="Limite quotidienne atteinte (10 annonces/jour).",
    )
    listing = {
        "id": str(uuid.uuid4()),
        "owner_id": user["id"],
        "owner_name": user.get("name"),
        "title": body.title,
        "description": body.description,
        "price": body.price,
        "currency": body.currency,
        "category": body.category,
        "city": body.city,
        "quartier": body.quartier or "",
        "photos": body.photos,
        "type": body.type,
        "whatsapp": body.whatsapp or user.get("whatsapp") or user.get("phone"),
        "status": "approved" if AUTO_APPROVE_LISTINGS else "pending",
        "premium": False,
        "boosted_until": None,
        "views": 0,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.listings.insert_one(listing)
    listing.pop("_id", None)
    return listing

@api.patch("/listings/{listing_id}")
async def update_listing(listing_id: str, body: ListingUpdate, user=Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Annonce introuvable")
    if listing["owner_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(403, "Non autorisé")
    updates = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if updates:
        updates["updated_at"] = now_iso()
        await db.listings.update_one({"id": listing_id}, {"$set": updates})
    return await db.listings.find_one({"id": listing_id}, {"_id": 0})

@api.delete("/listings/{listing_id}")
async def delete_listing(listing_id: str, user=Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(404, "Annonce introuvable")
    if listing["owner_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(403, "Non autorisé")
    await db.listings.delete_one({"id": listing_id})
    return {"success": True}

# ---------------- Upload ----------------
@api.post("/upload")
async def upload_image(file: UploadFile = File(...), user=Depends(get_current_user)):
    if file.content_type not in ["image/jpeg", "image/png", "image/webp", "image/jpg"]:
        raise HTTPException(400, "Format d'image invalide")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(400, "Image trop volumineuse (max 5MB)")
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    path = f"{APP_NAME}/uploads/{user['id']}/{uuid.uuid4()}.{ext}"
    try:
        result = put_object(path, data, file.content_type)
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(500, "Échec du téléversement")
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "owner_id": user["id"],
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": now_iso(),
    })
    return {"path": result["path"], "url": f"/api/files/{result['path']}"}

@api.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(404, "Fichier introuvable")
    try:
        data, ct = get_object(path)
    except Exception as e:
        logger.error(f"Get object failed: {e}")
        raise HTTPException(404, "Fichier introuvable")
    return StreamingResponse(io.BytesIO(data), media_type=record.get("content_type", ct))

# ---------------- Messaging ----------------
def conv_key(a: str, b: str, listing_id: Optional[str] = None) -> str:
    parts = sorted([a, b])
    base = f"{parts[0]}__{parts[1]}"
    return f"{base}__{listing_id}" if listing_id else base

@api.post("/messages")
async def send_message(body: MessageCreate, user=Depends(get_current_user)):
    if body.to_user_id == user["id"]:
        raise HTTPException(400, "Impossible de s'envoyer un message")
    # Rate limit: max 10 messages per minute per user
    await enforce_limit(
        f"msg:{user['id']}", max_requests=10, window_seconds=60,
        error_msg="Trop de messages envoyés. Patientez 1 minute.",
    )
    recipient = await db.users.find_one({"id": body.to_user_id})
    if not recipient:
        raise HTTPException(404, "Destinataire introuvable")
    msg = {
        "id": str(uuid.uuid4()),
        "conversation_key": conv_key(user["id"], body.to_user_id, body.listing_id),
        "from_user_id": user["id"],
        "from_name": user.get("name"),
        "to_user_id": body.to_user_id,
        "listing_id": body.listing_id,
        "content": body.content,
        "read": False,
        "created_at": now_iso(),
    }
    await db.messages.insert_one(msg)
    msg.pop("_id", None)
    return msg

@api.get("/conversations")
async def list_conversations(user=Depends(get_current_user)):
    pipeline = [
        {"$match": {"$or": [{"from_user_id": user["id"]}, {"to_user_id": user["id"]}]}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": "$conversation_key",
            "last_message": {"$first": "$content"},
            "last_at": {"$first": "$created_at"},
            "from_user_id": {"$first": "$from_user_id"},
            "to_user_id": {"$first": "$to_user_id"},
            "listing_id": {"$first": "$listing_id"},
        }},
        {"$sort": {"last_at": -1}},
        {"$limit": 100},
    ]
    convs = await db.messages.aggregate(pipeline).to_list(100)
    result = []
    for c in convs:
        other_id = c["to_user_id"] if c["from_user_id"] == user["id"] else c["from_user_id"]
        other = await db.users.find_one({"id": other_id}, {"_id": 0})
        listing = None
        if c.get("listing_id"):
            listing = await db.listings.find_one({"id": c["listing_id"]}, {"_id": 0, "title": 1, "id": 1, "photos": 1})
        result.append({
            "conversation_key": c["_id"],
            "other_user": public_user(other) if other else None,
            "last_message": c["last_message"],
            "last_at": c["last_at"],
            "listing": listing,
        })
    return result

@api.get("/conversations/{other_user_id}/messages")
async def get_conversation_messages(other_user_id: str, listing_id: Optional[str] = None, user=Depends(get_current_user)):
    key = conv_key(user["id"], other_user_id, listing_id)
    msgs = await db.messages.find({"conversation_key": key}, {"_id": 0}).sort("created_at", 1).to_list(500)
    await db.messages.update_many({"conversation_key": key, "to_user_id": user["id"], "read": False}, {"$set": {"read": True}})
    return msgs

# ---------------- Payments (Orange Money simulé) ----------------
@api.post("/payments/orange-money/initiate")
async def initiate_payment(body: PaymentInitiate, user=Depends(get_current_user)):
    if body.purpose not in ["premium", "boost", "pro_subscription"]:
        raise HTTPException(400, "Type de paiement invalide")
    payment = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user.get("name"),
        "user_phone": user.get("phone"),
        "orange_money_phone": body.orange_money_phone,
        "purpose": body.purpose,
        "listing_id": body.listing_id,
        "amount": body.amount,
        "currency": body.currency,
        "status": "pending",
        "transaction_ref": f"OM-{uuid.uuid4().hex[:10].upper()}",
        "created_at": now_iso(),
        "confirmed_at": None,
    }
    await db.payments.insert_one(payment)
    payment.pop("_id", None)
    # Simulate Orange Money: return ref to confirm via /confirm
    return {
        "payment_id": payment["id"],
        "transaction_ref": payment["transaction_ref"],
        "instructions": f"Composez #144# sur votre Orange Money pour confirmer le paiement de {body.amount} {body.currency}. Réf: {payment['transaction_ref']}",
        "amount": body.amount,
        "currency": body.currency,
    }

@api.post("/payments/orange-money/confirm")
async def confirm_payment(body: PaymentConfirm, user=Depends(get_current_user)):
    payment = await db.payments.find_one({"id": body.payment_id, "user_id": user["id"]}, {"_id": 0})
    if not payment:
        raise HTTPException(404, "Paiement introuvable")
    if payment["status"] == "completed":
        return payment
    # Simulate success
    await db.payments.update_one(
        {"id": body.payment_id},
        {"$set": {"status": "completed", "confirmed_at": now_iso()}},
    )
    # Apply purchase effect
    if payment["purpose"] == "premium" and payment.get("listing_id"):
        await db.listings.update_one({"id": payment["listing_id"]}, {"$set": {"premium": True, "status": "approved"}})
    elif payment["purpose"] == "boost" and payment.get("listing_id"):
        boost_until = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        await db.listings.update_one({"id": payment["listing_id"]}, {"$set": {"boosted_until": boost_until, "status": "approved"}})
    elif payment["purpose"] == "pro_subscription":
        until = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        await db.users.update_one({"id": user["id"]}, {"$set": {"is_pro": True, "pro_until": until}})
    payment["status"] = "completed"
    return payment

# ---------------- CinetPay (paiement réel) ----------------
CINETPAY_PRICES_GNF = {
    # GNF amounts. CinetPay minimum is 1000 GNF.
    "premium": 20000,
    "boost": 10000,
    "pro_subscription": 50000,
}

CINETPAY_LABELS = {
    "premium": "Annonce Premium",
    "boost": "Boost 7 jours",
    "pro_subscription": "Abonnement Pro (1 mois)",
}


async def _apply_payment_effect(payment: dict):
    """Activate the marketplace service after a successful payment. Idempotent."""
    purpose = payment.get("purpose")
    user_id = payment.get("user_id")
    listing_id = payment.get("listing_id")
    if purpose == "premium" and listing_id:
        await db.listings.update_one({"id": listing_id}, {"$set": {"premium": True, "status": "approved"}})
    elif purpose == "boost" and listing_id:
        boost_until = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        await db.listings.update_one({"id": listing_id}, {"$set": {"boosted_until": boost_until, "status": "approved"}})
    elif purpose == "pro_subscription" and user_id:
        until = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        await db.users.update_one({"id": user_id}, {"$set": {"is_pro": True, "pro_until": until}})


@api.post("/payments/cinetpay/initiate")
async def cinetpay_initiate(body: CinetPayInitiate, request: Request, user=Depends(get_current_user)):
    if body.purpose not in CINETPAY_PRICES_GNF:
        raise HTTPException(400, "Type de paiement invalide")
    amount = CINETPAY_PRICES_GNF[body.purpose]
    transaction_id = f"ZOK-{uuid.uuid4().hex[:16].upper()}"

    # Build public URLs from forwarded host
    forwarded_proto = request.headers.get("x-forwarded-proto", "https")
    forwarded_host = request.headers.get("x-forwarded-host") or request.headers.get("host")
    base = f"{forwarded_proto}://{forwarded_host}" if forwarded_host else str(request.base_url).rstrip("/")
    notify_url = f"{base}/api/payments/cinetpay/webhook"
    return_url = f"{base}/payment/return?tx={transaction_id}"

    description = f"{CINETPAY_LABELS[body.purpose]} - Zokko"
    try:
        result = cinetpay.initiate_payment(
            transaction_id=transaction_id,
            amount=amount,
            description=description,
            customer_name=user.get("name") or "Client",
            customer_email=f"{user.get('phone')}@zokko.net",
            customer_phone=user.get("phone") or "",
            notify_url=notify_url,
            return_url=return_url,
            channels=body.channels,
        )
    except Exception as e:
        logger.error(f"CinetPay init error: {e}")
        raise HTTPException(502, f"Échec d'initialisation CinetPay: {e}")

    payment = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user.get("name"),
        "user_phone": user.get("phone"),
        "purpose": body.purpose,
        "listing_id": body.listing_id,
        "amount": amount,
        "currency": "GNF",
        "status": "pending",
        "provider": "cinetpay",
        "transaction_ref": transaction_id,
        "cinetpay_payment_token": result.get("payment_token"),
        "cinetpay_payment_url": result.get("payment_url"),
        "mock": result.get("mock", False),
        "channels": body.channels,
        "raw_init_response": result.get("raw_response"),
        "raw_webhook_payloads": [],
        "verification_history": [],
        "created_at": now_iso(),
        "confirmed_at": None,
    }
    await db.payments.insert_one(payment)
    payment.pop("_id", None)
    return {
        "payment_id": payment["id"],
        "transaction_id": transaction_id,
        "payment_url": result["payment_url"],
        "amount": amount,
        "currency": "GNF",
        "mock": result.get("mock", False),
    }


@api.post("/payments/cinetpay/webhook")
async def cinetpay_webhook(request: Request):
    raw = await request.body()
    # Try to parse body (CinetPay sends form-data or JSON depending on config)
    payload = {}
    try:
        payload = await request.json()
    except Exception:
        try:
            form = await request.form()
            payload = {k: v for k, v in form.items()}
        except Exception:
            payload = {}

    # Verify signature (optional but recommended)
    sig = request.headers.get("x-token") or request.headers.get("x-cinetpay-signature")
    if not cinetpay.verify_webhook_signature(raw, sig):
        logger.warning("CinetPay webhook: invalid signature")
        raise HTTPException(401, "Signature invalide")

    transaction_id = payload.get("cpm_trans_id") or payload.get("transaction_id")
    if not transaction_id:
        raise HTTPException(400, "transaction_id manquant")

    # Log raw webhook
    await db.payments.update_one(
        {"transaction_ref": transaction_id},
        {"$push": {"raw_webhook_payloads": payload}},
    )

    # Server-side verification (CinetPay best practice)
    try:
        verification = cinetpay.verify_payment(transaction_id)
    except Exception as e:
        logger.error(f"CinetPay verify error: {e}")
        return {"received": True, "verified": False}

    await db.payments.update_one(
        {"transaction_ref": transaction_id},
        {"$push": {"verification_history": {"at": now_iso(), "data": verification.get("raw_response")}}},
    )

    status = (verification.get("status") or "").upper()
    payment = await db.payments.find_one({"transaction_ref": transaction_id}, {"_id": 0})
    if not payment:
        raise HTTPException(404, "Paiement inconnu")

    # Idempotency
    if payment.get("status") == "completed":
        return {"received": True, "already_processed": True}

    if status in ("ACCEPTED", "SUCCESS", "SUCCEEDED"):
        await db.payments.update_one(
            {"transaction_ref": transaction_id},
            {"$set": {
                "status": "completed",
                "confirmed_at": now_iso(),
                "cinetpay_operator_id": verification.get("operator_id"),
                "cinetpay_payment_method": verification.get("payment_method"),
            }},
        )
        await _apply_payment_effect(payment)
        return {"received": True, "verified": True, "activated": True}
    else:
        await db.payments.update_one(
            {"transaction_ref": transaction_id},
            {"$set": {"status": "failed", "failed_reason": status}},
        )
        return {"received": True, "verified": False, "status": status}


@api.post("/payments/cinetpay/check/{transaction_id}")
async def cinetpay_check(transaction_id: str, user=Depends(get_current_user)):
    """Server-side check used by the return page to confirm payment status without waiting for the webhook."""
    payment = await db.payments.find_one({"transaction_ref": transaction_id, "user_id": user["id"]}, {"_id": 0})
    if not payment:
        raise HTTPException(404, "Paiement introuvable")

    if payment.get("status") == "completed":
        return payment

    # Verify with CinetPay
    try:
        verification = cinetpay.verify_payment(transaction_id)
    except Exception as e:
        raise HTTPException(502, f"Vérification impossible: {e}")

    await db.payments.update_one(
        {"transaction_ref": transaction_id},
        {"$push": {"verification_history": {"at": now_iso(), "data": verification.get("raw_response")}}},
    )

    status = (verification.get("status") or "").upper()
    if status in ("ACCEPTED", "SUCCESS", "SUCCEEDED"):
        await db.payments.update_one(
            {"transaction_ref": transaction_id},
            {"$set": {
                "status": "completed",
                "confirmed_at": now_iso(),
                "cinetpay_operator_id": verification.get("operator_id"),
                "cinetpay_payment_method": verification.get("payment_method"),
            }},
        )
        await _apply_payment_effect(payment)
        return await db.payments.find_one({"transaction_ref": transaction_id}, {"_id": 0})

    return {**payment, "status": "pending", "verification_status": status}


@api.get("/payments/cinetpay/config")
async def cinetpay_config():
    """Public config (price catalog + integration status). No secrets."""
    return {
        "configured": cinetpay.is_configured(),
        "prices_gnf": CINETPAY_PRICES_GNF,
        "labels": CINETPAY_LABELS,
        "currency": "GNF",
    }


# ---------------- Manual Orange Money (preuve de paiement) ----------------
MANUAL_OM_PRICES_GNF = {
    "premium": 20000,
    "boost": 10000,
    "pro_subscription": 50000,
}


@api.get("/payments/orange-money/info")
async def orange_money_info():
    """Public info: receiving number + price catalog. Shown to user before payment."""
    return {
        "number": ORANGE_MONEY_NUMBER,
        "holder": ORANGE_MONEY_HOLDER,
        "prices_gnf": MANUAL_OM_PRICES_GNF,
        "labels": CINETPAY_LABELS,  # reuse labels
        "instructions": [
            "Composez #144# sur votre téléphone Orange Money",
            "Choisissez 'Transfert d'argent'",
            f"Envoyez le montant exact au {ORANGE_MONEY_NUMBER}",
            "Notez le code de transaction reçu par SMS",
            "Prenez une capture d'écran de la confirmation",
            "Revenez dans Zokko et remplissez le formulaire ci-dessous",
        ],
    }


@api.post("/payments/orange-money/submit")
async def manual_om_submit(body: ManualOMSubmit, user=Depends(get_current_user)):
    """User submits proof of manual Orange Money payment. Goes to admin queue."""
    if body.purpose not in MANUAL_OM_PRICES_GNF:
        raise HTTPException(400, "Type de paiement invalide")
    if not body.transaction_code.strip():
        raise HTTPException(400, "Code de transaction requis")
    if not body.sender_phone.strip():
        raise HTTPException(400, "Numéro émetteur requis")

    amount = MANUAL_OM_PRICES_GNF[body.purpose]
    payment = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user.get("name"),
        "user_phone": user.get("phone"),
        "purpose": body.purpose,
        "listing_id": body.listing_id,
        "amount": amount,
        "currency": "GNF",
        "status": "pending_admin",
        "provider": "manual_om",
        "transaction_ref": f"OM-{uuid.uuid4().hex[:10].upper()}",
        "om_receiver": ORANGE_MONEY_NUMBER,
        "om_sender_phone": body.sender_phone.strip(),
        "om_transaction_code": body.transaction_code.strip(),
        "om_proof_image_path": body.proof_image_path,
        "created_at": now_iso(),
        "confirmed_at": None,
        "validated_by": None,
        "admin_note": None,
    }
    await db.payments.insert_one(payment)
    payment.pop("_id", None)
    return payment


@api.get("/admin/payments/pending")
async def admin_pending_payments(_admin=Depends(get_admin_user)):
    items = await db.payments.find({"status": "pending_admin"}, {"_id": 0}).sort("created_at", -1).to_list(500)
    # Enrich with listing info for context
    for p in items:
        if p.get("listing_id"):
            li = await db.listings.find_one({"id": p["listing_id"]}, {"_id": 0, "title": 1, "id": 1})
            p["listing"] = li
    return items


@api.post("/admin/payments/{payment_id}/validate")
async def admin_validate_payment(payment_id: str, admin=Depends(get_admin_user)):
    payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(404, "Paiement introuvable")
    if payment.get("status") == "completed":
        return payment
    if payment.get("status") not in ("pending_admin", "pending", "failed"):
        raise HTTPException(400, "Statut non modifiable")
    await db.payments.update_one(
        {"id": payment_id},
        {"$set": {
            "status": "completed",
            "confirmed_at": now_iso(),
            "validated_by": admin["id"],
            "validated_by_name": admin.get("name"),
        }},
    )
    # Apply effect (premium/boost/pro)
    await _apply_payment_effect(payment)
    return await db.payments.find_one({"id": payment_id}, {"_id": 0})


@api.post("/admin/payments/{payment_id}/reject")
async def admin_reject_payment(payment_id: str, admin=Depends(get_admin_user), note: Optional[str] = None):
    payment = await db.payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(404, "Paiement introuvable")
    await db.payments.update_one(
        {"id": payment_id},
        {"$set": {
            "status": "rejected",
            "validated_by": admin["id"],
            "validated_by_name": admin.get("name"),
            "admin_note": note or "Preuve invalide",
        }},
    )
    return {"success": True}


@api.get("/payments/me")
async def my_payments(user=Depends(get_current_user)):
    items = await db.payments.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items

# ---------------- Admin ----------------
@api.get("/admin/stats")
async def admin_stats(_admin=Depends(get_admin_user)):
    return {
        "users": await db.users.count_documents({}),
        "listings_total": await db.listings.count_documents({}),
        "listings_pending": await db.listings.count_documents({"status": "pending"}),
        "listings_approved": await db.listings.count_documents({"status": "approved"}),
        "payments_total": await db.payments.count_documents({}),
        "payments_completed": await db.payments.count_documents({"status": "completed"}),
        "revenue": sum([p["amount"] async for p in db.payments.find({"status": "completed"}, {"amount": 1, "_id": 0})]),
    }

@api.get("/admin/users")
async def admin_users(_admin=Depends(get_admin_user), skip: int = 0, limit: int = 100):
    users = await db.users.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [public_user(u) for u in users]

@api.post("/admin/users/{user_id}/block")
async def admin_block_user(user_id: str, _admin=Depends(get_admin_user)):
    await db.users.update_one({"id": user_id}, {"$set": {"blocked": True}})
    return {"success": True}

@api.post("/admin/users/{user_id}/unblock")
async def admin_unblock_user(user_id: str, _admin=Depends(get_admin_user)):
    await db.users.update_one({"id": user_id}, {"$set": {"blocked": False}})
    return {"success": True}

@api.get("/admin/listings")
async def admin_listings(_admin=Depends(get_admin_user), status: Optional[str] = None):
    q = {}
    if status:
        q["status"] = status
    items = await db.listings.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items

@api.post("/admin/listings/{listing_id}/approve")
async def admin_approve(listing_id: str, _admin=Depends(get_admin_user)):
    await db.listings.update_one({"id": listing_id}, {"$set": {"status": "approved"}})
    return {"success": True}

@api.post("/admin/listings/{listing_id}/reject")
async def admin_reject(listing_id: str, _admin=Depends(get_admin_user)):
    await db.listings.update_one({"id": listing_id}, {"$set": {"status": "rejected"}})
    return {"success": True}

@api.get("/admin/payments")
async def admin_payments(_admin=Depends(get_admin_user)):
    items = await db.payments.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items

# ---------------- Reports ----------------
@api.post("/reports")
async def create_report(body: ReportCreate, user=Depends(get_current_user)):
    if not body.listing_id and not body.reported_user_id:
        raise HTTPException(400, "Cible du signalement requise")
    report = {
        "id": str(uuid.uuid4()),
        "reporter_id": user["id"],
        "reporter_name": user.get("name"),
        "listing_id": body.listing_id,
        "reported_user_id": body.reported_user_id,
        "reason": body.reason,
        "description": body.description or "",
        "status": "open",
        "created_at": now_iso(),
    }
    await db.reports.insert_one(report)
    report.pop("_id", None)
    return report

# ---------------- Reviews / Ratings ----------------
@api.post("/reviews")
async def create_review(body: ReviewCreate, user=Depends(get_current_user)):
    if body.rating < 1 or body.rating > 5:
        raise HTTPException(400, "Note invalide (1-5)")
    if body.target_user_id == user["id"]:
        raise HTTPException(400, "Vous ne pouvez pas vous évaluer")
    target = await db.users.find_one({"id": body.target_user_id})
    if not target:
        raise HTTPException(404, "Utilisateur introuvable")
    # One review per pair (upsert latest)
    review = {
        "id": str(uuid.uuid4()),
        "from_user_id": user["id"],
        "from_name": user.get("name"),
        "target_user_id": body.target_user_id,
        "listing_id": body.listing_id,
        "rating": body.rating,
        "comment": body.comment or "",
        "created_at": now_iso(),
    }
    await db.reviews.update_one(
        {"from_user_id": user["id"], "target_user_id": body.target_user_id},
        {"$set": review},
        upsert=True,
    )
    # Recompute average
    agg = await db.reviews.aggregate([
        {"$match": {"target_user_id": body.target_user_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
    ]).to_list(1)
    if agg:
        await db.users.update_one(
            {"id": body.target_user_id},
            {"$set": {"rating_avg": round(agg[0]["avg"], 2), "rating_count": agg[0]["count"]}},
        )
    return review

@api.get("/users/{user_id}/reviews")
async def get_reviews(user_id: str):
    items = await db.reviews.find({"target_user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items

# ---------------- Free boost via credits ----------------
@api.post("/listings/{listing_id}/use-boost")
async def use_free_boost(listing_id: str, user=Depends(get_current_user)):
    if user.get("boost_credits", 0) < 1:
        raise HTTPException(400, "Aucun crédit boost disponible")
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(404, "Annonce introuvable")
    if listing["owner_id"] != user["id"]:
        raise HTTPException(403, "Non autorisé")
    boost_until = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    await db.listings.update_one({"id": listing_id}, {"$set": {"boosted_until": boost_until, "status": "approved"}})
    await db.users.update_one({"id": user["id"]}, {"$inc": {"boost_credits": -1}})
    return {"success": True, "boosted_until": boost_until}

# ---------------- Admin: Reports ----------------
# ---------------- Stats tracking ----------------
@api.post("/listings/{listing_id}/click-whatsapp")
async def click_whatsapp(listing_id: str):
    await db.listings.update_one({"id": listing_id}, {"$inc": {"whatsapp_clicks": 1}})
    return {"success": True}

@api.get("/listings/{listing_id}/stats")
async def listing_stats(listing_id: str, user=Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Annonce introuvable")
    if listing["owner_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(403, "Non autorisé")
    return {
        "views": listing.get("views", 0),
        "whatsapp_clicks": listing.get("whatsapp_clicks", 0),
        "messages": await db.messages.count_documents({"listing_id": listing_id}),
    }

@api.get("/admin/reports")
async def admin_reports(_admin=Depends(get_admin_user)):
    items = await db.reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items

@api.post("/admin/reports/{report_id}/resolve")
async def admin_resolve_report(report_id: str, _admin=Depends(get_admin_user)):
    await db.reports.update_one({"id": report_id}, {"$set": {"status": "resolved"}})
    return {"success": True}

@api.get("/")
async def root():
    return {"name": "GuinéeMarket API", "version": "1.0.0"}

# Mount
app.include_router(api)

# ---------------- SEO: Sitemap XML ----------------
@app.get("/api/sitemap.xml")
async def sitemap_xml(request: Request):
    """SEO sitemap listing all approved listings + main pages."""
    forwarded_proto = request.headers.get("x-forwarded-proto", "https")
    forwarded_host = request.headers.get("x-forwarded-host") or request.headers.get("host")
    base = f"{forwarded_proto}://{forwarded_host}" if forwarded_host else str(request.base_url).rstrip("/")

    static_pages = [
        ("/", "1.0", "daily"),
        ("/listings", "0.9", "hourly"),
        ("/login", "0.5", "monthly"),
        ("/publish", "0.6", "monthly"),
    ]
    # Add category pages
    for c in CATEGORIES:
        static_pages.append((f"/listings?category={c['slug']}", "0.8", "daily"))

    listings = await db.listings.find(
        {"status": "approved"},
        {"_id": 0, "id": 1, "updated_at": 1}
    ).sort("created_at", -1).limit(2000).to_list(2000)

    urls = []
    for path, priority, freq in static_pages:
        urls.append(f"<url><loc>{base}{path}</loc><changefreq>{freq}</changefreq><priority>{priority}</priority></url>")
    for li in listings:
        lastmod = (li.get("updated_at") or "")[:10]
        urls.append(
            f"<url><loc>{base}/listings/{li['id']}</loc>"
            f"{f'<lastmod>{lastmod}</lastmod>' if lastmod else ''}"
            f"<changefreq>weekly</changefreq><priority>0.7</priority></url>"
        )

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls)
        + "\n</urlset>"
    )
    return Response(content=xml, media_type="application/xml")

# ---------------- Open Graph share endpoint (under /api so kubernetes ingress routes correctly) ----------------
@app.get("/api/s/{listing_id}", response_class=HTMLResponse)
async def og_share(listing_id: str, request: Request):
    """Returns an HTML page with rich OG meta tags for WhatsApp/social previews,
    then redirects real users to the React listing page."""
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        return HTMLResponse("<h1>Annonce introuvable</h1>", status_code=404)
    # Prefer public/forwarded host when behind ingress
    forwarded_proto = request.headers.get("x-forwarded-proto", "https")
    forwarded_host = request.headers.get("x-forwarded-host") or request.headers.get("host")
    if forwarded_host:
        base = f"{forwarded_proto}://{forwarded_host}"
    else:
        base = str(request.base_url).rstrip("/")
    listing_url = f"{base}/listings/{listing_id}"
    image_url = ""
    if listing.get("photos"):
        image_url = f"{base}/api/files/{listing['photos'][0]}"
    title = (listing.get("title") or "Annonce")[:80]
    price = f"{int(listing.get('price', 0)):,} {listing.get('currency', 'GNF')}".replace(",", " ")
    city = listing.get("city", "")
    desc = f"{price} · {city} · Vu sur Zokko"
    full_desc = (listing.get("description") or desc)[:200]
    html = f"""<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"/>
<title>{title} - Zokko</title>
<meta property="og:type" content="product"/>
<meta property="og:title" content="{title}"/>
<meta property="og:description" content="{desc} — {full_desc}"/>
<meta property="og:url" content="{listing_url}"/>
{f'<meta property="og:image" content="{image_url}"/>' if image_url else ''}
{'<meta property="og:image:width" content="1200"/><meta property="og:image:height" content="900"/>' if image_url else ''}
<meta property="og:site_name" content="Zokko"/>
<meta property="product:price:amount" content="{listing.get('price', 0)}"/>
<meta property="product:price:currency" content="{listing.get('currency', 'GNF')}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="{title}"/>
<meta name="twitter:description" content="{desc}"/>
{f'<meta name="twitter:image" content="{image_url}"/>' if image_url else ''}
<meta http-equiv="refresh" content="0;url={listing_url}"/>
<style>body{{font-family:system-ui;text-align:center;padding:40px;color:#1A2E22;background:#FAF8F5}}</style>
</head><body>
<h1>{title}</h1>
<p>{desc}</p>
<p><a href="{listing_url}" style="color:#D84315;font-weight:bold">Voir l'annonce sur Zokko →</a></p>
<script>window.location.replace({repr(listing_url)});</script>
</body></html>"""
    return HTMLResponse(html)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_cors_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Frontend React (build) — une seule URL en prod
if FRONTEND_BUILD.is_dir():
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(404)
        target = FRONTEND_BUILD / full_path
        if full_path and target.is_file():
            return FileResponse(target)
        index = FRONTEND_BUILD / "index.html"
        if index.is_file():
            return FileResponse(index)
        raise HTTPException(404)

    logger.info("Serving frontend from %s", FRONTEND_BUILD.resolve())
