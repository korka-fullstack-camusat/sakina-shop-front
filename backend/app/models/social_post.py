from beanie import Document
from pydantic import Field
from datetime import datetime, timezone
from typing import Literal


class SocialPost(Document):
    product_id: str
    platform: Literal["tiktok", "snapchat", "facebook"]
    account_id: str | None = None    # Pour Facebook : "1" ou "2"
    account_name: str | None = None  # Nom affiché du compte Facebook
    status: Literal["pending", "published", "failed"] = "pending"
    post_id: str | None = None       # ID retourné par la plateforme
    post_url: str | None = None
    error: str | None = None
    published_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "social_posts"
        indexes = ["product_id", "platform", "status"]
