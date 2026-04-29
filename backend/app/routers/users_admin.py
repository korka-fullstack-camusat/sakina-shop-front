from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import List, Literal, Optional
from beanie import PydanticObjectId

from app.middleware.auth import require_admin
from app.models.user import User
from app.core.security import hash_password

router = APIRouter(prefix="/admin/users", tags=["Admin — Users"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Literal["admin", "client"] = "client"


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[Literal["admin", "client"]] = None
    is_active: Optional[bool] = None


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: str

    @classmethod
    def from_user(cls, u: User) -> "UserOut":
        return cls(
            id=str(u.id),
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at.isoformat(),
        )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[UserOut])
async def list_users(
    skip: int = 0,
    limit: int = 50,
    _admin: User = Depends(require_admin),
):
    users = await User.find().sort(-User.created_at).skip(skip).limit(limit).to_list()
    return [UserOut.from_user(u) for u in users]


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    _admin: User = Depends(require_admin),
):
    existing = await User.find_one(User.email == data.email)
    if existing:
        raise HTTPException(400, "Un utilisateur avec cet email existe déjà")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
    )
    await user.insert()
    return UserOut.from_user(user)


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: str,
    data: UserUpdate,
    admin: User = Depends(require_admin),
):
    user = await User.get(PydanticObjectId(user_id))
    if not user:
        raise HTTPException(404, "Utilisateur introuvable")

    # Empêche de se désactiver soi-même
    if str(user.id) == str(admin.id) and data.is_active is False:
        raise HTTPException(400, "Impossible de désactiver votre propre compte")

    if data.full_name  is not None: user.full_name  = data.full_name
    if data.role       is not None: user.role       = data.role
    if data.is_active  is not None: user.is_active  = data.is_active

    await user.save()
    return UserOut.from_user(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    admin: User = Depends(require_admin),
):
    user = await User.get(PydanticObjectId(user_id))
    if not user:
        raise HTTPException(404, "Utilisateur introuvable")
    if str(user.id) == str(admin.id):
        raise HTTPException(400, "Impossible de supprimer votre propre compte")
    await user.delete()
