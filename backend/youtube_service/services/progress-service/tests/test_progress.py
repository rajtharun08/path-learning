from typing import List, Optional
from unittest.mock import patch


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


@patch("app.services.progress_service.get_video_duration", return_value=600)
def test_update_progress(mock_dur, client):
    resp = client.post("/video/progress", json={
        "user_id": "user-1",
        "video_id": "vid-1",
        "watched_seconds": 300,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["video_id"] == "vid-1"
    assert data["watched_seconds"] == 300
    assert data["completed"] is False


@patch("app.services.progress_service.get_video_duration", return_value=600)
def test_update_progress_completed(mock_dur, client):
    resp = client.post("/video/progress", json={
        "user_id": "user-1",
        "video_id": "vid-1",
        "watched_seconds": 550,
    })
    assert resp.status_code == 200
    assert resp.json()["completed"] is True


@patch("app.services.progress_service.get_video_duration", return_value=600)
def test_update_progress_upsert(mock_dur, client):
    client.post("/video/progress", json={
        "user_id": "user-1", "video_id": "vid-1", "watched_seconds": 100,
    })
    resp = client.post("/video/progress", json={
        "user_id": "user-1", "video_id": "vid-1", "watched_seconds": 400,
    })
    assert resp.status_code == 200
    assert resp.json()["watched_seconds"] == 400


def test_resume_video_no_progress(client):
    resp = client.get("/video/resume/vid-1?user_id=user-1")
    assert resp.status_code == 200
    assert resp.json()["resume_at_seconds"] == 0


@patch("app.services.progress_service.get_video_duration", return_value=600)
def test_resume_video_with_progress(mock_dur, client):
    client.post("/video/progress", json={
        "user_id": "user-1", "video_id": "vid-1", "watched_seconds": 250,
    })
    resp = client.get("/video/resume/vid-1?user_id=user-1")
    assert resp.status_code == 200
    assert resp.json()["resume_at_seconds"] == 250


@patch("app.services.progress_service.get_playlist_video_ids", return_value=[])
def test_course_progress_playlist_not_found(mock_ids, client):
    resp = client.get("/course/PL_missing/progress?user_id=user-1")
    assert resp.status_code == 404


@patch("app.services.progress_service.get_playlist_video_ids", return_value=["vid-1", "vid-2"])
@patch("app.services.progress_service.get_video_duration", return_value=600)
def test_course_progress(mock_dur, mock_ids, client):
    client.post("/video/progress", json={
        "user_id": "user-1", "video_id": "vid-1", "watched_seconds": 550,
    })
    resp = client.get("/course/PL_test/progress?user_id=user-1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_videos"] == 2
    assert data["completed_videos"] == 1
    assert data["progress_percent"] == 50.0


@patch("app.services.progress_service.get_video_duration", return_value=600)
@patch("app.services.progress_service.get_playlist_details")
def test_course_detail(mock_playlist, mock_dur, client):
    mock_playlist.return_value = {
        "title": "React Complete Course 2024",
        "thumbnail": "https://example.com/course.jpg",
        "duration": "12h",
        "videos": [
            {
                "youtube_video_id": "vid-1",
                "title": "Introduction to React",
                "thumbnail": "https://example.com/vid-1.jpg",
                "duration": 600,
                "position": 1,
            },
            {
                "youtube_video_id": "vid-2",
                "title": "State and Lifecycle",
                "thumbnail": "https://example.com/vid-2.jpg",
                "duration": 900,
                "position": 2,
            },
        ],
    }

    client.post("/video/progress", json={
        "user_id": "user-1", "video_id": "vid-1", "watched_seconds": 550,
    })
    resp = client.get("/course/PL_test/detail?user_id=user-1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_videos"] == 2
    assert data["completed_videos"] == 1
    assert data["current_lesson"]["youtube_video_id"] == "vid-2"
    assert data["next_action_label"] == "Take Assessment"
    assert len(data["lessons"]) == 2
