import asyncio
from math import log1p
import uuid

import httpx
import jwt
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import Select, delete, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db_session
from app.models import LearningHistory, LearningPath, PathEnrollment, PathItem
from app.schemas import (
    CourseDetailResponse,
    EnrolledPathResponse,
    EnrollmentCreate,
    EnrollmentResponse,
    LearningHistoryResponse,
    NextUpResponse,
    PathCreate,
    PathItemsCreate,
    PathProgressResponse,
    PathResponse,
    PathWithItemsResponse,
    SearchResultResponse,
)


router = APIRouter(tags=["Path Service"])
settings = get_settings()
bearer_scheme = HTTPBearer(auto_error=False)


def get_http_client(request: Request) -> httpx.AsyncClient:
    return request.app.state.http_client


def _require_admin_token(
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

    role = payload.get("role")
    is_admin = payload.get("is_admin")
    if role != "admin" and is_admin is not True:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required to modify learning paths",
        )
    return payload


def _format_duration(total_seconds: int | None) -> str | None:
    if total_seconds is None or total_seconds < 0:
        return None

    hours, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    parts: list[str] = []
    if hours:
        parts.append(f"{hours}h")
    if minutes:
        parts.append(f"{minutes}m")
    if seconds or not parts:
        parts.append(f"{seconds}s")
    return " ".join(parts)


async def _get_learning_path_or_404(
    session: AsyncSession, path_id: uuid.UUID
) -> LearningPath:
    result = await session.execute(
        select(LearningPath).where(LearningPath.path_id == path_id)
    )
    learning_path = result.scalar_one_or_none()
    if learning_path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning path not found",
        )
    return learning_path


async def _get_ordered_path_items(
    session: AsyncSession, path_id: uuid.UUID
) -> list[PathItem]:
    result = await session.execute(
        select(PathItem)
        .where(PathItem.path_id == path_id)
        .order_by(PathItem.sequence_order.asc())
    )
    return list(result.scalars().all())


async def _get_enrolled_user_ids(
    session: AsyncSession, path_id: uuid.UUID
) -> list[uuid.UUID]:
    result = await session.execute(
        select(PathEnrollment.user_id).where(PathEnrollment.path_id == path_id)
    )
    return list(result.scalars().all())


async def _fetch_playlist_payload(
    client: httpx.AsyncClient, playlist_id: str
) -> dict[str, object] | None:
    url = f"{settings.content_service_base_url}/playlist/{playlist_id}"
    try:
        response = await client.get(url)
        response.raise_for_status()
        payload = response.json()
        if isinstance(payload, dict):
            return payload
    except (httpx.HTTPError, ValueError):
        return None
    return None


async def _fetch_course_metadata(
    client: httpx.AsyncClient, playlist_id: str
) -> dict[str, str | None]:
    payload = await _fetch_playlist_payload(client, playlist_id)
    try:
        if payload is None:
            raise ValueError("playlist unavailable")

        videos = payload.get("videos", [])

        thumbnail = payload.get("thumbnail")
        if thumbnail is None and videos:
            thumbnail = videos[0].get("thumbnail")

        duration = payload.get("duration")
        if isinstance(duration, int):
            formatted_duration = _format_duration(duration)
        elif isinstance(duration, str):
            formatted_duration = duration
        else:
            total_seconds = sum(
                video.get("duration", 0)
                for video in videos
                if isinstance(video.get("duration"), int)
            )
            formatted_duration = _format_duration(total_seconds) if videos else None

        return {
            "title": payload.get("title"),
            "description": payload.get("description"),
            "thumbnail": thumbnail,
            "duration": formatted_duration,
            "total_videos": len(videos),
            "content_status": "available",
        }
    except (httpx.HTTPError, ValueError, AttributeError):
        return {
            "title": None,
            "thumbnail": None,
            "duration": None,
            "total_videos": 0,
            "content_status": "unavailable",
        }


async def _fetch_course_completion(
    client: httpx.AsyncClient, playlist_id: str, user_id: uuid.UUID
) -> bool:
    url = (
        f"{settings.progress_service_base_url}/course/{playlist_id}/completion"
        f"?user_id={user_id}"
    )
    try:
        response = await client.get(url)
        response.raise_for_status()
        payload = response.json()
        return bool(payload.get("course_completed", False))
    except (httpx.HTTPError, ValueError):
        return False


async def _fetch_course_detail(
    client: httpx.AsyncClient, playlist_id: str, user_id: uuid.UUID | None = None
) -> dict[str, object]:
    payload = await _fetch_playlist_payload(client, playlist_id)
    metadata = await _fetch_course_metadata(client, playlist_id)

    videos = []
    if payload is not None:
        videos = payload.get("videos", [])
        if not isinstance(videos, list):
            videos = []

    if user_id is None:
        lessons = [
            {
                "youtube_video_id": video.get("youtube_video_id"),
                "title": video.get("title") or f"Lesson {index}",
                "thumbnail": video.get("thumbnail"),
                "duration": int(video.get("duration") or 0),
                "position": int(video.get("position") or index),
                "watched_seconds": 0,
                "completed": False,
                "resume_at_seconds": 0,
                "status": "not_started",
            }
            for index, video in enumerate(videos, start=1)
            if isinstance(video, dict) and video.get("youtube_video_id")
        ]

        current_lesson = lessons[0] if lessons else None
        next_lesson = lessons[1] if len(lessons) > 1 else None
        next_action_type = "take_assessment" if len(lessons) <= 1 else "next_lesson"
        next_action_label = "Take Assessment" if next_action_type == "take_assessment" else "Next Lesson"

        return {
            "playlist_id": playlist_id,
            "title": metadata.get("title"),
            "description": metadata.get("description"),
            "thumbnail": metadata.get("thumbnail"),
            "duration": metadata.get("duration"),
            "content_status": metadata.get("content_status", "available"),
            "total_videos": len(lessons),
            "completed_videos": 0,
            "remaining_videos": len(lessons),
            "progress_percent": 0.0,
            "course_completed": False,
            "next_action_type": next_action_type,
            "next_action_label": next_action_label,
            "current_lesson": current_lesson,
            "next_lesson": next_lesson,
            "lessons": lessons,
        }

    url = (
        f"{settings.progress_service_base_url}/course/{playlist_id}/detail"
        f"?user_id={user_id}"
    )
    try:
        response = await client.get(url)
        response.raise_for_status()
        progress_payload = response.json()
    except (httpx.HTTPError, ValueError):
        progress_payload = {}

    lessons = progress_payload.get("lessons", [])
    if not lessons and videos:
        lessons = [
            {
                "youtube_video_id": video.get("youtube_video_id"),
                "title": video.get("title") or f"Lesson {index}",
                "thumbnail": video.get("thumbnail"),
                "duration": int(video.get("duration") or 0),
                "position": int(video.get("position") or index),
                "watched_seconds": 0,
                "completed": False,
                "resume_at_seconds": 0,
                "status": "not_started",
            }
            for index, video in enumerate(videos, start=1)
            if isinstance(video, dict) and video.get("youtube_video_id")
        ]

    return {
        "playlist_id": playlist_id,
        "title": metadata.get("title"),
        "description": metadata.get("description"),
        "thumbnail": metadata.get("thumbnail"),
        "duration": metadata.get("duration"),
        "content_status": metadata.get("content_status", "available"),
        "total_videos": progress_payload.get("total_videos", len(lessons) or metadata.get("total_videos", 0)),
        "completed_videos": progress_payload.get("completed_videos", 0),
        "remaining_videos": progress_payload.get("remaining_videos", 0),
        "progress_percent": progress_payload.get("progress_percent", 0.0),
        "course_completed": progress_payload.get("course_completed", False),
        "next_action_type": progress_payload.get("next_action_type", "next_lesson"),
        "next_action_label": progress_payload.get("next_action_label", "Next Lesson"),
        "current_lesson": progress_payload.get("current_lesson"),
        "next_lesson": progress_payload.get("next_lesson"),
        "lessons": lessons,
    }


async def _record_path_view(
    client: httpx.AsyncClient, path_id: uuid.UUID
) -> None:
    url = f"{settings.analytics_service_base_url}/video/event"
    payload = {
        "user_id": "path_service",
        "video_id": str(path_id),
        "event_type": "path_view",
        "position_seconds": 0,
    }
    try:
        response = await client.post(url, json=payload)
        response.raise_for_status()
    except (httpx.HTTPError, ValueError):
        pass


async def _fetch_user_path_completion_percentage(
    client: httpx.AsyncClient, items: list[PathItem], user_id: uuid.UUID
) -> float:
    if not items:
        return 0.0

    completion_results = await asyncio.gather(
        *[
            _fetch_course_completion(client, item.playlist_id, user_id)
            for item in items
        ]
    )
    completed_courses = sum(1 for completed in completion_results if completed)
    return round((completed_courses / len(items)) * 100, 2)


async def _calculate_average_completion_rate(
    session: AsyncSession,
    client: httpx.AsyncClient,
    path_id: uuid.UUID,
    items: list[PathItem] | None = None,
) -> float:
    path_items = items if items is not None else await _get_ordered_path_items(session, path_id)
    user_ids = await _get_enrolled_user_ids(session, path_id)

    if not path_items or not user_ids:
        return 0.0

    completion_rates = await asyncio.gather(
        *[
            _fetch_user_path_completion_percentage(client, path_items, user_id)
            for user_id in user_ids
        ]
    )
    return round(sum(completion_rates) / len(completion_rates), 2)


async def _refresh_average_completion_rate(
    session: AsyncSession,
    client: httpx.AsyncClient,
    path_id: uuid.UUID,
) -> float:
    learning_path = await _get_learning_path_or_404(session, path_id)
    average_completion_rate = await _calculate_average_completion_rate(
        session, client, path_id
    )
    learning_path.average_completion_rate = average_completion_rate
    await session.commit()
    return average_completion_rate


async def _record_learning_history(
    session: AsyncSession,
    user_id: uuid.UUID,
    path_id: uuid.UUID,
    event_type: str,
    total_courses: int = 0,
    completed_courses: int = 0,
    remaining_courses: int = 0,
    progress_percentage: float = 0.0,
    next_up_playlist_id: str | None = None,
) -> None:
    session.add(
        LearningHistory(
            user_id=user_id,
            path_id=path_id,
            event_type=event_type,
            total_courses=total_courses,
            completed_courses=completed_courses,
            remaining_courses=remaining_courses,
            progress_percentage=progress_percentage,
            next_up_playlist_id=next_up_playlist_id,
        )
    )
    await session.commit()


def _build_certification_message(
    completed_courses: int, total_courses: int, remaining_courses: int
) -> str:
    if total_courses == 0:
        return "This learning path does not have any courses yet."
    if completed_courses == total_courses:
        return "Congratulations! You completed the full learning path and earned certification."
    if remaining_courses == 1:
        return "Just 1 more course left to get certified!"
    return f"Complete {remaining_courses} more courses to get certified."


def _build_progress_status(
    completed_courses: int, total_courses: int
) -> tuple[int, str]:
    if total_courses == 0:
        return 0, "not_started"

    progress_percentage = round((completed_courses / total_courses) * 100)

    if completed_courses == 0:
        return progress_percentage, "not_started"
    if completed_courses == total_courses:
        return progress_percentage, "completed"
    return progress_percentage, "in_progress"


def _normalize_score(value: float, max_value: float) -> float:
    if max_value <= 0:
        return 0.0
    return value / max_value


def _score_text_relevance(query: str, title: str, description: str) -> float:
    cleaned_query = query.strip().lower()
    title_text = title.strip().lower()
    description_text = description.strip().lower()

    if not cleaned_query:
        return 0.0
    if title_text == cleaned_query:
        return 1.0
    if title_text.startswith(cleaned_query):
        return 0.9
    if cleaned_query in title_text:
        return 0.8
    if cleaned_query in description_text:
        return 0.45
    return 0.0


@router.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/paths/search", response_model=list[SearchResultResponse])
async def search_paths(
    q: str = Query(..., min_length=1, max_length=100),
    session: AsyncSession = Depends(get_db_session),
    client: httpx.AsyncClient = Depends(get_http_client),
) -> list[SearchResultResponse]:
    cleaned_query = q.strip()
    if not cleaned_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query cannot be blank",
        )

    search_term = f"%{cleaned_query}%"
    count_subquery = (
        select(PathItem.path_id, func.count(PathItem.id).label("course_count"))
        .group_by(PathItem.path_id)
        .subquery()
    )
    enrollment_subquery = (
        select(
            PathEnrollment.path_id,
            func.count(PathEnrollment.id).label("enrollment_count"),
        )
        .group_by(PathEnrollment.path_id)
        .subquery()
    )

    query: Select[tuple[LearningPath, int]] = (
        select(
            LearningPath,
            func.coalesce(count_subquery.c.course_count, 0).label("course_count"),
            func.coalesce(
                enrollment_subquery.c.enrollment_count, 0
            ).label("enrollment_count"),
        )
        .outerjoin(count_subquery, LearningPath.path_id == count_subquery.c.path_id)
        .outerjoin(
            enrollment_subquery, LearningPath.path_id == enrollment_subquery.c.path_id
        )
        .where(
            or_(
                LearningPath.title.ilike(search_term),
                LearningPath.description.ilike(search_term),
            )
        )
    )

    result = await session.execute(query)
    matches = result.all()

    if not matches:
        return []

    max_views = max(path.total_views for path, _, _ in matches) or 1
    max_rating = max(path.rating for path, _, _ in matches) or 1.0
    max_enrollments = max(enrollment_count for _, _, enrollment_count in matches) or 1
    max_completion = 100.0

    ranked_results: list[SearchResultResponse] = []
    for path, course_count, enrollment_count in matches:
        normalized_views = _normalize_score(
            float(log1p(path.total_views)), float(log1p(max_views))
        )
        normalized_enrollments = _normalize_score(
            float(log1p(enrollment_count)), float(log1p(max_enrollments))
        )
        normalized_completion = _normalize_score(
            min(max(path.average_completion_rate, 0.0), max_completion), max_completion
        )
        normalized_rating = _normalize_score(float(path.rating), float(max_rating))
        text_relevance = _score_text_relevance(
            cleaned_query, path.title, path.description
        )

        quality_score = (
            (0.35 * normalized_completion)
            + (0.25 * normalized_rating)
            + (0.20 * normalized_views)
            + (0.20 * normalized_enrollments)
        )
        total_score = (0.60 * text_relevance) + (0.40 * quality_score)

        ranked_results.append(
            SearchResultResponse(
                path_id=path.path_id,
                title=path.title,
                description=path.description,
                editor_name=path.editor_name,
                total_views=path.total_views,
                average_completion_rate=path.average_completion_rate,
                rating=path.rating,
                total_score=round(total_score, 4),
                course_count=course_count,
            )
        )

    ranked_results.sort(key=lambda item: item.total_score, reverse=True)
    return ranked_results


@router.get("/paths/top", response_model=list[SearchResultResponse])
async def get_top_paths(
    limit: int = Query(10, ge=1, le=50),
    session: AsyncSession = Depends(get_db_session),
    client: httpx.AsyncClient = Depends(get_http_client),
) -> list[SearchResultResponse]:
    """
    Get top learning paths based on quality scoring (completion rate, rating, views, enrollments).
    Used for populating path suggestions in the frontend.
    """
    # Get all paths with their metrics
    count_subquery = (
        select(PathItem.path_id, func.count(PathItem.id).label("course_count"))
        .group_by(PathItem.path_id)
        .subquery()
    )
    enrollment_subquery = (
        select(
            PathEnrollment.path_id,
            func.count(PathEnrollment.id).label("enrollment_count"),
        )
        .group_by(PathEnrollment.path_id)
        .subquery()
    )

    query: Select[tuple[LearningPath, int]] = (
        select(
            LearningPath,
            func.coalesce(count_subquery.c.course_count, 0).label("course_count"),
            func.coalesce(
                enrollment_subquery.c.enrollment_count, 0
            ).label("enrollment_count"),
        )
        .outerjoin(count_subquery, LearningPath.path_id == count_subquery.c.path_id)
        .outerjoin(
            enrollment_subquery, LearningPath.path_id == enrollment_subquery.c.path_id
        )
    )

    result = await session.execute(query)
    matches = result.all()

    if not matches:
        return []

    # Calculate normalization factors
    max_views = max(path.total_views for path, _, _ in matches) or 1
    max_rating = max(path.rating for path, _, _ in matches) or 1.0
    max_enrollments = max(enrollment_count for _, _, enrollment_count in matches) or 1
    max_completion = 100.0

    ranked_results: list[SearchResultResponse] = []
    for path, course_count, enrollment_count in matches:
        normalized_views = _normalize_score(
            float(log1p(path.total_views)), float(log1p(max_views))
        )
        normalized_enrollments = _normalize_score(
            float(log1p(enrollment_count)), float(log1p(max_enrollments))
        )
        normalized_completion = _normalize_score(
            min(max(path.average_completion_rate, 0.0), max_completion), max_completion
        )
        normalized_rating = _normalize_score(float(path.rating), float(max_rating))

        # Quality score (same as in search but without text relevance)
        quality_score = (
            (0.35 * normalized_completion)
            + (0.25 * normalized_rating)
            + (0.20 * normalized_views)
            + (0.20 * normalized_enrollments)
        )

        # For top paths, we use quality score as total score (text relevance = 1.0)
        total_score = quality_score

        ranked_results.append(
            SearchResultResponse(
                path_id=path.path_id,
                title=path.title,
                description=path.description,
                editor_name=path.editor_name,
                total_views=path.total_views,
                average_completion_rate=path.average_completion_rate,
                rating=path.rating,
                total_score=round(total_score, 4),
                course_count=course_count,
            )
        )

    ranked_results.sort(key=lambda item: item.total_score, reverse=True)
    return ranked_results[:limit]


@router.post(
    "/paths",
    response_model=PathResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_path(
    payload: PathCreate,
    session: AsyncSession = Depends(get_db_session),
    _: dict[str, object] = Depends(_require_admin_token),
) -> LearningPath:
    learning_path = LearningPath(
        **payload.model_dump(),
        total_views=0,
        average_completion_rate=0.0,
    )
    session.add(learning_path)
    await session.commit()
    await session.refresh(learning_path)
    return learning_path


@router.post("/paths/{path_id}/items", response_model=PathWithItemsResponse)
async def add_path_items(
    path_id: uuid.UUID,
    payload: PathItemsCreate,
    session: AsyncSession = Depends(get_db_session),
    client: httpx.AsyncClient = Depends(get_http_client),
    _: dict[str, object] = Depends(_require_admin_token),
) -> PathWithItemsResponse:
    learning_path = await _get_learning_path_or_404(session, path_id)

    await session.execute(delete(PathItem).where(PathItem.path_id == path_id))

    items = [
        PathItem(
            path_id=path_id,
            playlist_id=playlist_id,
            sequence_order=index,
        )
        for index, playlist_id in enumerate(payload.playlist_ids, start=1)
    ]

    session.add_all(items)
    await session.commit()

    average_completion_rate = await _refresh_average_completion_rate(
        session, client, path_id
    )
    course_details = await asyncio.gather(
        *[_fetch_course_detail(client, item.playlist_id) for item in items]
    )

    return PathWithItemsResponse(
        path_id=learning_path.path_id,
        title=learning_path.title,
        description=learning_path.description,
        editor_name=learning_path.editor_name,
        total_views=learning_path.total_views,
        average_completion_rate=average_completion_rate,
        rating=learning_path.rating,
        items=[
            {"playlist_id": item.playlist_id, "sequence_order": item.sequence_order, **course}
            for item, course in zip(items, course_details, strict=False)
        ],
    )


@router.get("/paths/{path_id}", response_model=PathWithItemsResponse)
async def get_path(
    path_id: uuid.UUID,
    user_id: uuid.UUID | None = None,
    session: AsyncSession = Depends(get_db_session),
    client: httpx.AsyncClient = Depends(get_http_client),
) -> PathWithItemsResponse:
    learning_path = await _get_learning_path_or_404(session, path_id)
    items = await _get_ordered_path_items(session, path_id)

    course_details = await asyncio.gather(
        *[
            _fetch_course_detail(client, item.playlist_id, user_id)
            for item in items
        ]
    )

    return PathWithItemsResponse(
        path_id=learning_path.path_id,
        title=learning_path.title,
        description=learning_path.description,
        editor_name=learning_path.editor_name,
        total_views=learning_path.total_views,
        average_completion_rate=learning_path.average_completion_rate,
        rating=learning_path.rating,
        items=[
            {"playlist_id": item.playlist_id, "sequence_order": item.sequence_order, **course}
            for item, course in zip(items, course_details, strict=False)
        ],
    )


@router.get("/courses/{playlist_id}", response_model=CourseDetailResponse)
async def get_course(
    playlist_id: str,
    user_id: uuid.UUID | None = None,
    client: httpx.AsyncClient = Depends(get_http_client),
) -> CourseDetailResponse:
    course = await _fetch_course_detail(client, playlist_id, user_id)
    return CourseDetailResponse(**course)


@router.post("/paths/{path_id}/view", status_code=status.HTTP_204_NO_CONTENT)
async def record_path_view(
    path_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    client: httpx.AsyncClient = Depends(get_http_client),
) -> None:
    learning_path = await _get_learning_path_or_404(session, path_id)
    learning_path.total_views += 1
    await session.commit()
    await _record_path_view(client, path_id)


@router.post(
    "/paths/{path_id}/enroll",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def enroll_user(
    path_id: uuid.UUID,
    payload: EnrollmentCreate,
    session: AsyncSession = Depends(get_db_session),
) -> PathEnrollment:
    await _get_learning_path_or_404(session, path_id)

    enrollment = PathEnrollment(user_id=payload.user_id, path_id=path_id)
    session.add(enrollment)

    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already enrolled in this learning path",
        ) from None

    await session.refresh(enrollment)
    await _record_learning_history(
        session,
        user_id=payload.user_id,
        path_id=path_id,
        event_type="enrolled",
    )
    return enrollment


async def _calculate_path_progress(
    user_id: uuid.UUID,
    path_id: uuid.UUID,
    session: AsyncSession,
    client: httpx.AsyncClient
) -> dict:
    items = await _get_ordered_path_items(session, path_id)
    total_courses = len(items)
    
    if total_courses == 0:
        return {
            "total_courses": 0,
            "completed_courses": 0,
            "remaining_courses": 0,
            "progress_percentage": 0,
            "status": "not_started",
            "next_up": None
        }

    completion_results = await asyncio.gather(
        *[
            _fetch_course_completion(client, item.playlist_id, user_id)
            for item in items
        ]
    )

    completed_courses = sum(1 for completed in completion_results if completed)
    remaining_courses = total_courses - completed_courses
    progress_percentage, progress_status = _build_progress_status(
        completed_courses, total_courses
    )

    next_index = next(
        (index for index, completed in enumerate(completion_results) if not completed),
        None,
    )

    next_up = None
    if next_index is not None:
        next_item = items[next_index]
        metadata = await _fetch_course_metadata(client, next_item.playlist_id)
        next_up = NextUpResponse(
            playlist_id=next_item.playlist_id,
            title=metadata.get("title"),
        )
    
    return {
        "total_courses": total_courses,
        "completed_courses": completed_courses,
        "remaining_courses": remaining_courses,
        "progress_percentage": progress_percentage,
        "status": progress_status,
        "next_up": next_up
    }


@router.get("/paths/{path_id}/progress", response_model=PathProgressResponse)
async def get_path_progress(
    path_id: uuid.UUID,
    user_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    client: httpx.AsyncClient = Depends(get_http_client),
) -> PathProgressResponse:
    await _get_learning_path_or_404(session, path_id)
    
    progress_data = await _calculate_path_progress(user_id, path_id, session, client)
    
    await _record_learning_history(
        session,
        user_id=user_id,
        path_id=path_id,
        event_type="progress_updated",
        total_courses=progress_data["total_courses"],
        completed_courses=progress_data["completed_courses"],
        remaining_courses=progress_data["remaining_courses"],
        progress_percentage=float(progress_data["progress_percentage"]),
        next_up_playlist_id=progress_data["next_up"].playlist_id if progress_data["next_up"] else None,
    )

    await _refresh_average_completion_rate(session, client, path_id)

    return PathProgressResponse(
        path_id=path_id,
        **progress_data,
        certification_message=_build_certification_message(
            progress_data["completed_courses"], progress_data["total_courses"], progress_data["remaining_courses"]
        )
    )


@router.get("/users/{user_id}/enrolled-paths", response_model=list[EnrolledPathResponse])
async def get_enrolled_paths(
    user_id: uuid.UUID,
    started_only: bool = Query(False),
    session: AsyncSession = Depends(get_db_session),
    client: httpx.AsyncClient = Depends(get_http_client),
) -> list[EnrolledPathResponse]:
    result = await session.execute(
        select(PathEnrollment).where(PathEnrollment.user_id == user_id)
    )
    enrollments = result.scalars().all()
    
    response = []
    for enrollment in enrollments:
        path = await _get_learning_path_or_404(session, enrollment.path_id)
        progress_data = await _calculate_path_progress(user_id, enrollment.path_id, session, client)
        
        progress_val = float(progress_data["progress_percentage"])
        if started_only and progress_val <= 0:
            continue

        response.append(EnrolledPathResponse(
            path_id=path.path_id,
            title=path.title,
            progress=float(progress_data["progress_percentage"]),
            status=progress_data["status"],
            total_courses=progress_data["total_courses"],
            completed_courses=progress_data["completed_courses"]
        ))
        
    return response


@router.get(
    "/paths/{path_id}/history",
    response_model=list[LearningHistoryResponse],
)
async def get_learning_history(
    path_id: uuid.UUID,
    user_id: uuid.UUID | None = None,
    session: AsyncSession = Depends(get_db_session),
) -> list[LearningHistoryResponse]:
    await _get_learning_path_or_404(session, path_id)

    query = select(LearningHistory).where(LearningHistory.path_id == path_id)
    if user_id is not None:
        query = query.where(LearningHistory.user_id == user_id)

    result = await session.execute(query.order_by(LearningHistory.created_at.desc()))
    return list(result.scalars().all())
