from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class VideoResponse(BaseModel):
    id: str
    youtube_video_id: str
    youtube_url: Optional[str] = None
    title: str
    thumbnail: Optional[str]
    duration: int
    position: int

    model_config = {"from_attributes": True}

class ResourceResponse(BaseModel):
    id: str
    title: str
    url: str
    resource_type: str

    model_config = {"from_attributes": True}


class ResourceCreate(BaseModel):
    title: str
    url: str
    resource_type: str = "link"


class PlaylistResponse(BaseModel):
    id: str
    youtube_playlist_id: str
    is_manual: bool = False
    title: str
    description: Optional[str]
    outcomes: List[str] = Field(default_factory=list)
    thumbnail: Optional[str] = None
    author_name: Optional[str] = None
    last_synced_at: datetime
    rating: float = 5.0
    rating_count: int = 1
    total_views: int = 0
    videos: List[VideoResponse] = Field(default_factory=list)
    resources: List[ResourceResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class PlaylistSearchResultResponse(PlaylistResponse):
    relevance_score: float
    matched_fields: List[str] = Field(default_factory=list)


class VideoMetadataResponse(BaseModel):
    current: Optional[dict]
    next: Optional[dict]


class ManualLessonCreate(BaseModel):
    youtube_url: str = Field(..., min_length=3, max_length=500)
    title: str = Field(..., min_length=1, max_length=500)
    duration: int = Field(..., ge=0, description="Duration in seconds")
    thumbnail: Optional[str] = Field(default=None, max_length=500)
    position: Optional[int] = Field(default=None, ge=0)


class ManualLessonUpdate(BaseModel):
    youtube_url: Optional[str] = Field(default=None, min_length=3, max_length=500)
    title: Optional[str] = Field(default=None, max_length=500)
    position: Optional[int] = Field(default=None, ge=0)


class ManualCourseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    outcomes: List[str] = Field(default_factory=list)
    thumbnail: Optional[str] = Field(default=None, max_length=500)
    author_name: Optional[str] = Field(default=None, max_length=255)
    lessons: List[ManualLessonCreate] = Field(default_factory=list)
    resources: List[ResourceCreate] = Field(default_factory=list)


class ManualCourseUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=500)
    description: Optional[str] = None
    outcomes: Optional[List[str]] = None
    thumbnail: Optional[str] = Field(default=None, max_length=500)
    author_name: Optional[str] = Field(default=None, max_length=255)
    resources: Optional[List[ResourceCreate]] = None


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1, max_length=255)
    role: str = Field(..., pattern="^(student|admin|staff)$")


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: str


class ErrorResponse(BaseModel):
    detail: str


class RatingRequest(BaseModel):
    rating: float = Field(..., ge=1, le=5)
    user_id: str
