from typing import List
import uuid
from datetime import datetime, timezone
import json

from sqlalchemy import String, Text, DateTime, Boolean, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Playlist(Base):
    __tablename__ = "playlists"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    youtube_playlist_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    is_manual: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    outcomes_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail: Mapped[str] = mapped_column(Text, nullable=True)
    author_name: Mapped[str] = mapped_column(String(255), nullable=True)
    last_synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    total_views: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rating: Mapped[float] = mapped_column(Float, nullable=False, default=5.0)
    rating_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    videos: Mapped[List["Video"]] = relationship(
        "Video", back_populates="playlist", cascade="all, delete-orphan", order_by="Video.position"
    )
    resources: Mapped[List["Resource"]] = relationship(
        "Resource", back_populates="playlist", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Playlist youtube_id={self.youtube_playlist_id}>"

    @property
    def outcomes(self) -> List[str]:
        if not self.outcomes_json:
            return []
        try:
            parsed = json.loads(self.outcomes_json)
        except json.JSONDecodeError:
            return []
        if not isinstance(parsed, list):
            return []
        return [str(item).strip() for item in parsed if str(item).strip()]
