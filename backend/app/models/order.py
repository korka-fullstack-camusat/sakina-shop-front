from beanie import Document
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Literal, List, Optional


class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int = 1
    unit_price: float
    currency: str = "FCFA"

    @property
    def subtotal(self) -> float:
        return self.unit_price * self.quantity


class Order(Document):
    # Client
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    customer_address: str

    # Produits commandés
    items: List[OrderItem]
    total: float
    currency: str = "FCFA"

    # Statut
    status: Literal[
        "pending", "confirmed", "shipped", "delivered", "cancelled"
    ] = "pending"

    # Paiement
    payment_method: Optional[Literal[
        "especes", "mobile_money", "virement", "autre"
    ]] = None
    payment_status: Literal["pending", "paid"] = "pending"

    # Infos complémentaires
    notes: Optional[str] = None

    # Facture (générée automatiquement à la livraison)
    invoice_number: Optional[str] = None

    # Horodatage
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    class Settings:
        name = "orders"
        indexes = ["status", "customer_phone", "created_at", "invoice_number"]
