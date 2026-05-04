import jwt
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_db
from app.core.pagination import PaginatedResponse, PaginationParams
from app.controllers.content_controller import ContentController
from app.schemas.content import (
    LoginRequest,
    LoginResponse,
    ManualCourseCreate,
    ManualCourseUpdate,
    ManualLessonCreate,
    ManualLessonUpdate,
    PlaylistResponse,
    PlaylistSearchResultResponse,
    VideoMetadataResponse,
    RatingRequest,
    ResourceCreate,
    YoutubeImportRequest,
)

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(tags=["Content"])
bearer_scheme = HTTPBearer(auto_error=False)


def require_staff_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, object]:
    if not settings.admin_jwt_secret_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Admin JWT secret key is not configured",
        )

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.admin_jwt_secret_key,
            algorithms=[settings.admin_jwt_algorithm],
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    role = str(payload.get("role", "")).lower()
    if role not in {"admin", "staff"} and payload.get("is_admin") is not True:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or staff access required to modify courses",
        )
    return payload


@router.post("/auth/login", response_model=LoginResponse)
@limiter.limit("30/minute")
def login(request: Request, payload: LoginRequest):
    normalized_role = payload.role.lower()
    token_payload = {
        "sub": payload.email,
        "user_id": str(uuid.uuid5(uuid.NAMESPACE_DNS, payload.email.lower())),
        "email": payload.email,
        "role": normalized_role,
        "is_admin": normalized_role == "admin",
    }
    token = jwt.encode(
        token_payload,
        settings.admin_jwt_secret_key,
        algorithm=settings.admin_jwt_algorithm,
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": token_payload["user_id"],
        "email": payload.email,
        "role": normalized_role,
    }


@router.get("/playlist/all", response_model=PaginatedResponse[PlaylistResponse])
@limiter.limit("100/minute")
def list_playlists(request: Request, pagination: PaginationParams = Depends(), db: Session = Depends(get_db)):
    return ContentController(db).list_playlists(pagination)




@router.post("/courses/import-youtube", response_model=PlaylistResponse, status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
def import_youtube_course(
    request: Request,
    payload: YoutubeImportRequest,
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_staff_token),
):
    """Import or re-sync a YouTube playlist as a course. Requires YOUTUBE_API_KEY."""
    return ContentController(db).import_youtube_course(payload)


@router.post("/courses", response_model=PlaylistResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
def create_manual_course(
    request: Request,
    payload: ManualCourseCreate,
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_staff_token),
):
    return ContentController(db).create_manual_course(payload)


@router.put("/courses/{course_id}", response_model=PlaylistResponse)
@limiter.limit("30/minute")
def update_manual_course(
    request: Request,
    course_id: str,
    payload: ManualCourseUpdate,
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_staff_token),
):
    return ContentController(db).update_manual_course(course_id, payload)


@router.delete("/courses/{course_id}")
@limiter.limit("30/minute")
def delete_manual_course(
    request: Request,
    course_id: str,
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_staff_token),
):
    return ContentController(db).delete_manual_course(course_id)


@router.post("/courses/{course_id}/lessons", response_model=PlaylistResponse)
@limiter.limit("60/minute")
def add_manual_lesson(
    request: Request,
    course_id: str,
    payload: ManualLessonCreate,
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_staff_token),
):
    return ContentController(db).add_manual_lesson(course_id, payload)


@router.put("/courses/{course_id}/lessons/{lesson_id}", response_model=PlaylistResponse)
@limiter.limit("60/minute")
def update_manual_lesson(
    request: Request,
    course_id: str,
    lesson_id: str,
    payload: ManualLessonUpdate,
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_staff_token),
):
    return ContentController(db).update_manual_lesson(course_id, lesson_id, payload)


@router.delete("/courses/{course_id}/lessons/{lesson_id}", response_model=PlaylistResponse)
@limiter.limit("60/minute")
def delete_manual_lesson(
    request: Request,
    course_id: str,
    lesson_id: str,
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_staff_token),
):
    return ContentController(db).delete_manual_lesson(course_id, lesson_id)


@router.get("/playlist/search", response_model=PaginatedResponse[PlaylistSearchResultResponse])
@limiter.limit("100/minute")
def search_playlists(
    request: Request,
    q: str = Query(..., min_length=1, max_length=100),
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    return ContentController(db).search_playlists(q, pagination)


@router.get("/playlist/{playlist_id}", response_model=PlaylistResponse)
@limiter.limit("100/minute")
def get_playlist(request: Request, playlist_id: str, db: Session = Depends(get_db)):
    return ContentController(db).get_playlist(playlist_id)


@router.get("/video/metadata/{video_id}", response_model=VideoMetadataResponse)
@limiter.limit("100/minute")
def get_video_metadata(request: Request, video_id: str, db: Session = Depends(get_db)):
    return ContentController(db).get_video_metadata(video_id)


@router.post("/courses/{course_id}/view")
@limiter.limit("60/minute")
def record_view(request: Request, course_id: str, db: Session = Depends(get_db)):
    return ContentController(db).record_view(course_id)


@router.post("/courses/{course_id}/rate", response_model=PlaylistResponse)
@limiter.limit("10/minute")
def rate_course(
    request: Request, course_id: str, payload: RatingRequest, db: Session = Depends(get_db)
):
    return ContentController(db).rate_course(course_id, payload.rating)


@router.post("/courses/{course_id}/resources", response_model=PlaylistResponse)
@limiter.limit("30/minute")
def add_resource(
    request: Request,
    course_id: str,
    payload: ResourceCreate,
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_staff_token),
):
    return ContentController(db).add_resource(course_id, payload)


@router.delete("/courses/{course_id}/resources/{resource_id}", response_model=PlaylistResponse)
@limiter.limit("30/minute")
def delete_resource(
    request: Request,
    course_id: str,
    resource_id: str,
    db: Session = Depends(get_db),
    _: dict[str, object] = Depends(require_staff_token),
):
    return ContentController(db).delete_resource(course_id, resource_id)
