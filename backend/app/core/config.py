from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "SakinaShop"
    APP_ENV: str = "development"
    APP_BASE_URL: str = "http://localhost:8000"   # URL de base pour les fichiers locaux
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    MONGODB_URL: str
    DATABASE_NAME: str = "sakina_shop"

    REDIS_URL: str = "redis://localhost:6379"

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "eu-west-3"
    S3_BUCKET_NAME: str = "sakina-shop-media"

    FAL_KEY: str = ""

    RUNWAY_API_KEY: str = ""
    RUNWAY_API_URL: str = "https://api.dev.runwayml.com/v1"

    TIKTOK_CLIENT_KEY: str = ""
    TIKTOK_CLIENT_SECRET: str = ""
    TIKTOK_ACCESS_TOKEN: str = ""

    SNAPCHAT_CLIENT_ID: str = ""
    SNAPCHAT_CLIENT_SECRET: str = ""
    SNAPCHAT_ACCESS_TOKEN: str = ""
    SNAPCHAT_AD_ACCOUNT_ID: str = ""

    # Cloudinary (stockage images & vidéos)
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY:    str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Facebook App (OAuth)
    FACEBOOK_APP_ID:     str = ""
    FACEBOOK_APP_SECRET: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
