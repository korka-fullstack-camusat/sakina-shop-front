import httpx
from datetime import datetime, timezone
from tenacity import retry, stop_after_attempt, wait_exponential
from app.core.config import settings
from app.core.logging import logger
from app.models.social_post import SocialPost
from app.models.product import Product


class TikTokService:
    """Publication sur TikTok via TikTok for Business Content Posting API."""

    BASE_URL = "https://open.tiktokapis.com/v2"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=8))
    async def upload_video(self, video_url: str, title: str, description: str) -> dict:
        headers = {
            "Authorization": f"Bearer {settings.TIKTOK_ACCESS_TOKEN}",
            "Content-Type": "application/json; charset=UTF-8",
        }
        # Étape 1 : Init upload
        async with httpx.AsyncClient(timeout=30) as client:
            init_resp = await client.post(
                f"{self.BASE_URL}/post/publish/video/init/",
                headers=headers,
                json={
                    "post_info": {
                        "title": title[:150],
                        "description": description[:2200],
                        "privacy_level": "PUBLIC_TO_EVERYONE",
                        "disable_duet": False,
                        "disable_comment": False,
                        "disable_stitch": False,
                    },
                    "source_info": {
                        "source": "PULL_FROM_URL",
                        "video_url": video_url,
                    },
                },
            )
            init_resp.raise_for_status()
            data = init_resp.json()["data"]
            publish_id: str = data["publish_id"]
            logger.info("TikTok upload initié", publish_id=publish_id)
            return {"publish_id": publish_id}

    async def publish_product(self, post: SocialPost, product: Product) -> None:
        if not product.video_url:
            raise ValueError("Aucune vidéo disponible pour la publication TikTok")
        try:
            description = (
                f"✨ {product.name}\n"
                f"💰 {product.price} {product.currency}\n"
                f"📦 {product.description[:200]}\n"
                f"#SakinaShop #{product.category}"
            )
            result = await self.upload_video(product.video_url, product.name, description)
            await post.set({
                SocialPost.status: "published",
                SocialPost.post_id: result["publish_id"],
                SocialPost.published_at: datetime.now(timezone.utc),
            })
            logger.info("Publié sur TikTok", product_id=str(product.id))
        except Exception as exc:
            logger.error("Erreur publication TikTok", error=str(exc))
            await post.set({SocialPost.status: "failed", SocialPost.error: str(exc)})
            raise


class SnapchatService:
    """Publication sur Snapchat via Snapchat Marketing API."""

    BASE_URL = "https://adsapi.snapchat.com/v1"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=8))
    async def upload_media(self, video_url: str, name: str) -> str:
        """Upload un média vidéo et retourne le media_id."""
        headers = {
            "Authorization": f"Bearer {settings.SNAPCHAT_ACCESS_TOKEN}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{self.BASE_URL}/adaccounts/{settings.SNAPCHAT_AD_ACCOUNT_ID}/media",
                headers=headers,
                json={
                    "media": [{
                        "name": name,
                        "type": "VIDEO",
                        "ad_account_id": settings.SNAPCHAT_AD_ACCOUNT_ID,
                    }]
                },
            )
            resp.raise_for_status()
            media_id: str = resp.json()["media"][0]["media"]["id"]
            logger.info("Snapchat media créé", media_id=media_id)
            return media_id

    async def publish_product(self, post: SocialPost, product: Product) -> None:
        if not product.video_url:
            raise ValueError("Aucune vidéo disponible pour la publication Snapchat")
        try:
            media_id = await self.upload_media(product.video_url, product.name)
            await post.set({
                SocialPost.status: "published",
                SocialPost.post_id: media_id,
                SocialPost.published_at: datetime.now(timezone.utc),
            })
            logger.info("Publié sur Snapchat", product_id=str(product.id))
        except Exception as exc:
            logger.error("Erreur publication Snapchat", error=str(exc))
            await post.set({SocialPost.status: "failed", SocialPost.error: str(exc)})
            raise


class FacebookService:
    """
    Publication sur une Page Facebook via l'API Graph (v18).
    Nécessite un Page Access Token et un Page ID.
    """

    BASE_URL = "https://graph.facebook.com/v18.0"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=8))
    async def post_video(
        self,
        page_id: str,
        access_token: str,
        video_url: str,
        description: str,
    ) -> str:
        """
        Publie une vidéo sur une Page Facebook.
        Retourne l'ID du post créé.
        """
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{self.BASE_URL}/{page_id}/videos",
                data={
                    "access_token": access_token,
                    "file_url": video_url,
                    "description": description,
                    "published": "true",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            post_id: str = data.get("id", "")
            logger.info("Facebook vidéo publiée", page_id=page_id, post_id=post_id)
            return post_id

    async def publish_product(
        self,
        post: SocialPost,
        product: Product,
        page_id: str,
        access_token: str,
        account_name: str,
    ) -> None:
        if not product.video_url:
            raise ValueError("Aucune vidéo disponible pour la publication Facebook")
        try:
            description = (
                f"✨ {product.name}\n"
                f"💰 {int(product.price):,} {product.currency}\n"
                f"{(product.description or '')[:300]}\n\n"
                f"📦 Commandez maintenant !"
            )
            post_id = await self.post_video(
                page_id, access_token, product.video_url, description
            )
            post_url = f"https://www.facebook.com/{page_id}/videos/{post_id}"
            await post.set({
                SocialPost.status:       "published",
                SocialPost.post_id:      post_id,
                SocialPost.post_url:     post_url,
                SocialPost.published_at: datetime.now(timezone.utc),
            })
            logger.info("Publié sur Facebook", page_id=page_id, product_id=str(product.id))
        except Exception as exc:
            logger.error("Erreur publication Facebook", error=str(exc))
            await post.set({SocialPost.status: "failed", SocialPost.error: str(exc)})
            raise


tiktok_service   = TikTokService()
snapchat_service = SnapchatService()
facebook_service = FacebookService()
