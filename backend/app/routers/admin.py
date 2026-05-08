import base64
import mimetypes
import uuid

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.core.migrations import migrate_up, migrate_down, migration_status
from app.core.logging import logger
from app.middleware.auth import require_admin
from app.models.product import Product
from app.models.user import User
from app.services.storage import upload_file

router = APIRouter(prefix="/admin", tags=["Admin"])


def _get_db():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    return client[settings.DATABASE_NAME]


@router.get("/migrations/status", summary="[Admin] État des migrations")
async def get_migration_status(admin: User = Depends(require_admin)) -> list[dict]:
    return await migration_status(_get_db())


@router.post("/migrations/upgrade", summary="[Admin] Appliquer les migrations en attente")
async def run_migrations(admin: User = Depends(require_admin)) -> dict:
    db = _get_db()
    await migrate_up(db)
    return {"message": "Migrations appliquées avec succès"}


@router.post("/migrations/downgrade/{target}", summary="[Admin] Annuler jusqu'à une migration")
async def rollback_migration(
    target: str,
    admin: User = Depends(require_admin),
) -> dict:
    db = _get_db()
    await migrate_down(db, target)
    return {"message": f"Rollback jusqu'à {target} effectué"}


@router.get("/storage-info", summary="[Admin] Vérifier la config du storage")
async def storage_info(admin: User = Depends(require_admin)) -> dict:
    from app.services.storage import USE_CLOUDINARY, USE_S3, USE_LOCAL
    return {
        "cloudinary": USE_CLOUDINARY,
        "s3":         USE_S3,
        "local":      USE_LOCAL,
        "cloud_name": settings.CLOUDINARY_CLOUD_NAME[:4] + "…" if settings.CLOUDINARY_CLOUD_NAME else "",
    }


@router.post("/migrate-images", summary="[Admin] Migrer les images base64 vers Cloudinary")
async def migrate_base64_images(admin: User = Depends(require_admin)) -> dict:
    from app.services.storage import USE_CLOUDINARY, USE_S3, USE_LOCAL

    if USE_LOCAL:
        raise HTTPException(
            status_code=400,
            detail="Aucun service cloud configuré. Ajoutez CLOUDINARY_CLOUD_NAME dans les variables d'environnement Render.",
        )

    products = await Product.find().to_list()
    total_migrated = 0
    errors: list[str] = []

    for product in products:
        new_images: list[str] = []
        changed = False

        for idx, img in enumerate(product.images or []):
            if not img.startswith("data:"):
                new_images.append(img)
                continue
            try:
                header, encoded = img.split(",", 1)
                mime = header.split(":")[1].split(";")[0]
                image_bytes = base64.b64decode(encoded)
                ext = mimetypes.guess_extension(mime) or ".jpg"
                ext = ext.replace(".jpe", ".jpg")
                key = f"products/{product.id}/{uuid.uuid4().hex}{ext}"
                url = await upload_file(image_bytes, key, mime)
                new_images.append(url)
                changed = True
                total_migrated += 1
                logger.info("Image migrée", product=product.name, idx=idx, url=url)
            except Exception as exc:
                logger.error("Échec migration image", product=product.name,
                             idx=idx, error=str(exc))
                new_images.append(img)
                errors.append(f"{product.name}[{idx}]: {str(exc)[:120]}")

        if changed:
            await product.set({Product.images: new_images})

    return {
        "migrated": total_migrated,
        "errors":   errors,
        "message":  f"{total_migrated} image(s) migrée(s) vers Cloudinary",
    }
