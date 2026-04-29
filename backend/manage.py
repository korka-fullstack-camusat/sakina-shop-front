#!/usr/bin/env python
"""
CLI de gestion Sakina Shop — équivalent de la commande `alembic` pour MongoDB.

Usage:
    python manage.py migrate              # Applique toutes les migrations en attente
    python manage.py migrate --target X  # Applique jusqu'à X
    python manage.py rollback --target X # Annule jusqu'à X (inclus)
    python manage.py status              # Affiche l'état des migrations
    python manage.py makemigration <nom> # Génère un nouveau fichier de migration
"""
import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorClient

# Assure que le package app est importable
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import settings
from app.core.migrations import migrate_up, migrate_down, migration_status

MIGRATIONS_DIR = Path(__file__).parent / "migrations"

MIGRATION_TEMPLATE = '''\
"""
Migration {name}
{description}
"""
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.migration_base import BaseMigration


class Migration(BaseMigration):
    """{description}"""

    async def forward(self, db: AsyncIOMotorDatabase) -> None:
        # TODO: implémenter la migration
        pass

    async def backward(self, db: AsyncIOMotorDatabase) -> None:
        # TODO: implémenter le rollback
        pass
'''


def _get_db():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    return client[settings.DATABASE_NAME]


async def cmd_migrate(target: str | None) -> None:
    db = _get_db()
    await migrate_up(db, target)


async def cmd_rollback(target: str) -> None:
    db = _get_db()
    await migrate_down(db, target)


async def cmd_status() -> None:
    db = _get_db()
    statuses = await migration_status(db)
    print(f"\n{'NOM':<55} {'STATUT':<10} DESCRIPTION")
    print("─" * 100)
    for s in statuses:
        icon = "✅" if s["status"] == "applied" else "⏳"
        print(f"{s['name']:<55} {icon} {s['status']:<8} {s['description']}")
    print()


def cmd_makemigration(name: str) -> None:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    slug = name.lower().replace(" ", "_")
    filename = f"{timestamp}_{slug}.py"
    path = MIGRATIONS_DIR / filename
    content = MIGRATION_TEMPLATE.format(
        name=filename.replace(".py", ""),
        description=name.replace("_", " ").capitalize(),
    )
    path.write_text(content, encoding="utf-8")
    print(f"✅ Migration créée : migrations/{filename}")


def main() -> None:
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)

    command = args[0]

    if command == "migrate":
        target = None
        if "--target" in args:
            idx = args.index("--target")
            target = args[idx + 1]
        asyncio.run(cmd_migrate(target))

    elif command == "rollback":
        if "--target" not in args:
            print("Erreur: --target requis pour rollback")
            sys.exit(1)
        idx = args.index("--target")
        target = args[idx + 1]
        asyncio.run(cmd_rollback(target))

    elif command == "status":
        asyncio.run(cmd_status())

    elif command == "makemigration":
        if len(args) < 2:
            print("Erreur: python manage.py makemigration <nom_de_la_migration>")
            sys.exit(1)
        cmd_makemigration(args[1])

    else:
        print(f"Commande inconnue: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
