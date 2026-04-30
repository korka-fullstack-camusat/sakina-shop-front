from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Literal
import httpx
from app.middleware.auth import require_admin
from app.models.user import User
from app.models.social_post import SocialPost
from app.models.product import Product
from app.models.facebook_page import FacebookPage
from app.services.social_media import tiktok_service, snapchat_service, facebook_service
from app.core.config import settings
from app.core.serializers import doc_to_dict, docs_to_list

router = APIRouter(prefix="/social", tags=["Réseaux Sociaux"])


# ── Helpers comptes Facebook ─────────────────────────────────────────────────

async def _get_facebook_accounts() -> list[dict]:
    """Retourne les Pages Facebook sauvegardées en MongoDB."""
    pages = await FacebookPage.find_all().to_list()
    return [
        {
            "id":           str(p.id),
            "name":         p.name,
            "page_id":      p.page_id,
            "access_token": p.access_token,
        }
        for p in pages
    ]


# ── Schemas ───────────────────────────────────────────────────────────────────

class PublishTarget(BaseModel):
    platform:   Literal["tiktok", "snapchat", "facebook"]
    account_id: str | None = None   # Pour Facebook : "1" ou "2"

class PublishIn(BaseModel):
    product_id: str
    targets:    list[PublishTarget]


# ── Tâche de fond ─────────────────────────────────────────────────────────────

async def _publish_to_platform(
    post: SocialPost, product: Product, target: PublishTarget
) -> None:
    if target.platform == "tiktok":
        await tiktok_service.publish_product(post, product)
    elif target.platform == "snapchat":
        await snapchat_service.publish_product(post, product)
    elif target.platform == "facebook":
        fb_accounts = {a["id"]: a for a in await _get_facebook_accounts()}
        acct = fb_accounts.get(target.account_id or "")
        if not acct:
            raise ValueError(f"Compte Facebook introuvable : {target.account_id}")
        await facebook_service.publish_product(
            post, product,
            page_id=acct["page_id"],
            access_token=acct["access_token"],
            account_name=acct["name"],
        )


# ── Routes ────────────────────────────────────────────────────────────────────

# ── Routes OAuth Facebook ─────────────────────────────────────────────────────

class FacebookExchangeIn(BaseModel):
    short_lived_token: str   # Token reçu du SDK JS Facebook

class FacebookConnectPageIn(BaseModel):
    page_id:      str
    name:         str
    access_token: str   # Page Access Token long-lived


@router.post("/facebook-exchange", summary="[Admin] Échanger token court → Pages Facebook")
async def facebook_exchange_token(
    body: FacebookExchangeIn,
    admin: User = Depends(require_admin),
) -> list[dict]:
    """
    1. Échange le token court-lived (SDK JS) contre un token long-lived (60j).
    2. Récupère la liste des Pages que l'utilisateur administre.
    3. Retourne les Pages avec leurs Page Access Tokens.
    """
    if not settings.FACEBOOK_APP_ID or not settings.FACEBOOK_APP_SECRET:
        raise HTTPException(
            status_code=400,
            detail="FACEBOOK_APP_ID et FACEBOOK_APP_SECRET non configurés dans .env",
        )

    async with httpx.AsyncClient(timeout=15) as client:
        # ── 1. Échange token court → long-lived ──────────────────────────
        exchange = await client.get(
            "https://graph.facebook.com/v18.0/oauth/access_token",
            params={
                "grant_type":        "fb_exchange_token",
                "client_id":         settings.FACEBOOK_APP_ID,
                "client_secret":     settings.FACEBOOK_APP_SECRET,
                "fb_exchange_token": body.short_lived_token,
            },
        )
        if exchange.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Échange token échoué : {exchange.text}")
        long_token = exchange.json().get("access_token", "")

        # ── 2. Récupérer les Pages de l'utilisateur ───────────────────────
        pages_resp = await client.get(
            "https://graph.facebook.com/v18.0/me/accounts",
            params={
                "access_token": long_token,
                "fields":       "id,name,access_token",
            },
        )
        if pages_resp.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Récupération Pages échouée : {pages_resp.text}")

        pages_data = pages_resp.json().get("data", [])

    return [
        {"page_id": p["id"], "name": p["name"], "access_token": p["access_token"]}
        for p in pages_data
    ]


@router.post("/facebook-connect-page", summary="[Admin] Connecter une Page Facebook")
async def facebook_connect_page(
    body: FacebookConnectPageIn,
    admin: User = Depends(require_admin),
) -> dict:
    """Sauvegarde une Page Facebook en base de données."""
    # Supprimer si déjà existante (reconnexion)
    existing = await FacebookPage.find_one(FacebookPage.page_id == body.page_id)
    if existing:
        await existing.delete()

    page = FacebookPage(
        name=body.name,
        page_id=body.page_id,
        access_token=body.access_token,
    )
    await page.insert()
    return {"connected": True, "id": str(page.id), "name": page.name}


@router.delete("/facebook-disconnect/{doc_id}", summary="[Admin] Déconnecter une Page Facebook")
async def facebook_disconnect_page(
    doc_id: str,
    admin: User = Depends(require_admin),
) -> dict:
    """Supprime une Page Facebook connectée."""
    page = await FacebookPage.get(doc_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page introuvable")
    await page.delete()
    return {"disconnected": True}


@router.get("/facebook-accounts", summary="[Admin] Pages Facebook connectées")
async def list_facebook_accounts(admin: User = Depends(require_admin)) -> list[dict]:
    """Retourne les Pages Facebook disponibles (sans exposer les tokens)."""
    return [{"id": a["id"], "name": a["name"]} for a in await _get_facebook_accounts()]


@router.post("/publish", summary="[Admin] Publier un produit sur les réseaux sociaux")
async def publish_to_social(
    body: PublishIn,
    background_tasks: BackgroundTasks,
    admin: User = Depends(require_admin),
) -> dict:
    product = await Product.get(body.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    if not product.video_url:
        raise HTTPException(
            status_code=400,
            detail="Le produit doit avoir une vidéo générée avant publication sur les réseaux",
        )

    posts = []
    for target in body.targets:
        # Récupérer le nom du compte Facebook si applicable
        account_name: str | None = None
        if target.platform == "facebook":
            fb = {a["id"]: a for a in await _get_facebook_accounts()}
            acct = fb.get(target.account_id or "")
            if not acct:
                raise HTTPException(
                    status_code=400,
                    detail=f"Compte Facebook {target.account_id} non configuré dans .env",
                )
            account_name = acct["name"]

        post = SocialPost(
            product_id=body.product_id,
            platform=target.platform,
            account_id=target.account_id,
            account_name=account_name,
        )
        await post.insert()
        background_tasks.add_task(_publish_to_platform, post, product, target)
        posts.append({
            "post_id":    str(post.id),
            "platform":   target.platform,
            "account_id": target.account_id,
            "status":     "pending",
        })

    return {"message": "Publication lancée", "posts": posts}


@router.get("/product/{product_id}", summary="[Admin] Historique publications sociales d'un produit")
async def get_product_social_posts(
    product_id: str,
    admin: User = Depends(require_admin),
) -> list[dict]:
    posts = await SocialPost.find(SocialPost.product_id == product_id).to_list()
    return docs_to_list(posts)


@router.get("/post/{post_id}", summary="[Admin] Statut d'une publication")
async def get_post_status(
    post_id: str,
    admin: User = Depends(require_admin),
) -> dict:
    post = await SocialPost.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Publication introuvable")
    return doc_to_dict(post)
