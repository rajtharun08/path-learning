import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CourseAssessment(Base):
    __tablename__ = "course_assessments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    playlist_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    score: Mapped[float] = mapped_column(default=0.0)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<CourseAssessment user={self.user_id} playlist={self.playlist_id} complete={self.is_completed}>"
