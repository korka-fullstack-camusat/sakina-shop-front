from beanie import Document
from pydantic import Field
from datetime import datetime, timezone
from typing import Literal


class VideoJob(Document):
    product_id: str
    prompt: str
    status: Literal["pending", "processing", "completed", "failed"] = "pending"
    progress: int = 0          # 0-100
    step: str = ""             # description de l'étape en cours
    runway_task_id: str | None = None
    video_url: str | None = None
    error: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = None

    class Settings:
        name = "video_jobs"
        indexes = ["product_id", "status"]
