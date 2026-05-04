# Content Service

Manages all course content for the Hexaware Luminous platform. Supports both manual course creation and importing entire playlists from YouTube.

**Port:** `8002`  
**Database:** `content_db` (PostgreSQL)

---

## Responsibilities

- **Manual Creation:** Create, update, and delete courses and lessons manually.
- **YouTube Import:** Import entire playlists as courses using the YouTube Data API v3.
- **Syncing:** Re-importing a playlist updates existing metadata and synchronizes the lesson list (adding/removing videos) while preserving manual overrides.
- **Full Flexibility:** Both manual and imported courses are treated as first-class entities and can be edited, reordered, or deleted by admins.
- **Resources:** Attach links and files to any course.
- **Thumbnails:** Store thumbnails as URLs (for YouTube) or Base64 images (for Manual) in the database.

---

## Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/playlist/all` | List all courses (paginated) |
| `GET` | `/playlist/{playlist_id}` | Get full details for a course |
| `POST` | `/courses/import-youtube` | Import or re-sync a YouTube playlist (requires API Key) |
| `POST` | `/courses` | Create a new manual course |
| `PUT` | `/courses/{course_id}` | Update course details (title, author, outcomes, etc.) |
| `DELETE` | `/courses/{course_id}` | Delete a course |
| `POST` | `/courses/{course_id}/lessons` | Add a lesson to a course |
| `PUT` | `/courses/{course_id}/lessons/{lesson_id}` | Update a lesson (title, URL, position) |
| `DELETE` | `/courses/{course_id}/lessons/{lesson_id}` | Remove a lesson |

### Authentication
All write operations (`POST`, `PUT`, `DELETE`) require a **Bearer JWT token** with `staff` or `admin` role.

---

## Models

### Playlist (Course)
| Field | Type | Notes |
|---|---|---|
| `youtube_playlist_id` | `String` | Unique internal ID |
| `title` | `String(500)` | Course title |
| `description` | `Text` | Course overview |
| `thumbnail` | `Text` | URL or Base64 encoded image |
| `author_name` | `String(255)` | Instructor name |
| `outcomes_json` | `Text` | JSON array of learning outcomes |
| `is_manual` | `Boolean` | `True` for manual courses, `False` for imported |
| `last_synced_at` | `DateTime` | When the course was last updated/synced |

### Video (Lesson)
| Field | Type | Notes |
|---|---|---|
| `youtube_video_id` | `String(100)` | Unique ID from YouTube |
| `youtube_url` | `String(500)` | Full YouTube URL |
| `playlist_id` | `FK → playlists.id` | Parent course |
| `title` | `String(500)` | Lesson title |
| `thumbnail` | `Text` | URL or Base64 image |
| `duration` | `Integer` | Duration in seconds |
| `position` | `Integer` | order within the course |

---

## Running Locally

```bash
cd backend/youtube_service/services/content-service
uvicorn app.main:app --reload --port 8002
```

**Environment Variables:**
```bash
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/content_db
# Required for Course Import:
YOUTUBE_API_KEY=your_google_cloud_api_key
```

**Swagger UI:** http://localhost:8002/docs
