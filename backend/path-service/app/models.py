import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LearningPath(Base):
    __tablename__ = "learning_paths"

    path_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    editor_name: Mapped[str] = mapped_column(String(255), nullable=False)
    total_views: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    average_completion_rate: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )
    rating: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    items: Mapped[list["PathItem"]] = relationship(
        back_populates="path",
        cascade="all, delete-orphan",
        order_by="PathItem.sequence_order",
    )
    enrollments: Mapped[list["PathEnrollment"]] = relationship(
        back_populates="path",
        cascade="all, delete-orphan",
    )


class PathItem(Base):
    __tablename__ = "path_items"
    __table_args__ = (
        UniqueConstraint("path_id", "sequence_order", name="uq_path_items_path_order"),
        UniqueConstraint("path_id", "playlist_id", name="uq_path_items_path_playlist"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    path_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("learning_paths.path_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    playlist_id: Mapped[str] = mapped_column(String(255), nullable=False)
    sequence_order: Mapped[int] = mapped_column(Integer, nullable=False)

    path: Mapped["LearningPath"] = relationship(back_populates="items")


class PathEnrollment(Base):
    __tablename__ = "path_enrollments"
    __table_args__ = (
        UniqueConstraint("user_id", "path_id", name="uq_path_enrollments_user_path"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    path_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("learning_paths.path_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    enrolled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    path: Mapped["LearningPath"] = relationship(back_populates="enrollments")


class LearningHistory(Base):
    __tablename__ = "learning_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    path_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("learning_paths.path_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    total_courses: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    completed_courses: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    remaining_courses: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    progress_percentage: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    next_up_playlist_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    path: Mapped["LearningPath"] = relationship()
