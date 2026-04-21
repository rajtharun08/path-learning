# Path Service

Path Service is a FastAPI microservice for creating and managing learning paths in the YouTube learning platform. A learning path is an ordered collection of playlist-based courses. The service stores path data in its own database and enriches paths by calling the Content Service and Progress Service over HTTP.

## What It Does

- Creates and manages learning paths
- Stores ordered playlist references for each path
- Retrieves playlist metadata from Content Service
- Calculates learner progress using Progress Service
- Computes live average completion rate from enrolled users
- Supports ranked search across paths

## Service Layout

- `main.py`: application startup, database table creation, shared HTTP client
- `app/config.py`: environment-based configuration
- `app/database.py`: async SQLAlchemy engine and session dependency
- `app/models.py`: learning path, path item, and enrollment models
- `app/schemas.py`: request and response schemas
- `app/routers.py`: API endpoints and business logic

## Data Model

### `learning_paths`

- `path_id` UUID primary key
- `title` string
- `description` text
- `editor_name` string
- `total_views` integer, server-managed
- `average_completion_rate` float, computed from Progress Service
- `rating` float

### `path_items`

- `id` integer primary key
- `path_id` foreign key to `learning_paths.path_id`
- `playlist_id` string
- `sequence_order` integer

Constraints:

- Unique `(path_id, sequence_order)`
- Unique `(path_id, playlist_id)`

### `path_enrollments`

- `id` integer primary key
- `user_id` UUID
- `path_id` foreign key to `learning_paths.path_id`
- `enrolled_at` timestamp with time zone

Constraint:

- Unique `(user_id, path_id)`

## Dependencies

Path Service calls these downstream services:

- Content Service: `http://127.0.0.1:8002`
- Progress Service: `http://127.0.0.1:8003`
- Analytics Service: `http://127.0.0.1:8004`

### Content Service endpoint used

- `GET /playlist/{playlist_id}`

Used fields:

- `title`
- `thumbnail`
- `duration`

### Progress Service endpoint used

- `GET /course/{playlist_id}/completion?user_id={id}`

Used field:

- `course_completed`

### Analytics Service endpoint used

- `POST /video/event`

Used for:

- recording path views as `path_view` events

## API

### Health

`GET /health`

Response:

```json
{
  "status": "ok"
}
```

### Create a path

`POST /paths`

Requires a bearer token with an `admin` role claim.

Request body:

```json
{
  "title": "Backend Engineering Roadmap",
  "description": "A structured path for mastering backend development.",
  "editor_name": "Platform Editorial Team",
  "rating": 4.7
}
```

Notes:

- `total_views` is not accepted from the client
- `average_completion_rate` is computed by the service
- `rating` is still accepted as a manual editorial score

### Add path items

`POST /paths/{path_id}/items`

Request body:

```json
{
  "playlist_ids": [
    "playlist-fastapi-basics",
    "playlist-async-python"
  ]
}
```

Notes:

- Playlist order is preserved
- Duplicate playlist IDs are rejected
- The response is enriched from Content Service

### Record a view

`POST /paths/{path_id}/view`

Use this from the frontend when the detail page is actually viewed. This endpoint increments `total_views` and emits the analytics event.

### Get a path

`GET /paths/{path_id}?user_id={id}`

Returns the path with enriched item metadata and the cached `average_completion_rate`. If `user_id` is provided, the response is enriched with `is_enrolled` status and `progress_percentage` in a single request for high-performance frontend rendering.

### Enroll a user

`POST /paths/{path_id}/enroll`

Request body:

```json
{
  "user_id": "5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859"
}
```

- next up course

### Get Enrolled Paths (User Dashboard)

`GET /users/{user_id}/enrolled-paths?started_only=true`

Returns an array of paths that the user has enrolled in. If `started_only` is true, it filters out paths where progress is effectively 0%.

Response:
```json
[
  {
    "path_id": "uuid",
    "title": "React Mastery",
    "progress": 45.5,
    "status": "In Progress (2/4)",
    "total_courses": 4,
    "completed_courses": 2
  }
]
```

### Search paths

`GET /paths/search?q={keyword}`

Searches path title and description, then ranks results using:

```text
Total Score = (0.4 * Normalized Views) + (0.4 * Completion Rate) + (0.2 * Normalized Rating)
```

## Local Development

### Environment

Default local settings are defined in `app/config.py`. The important ones are:

```env
APP_PORT=8006
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/path_service_db
CONTENT_SERVICE_BASE_URL=http://127.0.0.1:8002
PROGRESS_SERVICE_BASE_URL=http://127.0.0.1:8003
ANALYTICS_SERVICE_BASE_URL=http://127.0.0.1:8004
ADMIN_JWT_SECRET_KEY=replace-with-a-long-random-secret
ADMIN_JWT_ALGORITHM=HS256
HTTP_TIMEOUT_SECONDS=5
```

### Run

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8006
```

### Docs

- Swagger UI: `http://localhost:8006/docs`
- ReDoc: `http://localhost:8006/redoc`

## Notes

- Tables are created automatically at startup
- The service uses a shared async `httpx.AsyncClient`
- Path views are recorded through `POST /paths/{path_id}/view`
- `average_completion_rate` is refreshed when progress is checked
- Path creation and item updates require a valid admin JWT
- Content or progress lookup failures do not break the main path endpoints
- For local testing without a YouTube API key, seed the Content Service database manually

## Operational Considerations

For production use, consider adding:

- Alembic migrations
- Structured logging
- Metrics and tracing
- Retries and circuit breakers for downstream calls
- Authentication for path management
