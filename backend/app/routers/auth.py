from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings
from app.middleware.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Setup — bootstrappe le premier compte admin ───────────────────────────────

@router.post("/setup", response_model=TokenOut, status_code=status.HTTP_201_CREATED,
             summary="Créer le premier administrateur (utilisable une seule fois)")
async def setup_first_admin(body: RegisterIn) -> TokenOut:
    """
    Endpoint de bootstrapping : crée le PREMIER compte admin.
    Échoue si un admin existe déjà en base → ne peut être utilisé qu'une seule fois.
    """
    admin_exists = await User.find_one(User.role == "admin")
    if admin_exists:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Un administrateur existe déjà. Connectez-vous via le panel.",
        )

    existing = await User.find_one(User.email == body.email)
    if existing:
        # L'email existe déjà en tant que client → on le promeut admin
        existing.role = "admin"
        await existing.save()
        token = create_access_token(str(existing.id))
        return TokenOut(access_token=token)

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        role="admin",
    )
    await user.insert()
    token = create_access_token(str(user.id))
    return TokenOut(access_token=token)


# ── Register (clients publics) ────────────────────────────────────────────────

@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterIn) -> TokenOut:
    existing = await User.find_one(User.email == body.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        role="client",
    )
    await user.insert()
    token = create_access_token(str(user.id))
    return TokenOut(access_token=token)


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenOut)
async def login(body: LoginIn) -> TokenOut:
    user = await User.find_one(User.email == body.email)
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Identifiants invalides")
    token = create_access_token(str(user.id))
    return TokenOut(access_token=token)


# ── Me — profil du token courant ──────────────────────────────────────────────

@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    """Retourne les infos du compte associé au token Bearer."""
    return JSONResponse(content={
        "id":        str(current_user.id),
        "email":     current_user.email,
        "full_name": current_user.full_name,
        "role":      current_user.role,
        "is_active": current_user.is_active,
    })


# ── Promote — promouvoir un compte en admin (dev uniquement) ──────────────────

class PromoteIn(BaseModel):
    email:    EmailStr
    password: str


@router.post("/promote", response_model=TokenOut,
             summary="Promouvoir un compte existant en admin (dev seulement)")
async def promote_to_admin(body: PromoteIn) -> TokenOut:
    """
    Vérifie le mot de passe du compte, puis le passe en role='admin'.
    Disponible en développement uniquement.
    """
    if settings.APP_ENV == "production":
        raise HTTPException(status_code=403, detail="Non disponible en production")

    user = await User.find_one(User.email == body.email)
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Identifiants invalides")

    user.role     = "admin"
    user.is_active = True
    await user.save()

    token = create_access_token(str(user.id))
    return TokenOut(access_token=token)
