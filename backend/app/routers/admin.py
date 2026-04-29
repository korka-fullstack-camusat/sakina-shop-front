from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.core.migrations import migrate_up, migrate_down, migration_status
from app.middleware.auth import require_admin
from app.models.user import User

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
