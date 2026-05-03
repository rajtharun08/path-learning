from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class VideoResponse(BaseModel):
    id: str
    youtube_video_id: str
    title: str
    thumbnail: Optional[str]
    duration: int
    position: int

    model_config = {"from_attributes": True}


class PlaylistCreate(BaseModel):
    youtube_playlist_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    author_name: Optional[str] = None

class PlaylistUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    author_name: Optional[str] = None

class PlaylistResponse(BaseModel):
    id: str
    youtube_playlist_id: str
    title: str
    description: Optional[str]
    thumbnail: Optional[str] = None
    author_name: Optional[str] = None
    last_synced_at: datetime
    videos: List[VideoResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class PlaylistSearchResultResponse(PlaylistResponse):
    relevance_score: float
    matched_fields: List[str] = Field(default_factory=list)


class VideoMetadataResponse(BaseModel):
    current: Optional[dict]
    next: Optional[dict]


class ErrorResponse(BaseModel):
    detail: str
