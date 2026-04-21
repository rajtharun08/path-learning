import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class PathCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    editor_name: str = Field(..., min_length=2, max_length=255)
    rating: float = Field(default=0.0, ge=0.0, le=5.0)

    @field_validator("title", "description", "editor_name")
    @classmethod
    def strip_and_validate_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Field cannot be blank")
        return cleaned


class PathResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    path_id: uuid.UUID
    title: str
    description: str
    editor_name: str
    total_views: int
    average_completion_rate: float
    rating: float


class PathItemsCreate(BaseModel):
    playlist_ids: list[str] = Field(..., min_length=1)

    @field_validator("playlist_ids")
    @classmethod
    def validate_playlist_ids(cls, value: list[str]) -> list[str]:
        cleaned = [playlist_id.strip() for playlist_id in value if playlist_id.strip()]
        if not cleaned:
            raise ValueError("playlist_ids must contain at least one non-empty value")
        if len(set(cleaned)) != len(cleaned):
            raise ValueError("playlist_ids must not contain duplicates")
        return cleaned


class PathItemResponse(BaseModel):
    playlist_id: str
    sequence_order: int = 0
    title: str | None = None
    description: str | None = None
    thumbnail: str | None = None
    duration: str | None = None
    content_status: str = "available"
    total_videos: int = 0
    completed_videos: int = 0
    remaining_videos: int = 0
    progress_percent: float = 0.0
    course_completed: bool = False
    next_action_type: str = "next_lesson"
    next_action_label: str = "Next Lesson"


class CourseLessonResponse(BaseModel):
    youtube_video_id: str
    title: str
    thumbnail: str | None = None
    duration: int = 0
    position: int = 0
    watched_seconds: int = 0
    completed: bool = False
    resume_at_seconds: int = 0
    status: str = "not_started"


class PathWithItemsResponse(PathResponse):
    items: list[PathItemResponse]


class CourseDetailResponse(PathItemResponse):
    user_id: uuid.UUID | None = None
    current_lesson: CourseLessonResponse | None = None
    next_lesson: CourseLessonResponse | None = None
    lessons: list[CourseLessonResponse] = Field(default_factory=list)


class EnrollmentCreate(BaseModel):
    user_id: uuid.UUID


class EnrollmentResponse(BaseModel):
    id: int
    user_id: uuid.UUID
    path_id: uuid.UUID
    enrolled_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NextUpResponse(BaseModel):
    playlist_id: str
    title: str | None = None


class PathProgressResponse(BaseModel):
    path_id: uuid.UUID
    total_courses: int
    completed_courses: int
    remaining_courses: int
    progress_percentage: float
    status: str
    certification_message: str
    next_up: NextUpResponse | None = None


class SearchResultResponse(PathResponse):
    total_score: float
    course_count: int


class EnrolledPathResponse(BaseModel):
    path_id: uuid.UUID
    title: str
    progress: float
    status: str
    total_courses: int
    completed_courses: int


class LearningHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: uuid.UUID
    path_id: uuid.UUID
    event_type: str
    total_courses: int
    completed_courses: int
    remaining_courses: int
    progress_percentage: float
    next_up_playlist_id: str | None = None
    created_at: datetime
