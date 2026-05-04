from typing import Dict, List, Optional
import logging
from datetime import datetime, timezone
import json

from sqlalchemy import or_
from sqlalchemy.orm import selectinload
from sqlalchemy.orm import Session

from app.models.playlist import Playlist
from app.models.video import Video
from app.models.resource import Resource

logger = logging.getLogger(__name__)


class ContentRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_playlist_by_youtube_id(self, youtube_playlist_id: str) -> Optional[Playlist]:
        return (
            self.db.query(Playlist)
            .options(selectinload(Playlist.videos))
            .options(selectinload(Playlist.resources))
            .filter(Playlist.youtube_playlist_id == youtube_playlist_id)
            .first()
        )

    def create_or_update_playlist(
        self,
        youtube_playlist_id: str,
        title: str,
        description: str,
        videos_data: List[dict],
        thumbnail: Optional[str] = None,
        author_name: Optional[str] = None,
        outcomes: Optional[List[str]] = None,
        is_manual: bool = False,
    ) -> Playlist:
        playlist = self.get_playlist_by_youtube_id(youtube_playlist_id)

        if playlist:
            playlist.title = title
            playlist.description = description
            playlist.is_manual = is_manual
            if outcomes is not None:
                playlist.outcomes_json = json.dumps(outcomes)
            if thumbnail is not None:
                playlist.thumbnail = thumbnail
            if author_name is not None:
                playlist.author_name = author_name
            playlist.last_synced_at = datetime.now(timezone.utc)
        else:
            playlist = Playlist(
                youtube_playlist_id=youtube_playlist_id,
                is_manual=is_manual,
                title=title,
                description=description,
                outcomes_json=json.dumps(outcomes or []),
                thumbnail=thumbnail,
                author_name=author_name,
            )
            self.db.add(playlist)
            self.db.flush()

        existing_videos: Dict[str, Video] = {v.youtube_video_id: v for v in playlist.videos}
        incoming_ids = {v["youtube_video_id"] for v in videos_data}

        for vid_id, video in list(existing_videos.items()):
            if vid_id not in incoming_ids:
                self.db.delete(video)

        for vdata in videos_data:
            if vdata["youtube_video_id"] in existing_videos:
                video = existing_videos[vdata["youtube_video_id"]]
                video.youtube_url = vdata.get("youtube_url")
                video.title = vdata["title"]
                video.thumbnail = vdata["thumbnail"]
                video.duration = vdata["duration"]
                video.position = vdata["position"]
            else:
                video = Video(
                    youtube_video_id=vdata["youtube_video_id"],
                    youtube_url=vdata.get("youtube_url"),
                    playlist_id=playlist.id,
                    title=vdata["title"],
                    thumbnail=vdata["thumbnail"],
                    duration=vdata["duration"],
                    position=vdata["position"],
                )
                self.db.add(video)

        self.db.commit()
        self.db.refresh(playlist)
        return playlist

    def get_video_by_youtube_id(self, youtube_video_id: str) -> Optional[Video]:
        return self.db.query(Video).filter(Video.youtube_video_id == youtube_video_id).first()

    def get_video_by_id(self, video_id: str) -> Optional[Video]:
        return self.db.query(Video).filter(Video.id == video_id).first()

    def get_videos_by_playlist(self, playlist_id: str) -> List[Video]:
        return (
            self.db.query(Video)
            .filter(Video.playlist_id == playlist_id)
            .order_by(Video.position)
            .all()
        )

    def create_manual_playlist(
        self,
        youtube_playlist_id: str,
        title: str,
        description: Optional[str],
        outcomes: Optional[List[str]],
        thumbnail: Optional[str],
        author_name: Optional[str],
    ) -> Playlist:
        playlist = Playlist(
            youtube_playlist_id=youtube_playlist_id,
            is_manual=True,
            title=title,
            description=description,
            outcomes_json=json.dumps(outcomes or []),
            thumbnail=thumbnail,
            author_name=author_name,
        )
        self.db.add(playlist)
        self.db.commit()
        self.db.refresh(playlist)
        return playlist

    def update_manual_playlist(
        self,
        playlist: Playlist,
        title: Optional[str] = None,
        description: Optional[str] = None,
        outcomes: Optional[List[str]] = None,
        thumbnail: Optional[str] = None,
        author_name: Optional[str] = None,
    ) -> Playlist:
        if title is not None:
            playlist.title = title
        if description is not None:
            playlist.description = description
        if outcomes is not None:
            playlist.outcomes_json = json.dumps(outcomes)
        if thumbnail is not None:
            playlist.thumbnail = thumbnail
        if author_name is not None:
            playlist.author_name = author_name
        playlist.last_synced_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(playlist)
        return playlist

    def delete_playlist(self, playlist: Playlist) -> None:
        self.db.delete(playlist)
        self.db.commit()

    def add_video_to_playlist(
        self,
        playlist: Playlist,
        youtube_video_id: str,
        youtube_url: Optional[str],
        title: str,
        thumbnail: Optional[str],
        duration: int,
        position: int,
    ) -> Video:
        video = Video(
            youtube_video_id=youtube_video_id,
            youtube_url=youtube_url,
            playlist_id=playlist.id,
            title=title,
            thumbnail=thumbnail,
            duration=duration,
            position=position,
        )
        self.db.add(video)
        self.db.commit()
        self.db.refresh(video)
        return video

    def update_video(
        self,
        video: Video,
        youtube_video_id: Optional[str] = None,
        youtube_url: Optional[str] = None,
        title: Optional[str] = None,
        thumbnail: Optional[str] = None,
        duration: Optional[int] = None,
        position: Optional[int] = None,
    ) -> Video:
        if youtube_video_id is not None:
            video.youtube_video_id = youtube_video_id
        if youtube_url is not None:
            video.youtube_url = youtube_url
        if title is not None:
            video.title = title
        if thumbnail is not None:
            video.thumbnail = thumbnail
        if duration is not None:
            video.duration = duration
        if position is not None:
            video.position = position
        self.db.commit()
        self.db.refresh(video)
        return video

    def delete_video(self, video: Video) -> None:
        self.db.delete(video)
        self.db.commit()

    def shift_video_positions(
        self,
        playlist_id: str,
        start_position: int,
        delta: int,
        exclude_video_id: Optional[str] = None,
    ) -> None:
        videos = self.get_videos_by_playlist(playlist_id)
        for video in videos:
            if exclude_video_id and video.id == exclude_video_id:
                continue
            if video.position >= start_position:
                video.position += delta
        self.db.commit()

    def renumber_playlist_videos(self, playlist_id: str) -> None:
        videos = self.get_videos_by_playlist(playlist_id)
        for index, video in enumerate(videos):
            video.position = index
        self.db.commit()

    def get_all_playlists(self, offset: int = 0, limit: int = 20) -> List[Playlist]:
        return (
            self.db.query(Playlist)
            .options(selectinload(Playlist.videos))
            .offset(offset)
            .limit(limit)
            .all()
        )

    def get_youtube_playlists_for_sync(self) -> List[Playlist]:
        return (
            self.db.query(Playlist)
            .options(selectinload(Playlist.videos))
            .filter(Playlist.is_manual.is_(False))
            .all()
        )

    def deserialize_outcomes(self, playlist: Playlist) -> List[str]:
        raw = playlist.outcomes_json
        if not raw:
            return []
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return []
        if not isinstance(parsed, list):
            return []
        return [str(item).strip() for item in parsed if str(item).strip()]

    def count_playlists(self) -> int:
        return self.db.query(Playlist).count()

    def search_playlists(self, query: str) -> List[Playlist]:
        cleaned_query = query.strip().lower()
        if not cleaned_query:
            return []

        tokens = [token for token in cleaned_query.split() if token]
        filters = [
            Playlist.title.ilike(f"%{cleaned_query}%"),
            Playlist.description.ilike(f"%{cleaned_query}%"),
        ]

        for token in tokens:
            token_pattern = f"%{token}%"
            filters.extend(
                [
                    Playlist.title.ilike(token_pattern),
                    Playlist.description.ilike(token_pattern),
                    Playlist.videos.any(Video.title.ilike(token_pattern)),
                ]
            )

        return (
            self.db.query(Playlist)
            .options(selectinload(Playlist.videos))
            .filter(or_(*filters))
            .all()
        )

    def increment_view(self, playlist: Playlist) -> None:
        playlist.total_views += 1
        self.db.commit()

    def update_rating(self, playlist: Playlist, new_rating: float) -> Playlist:
        # Calculate new average rating
        total_score = (playlist.rating * playlist.rating_count) + new_rating
        playlist.rating_count += 1
        playlist.rating = round(total_score / playlist.rating_count, 1)
        self.db.commit()
        self.db.refresh(playlist)
        return playlist

    def add_resource(self, playlist_id: str, title: str, url: str, resource_type: str) -> Resource:
        resource = Resource(
            playlist_id=playlist_id,
            title=title,
            url=url,
            resource_type=resource_type
        )
        self.db.add(resource)
        self.db.commit()
        self.db.refresh(resource)
        return resource

    def delete_resource(self, resource_id: str) -> bool:
        resource = self.db.query(Resource).filter(Resource.id == resource_id).first()
        if resource:
            self.db.delete(resource)
            self.db.commit()
            return True
        return False

