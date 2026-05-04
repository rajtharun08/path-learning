import logging
import re
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


def extract_youtube_video_id(url_or_id: str) -> str:
    candidate = (url_or_id or "").strip()
    # If it's already an 11-char ID
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", candidate):
        return candidate

    # Common YouTube URL patterns
    patterns = [
        r"(?:v=)([A-Za-z0-9_-]{11})",
        r"youtu\.be/([A-Za-z0-9_-]{11})",
        r"youtube\.com/embed/([A-Za-z0-9_-]{11})",
        r"youtube\.com/shorts/([A-Za-z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, candidate)
        if match:
            return match.group(1)

    raise ValueError("Invalid YouTube video link or ID.")
