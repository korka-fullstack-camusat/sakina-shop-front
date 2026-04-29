from motor.motor_asyncio import AsyncIOMotorDatabase


class BaseMigration:
    """Classe de base pour toutes les migrations Sakina Shop.

    Chaque migration doit hériter de cette classe et implémenter :
    - forward(db) : applique la migration
    - backward(db) : annule la migration (rollback)
    """

    async def forward(self, db: AsyncIOMotorDatabase) -> None:
        raise NotImplementedError("La méthode forward() doit être implémentée")

    async def backward(self, db: AsyncIOMotorDatabase) -> None:
        raise NotImplementedError("La méthode backward() doit être implémentée")
