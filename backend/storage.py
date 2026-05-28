"""Stockage fichiers — local (dev) ou S3 / Cloudflare R2 (prod). Plus de dépendance Emergent."""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional, Tuple

logger = logging.getLogger("zokko.storage")

BACKEND = os.environ.get("STORAGE_BACKEND", "local").strip().lower()
LOCAL_ROOT = Path(os.environ.get("STORAGE_LOCAL_PATH", str(Path(__file__).parent / "data" / "uploads")))

_s3_client = None


def _get_s3():
    global _s3_client
    if _s3_client is not None:
        return _s3_client
    import boto3
    from botocore.config import Config

    endpoint = os.environ.get("S3_ENDPOINT_URL", "").strip() or None
    region = os.environ.get("S3_REGION", "auto").strip()
    _s3_client = boto3.client(
        "s3",
        endpoint_url=endpoint,
        region_name=region,
        aws_access_key_id=os.environ["S3_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["S3_SECRET_ACCESS_KEY"],
        config=Config(signature_version="s3v4"),
    )
    return _s3_client


def _bucket() -> str:
    b = os.environ.get("S3_BUCKET", "").strip()
    if not b:
        raise RuntimeError("S3_BUCKET manquant")
    return b


def init_storage() -> bool:
    """Vérifie que le stockage est utilisable (appelé au startup)."""
    if BACKEND == "local":
        LOCAL_ROOT.mkdir(parents=True, exist_ok=True)
        logger.info("Storage: local → %s", LOCAL_ROOT.resolve())
        return True
    if BACKEND == "s3":
        client = _get_s3()
        client.head_bucket(Bucket=_bucket())
        logger.info("Storage: S3/R2 bucket OK → %s", _bucket())
        return True
    raise RuntimeError(f"STORAGE_BACKEND invalide: {BACKEND} (local | s3)")


def put_object(path: str, data: bytes, content_type: str) -> dict:
    path = path.lstrip("/")
    if BACKEND == "local":
        dest = LOCAL_ROOT / path
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        return {"path": path, "size": len(data)}
    if BACKEND == "s3":
        _get_s3().put_object(
            Bucket=_bucket(),
            Key=path,
            Body=data,
            ContentType=content_type,
        )
        return {"path": path, "size": len(data)}
    raise RuntimeError(f"STORAGE_BACKEND invalide: {BACKEND}")


def get_object(path: str) -> Tuple[bytes, str]:
    path = path.lstrip("/")
    if BACKEND == "local":
        dest = LOCAL_ROOT / path
        if not dest.is_file():
            raise FileNotFoundError(path)
        return dest.read_bytes(), "application/octet-stream"
    if BACKEND == "s3":
        resp = _get_s3().get_object(Bucket=_bucket(), Key=path)
        body = resp["Body"].read()
        ct = resp.get("ContentType") or "application/octet-stream"
        return body, ct
    raise RuntimeError(f"STORAGE_BACKEND invalide: {BACKEND}")
