"""
Script one-shot pour nettoyer la base avant un premier démarrage propre.
À n'exécuter QU'UNE FOIS, juste après le 1er `python manage.py migrate`
si tu rencontres IndexKeySpecsConflict.

Usage: python reset_indexes.py
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings

COLLECTIONS = ["users", "products", "video_jobs", "social_posts"]


async def main() -> None:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]

    for name in COLLECTIONS:
        existing = await db[name].list_indexes().to_list(length=None)
        # Garde uniquement l'index _id (système, indestructible)
        for idx in existing:
            if idx["name"] != "_id_":
                print(f"  Suppression index {idx['name']} sur {name}...")
                await db[name].drop_index(idx["name"])
        print(f"✅ Collection {name} nettoyée")

    print("\n✅ Base prête. Redémarre uvicorn — Beanie recréera les indexes correctement.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
