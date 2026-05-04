# Progress Service

Tracks individual student progress — which videos have been watched, how far they got, and whether a course or lesson is completed.

**Port:** `8003`  
**Database:** `progress_db` (PostgreSQL)

---

## Responsibilities

- Record video watch events (seconds watched, position)
- Calculate lesson and course completion status
- Provide detailed progress breakdowns for the Course Details screen
- Support the Path Service in calculating path-level progress

---

## Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/progress` | Record a watch event for a video |
| `GET` | `/course/{playlist_id}/completion` | Get completion status for a course |
| `GET` | `/course/{playlist_id}/detail` | Get detailed lesson-level progress |

---

## Running Locally

```bash
cd backend/youtube_service/services/progress-service
uvicorn app.main:app --reload --port 8003
```

**Environment Variables:**
```
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/progress_db
CONTENT_SERVICE_URL=http://localhost:8002
```

**Swagger UI:** http://localhost:8003/docs
