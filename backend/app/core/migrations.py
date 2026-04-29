"""
Système de migrations MongoDB inspiré d'Alembic.
- Stocke l'historique dans la collection __migrations__
- Exécute les migrations dans l'ordre alphabétique (timestamp dans le nom)
- Supporte forward (upgrade) et backward (downgrade)
"""
import importlib
import importlib.util
from datetime import datetime, timezone
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.logging import logger

MIGRATIONS_DIR = Path(__file__).parents[2] / "migrations"
TRACKER_COLLECTION = "__migrations__"


def _discover_migrations() -> list[Path]:
    """Retourne les fichiers de migration triés par ordre chronologique."""
    files = sorted(
        MIGRATIONS_DIR.glob("[0-9]*.py"),
        key=lambda p: p.stem,
    )
    return files


async def _get_applied(db: AsyncIOMotorDatabase) -> set[str]:
    docs = await db[TRACKER_COLLECTION].find({}, {"name": 1}).to_list(length=None)
    return {d["name"] for d in docs}


async def _mark_applied(db: AsyncIOMotorDatabase, name: str) -> None:
    await db[TRACKER_COLLECTION].insert_one(
        {"name": name, "applied_at": datetime.now(timezone.utc)}
    )


async def _mark_reverted(db: AsyncIOMotorDatabase, name: str) -> None:
    await db[TRACKER_COLLECTION].delete_one({"name": name})


def _load_migration(path: Path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.Migration()


async def migrate_up(db: AsyncIOMotorDatabase, target: str | None = None) -> None:
    """Applique toutes les migrations en attente (ou jusqu'à `target`)."""
    applied = await _get_applied(db)
    pending = [f for f in _discover_migrations() if f.stem not in applied]

    if not pending:
        logger.info("Aucune migration en attente — base à jour")
        return

    for path in pending:
        name = path.stem
        if target and name > target:
            break
        logger.info("Application migration", name=name)
        migration = _load_migration(path)
        await migration.forward(db)
        await _mark_applied(db, name)
        logger.info("Migration appliquée", name=name)


async def migrate_down(db: AsyncIOMotorDatabase, target: str) -> None:
    """Annule les migrations jusqu'à `target` (inclus)."""
    applied = await _get_applied(db)
    to_revert = sorted(
        [f for f in _discover_migrations() if f.stem in applied and f.stem >= target],
        key=lambda p: p.stem,
        reverse=True,
    )

    for path in to_revert:
        name = path.stem
        logger.info("Annulation migration", name=name)
        migration = _load_migration(path)
        await migration.backward(db)
        await _mark_reverted(db, name)
        logger.info("Migration annulée", name=name)


async def migration_status(db: AsyncIOMotorDatabase) -> list[dict]:
    """Retourne l'état de toutes les migrations."""
    applied = await _get_applied(db)
    all_files = _discover_migrations()
    return [
        {
            "name": f.stem,
            "status": "applied" if f.stem in applied else "pending",
            "description": (
                _load_migration(f).__class__.__doc__ or ""
            ).strip().split("\n")[0],
        }
        for f in all_files
    ]
