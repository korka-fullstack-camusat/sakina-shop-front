"""
Service de stockage de fichiers.

Priorité :
  1. Cloudinary  — si CLOUDINARY_CLOUD_NAME est configuré (recommandé en prod)
  2. S3          — si AWS_ACCESS_KEY_ID est configuré
  3. Local       — fallback développement (backend/uploads/)
"""
import hashlib
import time
import uuid
from pathlib import Path

import httpx

from app.core.config import settings
from app.core.logging import logger

# ── Dossier local (dev) ───────────────────────────────────────────────────────
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

_FAKE = {"", "your-aws-key", "your_aws_key", "CHANGE_ME"}

USE_CLOUDINARY = bool(settings.CLOUDINARY_CLOUD_NAME.strip())
USE_S3         = not USE_CLOUDINARY and settings.AWS_ACCESS_KEY_ID.strip() not in _FAKE
USE_LOCAL      = not USE_CLOUDINARY and not USE_S3


# ── Cloudinary ────────────────────────────────────────────────────────────────

def _cloudinary_sign(params: dict, api_secret: str) -> str:
    """Génère la signature SHA-1 pour l'API Cloudinary."""
    to_sign = "&".join(f"{k}={v}" for k, v in sorted(params.items()))
    return hashlib.sha1(f"{to_sign}{api_secret}".encode()).hexdigest()


async def _cloudinary_upload(file_bytes: bytes, key: str, content_type: str) -> str:
    cloud  = settings.CLOUDINARY_CLOUD_NAME
    apikey = settings.CLOUDINARY_API_KEY
    secret = settings.CLOUDINARY_API_SECRET

    # public_id = clé sans extension (ex: "images/produit_abc")
    public_id = key.rsplit(".", 1)[0].replace("/", "_")

    # Détecter resource_type
    resource_type = "video" if content_type.startswith("video") else "image"

    ts     = int(time.time())
    params = {"public_id": public_id, "timestamp": ts}
    sig    = _cloudinary_sign(params, secret)

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"https://api.cloudinary.com/v1_1/{cloud}/{resource_type}/upload",
            data={
                "api_key":   apikey,
                "timestamp": ts,
                "public_id": public_id,
                "signature": sig,
            },
            files={"file": ("file", file_bytes, content_type)},
        )
        resp.raise_for_status()
        url: str = resp.json()["secure_url"]

    logger.info("Fichier uploadé sur Cloudinary", public_id=public_id, url=url)
    return url


async def _cloudinary_delete(key: str) -> None:
    cloud  = settings.CLOUDINARY_CLOUD_NAME
    apikey = settings.CLOUDINARY_API_KEY
    secret = settings.CLOUDINARY_API_SECRET

    public_id = key.rsplit(".", 1)[0].replace("/", "_")
    resource_type = "video" if "video" in key else "image"

    ts     = int(time.time())
    params = {"public_id": public_id, "timestamp": ts}
    sig    = _cloudinary_sign(params, secret)

    async with httpx.AsyncClient(timeout=30) as client:
        await client.post(
            f"https://api.cloudinary.com/v1_1/{cloud}/{resource_type}/destroy",
            data={"api_key": apikey, "timestamp": ts,
                  "public_id": public_id, "signature": sig},
        )
    logger.info("Fichier supprimé de Cloudinary", public_id=public_id)


# ── Local (dev) ───────────────────────────────────────────────────────────────

def _local_url(key: str) -> str:
    base = getattr(settings, "APP_BASE_URL", "http://localhost:8000")
    return f"{base}/uploads/{key}"


async def _local_upload(file_bytes: bytes, key: str, content_type: str) -> str:
    dest = UPLOAD_DIR / key
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(file_bytes)
    url = _local_url(key)
    logger.info("Fichier sauvegardé localement", path=str(dest), url=url)
    return url


async def _local_delete(key: str) -> None:
    dest = UPLOAD_DIR / key
    if dest.exists():
        dest.unlink()
        logger.info("Fichier local supprimé", path=str(dest))


# ── S3 ────────────────────────────────────────────────────────────────────────

async def _s3_upload(file_bytes: bytes, key: str, content_type: str) -> str:
    import aioboto3
    session = aioboto3.Session(
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )
    async with session.client("s3") as s3:
        await s3.put_object(
            Bucket=settings.S3_BUCKET_NAME, Key=key,
            Body=file_bytes, ContentType=content_type, ACL="public-read",
        )
    url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
    logger.info("Fichier uploadé sur S3", key=key, url=url)
    return url


async def _s3_delete(key: str) -> None:
    import aioboto3
    session = aioboto3.Session(
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )
    async with session.client("s3") as s3:
        await s3.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
    logger.info("Fichier supprimé de S3", key=key)


# ── API publique ──────────────────────────────────────────────────────────────

async def upload_file(file_bytes: bytes, key: str, content_type: str) -> str:
    if USE_CLOUDINARY:
        return await _cloudinary_upload(file_bytes, key, content_type)
    if USE_S3:
        return await _s3_upload(file_bytes, key, content_type)
    return await _local_upload(file_bytes, key, content_type)


async def delete_file(key: str) -> None:
    if USE_CLOUDINARY:
        await _cloudinary_delete(key)
    elif USE_S3:
        await _s3_delete(key)
    else:
        await _local_delete(key)


def extract_key_from_url(url: str) -> str:
    if USE_S3:
        base = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/"
        return url.replace(base, "")
    if USE_LOCAL:
        return url.replace(_local_url(""), "")
    # Cloudinary : retourne l'URL telle quelle (la suppression utilise le public_id)
    return url
