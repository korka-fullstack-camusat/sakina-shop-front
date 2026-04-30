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
from app.models.settings import ShopSettings
from app.services.storage import upload_file

# ── Constantes ────────────────────────────────────────────────────────────────
UPLOAD_DIR  = Path(__file__).resolve().parent.parent.parent / "uploads"
FFMPEG_BIN  = imageio_ffmpeg.get_ffmpeg_exe()

# Chemin de police pour l'overlay de texte (Windows / Linux / macOS)
def _find_font() -> str:
    candidates = [
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/Arial.ttf",
        "C:/Windows/Fonts/calibri.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for f in candidates:
        if Path(f).exists():
            return f
    return ""

FONT_PATH = _find_font()

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


# ── Scripts publicitaires par catégorie ──────────────────────────────────────

# Chaque entrée : (accroche_intro, phrase_milieu, call_to_action)
_CATEGORY_SCRIPTS: dict[str, tuple[str, str, str]] = {
    # Mode & vêtements
    "mode":        ("Un style qui vous ressemble.", "Portez l'élégance au quotidien.", "Commandez maintenant et faites la différence."),
    "vêtements":   ("Un style qui vous ressemble.", "Portez l'élégance au quotidien.", "Commandez maintenant et faites la différence."),
    "habits":      ("Un style qui vous ressemble.", "Portez l'élégance au quotidien.", "Commandez maintenant et faites la différence."),
    "tenue":       ("Un style qui vous ressemble.", "Portez l'élégance au quotidien.", "Commandez maintenant et faites la différence."),
    "robe":        ("La robe qui va tout changer.", "Élégante, moderne, inoubliable.", "Ne passez pas à côté de cette pièce unique."),
    "boubou":      ("Le boubou qui sublime chaque silhouette.", "Tradition et raffinement réunis.", "Offrez-vous l'authenticité africaine."),

    # Chaussures
    "chaussures":  ("Marchez avec style et confiance.", "Confort et élégance à chaque pas.", "Vos pieds méritent ce qu'il y a de mieux."),
    "baskets":     ("Le look streetwear qui fait tourner les têtes.", "Tendance, confortable, incontournable.", "Adoptez le style dès aujourd'hui."),
    "sandales":    ("La légèreté et l'élégance à chaque pas.", "Parfaites pour toutes les occasions.", "Craquez pour ce modèle avant qu'il ne soit plus disponible."),

    # Accessoires & sacs
    "accessoires": ("L'accessoire qui fait toute la différence.", "Un détail qui change tout.", "Ajoutez cette touche de classe à votre look."),
    "sac":         ("Le sac qui accompagne chaque moment de votre vie.", "Pratique, élégant, résistant.", "Faites le choix de la qualité."),
    "bijoux":      ("Des bijoux qui racontent une histoire.", "Chaque pièce, une œuvre d'art.", "Offrez-vous ou offrez ce moment d'exception."),
    "montre":      ("Le temps, porté avec élégance.", "Précision, style et prestige au poignet.", "Faites de chaque seconde un moment de classe."),

    # Beauté & cosmétiques
    "beauté":      ("Révélez votre beauté naturelle.", "Prenez soin de vous avec ce qu'il y a de mieux.", "Votre peau mérite l'excellence."),
    "cosmétiques": ("Révélez votre beauté naturelle.", "Des formules pensées pour sublimer.", "Votre routine beauté change aujourd'hui."),
    "parfum":      ("Un parfum qui laisse une empreinte inoubliable.", "Enveloppez-vous d'une fragrance unique.", "Séduisez sans dire un mot."),
    "skincare":    ("Une peau éclatante, c'est possible.", "Formulé pour nourrir, protéger et sublimer.", "Commencez votre transformation dès aujourd'hui."),

    # Alimentation
    "alimentation": ("Le goût authentique de chez nous.", "Naturel, savoureux, préparé avec amour.", "Savourez l'authenticité à chaque bouchée."),
    "nourriture":   ("Le goût authentique de chez nous.", "Naturel, savoureux, préparé avec amour.", "Savourez l'authenticité à chaque bouchée."),
    "épicerie":     ("Des saveurs qui font voyager.", "Le meilleur de nos terroirs dans votre assiette.", "Régalez-vous dès aujourd'hui."),
    "boisson":      ("La boisson qui désaltère et régale.", "Fraîche, naturelle, irrésistible.", "Une gorgée et vous comprendrez pourquoi tout le monde en parle."),

    # Maison & décoration
    "maison":      ("Transformez votre intérieur en un espace de vie unique.", "Chaque pièce mérite une touche d'exception.", "Donnez du caractère à votre maison."),
    "décoration":  ("Un objet qui raconte une histoire.", "L'élégance africaine s'invite chez vous.", "Faites de votre intérieur un lieu d'exception."),
    "cuisine":     ("La cuisine réinventée avec style.", "Pratique, esthétique, indispensable.", "Équipez-vous de ce qu'il y a de mieux."),
    "meubles":     ("Un meuble qui allie design et durabilité.", "Qualité artisanale, confort au quotidien.", "Investissez dans l'essentiel."),

    # Électronique & tech
    "électronique": ("La technologie au service de votre quotidien.", "Performance, fiabilité, innovation.", "Passez au niveau supérieur dès maintenant."),
    "téléphone":    ("Restez connecté avec style.", "Puissant, rapide, incontournable.", "Équipez-vous du meilleur de la technologie."),
    "informatique": ("Travaillez plus vite, travaillez mieux.", "Performances maximales, prix imbattable.", "Boostez votre productivité dès aujourd'hui."),

    # Sport & fitness
    "sport":       ("Dépassez vos limites chaque jour.", "Performance et confort pour vos entraînements.", "Atteignez vos objectifs avec le bon équipement."),
    "fitness":     ("Votre transformation commence ici.", "Équipement professionnel, résultats garantis.", "Investissez dans votre santé aujourd'hui."),

    # Enfants & bébé
    "enfants":     ("Parce que vos enfants méritent ce qu'il y a de mieux.", "Sécurisé, durable et adorable.", "Offrez un sourire à votre petit trésor."),
    "bébé":        ("Le bonheur de votre bébé, notre priorité.", "Douceur, sécurité et qualité garanties.", "Choisissez l'excellence pour votre enfant."),

    # Artisanat & culture
    "artisanat":   ("Un savoir-faire transmis de génération en génération.", "Fait à la main, avec passion et tradition.", "Possédez une pièce unique, possédez un morceau d'histoire."),
    "art":         ("Une œuvre qui inspire et qui émeut.", "L'art africain dans toute sa splendeur.", "Faites entrer la beauté dans votre vie."),
}

def _get_category_script(cat: str) -> tuple[str, str, str] | None:
    """Retourne le script par catégorie (insensible à la casse, correspondance partielle)."""
    cat_lower = cat.lower().strip()
    # Correspondance exacte d'abord
    if cat_lower in _CATEGORY_SCRIPTS:
        return _CATEGORY_SCRIPTS[cat_lower]
    # Correspondance partielle (ex: "Mode & Vêtements" → "mode")
    for key, value in _CATEGORY_SCRIPTS.items():
        if key in cat_lower or cat_lower in key:
            return value
    return None


def _build_ad_script(product: Product) -> str:
    """
    Génère un script publicitaire naturel adapté à la catégorie du produit.
    Si la catégorie est connue → script spécifique au secteur.
    Sinon → script générique de qualité.
    """
    name  = product.name
    desc  = (product.description or "").strip()
    price = f"{int(product.price):,}".replace(",", " ")
    curr  = product.currency or "FCFA"
    cat   = (product.category or "").strip()

    # Description courte (max 100 chars pour garder un rythme publicitaire)
    short_desc = (desc[:100] + "…") if len(desc) > 100 else desc

    # Récupérer le script de la catégorie
    cat_script = _get_category_script(cat) if cat else None

    if cat_script:
        intro, milieu, cta = cat_script
        parts = [intro, f"{name}."]
        if short_desc:
            parts.append(short_desc)
        parts.append(milieu)
        parts.append(f"À seulement {price} {curr}.")
        parts.append(cta)
    else:
        # Script générique engageant
        parts = [f"{name} — un produit d'exception."]
        if short_desc:
            parts.append(short_desc)
        parts.append("Qualité irréprochable, style inimitable.")
        parts.append(f"Disponible maintenant pour seulement {price} {curr}.")
        parts.append("Rejoignez des milliers de clients satisfaits. Commandez dès aujourd'hui !")

    return "  ".join(parts)


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
                mixed_path = tmpdir / "ad_mixed.mp4"
                await self._mix_audio(video_silent, audio_path, mixed_path)

                # ── 5. Overlay contact (téléphone + site web) ─────────────
                shop = await ShopSettings.find_one(ShopSettings.key == "main")
                phone   = (shop.phone   or "").strip() if shop else ""
                website = (shop.website_url or "").strip() if shop else ""

                final_path = tmpdir / "ad_final.mp4"
                if phone or website:
                    await self._add_contact_overlay(mixed_path, final_path, phone, website)
                else:
                    import shutil
                    shutil.copy(mixed_path, final_path)

                # ── 6. Upload ─────────────────────────────────────────────
                s3_key    = f"videos/{product.id}/{job.id}.mp4"
                final_url = await upload_file(
                    final_path.read_bytes(), s3_key, "video/mp4"
                )

            # ── 7. Mise à jour BDD ────────────────────────────────────────
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

    async def _add_contact_overlay(
        self, video: Path, output: Path, phone: str, website: str
    ) -> None:
        """
        Superpose le numéro de téléphone et l'URL du site en bas de la vidéo.
        Format portrait 9:16 (1080×1920). Fond semi-transparent noir.
        """
        # Échapper les caractères spéciaux pour le filtre drawtext
        def _esc(text: str) -> str:
            return (text
                    .replace("\\", "\\\\")
                    .replace("'", "\\'")
                    .replace(":", "\\:")
                    )

        font_arg = f"fontfile='{FONT_PATH}':" if FONT_PATH else ""
        filters: list[str] = []

        # Bande de fond en bas (hauteur 120px)
        filters.append(
            "drawbox=x=0:y=ih-120:w=iw:h=120:color=black@0.65:t=fill"
        )

        # Ligne 1 — numéro de téléphone (y=ih-95)
        if phone:
            filters.append(
                f"drawtext={font_arg}text='{_esc(phone)}':"
                f"fontsize=42:fontcolor=white:x=(w-text_w)/2:y=h-95:"
                f"shadowcolor=black:shadowx=2:shadowy=2"
            )

        # Ligne 2 — URL boutique (y=ih-48)
        if website:
            filters.append(
                f"drawtext={font_arg}text='{_esc(website)}':"
                f"fontsize=34:fontcolor=#a3e635:x=(w-text_w)/2:y=h-48:"
                f"shadowcolor=black:shadowx=1:shadowy=1"
            )

        vf = ",".join(filters)
        cmd = [
            FFMPEG_BIN, "-y",
            "-i", str(video),
            "-vf", vf,
            "-c:v", "libx264", "-preset", "fast", "-pix_fmt", "yuv420p",
            "-c:a", "copy",
            str(output),
        ]
        await self._run_ffmpeg(cmd, "contact_overlay")

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
