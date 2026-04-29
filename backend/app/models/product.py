from beanie import Document, Indexed
from pydantic import Field
from datetime import datetime, timezone
from typing import Literal


class Product(Document):
    name: Indexed(str)
    description: str
    price: float
    currency: str = "XOF"
    category: str
    images: list[str] = []          # URLs S3
    video_url: str | None = None    # URL vidéo IA générée
    stock: int = 0
    is_published: bool = False
    status: Literal["draft", "published", "archived"] = "draft"
    created_by: str                  # User ID admin
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "products"
        indexes = ["status", "category", "is_published"]
