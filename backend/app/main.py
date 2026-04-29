from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

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


limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="SAKINA SHOP API",
    description="API e-commerce avec génération vidéo IA et publication réseaux sociaux",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs"  if settings.APP_ENV != "production" else None,
    redoc_url="/redoc" if settings.APP_ENV != "production" else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://sakina-shop.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,            prefix="/api/v1")
app.include_router(products.router,        prefix="/api/v1")
app.include_router(videos.router,          prefix="/api/v1")
app.include_router(social.router,          prefix="/api/v1")
app.include_router(admin.router,           prefix="/api/v1")
app.include_router(orders.router,          prefix="/api/v1")
app.include_router(users_admin.router,     prefix="/api/v1")
app.include_router(settings_router.router, prefix="/api/v1")

# Fichiers statiques locaux (images produits en mode développement)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    return {"status": "ok", "app": settings.APP_NAME}
