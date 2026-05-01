"""
Cache en mémoire avec TTL — léger, sans dépendance Redis.
Parfait pour les endpoints publics à fort trafic (liste produits, settings…).

Usage :
    from app.core.cache import cache_get, cache_set, cache_bust

    val = await cache_get("products:all")
    if val is None:
        val = await fetch_from_db()
        await cache_set("products:all", val, ttl=120)
    return val
"""
import asyncio
import time
from typing import Any

# ─── Stockage ─────────────────────────────────────────────────────────────────
_store: dict[str, tuple[Any, float]] = {}
_lock  = asyncio.Lock()


# ─── API publique ──────────────────────────────────────────────────────────────

async def cache_get(key: str) -> Any | None:
    """Retourne la valeur en cache ou None si absente / expirée."""
    entry = _store.get(key)
    if entry is None:
        return None
    value, expires_at = entry
    if time.monotonic() > expires_at:
        async with _lock:
            _store.pop(key, None)
        return None
    return value


async def cache_set(key: str, value: Any, ttl: int = 120) -> None:
    """Stocke une valeur pendant `ttl` secondes."""
    async with _lock:
        _store[key] = (value, time.monotonic() + ttl)


async def cache_bust(prefix: str) -> None:
    """Supprime toutes les clés commençant par `prefix`."""
    async with _lock:
        keys = [k for k in _store if k.startswith(prefix)]
        for k in keys:
            del _store[k]


async def cache_clear_all() -> None:
    """Vide tout le cache (utile pour tests)."""
    async with _lock:
        _store.clear()


def cache_size() -> int:
    """Nombre d'entrées en cache (debug)."""
    return len(_store)
