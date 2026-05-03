from typing import Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.repositories.progress_repository import ProgressRepository
from app.schemas.progress import (
    CourseCompletionResponse,
    CourseDetailResponse,
    CourseProgressResponse,
    LessonProgressResponse,
    ResumeResponse,
)
from app.services.content_client import (
    get_video_duration,
    get_playlist_video_ids,
    get_playlist_details,
)


class ProgressService:

    def __init__(self, db: Session):
        self.repo = ProgressRepository(db)

    def update_progress(self, user_id: str, video_id: str, watched_seconds: int):
        duration = get_video_duration(video_id)
        completed = watched_seconds >= settings.completion_threshold * duration if duration > 0 else False
        return self.repo.upsert_progress(
            user_id=user_id, video_id=video_id,
            watched_seconds=watched_seconds, completed=completed,
        )

    def get_resume_timestamp(self, user_id: str, video_id: str) -> ResumeResponse:
        record = self.repo.get_progress(user_id, video_id)
        resume_ts = 0
        if record and not record.completed:
            resume_ts = record.watched_seconds
        
        return ResumeResponse(
            video_id=video_id,
            resume_at_seconds=resume_ts,
        )

    def toggle_bookmark(self, user_id: str, video_id: str) -> bool:
        return self.repo.toggle_bookmark(user_id, video_id)

    def create_note(self, user_id: str, video_id: str, content: str, video_timestamp: int):
        return self.repo.create_note(user_id, video_id, content, video_timestamp)

    def get_video_notes(self, user_id: str, video_id: str):
        return self.repo.get_notes_for_video(user_id, video_id)

    def get_course_progress(self, playlist_id: str, user_id: str) -> Optional[CourseProgressResponse]:
        video_ids = get_playlist_video_ids(playlist_id)
        if not video_ids:
            return None
        progress_records = self.repo.get_user_progress_for_videos(user_id, video_ids)
        completed = sum(1 for r in progress_records if r.completed)
        total = len(video_ids)
        return CourseProgressResponse(
            playlist_id=playlist_id, user_id=user_id,
            total_videos=total, completed_videos=completed,
            remaining_videos=total - completed,
            progress_percent=round((completed / total) * 100, 2) if total > 0 else 0.0,
        )

    def get_course_completion(self, playlist_id: str, user_id: str) -> Optional[CourseCompletionResponse]:
        video_ids = get_playlist_video_ids(playlist_id)
        if not video_ids:
            return None
        progress_records = self.repo.get_user_progress_for_videos(user_id, video_ids)
        
        # Calculate granular percentage based on total videos and their completion status
        # but let's make it even more granular: average of video percentages
        total_videos = len(video_ids)
        if total_videos == 0:
             return CourseCompletionResponse(playlist_id=playlist_id, user_id=user_id, completion_percentage=0.0, course_completed=False)
        
        completed_count = sum(1 for r in progress_records if r.completed)
        # For now, let's stick to (completed / total) but ensure it's returned correctly
        pct = round((completed_count / total_videos) * 100, 2)
        
        return CourseCompletionResponse(
            playlist_id=playlist_id, user_id=user_id,
            completion_percentage=pct, course_completed=pct >= 90.0,
        )

    def get_course_detail(self, playlist_id: str, user_id: str) -> Optional[CourseDetailResponse]:
        playlist = get_playlist_details(playlist_id)
        if not playlist:
            return None

        videos = playlist.get("videos", [])
        if not isinstance(videos, list):
            videos = []

        video_ids = [
            video.get("youtube_video_id")
            for video in videos
            if isinstance(video, dict) and video.get("youtube_video_id")
        ]
        progress_records = (
            self.repo.get_user_progress_for_videos(user_id, video_ids)
            if video_ids
            else []
        )
        progress_by_video = {record.video_id: record for record in progress_records}

        lessons: list[LessonProgressResponse] = []
        for index, video in enumerate(videos, start=1):
            if not isinstance(video, dict):
                continue

            video_id = video.get("youtube_video_id")
            if not video_id:
                continue

            record = progress_by_video.get(video_id)
            watched_seconds = record.watched_seconds if record else 0
            completed = bool(record.completed) if record else False
            is_bookmarked = bool(record.is_bookmarked) if record else False
            status = (
                "completed"
                if completed
                else "in_progress"
                if watched_seconds > 0
                else "not_started"
            )

            lessons.append(
                LessonProgressResponse(
                    youtube_video_id=video_id,
                    title=video.get("title") or f"Lesson {index}",
                    thumbnail=video.get("thumbnail"),
                    duration=int(video.get("duration") or 0),
                    position=int(video.get("position") or index),
                    watched_seconds=watched_seconds,
                    completed=completed,
                    is_bookmarked=is_bookmarked,
                    resume_at_seconds=0 if completed else watched_seconds,
                    status=status,
                )
            )

        completed_videos = sum(1 for lesson in lessons if lesson.completed)
        total_videos = len(lessons)
        remaining_videos = max(total_videos - completed_videos, 0)
        progress_percent = (
            round((completed_videos / total_videos) * 100, 2)
            if total_videos > 0
            else 0.0
        )
        course_completed = progress_percent >= 90.0

        current_lesson = next((lesson for lesson in lessons if not lesson.completed), None)
        if current_lesson is None and lessons:
            current_lesson = lessons[-1]

        next_lesson = None
        if current_lesson is not None:
            current_index = next(
                (
                    i
                    for i, lesson in enumerate(lessons)
                    if lesson.youtube_video_id == current_lesson.youtube_video_id
                ),
                None,
            )
            if current_index is not None and current_index + 1 < len(lessons):
                next_lesson = lessons[current_index + 1]

        next_action_type = (
            "take_assessment"
            if current_lesson is not None and current_lesson.position == total_videos
            else "next_lesson"
        )
        next_action_label = (
            "Take Assessment" if next_action_type == "take_assessment" else "Next Lesson"
        )

        thumbnail = playlist.get("thumbnail")
        if thumbnail is None and lessons:
            thumbnail = lessons[0].thumbnail

        return CourseDetailResponse(
            playlist_id=playlist_id,
            user_id=user_id,
            title=playlist.get("title"),
            thumbnail=thumbnail,
            duration=playlist.get("duration"),
            total_videos=total_videos,
            completed_videos=completed_videos,
            remaining_videos=remaining_videos,
            progress_percent=progress_percent,
            course_completed=course_completed,
            next_action_type=next_action_type,
            next_action_label=next_action_label,
            current_lesson=current_lesson,
            next_lesson=next_lesson,
            lessons=lessons,
        )
