from typing import List, Optional
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.video_progress import VideoProgress
from app.models.learning_session import LearningSession
from app.models.video_note import VideoNote
from app.models.course_assessment import CourseAssessment


class ProgressRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_progress(self, user_id: str, video_id: str) -> Optional[VideoProgress]:
        return (
            self.db.query(VideoProgress)
            .filter(VideoProgress.user_id == user_id, VideoProgress.video_id == video_id)
            .first()
        )

    def upsert_progress(self, user_id: str, video_id: str, watched_seconds: int, completed: bool) -> VideoProgress:
        record = self.get_progress(user_id, video_id)
        if record:
            record.watched_seconds = watched_seconds
            record.completed = completed
            record.updated_at = datetime.now(timezone.utc)
        else:
            record = VideoProgress(
                user_id=user_id, video_id=video_id,
                watched_seconds=watched_seconds, completed=completed,
            )
            self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def toggle_bookmark(self, user_id: str, video_id: str) -> bool:
        record = self.get_progress(user_id, video_id)
        if record:
            record.is_bookmarked = not record.is_bookmarked
        else:
            record = VideoProgress(
                user_id=user_id, video_id=video_id,
                is_bookmarked=True
            )
            self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record.is_bookmarked

    def create_note(self, user_id: str, video_id: str, content: str, video_timestamp: int, title: str = None) -> VideoNote:
        note = VideoNote(
            user_id=user_id, video_id=video_id,
            content=content, video_timestamp=video_timestamp,
            title=title
        )
        self.db.add(note)
        self.db.commit()
        self.db.refresh(note)
        return note

    def get_notes_for_video(self, user_id: str, video_id: str) -> List[VideoNote]:
        return (
            self.db.query(VideoNote)
            .filter(VideoNote.user_id == user_id, VideoNote.video_id == video_id)
            .order_by(VideoNote.video_timestamp.asc())
            .all()
        )

    def get_completed_video_ids_for_user(self, user_id: str) -> List[str]:
        rows = (
            self.db.query(VideoProgress.video_id)
            .filter(VideoProgress.user_id == user_id, VideoProgress.completed.is_(True))
            .all()
        )
        return [r.video_id for r in rows]

    def get_user_progress_for_videos(self, user_id: str, video_ids: List[str]) -> List[VideoProgress]:
        return (
            self.db.query(VideoProgress)
            .filter(VideoProgress.user_id == user_id, VideoProgress.video_id.in_(video_ids))
            .all()
        )

    def get_incomplete_video_in_playlist(self, user_id: str, video_ids: List[str]) -> Optional[VideoProgress]:
        return (
            self.db.query(VideoProgress)
            .filter(
                VideoProgress.user_id == user_id,
                VideoProgress.video_id.in_(video_ids),
                VideoProgress.completed.is_(False),
                VideoProgress.watched_seconds > 0,
            )
            .order_by(VideoProgress.updated_at.desc())
            .first()
        )

    def create_session(self, user_id: str) -> LearningSession:
        session = LearningSession(user_id=user_id)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_assessment(self, user_id: str, playlist_id: str) -> Optional[CourseAssessment]:
        return (
            self.db.query(CourseAssessment)
            .filter(CourseAssessment.user_id == user_id, CourseAssessment.playlist_id == playlist_id)
            .first()
        )

    def complete_assessment(self, user_id: str, playlist_id: str, score: float) -> CourseAssessment:
        assessment = self.get_assessment(user_id, playlist_id)
        if assessment:
            assessment.is_completed = True
            assessment.score = score
            assessment.completed_at = datetime.now(timezone.utc)
        else:
            assessment = CourseAssessment(
                user_id=user_id, playlist_id=playlist_id,
                is_completed=True, score=score
            )
            self.db.add(assessment)
        self.db.commit()
        self.db.refresh(assessment)
        return assessment
