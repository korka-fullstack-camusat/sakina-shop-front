# SAKINA SHOP — Guide de démarrage

## Prérequis
- Python 3.12+
- Node.js 20+
- Compte MongoDB Atlas
- Compte AWS S3
- Clé API Runway ML (https://runwayml.com)
- Comptes développeur TikTok for Business + Snapchat Marketing API

---

## Backend (FastAPI)

```bash
cd backend

# Créer l'environnement virtuel
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Le fichier .env est déjà configuré avec les infos MongoDB Atlas
# Vérifier / compléter les clés API (Runway, TikTok, Snapchat, AWS)

# Appliquer les migrations MongoDB (à faire UNE FOIS avant le premier démarrage)
python manage.py migrate

# Démarrer le serveur
uvicorn app.main:app --reload --port 8000
```

API disponible sur : http://localhost:8000
Docs Swagger : http://localhost:8000/docs

---

## Commandes Migrations (équivalent Alembic pour MongoDB)

> Les migrations sont gérées par `manage.py` — elles stockent leur état dans
> la collection `__migrations__` de MongoDB Atlas.

```bash
# Voir l'état de toutes les migrations
python manage.py status

# Appliquer toutes les migrations en attente
python manage.py migrate

# Appliquer jusqu'à une migration précise
python manage.py migrate --target 20240101_000001_initial_schema

# Annuler une migration (rollback)
python manage.py rollback --target 20240101_000002_add_product_tags

# Créer un nouveau fichier de migration
python manage.py makemigration add_product_slug
# → Génère automatiquement migrations/20241022_143022_add_product_slug.py
```

### Convention de nommage des migrations
```
migrations/
├── 20240101_000001_initial_schema.py       ← premier démarrage
├── 20240101_000002_add_product_tags.py     ← ajout de champ
└── YYYYMMDD_HHMMSS_description.py         ← format à suivre
```

### Endpoints API migrations (admin uniquement)
```
GET  /api/v1/admin/migrations/status              → liste des migrations
POST /api/v1/admin/migrations/upgrade             → appliquer en attente
POST /api/v1/admin/migrations/downgrade/{target}  → rollback
```

---

## Frontend (Next.js)

```bash
cd frontend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.local.example .env.local
# → Éditer .env.local

# Démarrer en développement
npm run dev
```

Frontend disponible sur : http://localhost:3000

---

## Architecture

```
SAKINA-SHOP/
├── backend/
│   └── app/
│       ├── core/           # Config, DB, sécurité, logs
│       ├── models/         # Documents Beanie (MongoDB)
│       │   ├── user.py
│       │   ├── product.py
│       │   ├── video.py
│       │   └── social_post.py
│       ├── routers/        # Endpoints FastAPI
│       │   ├── auth.py
│       │   ├── products.py
│       │   ├── videos.py   # ← IA génération vidéo
│       │   └── social.py   # ← TikTok / Snapchat
│       ├── services/
│       │   ├── ai_video.py     # Runway ML Gen-3
│       │   ├── social_media.py # TikTok + Snapchat APIs
│       │   └── storage.py      # AWS S3
│       └── middleware/
│           └── auth.py
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx          # Vitrine clients
        │   └── admin/
        │       ├── login/        # Connexion admin
        │       ├── dashboard/    # Statistiques
        │       └── products/     # Gestion produits
        ├── components/
        │   ├── shop/             # Composants vitrine
        │   └── admin/            # Composants admin
        │       ├── ProductFormModal.tsx
        │       ├── VideoGenerateModal.tsx  # ← Génération vidéo IA
        │       └── SocialPublishModal.tsx  # ← Publication réseaux
        ├── lib/api.ts            # Client API axios
        └── store/auth.ts         # Auth zustand
```

## Flux principal

1. **Admin crée un produit** → upload photos → produit en brouillon
2. **Admin génère une vidéo IA** → Runway ML anime la photo du produit → vidéo 9:16 (format TikTok/Snap)
3. **Admin publie le produit** → apparaît immédiatement sur la vitrine client
4. **Admin publie sur les réseaux** → TikTok + Snapchat via leurs APIs officielles

## APIs Réseaux Sociaux

### TikTok for Business
- Inscription : https://developers.tiktok.com
- Scope requis : `video.upload`, `video.publish`

### Snapchat Marketing API
- Inscription : https://developers.snap.com
- Docs : https://marketingapi.snapchat.com/docs

### Runway ML
- Inscription : https://runwayml.com
- Modèle utilisé : Gen-3 Alpha Turbo (image → vidéo 9:16, 5s)
