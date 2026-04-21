from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProgressUpdateRequest(BaseModel):
    user_id: str = Field(...)
    video_id: str = Field(...)
    watched_seconds: int = Field(..., ge=0)
    event_type: Optional[str] = Field(default=None, description="Optional analytics event type (play, pause, seek, complete)")


class ProgressResponse(BaseModel):
    id: str
    user_id: str
    video_id: str
    watched_seconds: int
    completed: bool
    updated_at: datetime

    model_config = {"from_attributes": True}


class ResumeResponse(BaseModel):
    video_id: str
    resume_at_seconds: int


class CourseProgressResponse(BaseModel):
    playlist_id: str
    user_id: str
    total_videos: int
    completed_videos: int
    remaining_videos: int
    progress_percent: float


class CourseCompletionResponse(BaseModel):
    playlist_id: str
    user_id: str
    completion_percentage: float
    course_completed: bool


class LessonProgressResponse(BaseModel):
    youtube_video_id: str
    title: str
    thumbnail: str | None = None
    duration: int = 0
    position: int = 0
    watched_seconds: int = 0
    completed: bool = False
    resume_at_seconds: int = 0
    status: str = "not_started"


class CourseDetailResponse(BaseModel):
    playlist_id: str
    user_id: str
    title: str | None = None
    thumbnail: str | None = None
    duration: str | None = None
    total_videos: int
    completed_videos: int
    remaining_videos: int
    progress_percent: float
    course_completed: bool
    next_action_type: str
    next_action_label: str
    current_lesson: LessonProgressResponse | None = None
    next_lesson: LessonProgressResponse | None = None
    lessons: list[LessonProgressResponse] = Field(default_factory=list)
