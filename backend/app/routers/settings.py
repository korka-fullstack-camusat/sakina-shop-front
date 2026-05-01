from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from app.middleware.auth import require_admin
from app.models.settings import ShopSettings
from app.models.user import User
from app.core.cache import cache_get, cache_set, cache_bust

router = APIRouter(prefix="/settings", tags=["Settings"])


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_or_create() -> ShopSettings:
    s = await ShopSettings.find_one(ShopSettings.key == "main")
    if not s:
        s = ShopSettings()
        await s.insert()
    return s


# ── Schemas ───────────────────────────────────────────────────────────────────

class SettingsUpdate(BaseModel):
    shop_name:                 Optional[str]   = None
    tagline:                   Optional[str]   = None
    promo_banner:              Optional[str]   = None
    website_url:               Optional[str]   = None
    phone:                     Optional[str]   = None
    whatsapp:                  Optional[str]   = None
    email:                     Optional[str]   = None
    address:                   Optional[str]   = None
    instagram:                 Optional[str]   = None
    tiktok:                    Optional[str]   = None
    facebook:                  Optional[str]   = None
    snapchat:                  Optional[str]   = None
    currency:                  Optional[str]   = None
    delivery_fee:              Optional[float] = None
    free_delivery_threshold:   Optional[float] = None


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/")
async def get_settings(response: Response):
    """Paramètres publics — cachés 5 min, accessible sans authentification."""
    cached = await cache_get("settings:main")
    if cached is not None:
        response.headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=60"
        response.headers["X-Cache"] = "HIT"
        return cached

    s = await _get_or_create()
    result = s.model_dump(mode="json")
    await cache_set("settings:main", result, ttl=300)
    response.headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=60"
    response.headers["X-Cache"] = "MISS"
    return result


@router.put("/")
async def update_settings(
    data: SettingsUpdate,
    _admin: User = Depends(require_admin),
):
    """Mettre à jour les paramètres de la boutique."""
    s = await _get_or_create()
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(s, field, value)
    s.updated_at = datetime.now(timezone.utc)
    await s.save()
    # Invalide le cache settings
    await cache_bust("settings:")
    return s
