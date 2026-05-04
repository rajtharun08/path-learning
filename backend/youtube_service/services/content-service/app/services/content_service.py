from typing import Dict, List, Optional, Tuple
import logging
import re
import uuid

from sqlalchemy.orm import Session

from app.models.playlist import Playlist
from app.models.video import Video
from app.repositories.content_repository import ContentRepository
from app.schemas.content import (
    ManualCourseCreate,
    ManualCourseUpdate,
    ManualLessonCreate,
    ManualLessonUpdate,
    ResourceCreate,
)
from app.services.youtube_client import extract_youtube_video_id

logger = logging.getLogger(__name__)


class ContentService:

    def __init__(self, db: Session):
        self.repo = ContentRepository(db)

    def get_full_playlist(self, youtube_playlist_id: str) -> Optional[Playlist]:
        return self.repo.get_playlist_by_youtube_id(youtube_playlist_id)

    def create_manual_course(self, payload: ManualCourseCreate) -> Playlist:
        playlist = self.repo.create_manual_playlist(
            youtube_playlist_id=self._generate_manual_course_id(),
            title=payload.title,
            description=payload.description,
            outcomes=payload.outcomes,
            thumbnail=payload.thumbnail,
            author_name=payload.author_name,
        )

        for lesson in payload.lessons:
            self._add_manual_lesson(playlist, lesson)

        for res in payload.resources:
            self.repo.add_resource(playlist.id, res.title, res.url, res.resource_type)

        return self.repo.get_playlist_by_youtube_id(playlist.youtube_playlist_id) or playlist

    def update_manual_course(self, course_id: str, payload: ManualCourseUpdate) -> Optional[Playlist]:
        playlist = self.repo.get_playlist_by_youtube_id(course_id)
        if not playlist or not playlist.is_manual:
            return None

        return self.repo.update_manual_playlist(
            playlist,
            title=payload.title,
            description=payload.description,
            outcomes=payload.outcomes,
            thumbnail=payload.thumbnail,
            author_name=payload.author_name,
        )

    def delete_manual_course(self, course_id: str) -> bool:
        playlist = self.repo.get_playlist_by_youtube_id(course_id)
        if not playlist or not playlist.is_manual:
            return False
        self.repo.delete_playlist(playlist)
        return True

    def record_view(self, course_id: str) -> bool:
        playlist = self.repo.get_playlist_by_youtube_id(course_id)
        if not playlist:
            return False
        self.repo.increment_view(playlist)
        return True

    def rate_course(self, course_id: str, rating: float) -> Optional[Playlist]:
        playlist = self.repo.get_playlist_by_youtube_id(course_id)
        if not playlist:
            return None
        return self.repo.update_rating(playlist, rating)

    def add_manual_lesson(self, course_id: str, payload: ManualLessonCreate) -> Optional[Playlist]:
        playlist = self.repo.get_playlist_by_youtube_id(course_id)
        if not playlist or not playlist.is_manual:
            return None

        self._add_manual_lesson(playlist, payload)
        return self.repo.get_playlist_by_youtube_id(course_id)

    def update_manual_lesson(
        self, course_id: str, lesson_id: str, payload: ManualLessonUpdate
    ) -> Optional[Playlist]:
        playlist = self.repo.get_playlist_by_youtube_id(course_id)
        if not playlist or not playlist.is_manual:
            return None

        lesson = self.repo.get_video_by_id(lesson_id)
        if not lesson or lesson.playlist_id != playlist.id:
            return None

        updated_video_id = lesson.youtube_video_id
        updated_url = lesson.youtube_url
        updated_title = lesson.title
        updated_thumbnail = lesson.thumbnail
        updated_duration = lesson.duration

        if payload.youtube_url is not None:
            updated_video_id = extract_youtube_video_id(payload.youtube_url)
            updated_url = payload.youtube_url
            if payload.title is not None:
                updated_title = payload.title
            
        # For 100% manual, the admin can update thumbnail and duration via other fields 
        # but the current schema ManualLessonUpdate doesn't have them yet.
        # I'll keep it simple for now based on the requested schema update.

        if payload.title is not None:
            updated_title = payload.title

        if payload.position is not None:
            self._move_lesson_to_position(playlist, lesson, payload.position)

        self.repo.update_video(
            lesson,
            youtube_video_id=updated_video_id,
            youtube_url=updated_url,
            title=updated_title,
            thumbnail=updated_thumbnail,
            duration=updated_duration,
            position=lesson.position,
        )
        self.repo.renumber_playlist_videos(playlist.id)
        return self.repo.get_playlist_by_youtube_id(course_id)

    def delete_manual_lesson(self, course_id: str, lesson_id: str) -> Optional[Playlist]:
        playlist = self.repo.get_playlist_by_youtube_id(course_id)
        if not playlist or not playlist.is_manual:
            return None

        lesson = self.repo.get_video_by_id(lesson_id)
        if not lesson or lesson.playlist_id != playlist.id:
            return None

        self.repo.delete_video(lesson)
        self.repo.renumber_playlist_videos(playlist.id)
        return self.repo.get_playlist_by_youtube_id(course_id)

    def get_video_metadata(self, youtube_video_id: str) -> Dict[str, Optional[dict]]:
        video = self.repo.get_video_by_youtube_id(youtube_video_id)
        if not video:
            return {"current": None, "next": None}

        playlist_videos = self.repo.get_videos_by_playlist(video.playlist_id)
        current_idx = -1
        for i, current_video in enumerate(playlist_videos):
            if current_video.youtube_video_id == youtube_video_id:
                current_idx = i
                break

        next_video = None
        if current_idx != -1 and current_idx + 1 < len(playlist_videos):
            next_video_record = playlist_videos[current_idx + 1]
            next_video = {
                "youtube_video_id": next_video_record.youtube_video_id,
                "title": next_video_record.title,
                "thumbnail": next_video_record.thumbnail,
                "position": next_video_record.position,
                "youtube_url": next_video_record.youtube_url,
            }

        return {
            "current": {
                "youtube_video_id": video.youtube_video_id,
                "youtube_url": video.youtube_url or f"https://www.youtube.com/watch?v={video.youtube_video_id}",
                "title": video.title,
                "thumbnail": video.thumbnail,
                "duration": video.duration,
                "position": video.position,
                "embed_url": f"https://www.youtube.com/embed/{video.youtube_video_id}",
                "iframe_snippet": f'<iframe width="100%" height="100%" src="https://www.youtube.com/embed/{video.youtube_video_id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
            },
            "next": next_video,
        }

    def list_all_playlists(self, offset: int = 0, limit: int = 20) -> Tuple[List[Playlist], int]:
        playlists = self.repo.get_all_playlists(offset=offset, limit=limit)
        total = self.repo.count_playlists()
        return playlists, total

    def search_playlists(
        self, query: str, offset: int = 0, limit: int = 20
    ) -> Tuple[List[dict], int]:
        playlists = self.repo.search_playlists(query)
        scored_results = [self._build_search_result(query, playlist) for playlist in playlists]
        scored_results.sort(
            key=lambda item: (
                -item["relevance_score"],
                item["title"].lower(),
                item["youtube_playlist_id"],
            )
        )

        total = len(scored_results)
        return scored_results[offset : offset + limit], total

    def _build_search_result(self, query: str, playlist: Playlist) -> dict:
        query_lower = query.strip().lower()
        tokens = [token for token in re.split(r"\s+", query_lower) if token]
        title = playlist.title.lower()
        description = (playlist.description or "").lower()
        video_titles = [video.title.lower() for video in playlist.videos]

        matched_fields: list[str] = []
        score = 0.0

        def mark(field: str) -> None:
            if field not in matched_fields:
                matched_fields.append(field)

        if query_lower and query_lower in title:
            score += 100.0
            mark("title")
            if title.startswith(query_lower):
                score += 20.0

        if query_lower and query_lower in description:
            score += 45.0
            mark("description")

        if query_lower and any(query_lower in video_title for video_title in video_titles):
            score += 35.0
            mark("video_title")

        title_hits = 0
        description_hits = 0
        video_hits = 0

        for token in tokens:
            if token in title:
                title_hits += 1
                score += 14.0
                mark("title")
                if title.startswith(token):
                    score += 4.0
            if token in description:
                description_hits += 1
                score += 7.0
                mark("description")
            if any(token in video_title for video_title in video_titles):
                video_hits += 1
                score += 10.0
                mark("video_title")

        if tokens and title_hits == len(tokens):
            score += 15.0
        if tokens and description_hits == len(tokens):
            score += 8.0
        if tokens and video_hits == len(tokens):
            score += 10.0

        score += min(len(video_titles), 10) * 0.5

        return {
            "id": playlist.id,
            "youtube_playlist_id": playlist.youtube_playlist_id,
            "is_manual": playlist.is_manual,
            "title": playlist.title,
            "description": playlist.description,
            "outcomes": self.repo.deserialize_outcomes(playlist),
            "thumbnail": playlist.thumbnail,
            "author_name": playlist.author_name,
            "last_synced_at": playlist.last_synced_at,
            "videos": playlist.videos,
            "relevance_score": round(score, 2),
            "matched_fields": matched_fields,
        }

    def _generate_manual_course_id(self) -> str:
        return f"manual_{uuid.uuid4().hex[:16]}"

    def _ensure_video_available(
        self, youtube_video_id: str, current_playlist_id: Optional[str] = None
    ) -> None:
        existing_video = self.repo.get_video_by_youtube_id(youtube_video_id)
        if existing_video and existing_video.playlist_id != current_playlist_id:
            raise ValueError(f"Video '{youtube_video_id}' is already assigned to another course.")

    def _resolve_manual_position(self, playlist: Playlist, requested_position: Optional[int]) -> int:
        existing_videos = self.repo.get_videos_by_playlist(playlist.id)
        if requested_position is None or requested_position >= len(existing_videos):
            return len(existing_videos)
        return max(requested_position, 0)

    def _add_manual_lesson(self, playlist: Playlist, payload: ManualLessonCreate) -> None:
        youtube_video_id = extract_youtube_video_id(payload.youtube_url)
        self._ensure_video_available(youtube_video_id, current_playlist_id=playlist.id)
        position = self._resolve_manual_position(playlist, payload.position)
        self.repo.shift_video_positions(playlist.id, position, 1)
        self.repo.add_video_to_playlist(
            playlist=playlist,
            youtube_video_id=youtube_video_id,
            youtube_url=payload.youtube_url,
            title=payload.title,
            thumbnail=payload.thumbnail,
            duration=payload.duration,
            position=position,
        )
        self.repo.renumber_playlist_videos(playlist.id)

    def _move_lesson_to_position(self, playlist: Playlist, lesson: Video, requested_position: int) -> None:
        videos = self.repo.get_videos_by_playlist(playlist.id)
        max_index = max(len(videos) - 1, 0)
        new_position = min(max(requested_position, 0), max_index)
        if lesson.position == new_position:
            return

        ordered = [video for video in videos if video.id != lesson.id]
        ordered.insert(new_position, lesson)
        for index, video in enumerate(ordered):
            video.position = index
        self.repo.db.commit()

    def add_resource(self, course_id: str, payload: ResourceCreate) -> Optional[Playlist]:
        playlist = self.repo.get_playlist_by_youtube_id(course_id)
        if not playlist:
            return None
        self.repo.add_resource(playlist.id, payload.title, payload.url, payload.resource_type)
        return self.repo.get_playlist_by_youtube_id(course_id)

    def delete_resource(self, course_id: str, resource_id: str) -> Optional[Playlist]:
        playlist = self.repo.get_playlist_by_youtube_id(course_id)
        if not playlist:
            return None
        self.repo.delete_resource(resource_id)
        return self.repo.get_playlist_by_youtube_id(course_id)
