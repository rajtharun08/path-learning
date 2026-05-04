from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.pagination import PaginatedResponse, PaginationParams
from app.schemas.content import (
    ManualCourseCreate,
    ManualCourseUpdate,
    ManualLessonCreate,
    ManualLessonUpdate,
    PlaylistResponse,
    PlaylistSearchResultResponse,
    VideoMetadataResponse,
    ResourceCreate
)
from app.services.content_service import ContentService


class ContentController:

    def __init__(self, db: Session):
        self.service = ContentService(db)

    def get_playlist(self, playlist_id: str):
        playlist = self.service.get_full_playlist(playlist_id)
        if not playlist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Playlist '{playlist_id}' not found.",
            )
        return playlist


    def create_manual_course(self, payload: ManualCourseCreate):
        try:
            return self.service.create_manual_course(payload)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    def update_manual_course(self, course_id: str, payload: ManualCourseUpdate):
        playlist = self.service.update_manual_course(course_id, payload)
        if not playlist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Manual course '{course_id}' not found.",
            )
        return playlist

    def delete_manual_course(self, course_id: str):
        deleted = self.service.delete_manual_course(course_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Manual course '{course_id}' not found.",
            )
        return {"deleted": True, "course_id": course_id}

    def record_view(self, course_id: str):
        recorded = self.service.record_view(course_id)
        if not recorded:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course '{course_id}' not found.",
            )
        return {"recorded": True}

    def rate_course(self, course_id: str, rating: float):
        playlist = self.service.rate_course(course_id, rating)
        if not playlist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course '{course_id}' not found.",
            )
        return playlist

    def add_manual_lesson(self, course_id: str, payload: ManualLessonCreate):
        try:
            playlist = self.service.add_manual_lesson(course_id, payload)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

        if not playlist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Manual course '{course_id}' not found.",
            )
        return playlist

    def update_manual_lesson(self, course_id: str, lesson_id: str, payload: ManualLessonUpdate):
        try:
            playlist = self.service.update_manual_lesson(course_id, lesson_id, payload)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

        if not playlist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lesson '{lesson_id}' not found in course '{course_id}'.",
            )
        return playlist

    def delete_manual_lesson(self, course_id: str, lesson_id: str):
        playlist = self.service.delete_manual_lesson(course_id, lesson_id)
        if not playlist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lesson '{lesson_id}' not found in course '{course_id}'.",
            )
        return playlist

    def list_playlists(self, pagination: PaginationParams):
        playlists, total = self.service.list_all_playlists(
            offset=pagination.offset, limit=pagination.page_size
        )
        return PaginatedResponse[PlaylistResponse].create(
            items=playlists, total=total,
            page=pagination.page, page_size=pagination.page_size,
        )

    def get_video_metadata(self, video_id: str):
        metadata = self.service.get_video_metadata(video_id)
        if not metadata["current"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Video '{video_id}' not found.",
            )
        return metadata

    def get_next_video(self, video_id: str):
        metadata = self.service.get_video_metadata(video_id)
        if not metadata["current"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Video '{video_id}' not found.",
            )
        return {"next": metadata["next"]}

    def search_playlists(self, query: str, pagination: PaginationParams):
        results, total = self.service.search_playlists(
            query=query, offset=pagination.offset, limit=pagination.page_size
        )
        return PaginatedResponse[PlaylistSearchResultResponse].create(
            items=results,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
        )

    def add_resource(self, course_id: str, payload: ResourceCreate):
        playlist = self.service.add_resource(course_id, payload)
        if not playlist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course '{course_id}' not found.",
            )
        return playlist

    def delete_resource(self, course_id: str, resource_id: str):
        playlist = self.service.delete_resource(course_id, resource_id)
        if not playlist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course '{course_id}' or resource '{resource_id}' not found.",
            )
        return playlist
