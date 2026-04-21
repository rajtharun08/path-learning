# Path Service Frontend Documentation

This document is a handoff for the frontend team. It explains which endpoints exist, what payloads they should send, what the service returns, and which actions are admin-only.

## Base Information

- Service name: `path_service`
- Default local base URL: `http://localhost:8006`
- Swagger UI: `http://localhost:8006/docs`
- ReDoc: `http://localhost:8006/redoc`

## What This Service Owns

`path_service` manages learning paths only. It does not talk to YouTube directly.

It depends on:
- `content-service` for playlist metadata
- `progress-service` for course completion
- `analytics-service` for path view events

## Authentication

Only write operations are admin-only.

Admin endpoints require a JWT bearer token in the `Authorization` header.

```http
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

The token must be signed with the secret configured in `ADMIN_JWT_SECRET_KEY` and must contain either:
- `role: "admin"`
- or `is_admin: true`

Admin-only endpoints:
- `POST /paths`
- `POST /paths/{path_id}/items`

Public endpoints do not require a token.

### How to get a local admin token

For local testing, generate a JWT with the same secret that `path_service` uses.

Example environment values:

```env
ADMIN_JWT_SECRET_KEY=your-local-secret
ADMIN_JWT_ALGORITHM=HS256
```

Example Python snippet:

```python
import jwt

token = jwt.encode(
    {"role": "admin"},
    "your-local-secret",
    algorithm="HS256",
)

print(token)
```

Use the printed token in:
- Swagger UI `Authorize`
- Postman `Authorization` header
- frontend requests for admin actions

### How the frontend should send it

For admin requests, the frontend should include:

```http
Authorization: Bearer <admin_jwt_token>
```

Example with `fetch`:

```js
await fetch("http://localhost:8006/paths", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${adminToken}`,
  },
  body: JSON.stringify(payload),
});
```

If the token is missing, the backend returns `401 Unauthorized`.
If the token is valid but not an admin token, the backend returns `403 Forbidden`.

## Database Tables

The database section already exists in `README.md`. This service uses these tables:

- `learning_paths`
- `path_items`
- `path_enrollments`
- `learning_history`

## Frontend Flow

Recommended order for the frontend:

1. Search or list paths.
2. Open a path detail page.
3. Call `POST /paths/{path_id}/view` once when the detail page actually loads.
4. Render the path from `GET /paths/{path_id}`.
5. Allow enrollments with `POST /paths/{path_id}/enroll`.
6. Show progress with `GET /paths/{path_id}/progress?user_id=...`.
7. Show history with `GET /paths/{path_id}/history?user_id=...` when needed.

## Endpoints

### Health Check

`GET /health`

Response:

```json
{
  "status": "ok"
}
```

### Create Path

`POST /paths`

Admin-only.

Request body:

```json
{
  "title": "Python Path",
  "description": "A learning path for Python",
  "editor_name": "Platform Team",
  "rating": 4.5
}
```

Notes:
- Do not send `total_views`
- Do not send `average_completion_rate`
- Those values are managed by the service

Response fields:
- `path_id`
- `title`
- `description`
- `editor_name`
- `total_views`
- `average_completion_rate`
- `rating`

### Add Items to a Path

`POST /paths/{path_id}/items`

Admin-only.

Request body:

```json
{
  "playlist_ids": [
    "PL_TEST_001",
    "PL_TEST_002"
  ]
}
```

Behavior:
- Replaces the existing item list for that path
- Preserves the order in the array
- Fetches playlist metadata from `content-service`

Response:
- Returns the full path
- Returns enriched item metadata
- Each item contains:
  - `playlist_id`
  - `sequence_order`
  - `title`
  - `thumbnail`
  - `duration`
  - `content_status`

### Record a Path View

`POST /paths/{path_id}/view`

Use this when the detail page is actually viewed.

Behavior:
- Increments `total_views`
- Sends a `path_view` event to `analytics-service`

This endpoint is the correct way to count views.
Do not rely on `GET /paths/{path_id}` for view counting.

### Get a Path

`GET /paths/{path_id}`

Returns:
- path details
- cached `average_completion_rate`
- item list with metadata from `content-service`

This endpoint is read-only.

### Enroll in a Path

`POST /paths/{path_id}/enroll`

Request body:

```json
{
  "user_id": "5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859"
}
```

Behavior:
- creates a path enrollment
- rejects duplicates with `409 Conflict`
- records an `enrolled` entry in `learning_history`

Response:
```json
{
  "id": 1,
  "user_id": "5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859",
  "path_id": "b96b5184-3d6e-4d4c-be0b-9c09b2a67d64",
  "enrolled_at": "2026-04-09T05:50:20.480Z"
}
```

### Get Path Progress

`GET /paths/{path_id}/progress?user_id={user_id}`

Returns:
- `total_courses`
- `completed_courses`
- `remaining_courses`
- `progress_percentage`
- `status`
- `certification_message`
- `next_up`

Example response:

```json
{
  "path_id": "b96b5184-3d6e-4d4c-be0b-9c09b2a67d64",
  "total_courses": 1,
  "completed_courses": 0,
  "remaining_courses": 1,
  "progress_percentage": 0,
  "status": "not_started",
  "certification_message": "Just 1 more course left to get certified!",
  "next_up": {
    "playlist_id": "PL_TEST_001",
    "title": "Test Playlist"
  }
}
```

Behavior:
- checks course completion from `progress-service`
- refreshes cached `average_completion_rate`
- writes a `progress_updated` entry to `learning_history`

### Get Path History

`GET /paths/{path_id}/history`

Optional query parameter:
- `user_id`

Examples:
- `GET /paths/{path_id}/history`
- `GET /paths/{path_id}/history?user_id=<uuid>`

Returns the learning history rows for that path.

History fields:
- `id`
- `user_id`
- `path_id`
- `event_type`
- `total_courses`
- `completed_courses`
- `remaining_courses`
- `progress_percentage`
- `next_up_playlist_id`
- `created_at`

### Search Paths

`GET /paths/search?q={keyword}`

Example:
- `GET /paths/search?q=python`

Behavior:
- searches title and description
- ranks results using relevance plus quality signals
- returns `course_count` and `total_score`

Response example:

```json
[
  {
    "path_id": "b96b5184-3d6e-4d4c-be0b-9c09b2a67d64",
    "title": "Python Path",
    "description": "A learning path for Python",
    "editor_name": "Platform Team",
    "total_views": 12,
    "average_completion_rate": 68.5,
    "rating": 4.5,
    "total_score": 0.8231,
    "course_count": 4
  }
]
```

## What the Frontend Should Send

### For path creation

Send only:
- `title`
- `description`
- `editor_name`
- `rating`

Do not send:
- `total_views`
- `average_completion_rate`

### For path items

Send:
- `playlist_ids` as an ordered array

Important:
- The backend replaces the old list with the new list
- If the frontend wants to keep existing items, it must send the full final list

### For path detail pages

Call:
1. `POST /paths/{path_id}/view`
2. `GET /paths/{path_id}`

The first call records the view.
The second call fetches the data to render.

### For progress pages

Call:
- `GET /paths/{path_id}/progress?user_id=...`

If the user enrolls first, call:
- `POST /paths/{path_id}/enroll`

## Notes For Frontend Integration

- The frontend should not try to calculate completion rate itself.
- The frontend should not send content metadata for playlists.
- The frontend should expect enriched playlist info from the backend.
- The frontend should use JWT only for admin actions.
- Public read pages can stay unauthenticated.

## Local Testing Notes

If you are testing locally without Docker:

- Start Postgres
- Seed `content-service` with a playlist if you do not have a YouTube API key
- Start:
  - `content-service` on `8002`
  - `progress-service` on `8003`
  - `analytics-service` on `8004`
  - `path_service` on `8006`

Use the local env values from `path_service/.env`.
