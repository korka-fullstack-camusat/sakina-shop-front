from beanie import Document
from pydantic import Field
from datetime import datetime, timezone


class ShopSettings(Document):
    """Paramètres de la boutique — document singleton (key='main')."""

    key: str = "main"

    # Identité
    shop_name:   str = "Sakina Shop"
    tagline:     str = "Élégance Africaine & Mode Luxueuse"
    promo_banner: str = "✨ Livraison gratuite dès 50 000 FCFA d'achat · Qualité premium, Élégance africaine"

    # Contact
    phone:    str = ""
    whatsapp: str = ""
    email:    str = "contact@sakina-shop.com"
    address:  str = ""

    # Réseaux sociaux
    instagram: str = ""
    tiktok:    str = ""
    facebook:  str = ""
    snapchat:  str = ""

    # Commerce
    currency:                  str   = "FCFA"
    delivery_fee:              float = 0.0
    free_delivery_threshold:   float = 50_000.0

    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    class Settings:
        name = "shop_settings"
