import logging
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler

from app.core.database import SessionLocal
from app.repositories.content_repository import ContentRepository

logger = logging.getLogger(__name__)


def sync_all_playlists() -> None:
    logger.info("Playlist sync skipped: Automated YouTube sync is disabled.")
    return


def start_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        sync_all_playlists,
        trigger="interval",
        hours=24,
        id="playlist_sync",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    scheduler.start()
    return scheduler
