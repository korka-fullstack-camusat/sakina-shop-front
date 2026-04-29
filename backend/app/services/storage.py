"""
Service de stockage de fichiers.

Mode LOCAL  : si AWS_ACCESS_KEY_ID est vide / "your-aws-key" / non configuré
              → sauvegarde dans backend/uploads/ et sert via /uploads/ (StaticFiles)

Mode S3     : si AWS_ACCESS_KEY_ID est renseigné avec une vraie valeur
              → upload sur Amazon S3 (comportement original)
"""
import uuid
from pathlib import Path

from app.core.config import settings
from app.core.logging import logger

# Dossier de stockage local  (backend/uploads/)
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Décide du mode : local si pas de vraies clés AWS
_FAKE_KEYS = {"", "your-aws-key", "your_aws_key", "CHANGE_ME"}
USE_LOCAL   = settings.AWS_ACCESS_KEY_ID.strip() in _FAKE_KEYS


# ── Mode local ────────────────────────────────────────────────────────────────

def _local_url(key: str) -> str:
    """Construit l'URL publique pour un fichier stocké localement."""
    base = (settings.APP_BASE_URL if hasattr(settings, "APP_BASE_URL") else "http://localhost:8000")
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


# ── Mode S3 ───────────────────────────────────────────────────────────────────

async def _s3_upload(file_bytes: bytes, key: str, content_type: str) -> str:
    import aioboto3
    session = aioboto3.Session(
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )
    async with session.client("s3") as s3:
        await s3.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=key,
            Body=file_bytes,
            ContentType=content_type,
            ACL="public-read",
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
    if USE_LOCAL:
        return await _local_upload(file_bytes, key, content_type)
    return await _s3_upload(file_bytes, key, content_type)


async def delete_file(key: str) -> None:
    if USE_LOCAL:
        await _local_delete(key)
    else:
        await _s3_delete(key)


def extract_key_from_url(url: str) -> str:
    if USE_LOCAL:
        base = _local_url("")
        return url.replace(base, "")
    base = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/"
    return url.replace(base, "")
