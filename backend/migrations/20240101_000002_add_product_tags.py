"""
Migration 20240101_000002 — Ajout du champ tags aux produits
Exemple de migration qui ajoute un nouveau champ avec valeur par défaut.
"""
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.migration_base import BaseMigration


class Migration(BaseMigration):
    """Ajout du champ tags (liste) à tous les produits existants."""

    async def forward(self, db: AsyncIOMotorDatabase) -> None:
        await db["products"].update_many(
            {"tags": {"$exists": False}},
            {"$set": {"tags": []}},
        )

    async def backward(self, db: AsyncIOMotorDatabase) -> None:
        await db["products"].update_many(
            {},
            {"$unset": {"tags": ""}},
        )
