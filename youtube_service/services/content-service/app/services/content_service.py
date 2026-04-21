from typing import Dict, List, Optional, Tuple
import logging
import re

from sqlalchemy.orm import Session

from app.models.playlist import Playlist
from app.repositories.content_repository import ContentRepository
from app.services.youtube_client import fetch_playlist_from_youtube

logger = logging.getLogger(__name__)


class ContentService:

    def __init__(self, db: Session):
        self.repo = ContentRepository(db)

    def sync_playlist(self, youtube_playlist_id: str) -> Optional[Playlist]:
        data = fetch_playlist_from_youtube(youtube_playlist_id)
        if not data:
            return None

        return self.repo.create_or_update_playlist(
            youtube_playlist_id=youtube_playlist_id,
            title=data["title"],
            description=data["description"],
            videos_data=data["videos"],
        )

    def get_full_playlist(self, youtube_playlist_id: str) -> Optional[Playlist]:
        playlist = self.repo.get_playlist_by_youtube_id(youtube_playlist_id)
        if not playlist:
            playlist = self.sync_playlist(youtube_playlist_id)
        return playlist

    def get_video_metadata(self, youtube_video_id: str) -> Dict[str, Optional[dict]]:
        video = self.repo.get_video_by_youtube_id(youtube_video_id)
        if not video:
            return {"current": None, "next": None}

        playlist_videos = self.repo.get_videos_by_playlist(video.playlist_id)
        current_idx = -1
        for i, v in enumerate(playlist_videos):
            if v.youtube_video_id == youtube_video_id:
                current_idx = i
                break

        next_video = None
        if current_idx != -1 and current_idx + 1 < len(playlist_videos):
            next_v = playlist_videos[current_idx + 1]
            next_video = {
                "youtube_video_id": next_v.youtube_video_id,
                "title": next_v.title,
                "thumbnail": next_v.thumbnail,
                "position": next_v.position,
            }

        return {
            "current": {
                "youtube_video_id": video.youtube_video_id,
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
            "title": playlist.title,
            "description": playlist.description,
            "last_synced_at": playlist.last_synced_at,
            "videos": playlist.videos,
            "relevance_score": round(score, 2),
            "matched_fields": matched_fields,
        }
