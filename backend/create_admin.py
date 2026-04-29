#!/usr/bin/env python3
"""
Script de création / promotion d'un compte administrateur.

Usage :
    cd backend
    python create_admin.py
"""
import asyncio
import getpass
import sys

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User
from app.models.product import Product
from app.models.video import VideoJob
from app.models.social_post import SocialPost
from app.models.order import Order
from app.models.settings import ShopSettings


async def main() -> None:
    # ── Connexion DB ──────────────────────────────────────────────────────────
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.DATABASE_NAME],
        document_models=[User, Product, VideoJob, SocialPost, Order, ShopSettings],
    )

    print("\n" + "=" * 50)
    print("  SAKINA SHOP — Création compte Administrateur")
    print("=" * 50 + "\n")

    email     = input("Email admin       : ").strip()
    full_name = input("Nom complet       : ").strip()
    password  = getpass.getpass("Mot de passe      : ")
    confirm   = getpass.getpass("Confirmer le mdp  : ")

    if password != confirm:
        print("\n❌  Les mots de passe ne correspondent pas.")
        sys.exit(1)

    if len(password) < 6:
        print("\n❌  Mot de passe trop court (minimum 6 caractères).")
        sys.exit(1)

    # ── Email existe déjà ? ───────────────────────────────────────────────────
    existing = await User.find_one(User.email == email)

    if existing:
        if existing.role == "admin":
            print(f"\n✅  {email} est déjà administrateur. Rien à faire.")
        else:
            existing.role = "admin"
            await existing.save()
            print(f"\n✅  Compte {email} promu au rôle ADMIN avec succès !")
    else:
        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role="admin",
        )
        await user.insert()
        print(f"\n✅  Administrateur '{full_name}' créé avec succès !")

    print("\nVous pouvez maintenant vous connecter via la boutique.\n")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
