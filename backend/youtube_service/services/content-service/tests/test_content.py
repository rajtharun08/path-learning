from unittest.mock import patch

import jwt

from app.core.config import settings
from app.models.playlist import Playlist
from app.models.video import Video


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


def _admin_headers(role: str = "admin", is_admin: bool = False) -> dict[str, str]:
    settings.admin_jwt_secret_key = "test-secret"
    token = jwt.encode({"role": role, "is_admin": is_admin}, settings.admin_jwt_secret_key, algorithm=settings.admin_jwt_algorithm)
    return {"Authorization": f"Bearer {token}"}


def _seed_playlist(db_session):
    playlist = Playlist(
        youtube_playlist_id="PL_test123",
        title="Test Playlist",
        description="Test description",
    )
    db_session.add(playlist)
    db_session.flush()

    for i in range(3):
        db_session.add(
            Video(
                youtube_video_id=f"vid_{i}",
                youtube_url=f"https://www.youtube.com/watch?v=vid_{i}",
                playlist_id=playlist.id,
                title=f"Video {i}",
                thumbnail=f"https://img.youtube.com/{i}.jpg",
                duration=300 + i * 60,
                position=i,
            )
        )
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
                youtube_url="https://www.youtube.com/watch?v=vid_html_1",
                playlist_id=primary.id,
                title="Introduction to HTML",
                thumbnail=None,
                duration=300,
                position=0,
            ),
            Video(
                youtube_video_id="vid_html_2",
                youtube_url="https://www.youtube.com/watch?v=vid_html_2",
                playlist_id=secondary.id,
                title="HTML Project Setup",
                thumbnail=None,
                duration=420,
                position=0,
            ),
            Video(
                youtube_video_id="vid_python_1",
                youtube_url="https://www.youtube.com/watch?v=vid_python_1",
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
    assert data["current"]["youtube_url"] == "https://www.youtube.com/watch?v=vid_0"
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


def test_manual_course_requires_auth(client):
    settings.admin_jwt_secret_key = "test-secret"
    resp = client.post("/courses", json={"title": "Manual Course"})
    assert resp.status_code == 401


def test_login_returns_student_token(client):
    settings.admin_jwt_secret_key = "test-secret"
    resp = client.post(
        "/auth/login",
        json={"email": "student@example.com", "password": "secret", "role": "student"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "student"
    assert data["token_type"] == "bearer"
    assert data["access_token"]


def test_login_returns_admin_token(client):
    settings.admin_jwt_secret_key = "test-secret"
    resp = client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "secret", "role": "admin"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "admin"
    assert data["access_token"]


@patch(
    "app.services.content_service.fetch_video_from_youtube",
    side_effect=[
        {
            "youtube_video_id": "vid000001A1",
            "youtube_url": "https://www.youtube.com/watch?v=vid000001A1",
            "title": "Original Lesson One",
            "thumbnail": "https://img.youtube.com/1.jpg",
            "duration": 601,
        },
        {
            "youtube_video_id": "vid000002B2",
            "youtube_url": "https://www.youtube.com/watch?v=vid000002B2",
            "title": "Original Lesson Two",
            "thumbnail": "https://img.youtube.com/2.jpg",
            "duration": 845,
        },
    ],
)
def test_create_manual_course_with_lessons(mock_fetch_video, client):
    resp = client.post(
        "/courses",
        headers=_admin_headers(role="staff"),
        json={
            "title": "Admin Course",
            "description": "Built manually",
            "author_name": "Staff User",
            "lessons": [
                {
                    "youtube_url": "https://youtu.be/vid000001A1",
                    "title": "Custom Lesson 1",
                },
                {
                    "youtube_url": "https://youtu.be/vid000002B2",
                },
            ],
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["is_manual"] is True
    assert data["youtube_playlist_id"].startswith("manual_")
    assert data["title"] == "Admin Course"
    assert [video["title"] for video in data["videos"]] == ["Custom Lesson 1", "Original Lesson Two"]
    assert [video["position"] for video in data["videos"]] == [0, 1]


@patch(
    "app.services.content_service.fetch_video_from_youtube",
    side_effect=[
        {
            "youtube_video_id": "vid000003C3",
            "youtube_url": "https://www.youtube.com/watch?v=vid000003C3",
            "title": "First Lesson",
            "thumbnail": "https://img.youtube.com/3.jpg",
            "duration": 500,
        },
        {
            "youtube_video_id": "vid000004D4",
            "youtube_url": "https://www.youtube.com/watch?v=vid000004D4",
            "title": "Updated Lesson",
            "thumbnail": "https://img.youtube.com/4.jpg",
            "duration": 700,
        },
    ],
)
def test_add_update_delete_manual_lesson(mock_fetch_video, client):
    create_resp = client.post(
        "/courses",
        headers=_admin_headers(),
        json={"title": "Editable Course"},
    )
    assert create_resp.status_code == 201
    course_id = create_resp.json()["youtube_playlist_id"]

    add_resp = client.post(
        f"/courses/{course_id}/lessons",
        headers=_admin_headers(),
        json={"youtube_url": "https://youtu.be/vid000003C3"},
    )
    assert add_resp.status_code == 200
    added_course = add_resp.json()
    assert len(added_course["videos"]) == 1
    lesson_id = added_course["videos"][0]["id"]

    update_resp = client.put(
        f"/courses/{course_id}/lessons/{lesson_id}",
        headers=_admin_headers(),
        json={
            "youtube_url": "https://youtu.be/vid000004D4",
            "title": "Renamed Lesson",
            "position": 0,
        },
    )
    assert update_resp.status_code == 200
    updated_course = update_resp.json()
    assert updated_course["videos"][0]["youtube_video_id"] == "vid000004D4"
    assert updated_course["videos"][0]["title"] == "Renamed Lesson"

    delete_resp = client.delete(
        f"/courses/{course_id}/lessons/{lesson_id}",
        headers=_admin_headers(),
    )
    assert delete_resp.status_code == 200
    assert delete_resp.json()["videos"] == []
