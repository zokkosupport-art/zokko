"""Stockage fichiers — local (dev), S3/R2 (prod), ou local + secours R2."""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional, Tuple

logger = logging.getLogger("zokko.storage")

BACKEND = os.environ.get("STORAGE_BACKEND", "local").strip().lower()


def get_local_root() -> Path:
    """Chemin d'écriture des uploads. Priorité: Volume Railway > STORAGE_LOCAL_PATH > défaut."""
    railway_mount = os.environ.get("RAILWAY_VOLUME_MOUNT_PATH", "").strip()
    if railway_mount:
        return Path(railway_mount)
    custom = os.environ.get("STORAGE_LOCAL_PATH", "").strip()
    if custom:
        return Path(custom)
    return Path(__file__).parent / "data" / "uploads"


def backup_enabled() -> bool:
    """Miroir R2 actif : STORAGE_BACKUP=s3 + clés S3 (en plus du backend local)."""
    flag = os.environ.get("STORAGE_BACKUP", "").strip().lower()
    if flag not in ("1", "true", "yes", "s3"):
        return False
    return s3_configured()


def s3_configured() -> bool:
    return bool(
        os.environ.get("S3_BUCKET", "").strip()
        and os.environ.get("S3_ACCESS_KEY_ID", "").strip()
        and os.environ.get("S3_SECRET_ACCESS_KEY", "").strip()
    )


_s3_client_instance = None


def get_s3_client():
    global _s3_client_instance
    if _s3_client_instance is not None:
        return _s3_client_instance
    import boto3
    from botocore.config import Config

    endpoint = os.environ.get("S3_ENDPOINT_URL", "").strip() or None
    region = os.environ.get("S3_REGION", "auto").strip()
    _s3_client_instance = boto3.client(
        "s3",
        endpoint_url=endpoint,
        region_name=region,
        aws_access_key_id=os.environ["S3_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["S3_SECRET_ACCESS_KEY"],
        config=Config(signature_version="s3v4"),
    )
    return _s3_client_instance


def _bucket() -> str:
    b = os.environ.get("S3_BUCKET", "").strip()
    if not b:
        raise RuntimeError("S3_BUCKET manquant")
    return b


def _put_s3(path: str, data: bytes, content_type: str) -> None:
    get_s3_client().put_object(
        Bucket=_bucket(),
        Key=path,
        Body=data,
        ContentType=content_type,
    )


def _read_s3_object(path: str) -> Tuple[bytes, str]:
    resp = get_s3_client().get_object(Bucket=_bucket(), Key=path)
    body = resp["Body"].read()
    ct = resp.get("ContentType") or "application/octet-stream"
    return body, ct


def _mirror_to_backup(path: str, data: bytes, content_type: str) -> None:
    if not backup_enabled():
        return
    try:
        _put_s3(path, data, content_type)
    except Exception as exc:
        logger.warning("Backup R2 upload failed for %s: %s", path, exc)


def check_backup() -> dict:
    """État du stockage secours (pour /health/storage)."""
    if not backup_enabled():
        return {
            "enabled": False,
            "configured": s3_configured(),
            "ok": False,
            "bucket": None,
            "error": None,
        }
    err = None
    ok = False
    bucket = _bucket()
    try:
        get_s3_client().head_bucket(Bucket=bucket)
        ok = True
    except Exception as exc:
        err = str(exc)
    return {
        "enabled": True,
        "configured": True,
        "ok": ok,
        "bucket": bucket,
        "error": err,
    }


def init_storage() -> bool:
    """Vérifie que le stockage est utilisable (appelé au startup)."""
    if BACKEND == "local":
        root = get_local_root()
        root.mkdir(parents=True, exist_ok=True)
        vol = os.environ.get("RAILWAY_VOLUME_MOUNT_PATH", "").strip() or None
        logger.info(
            "Storage: local → %s (RAILWAY_VOLUME_MOUNT_PATH=%s, STORAGE_LOCAL_PATH=%s)",
            root.resolve(),
            vol,
            os.environ.get("STORAGE_LOCAL_PATH", "").strip() or None,
        )
        if not vol:
            logger.warning(
                "Aucun Volume Railway détecté (RAILWAY_VOLUME_MOUNT_PATH vide). "
                "Les photos seront perdues à chaque redeploy."
            )
        if backup_enabled():
            b = check_backup()
            if b["ok"]:
                logger.info("Storage backup: R2 mirror actif → bucket %s", b["bucket"])
            else:
                logger.warning("Storage backup: R2 configuré mais inaccessible: %s", b.get("error"))
        return True
    if BACKEND == "s3":
        get_s3_client().head_bucket(Bucket=_bucket())
        logger.info("Storage: S3/R2 bucket OK → %s", _bucket())
        return True
    raise RuntimeError(f"STORAGE_BACKEND invalide: {BACKEND} (local | s3)")


def put_object(path: str, data: bytes, content_type: str) -> dict:
    path = path.lstrip("/")
    if BACKEND == "local":
        dest = get_local_root() / path
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        _mirror_to_backup(path, data, content_type)
        return {"path": path, "size": len(data)}
    if BACKEND == "s3":
        _put_s3(path, data, content_type)
        return {"path": path, "size": len(data)}
    raise RuntimeError(f"STORAGE_BACKEND invalide: {BACKEND}")


def get_object(path: str) -> Tuple[bytes, str]:
    path = path.lstrip("/")
    if BACKEND == "local":
        dest = get_local_root() / path
        if dest.is_file():
            return dest.read_bytes(), "application/octet-stream"
        if backup_enabled():
            try:
                return _read_s3_object(path)
            except Exception as exc:
                logger.info("Backup R2 read for %s: %s", path, exc)
        raise FileNotFoundError(path)
    if BACKEND == "s3":
        return _read_s3_object(path)
    raise RuntimeError(f"STORAGE_BACKEND invalide: {BACKEND}")
