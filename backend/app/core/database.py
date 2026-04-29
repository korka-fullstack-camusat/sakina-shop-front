from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.core.logging import logger

_client: AsyncIOMotorClient | None = None


async def connect_db() -> None:
    global _client
    _client = AsyncIOMotorClient(settings.MONGODB_URL)

    from app.models.user        import User
    from app.models.product     import Product
    from app.models.video       import VideoJob
    from app.models.social_post import SocialPost
    from app.models.order       import Order
    from app.models.settings    import ShopSettings

    await init_beanie(
        database=_client[settings.DATABASE_NAME],
        document_models=[User, Product, VideoJob, SocialPost, Order, ShopSettings],
    )
    logger.info("MongoDB Atlas connecté", database=settings.DATABASE_NAME)


async def disconnect_db() -> None:
    if _client:
        _client.close()
        logger.info("MongoDB déconnecté")
