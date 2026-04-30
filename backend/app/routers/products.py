import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel
from datetime import datetime, timezone
from app.middleware.auth import require_admin
from app.models.product import Product
from app.models.user import User
from app.core.serializers import doc_to_dict, docs_to_list

router = APIRouter(prefix="/products", tags=["Produits"])


# ── Schémas ───────────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    currency: str = "XOF"
    category: str
    stock: int = 0


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    stock: int | None = None
    category: str | None = None


# ── Routes publiques ──────────────────────────────────────────────────────────

@router.get("/", summary="Liste des produits publiés (vitrine)")
async def list_published_products(skip: int = 0, limit: int = 20) -> list[dict]:
    products = await Product.find(Product.is_published == True).skip(skip).limit(limit).to_list()
    return [doc_to_dict(p, exclude={"created_by"}) for p in products]


@router.get("/{product_id}", summary="Détail d'un produit publié")
async def get_product(product_id: str) -> dict:
    product = await Product.get(product_id)
    if not product or not product.is_published:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    return serialize(product, exclude={"created_by"})


# ── Routes admin ──────────────────────────────────────────────────────────────

@router.get("/admin/all", summary="[Admin] Tous les produits")
async def admin_list_products(
    admin: User = Depends(require_admin),
    skip: int = 0,
    limit: int = 50,
) -> list[dict]:
    products = await Product.find_all().skip(skip).limit(limit).to_list()
    return [doc_to_dict(p) for p in products]


@router.post("/", status_code=status.HTTP_201_CREATED, summary="[Admin] Créer un produit")
async def create_product(
    body: ProductCreate,
    admin: User = Depends(require_admin),
) -> dict:
    product = Product(**body.model_dump(), created_by=str(admin.id))
    await product.insert()
    return doc_to_dict(product)


@router.patch("/{product_id}", summary="[Admin] Modifier un produit")
async def update_product(
    product_id: str,
    body: ProductUpdate,
    admin: User = Depends(require_admin),
) -> dict:
    product = await Product.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    await product.set(update_data)
    # Recharge pour avoir les données à jour
    product = await Product.get(product_id)
    return doc_to_dict(product)


@router.post("/{product_id}/images", summary="[Admin] Upload d'images produit (base64)")
async def upload_product_images(
    product_id: str,
    files: list[UploadFile] = File(...),
    admin: User = Depends(require_admin),
) -> dict:
    product = await Product.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    data_uris: list[str] = []
    for file in files:
        content     = await file.read()
        mime        = file.content_type or "image/jpeg"
        b64         = base64.b64encode(content).decode("utf-8")
        data_uri    = f"data:{mime};base64,{b64}"
        data_uris.append(data_uri)

    new_images = product.images + data_uris
    await product.set({Product.images: new_images})
    return {"images": new_images}


@router.post("/{product_id}/publish", summary="[Admin] Publier un produit")
async def publish_product(
    product_id: str,
    admin: User = Depends(require_admin),
) -> dict:
    product = await Product.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    await product.set({
        Product.is_published: True,
        Product.status:       "published",
        Product.updated_at:   datetime.now(timezone.utc),
    })
    return {"message": "Produit publié avec succès", "product_id": product_id}


@router.post("/{product_id}/unpublish", summary="[Admin] Dépublier un produit")
async def unpublish_product(
    product_id: str,
    admin: User = Depends(require_admin),
) -> dict:
    product = await Product.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    await product.set({
        Product.is_published: False,
        Product.status:       "draft",
        Product.updated_at:   datetime.now(timezone.utc),
    })
    return {"message": "Produit dépublié", "product_id": product_id}


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="[Admin] Supprimer un produit")
async def delete_product(
    product_id: str,
    admin: User = Depends(require_admin),
) -> None:
    product = await Product.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    await product.delete()
