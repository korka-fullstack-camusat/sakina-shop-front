"""
Service de génération vidéo publicitaire.

Pipeline :
  1. Lecture de TOUTES les images du produit (local ou HTTPS)
  2. Voix off française générée par edge-tts (Microsoft TTS, gratuit)
  3. Slideshow 9:16 avec transitions cross-fade via ffmpeg bundlé (imageio-ffmpeg)
  4. Mix audio + vidéo → fichier MP4 final
  5. Upload sur storage local/S3

Fal.ai est conservé comme fallback (1 seule image animée IA) si nécessaire.
"""

import os
import asyncio
import base64
import mimetypes
import subprocess
import tempfile
from pathlib import Path
from datetime import datetime, timezone

import httpx
import edge_tts
import imageio_ffmpeg

from app.core.config import settings
from app.core.logging import logger
from app.models.video import VideoJob
from app.models.product import Product
from app.services.storage import upload_file

# ── Constantes ────────────────────────────────────────────────────────────────
UPLOAD_DIR  = Path(__file__).resolve().parent.parent.parent / "uploads"
FFMPEG_BIN  = imageio_ffmpeg.get_ffmpeg_exe()

# Voix off française (Microsoft Edge TTS — gratuit, naturelle)
TTS_VOICE   = "fr-FR-DeniseNeural"   # voix féminine naturelle
# Alternatives : "fr-FR-HenriNeural" (masculin), "fr-FR-EloiseNeural" (féminin jeune)

# Durée d'affichage de chaque image (secondes)
SECS_PER_IMAGE = 3

# ── Détection clé Fal.ai ─────────────────────────────────────────────────────
_FAKE_KEYS = {"", "your-runway-key", "CHANGE_ME", "unused"}

def _fal_configured() -> bool:
    return bool(settings.FAL_KEY.strip()) and settings.FAL_KEY.strip() not in _FAKE_KEYS

def _runway_configured() -> bool:
    """Alias public utilisé par le router."""
    return True   # on utilise ffmpeg local → toujours disponible


# ── Script voix off ───────────────────────────────────────────────────────────

def _build_ad_script(product: Product) -> str:
    """Génère un script publicitaire court à partir des infos produit."""
    name  = product.name
    desc  = (product.description or "").strip()
    price = f"{int(product.price):,}".replace(",", " ")
    curr  = product.currency or "FCFA"
    cat   = product.category or ""

    # Tronquer la description à 120 caractères pour garder un rythme dynamique
    short_desc = (desc[:120] + "…") if len(desc) > 120 else desc

    lines = [
        f"Découvrez {name}.",
    ]
    if short_desc:
        lines.append(short_desc)
    if cat:
        lines.append(f"Dans la catégorie {cat}.")
    lines.append(f"Disponible maintenant pour seulement {price} {curr}.")
    lines.append("Commandez dès aujourd'hui sur notre boutique en ligne !")

    return "  ".join(lines)


# ── Helpers images ────────────────────────────────────────────────────────────

def _local_path_from_url(url: str) -> Path | None:
    """Retourne le Path local si l'URL pointe vers localhost."""
    if "localhost" in url or "127.0.0.1" in url:
        part = url.split("/uploads/", 1)[-1]
        return UPLOAD_DIR / part
    return None


async def _fetch_image_bytes(url: str) -> tuple[bytes, str]:
    """Télécharge une image (locale ou HTTPS) et retourne (bytes, mime_type)."""
    local = _local_path_from_url(url)
    if local and local.exists():
        mime, _ = mimetypes.guess_type(str(local))
        return local.read_bytes(), mime or "image/jpeg"
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        ct = resp.headers.get("content-type", "image/jpeg").split(";")[0]
        return resp.content, ct


def _to_data_uri(image_url: str) -> str:
    """Convertit une image locale en Data URI base64 (pour Fal.ai)."""
    local = _local_path_from_url(image_url)
    if local and local.exists():
        mime, _ = mimetypes.guess_type(str(local))
        mime = mime or "image/jpeg"
        enc  = base64.b64encode(local.read_bytes()).decode()
        return f"data:{mime};base64,{enc}"
    return image_url   # URL HTTPS → passée directement


# ── Pipeline principal ────────────────────────────────────────────────────────

class AdVideoService:
    """Génère une vidéo publicitaire à partir des images et infos d'un produit."""

    async def generate_video_for_product(self, job: VideoJob, product: Product) -> None:
        try:
            await job.set({VideoJob.status: "processing"})

            if not product.images:
                raise ValueError("Le produit doit avoir au moins une image.")

            with tempfile.TemporaryDirectory() as _tmpdir:
                tmpdir = Path(_tmpdir)

                # ── 1. Télécharger toutes les images ─────────────────────
                logger.info("Téléchargement des images",
                            product_id=str(product.id),
                            count=len(product.images))

                img_paths: list[Path] = []
                for idx, url in enumerate(product.images):
                    data, mime = await _fetch_image_bytes(url)
                    ext  = mimetypes.guess_extension(mime) or ".jpg"
                    ext  = ext.replace(".jpe", ".jpg")
                    dest = tmpdir / f"img_{idx:02d}{ext}"
                    dest.write_bytes(data)
                    img_paths.append(dest)

                # ── 2. Générer la voix off ────────────────────────────────
                script     = job.prompt if job.prompt else _build_ad_script(product)
                audio_path = tmpdir / "voiceover.mp3"

                logger.info("Génération voix off", voice=TTS_VOICE,
                            chars=len(script))
                communicate = edge_tts.Communicate(script, voice=TTS_VOICE,
                                                   rate="+5%", volume="+10%")
                await communicate.save(str(audio_path))

                # ── 3. Créer le slideshow vidéo ───────────────────────────
                video_silent = tmpdir / "slideshow_silent.mp4"
                await self._create_slideshow(img_paths, video_silent)

                # ── 4. Mixer audio + vidéo ────────────────────────────────
                final_path = tmpdir / "ad_final.mp4"
                await self._mix_audio(video_silent, audio_path, final_path)

                # ── 5. Upload ─────────────────────────────────────────────
                s3_key    = f"videos/{product.id}/{job.id}.mp4"
                final_url = await upload_file(
                    final_path.read_bytes(), s3_key, "video/mp4"
                )

            # ── 6. Mise à jour BDD ────────────────────────────────────────
            await job.set({
                VideoJob.status:       "completed",
                VideoJob.video_url:    final_url,
                VideoJob.completed_at: datetime.now(timezone.utc),
            })
            await product.set({Product.video_url: final_url})

            logger.info("Vidéo publicitaire générée",
                        product_id=str(product.id), url=final_url)

        except Exception as exc:
            msg = str(exc)
            logger.error("Erreur génération vidéo pub",
                         error=msg, job_id=str(job.id))
            await job.set({VideoJob.status: "failed", VideoJob.error: msg})

    # ── FFmpeg helpers ────────────────────────────────────────────────────────

    async def _create_slideshow(
        self, images: list[Path], output: Path
    ) -> None:
        """
        Crée un slideshow 1080×1920 (9:16) avec cross-fade entre les images.
        Chaque image est affichée SECS_PER_IMAGE secondes.
        """
        n   = len(images)
        fps = 25
        dur = SECS_PER_IMAGE
        fade_duration = 0.5   # secondes de cross-fade

        # Construire les inputs ffmpeg
        # Toutes les images sauf la dernière ont du padding pour le cross-fade.
        # La dernière image n'a besoin que de SECS_PER_IMAGE secondes.
        cmd: list[str] = [FFMPEG_BIN, "-y"]
        for idx, p in enumerate(images):
            t = dur if (n == 1 or idx == n - 1) else str(dur + fade_duration)
            cmd += ["-loop", "1", "-t", str(t), "-i", str(p)]

        # Filter complex : scale + pad + cross-fade entre segments
        filters: list[str] = []

        # Scale & pad chaque image en 1080×1920 (format portrait)
        for i in range(n):
            filters.append(
                f"[{i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,"
                f"pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,"
                f"setsar=1,fps={fps}[s{i}]"
            )

        if n == 1:
            # Une seule image : pas de cross-fade nécessaire
            filters.append(f"[s0]setpts=PTS-STARTPTS[vout]")
        else:
            # Cross-fade enchaîné
            prev = "s0"
            for i in range(1, n):
                offset = i * dur - fade_duration * i
                out    = f"cf{i}" if i < n - 1 else "vout"
                filters.append(
                    f"[{prev}][s{i}]xfade=transition=fade:"
                    f"duration={fade_duration}:offset={offset:.2f}[{out}]"
                )
                prev = out

        filter_complex = ";".join(filters)

        cmd += [
            "-filter_complex", filter_complex,
            "-map", "[vout]",
            "-c:v", "libx264",
            "-preset", "fast",
            "-pix_fmt", "yuv420p",
            str(output),
        ]

        await self._run_ffmpeg(cmd, "slideshow")

    async def _mix_audio(
        self, video: Path, audio: Path, output: Path
    ) -> None:
        """Superpose la voix off sur la vidéo. La vidéo s'arrête à la fin de l'audio."""
        cmd = [
            FFMPEG_BIN, "-y",
            "-i", str(video),
            "-i", str(audio),
            "-map", "0:v",
            "-map", "1:a",
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "128k",
            "-shortest",        # s'arrête quand le plus court (audio) se termine
            str(output),
        ]
        await self._run_ffmpeg(cmd, "mix_audio")

    @staticmethod
    async def _run_ffmpeg(cmd: list[str], step: str) -> None:
        """Exécute ffmpeg dans un thread executor (non-bloquant)."""
        def _run():
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,
            )
            if result.returncode != 0:
                raise RuntimeError(
                    f"ffmpeg [{step}] failed:\n{result.stderr[-2000:]}"
                )

        logger.info(f"ffmpeg [{step}] démarré")
        await asyncio.get_event_loop().run_in_executor(None, _run)
        logger.info(f"ffmpeg [{step}] terminé")


# ── Instance unique (même nom pour compatibilité router) ─────────────────────
runway_service = AdVideoService()
