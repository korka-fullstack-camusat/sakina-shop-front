from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.core.logging import logger

_client: AsyncIOMotorClient | None = None


async def connect_db() -> None:
    global _client

    # ── Pool de connexions optimisé pour la production ─────────────────────────
    _client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        # Pool de connexions : up to 200 connexions simultanées
        maxPoolSize=200,
        minPoolSize=5,
        # Timeouts réseau pour éviter les connexions zombies
        serverSelectionTimeoutMS=5_000,   # 5s max pour trouver un serveur
        connectTimeoutMS=5_000,           # 5s max pour établir la connexion
        socketTimeoutMS=30_000,           # 30s max pour une requête
        # Keep-alive
        maxIdleTimeMS=60_000,             # 60s avant de fermer une connexion idle
        # Compression réseau avec MongoDB Atlas
        compressors=["zlib"],
    )

    from app.models.user          import User
    from app.models.product       import Product
    from app.models.video         import VideoJob
    from app.models.social_post   import SocialPost
    from app.models.order         import Order
    from app.models.settings      import ShopSettings
    from app.models.facebook_page import FacebookPage

    await init_beanie(
        database=_client[settings.DATABASE_NAME],
        document_models=[User, Product, VideoJob, SocialPost, Order, ShopSettings, FacebookPage],
    )
    logger.info(
        "MongoDB Atlas connecté",
        database=settings.DATABASE_NAME,
        pool_max=200,
    )


async def disconnect_db() -> None:
    if _client:
        _client.close()
        logger.info("MongoDB déconnecté")
