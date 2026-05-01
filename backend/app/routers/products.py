import base64
from fastapi import APIRouter, Depends, HTTPException, Request, Response, UploadFile, File, status
from pydantic import BaseModel
from datetime import datetime, timezone

from app.middleware.auth import require_admin
from app.models.product import Product
from app.models.user import User
from app.core.serializers import doc_to_dict
from app.core.cache import cache_get, cache_set, cache_bust
from app.core.limiter import limiter

router = APIRouter(prefix="/products", tags=["Produits"])

_PRODUCTS_TTL = 120
_PRODUCT_TTL  = 300
_MAX_LIMIT    = 100


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


def _cache_headers(response: Response, max_age: int = 120, hit: bool = False) -> None:
    response.headers["Cache-Control"] = (
        f"public, max-age={max_age}, stale-while-revalidate={max_age // 2}"
    )
    response.headers["X-Cache"] = "HIT" if hit else "MISS"
    response.headers["Vary"] = "Accept-Encoding"


@router.get("/", summary="Liste des produits publies (vitrine)")
@limiter.limit("120/minute")
async def list_published_products(
    request: Request,
    response: Response,
    skip: int = 0,
    limit: int = 20,
) -> list[dict]:
    limit = min(limit, _MAX_LIMIT)
    cache_key = f"products:published:{skip}:{limit}"
    cached = await cache_get(cache_key)
    if cached is not None:
        _cache_headers(response, max_age=_PRODUCTS_TTL, hit=True)
        return cached

    products = await Product.find(Product.is_published == True).skip(skip).limit(limit).to_list()
    result = [doc_to_dict(p, exclude={"created_by"}) for p in products]
    await cache_set(cache_key, result, ttl=_PRODUCTS_TTL)
    _cache_headers(response, max_age=_PRODUCTS_TTL, hit=False)
    return result


@router.get("/{product_id}", summary="Detail d un produit publie")
@limiter.limit("120/minute")
async def get_product(
    request: Request,
    response: Response,
    product_id: str,
) -> dict:
    cache_key = f"product:{product_id}"
    cached = await cache_get(cache_key)
    if cached is not None:
        _cache_headers(response, max_age=_PRODUCT_TTL, hit=True)
        return cached

    product = await Product.get(product_id)
    if not product or not product.is_published:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    result = doc_to_dict(product, exclude={"created_by"})
    await cache_set(cache_key, result, ttl=_PRODUCT_TTL)
    _cache_headers(response, max_age=_PRODUCT_TTL, hit=False)
    return result


@router.get("/admin/all", summary="[Admin] Tous les produits")
async def admin_list_products(
    admin: User = Depends(require_admin),
    skip: int = 0,
    limit: int = 50,
) -> list[dict]:
    limit = min(limit, _MAX_LIMIT)
    products = await Product.find_all().skip(skip).limit(limit).to_list()
    return [doc_to_dict(p) for p in products]


@router.post("/", status_code=status.HTTP_201_CREATED, summary="[Admin] Creer un produit")
async def create_product(
    body: ProductCreate,
    admin: User = Depends(require_admin),
) -> dict:
    product = Product(**body.model_dump(), created_by=str(admin.id))
    await product.insert()
    await cache_bust("products:published:")
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
    await cache_bust(f"product:{product_id}")
    await cache_bust("products:published:")
    product = await Product.get(product_id)
    return doc_to_dict(product)


@router.post("/{product_id}/images", summary="[Admin] Upload images base64")
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
        content  = await file.read()
        mime     = file.content_type or "image/jpeg"
        b64      = base64.b64encode(content).decode("utf-8")
        data_uri = f"data:{mime};base64,{b64}"
        data_uris.append(data_uri)

    new_images = product.images + data_uris
    await product.set({Product.images: new_images})
    await cache_bust(f"product:{product_id}")
    await cache_bust("products:published:")
    return {"images": new_images}


@router.post("/{product_id}/publish", summary="[Admin] Publier")
async def publish_product(product_id: str, admin: User = Depends(require_admin)) -> dict:
    product = await Product.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    await product.set({
        Product.is_published: True,
        Product.status: "published",
        Product.updated_at: datetime.now(timezone.utc),
    })
    await cache_bust(f"product:{product_id}")
    await cache_bust("products:published:")
    return {"message": "Produit publie", "product_id": product_id}


@router.post("/{product_id}/unpublish", summary="[Admin] Depublier")
async def unpublish_product(product_id: str, admin: User = Depends(require_admin)) -> dict:
    product = await Product.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    await product.set({
        Product.is_published: False,
        Product.status: "draft",
        Product.updated_at: datetime.now(timezone.utc),
    })
    await cache_bust(f"product:{product_id}")
    await cache_bust("products:published:")
    return {"message": "Produit depublie", "product_id": product_id}


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT, summary="[Admin] Supprimer")
async def delete_product(product_id: str, admin: User = Depends(require_admin)) -> None:
    product = await Product.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    await product.delete()
    await cache_bust(f"product:{product_id}")
    await cache_bust("products:published:")
