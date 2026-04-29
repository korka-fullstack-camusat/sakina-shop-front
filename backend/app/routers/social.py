from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Literal
from app.middleware.auth import require_admin
from app.models.user import User
from app.models.social_post import SocialPost
from app.models.product import Product
from app.services.social_media import tiktok_service, snapchat_service
from app.core.serializers import doc_to_dict, docs_to_list

router = APIRouter(prefix="/social", tags=["Réseaux Sociaux"])


class PublishIn(BaseModel):
    product_id: str
    platforms: list[Literal["tiktok", "snapchat"]]


async def _publish_to_platform(post: SocialPost, product: Product, platform: str) -> None:
    if platform == "tiktok":
        await tiktok_service.publish_product(post, product)
    elif platform == "snapchat":
        await snapchat_service.publish_product(post, product)


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
    for platform in body.platforms:
        post = SocialPost(product_id=body.product_id, platform=platform)
        await post.insert()
        background_tasks.add_task(_publish_to_platform, post, product, platform)
        posts.append({"post_id": str(post.id), "platform": platform, "status": "pending"})

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
