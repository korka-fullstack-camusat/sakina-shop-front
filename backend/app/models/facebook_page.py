from beanie import Document
from pydantic import Field
from datetime import datetime, timezone


class FacebookPage(Document):
    """Page Facebook connectée via OAuth — token long-lived sauvegardé en base."""

    name:         str   # Nom de la Page Facebook
    page_id:      str   # ID de la Page Facebook
    access_token: str   # Page Access Token (long-lived, ~60 jours)
    connected_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name    = "facebook_pages"
        indexes = ["page_id"]
