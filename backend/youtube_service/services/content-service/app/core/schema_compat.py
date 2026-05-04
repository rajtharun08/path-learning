from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def apply_schema_compatibility_updates(engine: Engine) -> None:
    inspector = inspect(engine)

    playlist_columns = {column["name"] for column in inspector.get_columns("playlists")}
    video_columns = {column["name"] for column in inspector.get_columns("videos")}

    with engine.begin() as connection:
        if "is_manual" not in playlist_columns:
            connection.execute(
                text(
                    "ALTER TABLE playlists "
                    "ADD COLUMN is_manual BOOLEAN NOT NULL DEFAULT FALSE"
                )
            )

        if "youtube_url" not in video_columns:
            connection.execute(
                text(
                    "ALTER TABLE videos "
                    "ADD COLUMN youtube_url VARCHAR(500)"
                )
            )

        if "outcomes_json" not in playlist_columns:
            connection.execute(
                text(
                    "ALTER TABLE playlists "
                    "ADD COLUMN outcomes_json TEXT"
                )
            )

        if "total_views" not in playlist_columns:
            connection.execute(
                text(
                    "ALTER TABLE playlists "
                    "ADD COLUMN total_views INTEGER NOT NULL DEFAULT 0"
                )
            )

        if "rating" not in playlist_columns:
            connection.execute(
                text(
                    "ALTER TABLE playlists "
                    "ADD COLUMN rating FLOAT NOT NULL DEFAULT 5.0"
                )
            )

        if "rating_count" not in playlist_columns:
            connection.execute(
                text(
                    "ALTER TABLE playlists "
                    "ADD COLUMN rating_count INTEGER NOT NULL DEFAULT 1"
                )
            )
