from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.database import connect_db, disconnect_db
from app.routers import auth, products, videos, social, admin
from app.routers import orders, users_admin, settings as settings_router

# Dossier uploads (stockage local développement)
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    await connect_db()
    logger.info("SAKINA SHOP démarré", env=settings.APP_ENV)
    yield
    await disconnect_db()
    logger.info("SAKINA SHOP arrêté")


app = FastAPI(
    title="SAKINA SHOP API",
    description="API e-commerce Sakina Shop",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs"  if settings.APP_ENV != "production" else None,
    redoc_url="/redoc" if settings.APP_ENV != "production" else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Compression GZip (réduction ~70-90% des payloads JSON / base64) ───────────
# minimum_size=500 : ne compresse que les réponses > 500 octets (évite overhead)
app.add_middleware(GZipMiddleware, minimum_size=500)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://sakina-shop.vercel.app",
        "https://sakina-shop-196evjs8i-korka-camusats-projects.vercel.app",
        "https://sakina-shop-1t7fg19l8-korka-camusats-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Cache", "X-Response-Time"],
)

# ── Middleware : temps de réponse dans le header ───────────────────────────────
import time

@app.middleware("http")
async def add_response_time(request: Request, call_next):
    start = time.perf_counter()
    response: Response = await call_next(request)
    elapsed = (time.perf_counter() - start) * 1000
    response.headers["X-Response-Time"] = f"{elapsed:.1f}ms"
    return response

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,            prefix="/api/v1")
app.include_router(products.router,        prefix="/api/v1")
app.include_router(videos.router,          prefix="/api/v1")
app.include_router(social.router,          prefix="/api/v1")
app.include_router(admin.router,           prefix="/api/v1")
app.include_router(orders.router,          prefix="/api/v1")
app.include_router(users_admin.router,     prefix="/api/v1")
app.include_router(settings_router.router, prefix="/api/v1")

# ── Fichiers statiques ────────────────────────────────────────────────────────
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    from app.core.cache import cache_size
    return {
        "status": "ok",
        "app":    settings.APP_NAME,
        "cache_entries": cache_size(),
    }
