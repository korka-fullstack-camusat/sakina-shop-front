"""
Migration 20240101_000001 — Schéma initial
Initialise la collection de tracking des migrations.
Les indexes métier sont gérés par Beanie via les modèles (voir app/models/).
"""
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.migration_base import BaseMigration


class Migration(BaseMigration):
    """Création de la collection de tracking des migrations."""

    async def forward(self, db: AsyncIOMotorDatabase) -> None:
        await db["__migrations__"].create_index("name", unique=True)

    async def backward(self, db: AsyncIOMotorDatabase) -> None:
        await db["__migrations__"].drop_indexes()
