import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from app.middleware.auth import require_admin
from app.models.user import User
from app.models.video import VideoJob
from app.models.product import Product
from app.services.ai_video import runway_service, _runway_configured
from app.services.storage import delete_file, extract_key_from_url
from app.core.serializers import doc_to_dict, docs_to_list
from app.core.logging import logger

router = APIRouter(prefix="/videos", tags=["Vidéos IA"])


class VideoGenerateIn(BaseModel):
    product_id: str
    prompt: str = ""


def _build_prompt(product: Product, custom_prompt: str) -> str:
    if custom_prompt:
        return custom_prompt
    return (
        f"Cinematic product showcase video of {product.name}. "
        f"High quality, professional lighting, smooth camera movement. "
        f"Category: {product.category}. "
        f"Style: modern, elegant, commercial advertisement."
    )


@router.post("/generate", summary="[Admin] Générer une vidéo IA pour un produit")
async def generate_video(
    body: VideoGenerateIn,
    background_tasks: BackgroundTasks,
    admin: User = Depends(require_admin),
) -> dict:
    # Vérification clé Runway avant tout
    if not _runway_configured():
        raise HTTPException(
            status_code=503,
            detail="Service vidéo non configuré. Ajoutez RUNWAY_API_KEY dans le fichier .env.",
        )

    product = await Product.get(body.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    if not product.images:
        raise HTTPException(status_code=400, detail="Le produit doit avoir au moins une image")

    prompt = _build_prompt(product, body.prompt)
    job = VideoJob(product_id=body.product_id, prompt=prompt)
    await job.insert()

    background_tasks.add_task(runway_service.generate_video_for_product, job, product)

    return {
        "job_id":   str(job.id),
        "status":   "pending",
        "message":  "Génération vidéo lancée en arrière-plan",
    }


@router.get("/job/{job_id}", summary="[Admin] Statut d'une tâche de génération")
async def get_job_status(
    job_id: str,
    admin: User = Depends(require_admin),
) -> dict:
    job = await VideoJob.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Tâche introuvable")
    return doc_to_dict(job)


@router.get("/product/{product_id}", summary="[Admin] Historique vidéos d'un produit")
async def list_product_videos(
    product_id: str,
    admin: User = Depends(require_admin),
) -> list[dict]:
    jobs = await VideoJob.find(VideoJob.product_id == product_id).to_list()
    return docs_to_list(jobs)


@router.delete("/job/{job_id}", summary="[Admin] Supprimer une vidéo générée")
async def delete_video_job(
    job_id: str,
    admin: User = Depends(require_admin),
) -> dict:
    job = await VideoJob.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Tâche introuvable")

    # Supprimer le fichier vidéo du storage (local ou S3)
    if job.video_url:
        try:
            key = extract_key_from_url(job.video_url)
            await delete_file(key)
        except Exception as exc:
            logger.warning("Impossible de supprimer le fichier vidéo",
                           url=job.video_url, error=str(exc))

    # Retirer le video_url du produit si c'est celui-là
    if job.video_url:
        product = await Product.find_one(
            Product.id == job.product_id,  # type: ignore[arg-type]
            Product.video_url == job.video_url,
        )
        if product:
            await product.set({Product.video_url: None})

    await job.delete()
    logger.info("Job vidéo supprimé", job_id=job_id)
    return {"deleted": True, "job_id": job_id}
