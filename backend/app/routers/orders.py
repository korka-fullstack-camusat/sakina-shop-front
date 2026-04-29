from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Literal
from beanie import PydanticObjectId
from datetime import datetime, timezone

from app.middleware.auth import require_admin
from app.models.order import Order, OrderItem
from app.models.user import User
from app.core.serializers import doc_to_dict, docs_to_list

router = APIRouter(prefix="/orders", tags=["Orders"])


# ── Commande publique (panier client — sans authentification) ─────────────────

@router.post("/public", status_code=status.HTTP_201_CREATED)
async def create_public_order(data: "OrderCreate"):
    """Créer une commande depuis le panier client (pas d'auth requise)."""
    order = Order(
        **data.model_dump(exclude={"items"}),
        items=[OrderItem(**item.model_dump()) for item in data.items],
    )
    await order.insert()
    return JSONResponse(content=doc_to_dict(order), status_code=201)


# ── Schemas ───────────────────────────────────────────────────────────────────

class OrderItemIn(BaseModel):
    product_id: str
    product_name: str
    quantity: int = 1
    unit_price: float
    currency: str = "FCFA"


class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    customer_address: str
    items: List[OrderItemIn]
    total: float
    currency: str = "FCFA"
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class StatusUpdate(BaseModel):
    status: Literal["pending", "confirmed", "shipped", "delivered", "cancelled"]
    payment_status: Optional[Literal["pending", "paid"]] = None


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/")
async def list_orders(
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[str] = None,
    _admin: User = Depends(require_admin),
):
    """Lister toutes les commandes (admin)."""
    query = Order.find()
    if status_filter:
        query = Order.find(Order.status == status_filter)
    orders = await query.sort(-Order.created_at).skip(skip).limit(limit).to_list()
    return JSONResponse(content=docs_to_list(orders))


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    _admin: User = Depends(require_admin),
):
    """Créer une commande manuellement (commande téléphone/WhatsApp)."""
    order = Order(
        **data.model_dump(exclude={"items"}),
        items=[OrderItem(**item.model_dump()) for item in data.items],
    )
    await order.insert()
    return JSONResponse(content=doc_to_dict(order), status_code=201)


@router.get("/stats")
async def order_stats(_admin: User = Depends(require_admin)):
    """Statistiques des commandes."""
    total     = await Order.count()
    pending   = await Order.find(Order.status == "pending").count()
    confirmed = await Order.find(Order.status == "confirmed").count()
    shipped   = await Order.find(Order.status == "shipped").count()
    delivered = await Order.find(Order.status == "delivered").count()
    cancelled = await Order.find(Order.status == "cancelled").count()
    revenue   = sum(
        o.total
        for o in await Order.find(Order.status == "delivered").to_list()
    )
    return {
        "total": total,
        "pending": pending,
        "confirmed": confirmed,
        "shipped": shipped,
        "delivered": delivered,
        "cancelled": cancelled,
        "revenue": revenue,
    }


@router.get("/{order_id}")
async def get_order(order_id: str, _admin: User = Depends(require_admin)):
    order = await Order.get(PydanticObjectId(order_id))
    if not order:
        raise HTTPException(404, "Commande introuvable")
    return JSONResponse(content=doc_to_dict(order))


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: str,
    body: StatusUpdate,
    _admin: User = Depends(require_admin),
):
    """Mettre à jour le statut d'une commande.
    Génère automatiquement un numéro de facture à la livraison.
    """
    order = await Order.get(PydanticObjectId(order_id))
    if not order:
        raise HTTPException(404, "Commande introuvable")

    order.status = body.status
    if body.payment_status:
        order.payment_status = body.payment_status
    order.updated_at = datetime.now(timezone.utc)

    # Auto-génération du numéro de facture à la livraison
    if body.status == "delivered" and not order.invoice_number:
        date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        count = await Order.find(Order.invoice_number != None).count()  # noqa: E711
        order.invoice_number = f"INV-{date_str}-{count + 1:04d}"

    await order.save()
    return JSONResponse(content=doc_to_dict(order))


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(order_id: str, _admin: User = Depends(require_admin)):
    order = await Order.get(PydanticObjectId(order_id))
    if not order:
        raise HTTPException(404, "Commande introuvable")
    await order.delete()
