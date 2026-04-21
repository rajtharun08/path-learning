from unittest.mock import patch
from app.models.playlist import Playlist
from app.models.video import Video


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


def _seed_playlist(db_session):
    playlist = Playlist(
        youtube_playlist_id="PL_test123",
        title="Test Playlist",
        description="Test description",
    )
    db_session.add(playlist)
    db_session.flush()

    for i in range(3):
        db_session.add(Video(
            youtube_video_id=f"vid_{i}",
            playlist_id=playlist.id,
            title=f"Video {i}",
            thumbnail=f"https://img.youtube.com/{i}.jpg",
            duration=300 + i * 60,
            position=i,
        ))
    db_session.commit()
    return playlist


def _seed_search_playlists(db_session):
    primary = Playlist(
        youtube_playlist_id="PL_html_primary",
        title="HTML for Beginners",
        description="Learn the basics of HTML and web pages.",
    )
    secondary = Playlist(
        youtube_playlist_id="PL_html_secondary",
        title="Web Development Bootcamp",
        description="Build websites with practical projects.",
    )
    other = Playlist(
        youtube_playlist_id="PL_python",
        title="Python Masterclass",
        description="Learn Python from scratch.",
    )

    db_session.add_all([primary, secondary, other])
    db_session.flush()

    db_session.add_all(
        [
            Video(
                youtube_video_id="vid_html_1",
                playlist_id=primary.id,
                title="Introduction to HTML",
                thumbnail=None,
                duration=300,
                position=0,
            ),
            Video(
                youtube_video_id="vid_html_2",
                playlist_id=secondary.id,
                title="HTML Project Setup",
                thumbnail=None,
                duration=420,
                position=0,
            ),
            Video(
                youtube_video_id="vid_python_1",
                playlist_id=other.id,
                title="Python Basics",
                thumbnail=None,
                duration=360,
                position=0,
            ),
        ]
    )
    db_session.commit()
    return primary, secondary, other


def test_get_playlist_cached(client, db_session):
    _seed_playlist(db_session)
    resp = client.get("/playlist/PL_test123")
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Test Playlist"
    assert len(data["videos"]) == 3


@patch("app.services.content_service.fetch_playlist_from_youtube", return_value=None)
def test_get_playlist_not_found(mock_fetch, client):
    resp = client.get("/playlist/nonexistent")
    assert resp.status_code == 404


def test_get_video_metadata(client, db_session):
    _seed_playlist(db_session)
    resp = client.get("/video/metadata/vid_0")
    assert resp.status_code == 200
    data = resp.json()
    assert data["current"]["youtube_video_id"] == "vid_0"
    assert data["next"]["youtube_video_id"] == "vid_1"


def test_get_video_metadata_last_video(client, db_session):
    _seed_playlist(db_session)
    resp = client.get("/video/metadata/vid_2")
    assert resp.status_code == 200
    assert resp.json()["next"] is None


def test_get_video_metadata_not_found(client):
    resp = client.get("/video/metadata/nonexistent")
    assert resp.status_code == 404


def test_get_next_video(client, db_session):
    _seed_playlist(db_session)
    resp = client.get("/video/next/vid_0")
    assert resp.status_code == 200
    assert resp.json()["next"]["youtube_video_id"] == "vid_1"


def test_get_next_video_last(client, db_session):
    _seed_playlist(db_session)
    resp = client.get("/video/next/vid_2")
    assert resp.status_code == 200
    assert resp.json()["next"] is None


def test_search_playlists_by_title(client, db_session):
    _seed_search_playlists(db_session)
    resp = client.get("/playlist/search?q=html")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert data["items"][0]["youtube_playlist_id"] == "PL_html_primary"
    assert data["items"][0]["relevance_score"] >= data["items"][1]["relevance_score"]


def test_search_playlists_by_video_title(client, db_session):
    _seed_search_playlists(db_session)
    resp = client.get("/playlist/search?q=setup")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["youtube_playlist_id"] == "PL_html_secondary"
