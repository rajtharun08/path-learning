import uuid
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    playlist_id: Mapped[str] = mapped_column(String(36), ForeignKey("playlists.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False, default="link") # link, pdf, github, code

    playlist: Mapped["Playlist"] = relationship("Playlist", back_populates="resources")

    def __repr__(self) -> str:
        return f"<Resource title={self.title} type={self.resource_type}>"
