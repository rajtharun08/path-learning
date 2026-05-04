"""
YouTube Playlist Import Service.

Fetches playlist metadata and all video details from the YouTube Data API v3.
Requires YOUTUBE_API_KEY to be set in environment or .env file.

No YouTube API key means this service will raise a ValueError — the caller
(ContentController) surfaces this as a 503 to the frontend.
"""

import re
import logging
from typing import Optional
import httpx

logger = logging.getLogger(__name__)

YT_API_BASE = "https://www.googleapis.com/youtube/v3"


def _extract_playlist_id(url_or_id: str) -> str:
    """Accept a full YouTube playlist URL or a bare playlist ID and return the ID."""
    # Already a plain ID (starts with PL, UU, FL, RD, OL, LL, etc.)
    if re.match(r'^[A-Za-z0-9_-]{18,}$', url_or_id) and "youtube" not in url_or_id:
        return url_or_id

    match = re.search(r'[?&]list=([A-Za-z0-9_-]+)', url_or_id)
    if match:
        return match.group(1)

    raise ValueError(
        "Could not extract a playlist ID from the provided URL. "
        "Make sure it's a valid YouTube playlist link."
    )


def _parse_duration(iso_duration: str) -> int:
    """Convert ISO 8601 duration (PT4M13S) to total seconds."""
    pattern = re.compile(
        r'P(?:(?P<days>\d+)D)?T(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?'
    )
    match = pattern.match(iso_duration)
    if not match:
        return 0
    parts = {k: int(v) for k, v in match.groupdict(default='0').items()}
    return (
        parts['days'] * 86400
        + parts['hours'] * 3600
        + parts['minutes'] * 60
        + parts['seconds']
    )


def _best_thumbnail(thumbnails: dict) -> Optional[str]:
    """Pick the highest quality thumbnail URL available."""
    for quality in ('maxres', 'standard', 'high', 'medium', 'default'):
        if quality in thumbnails:
            return thumbnails[quality]['url']
    return None


def fetch_playlist_data(playlist_url_or_id: str, api_key: str) -> dict:
    """
    Fetch full playlist info and all its videos from YouTube Data API v3.

    Returns a dict:
    {
        "playlist_id": str,
        "title": str,
        "description": str,
        "thumbnail": str | None,
        "channel_title": str,
        "videos": [
            {
                "youtube_video_id": str,
                "youtube_url": str,
                "title": str,
                "thumbnail": str | None,
                "duration": int,   # seconds
                "position": int,
            },
            ...
        ]
    }
    """
    if not api_key:
        raise ValueError(
            "YouTube API key is not configured. "
            "Set YOUTUBE_API_KEY in the Content Service environment."
        )

    playlist_id = _extract_playlist_id(playlist_url_or_id)

    with httpx.Client(timeout=15.0) as client:
        # 1. Fetch playlist metadata
        playlist_resp = client.get(
            f"{YT_API_BASE}/playlists",
            params={
                "part": "snippet",
                "id": playlist_id,
                "key": api_key,
            },
        )
        playlist_resp.raise_for_status()
        playlist_data = playlist_resp.json()

        items = playlist_data.get("items", [])
        if not items:
            raise ValueError(
                f"Playlist '{playlist_id}' not found or is private/unlisted."
            )

        snippet = items[0]["snippet"]
        channel_title = snippet.get("channelTitle", "")
        playlist_title = snippet.get("title", "Untitled Playlist")
        playlist_description = snippet.get("description", "")
        playlist_thumbnail = _best_thumbnail(snippet.get("thumbnails", {}))

        # 2. Paginate through all playlist items to collect video IDs
        video_ids_ordered: list[str] = []
        next_page_token: Optional[str] = None

        while True:
            params: dict = {
                "part": "contentDetails",
                "playlistId": playlist_id,
                "maxResults": 50,
                "key": api_key,
            }
            if next_page_token:
                params["pageToken"] = next_page_token

            items_resp = client.get(f"{YT_API_BASE}/playlistItems", params=params)
            items_resp.raise_for_status()
            items_data = items_resp.json()

            for item in items_data.get("items", []):
                vid_id = item["contentDetails"]["videoId"]
                video_ids_ordered.append(vid_id)

            next_page_token = items_data.get("nextPageToken")
            if not next_page_token:
                break

        if not video_ids_ordered:
            raise ValueError("This playlist has no videos.")

        # 3. Batch-fetch video details (title, thumbnail, duration) — 50 per request
        video_details: dict[str, dict] = {}
        chunk_size = 50
        for i in range(0, len(video_ids_ordered), chunk_size):
            chunk = video_ids_ordered[i : i + chunk_size]
            videos_resp = client.get(
                f"{YT_API_BASE}/videos",
                params={
                    "part": "snippet,contentDetails",
                    "id": ",".join(chunk),
                    "key": api_key,
                },
            )
            videos_resp.raise_for_status()
            for v in videos_resp.json().get("items", []):
                video_details[v["id"]] = v

    # 4. Build ordered video list, skipping any deleted/private videos
    videos = []
    for position, vid_id in enumerate(video_ids_ordered):
        detail = video_details.get(vid_id)
        if not detail:
            logger.warning("Video %s not found (private/deleted), skipping.", vid_id)
            continue

        v_snippet = detail["snippet"]
        v_duration = _parse_duration(
            detail.get("contentDetails", {}).get("duration", "PT0S")
        )
        videos.append({
            "youtube_video_id": vid_id,
            "youtube_url": f"https://www.youtube.com/watch?v={vid_id}",
            "title": v_snippet.get("title", f"Lesson {position + 1}"),
            "thumbnail": _best_thumbnail(v_snippet.get("thumbnails", {})),
            "duration": v_duration,
            "position": position,
        })

    return {
        "playlist_id": playlist_id,
        "title": playlist_title,
        "description": playlist_description,
        "thumbnail": playlist_thumbnail,
        "channel_title": channel_title,
        "videos": videos,
    }
