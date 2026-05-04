# Backend Services — Hexaware Luminous

This directory contains all backend microservices for the Hexaware Luminous platform, organised into two groups:

```
backend/
├── path-service/         # Learning path orchestration (standalone FastAPI)
└── youtube_service/
    └── services/
        ├── content-service/      # Course & lesson management  (:8002)
        ├── progress-service/     # Watch progress & completion (:8003)
        ├── analytics-service/    # Player event tracking       (:8004)
        ├── user-service/         # Auth & learner identities   (:8001)
        ├── api-gateway/          # Optional unified gateway
        └── recommendation-service/
```

---

## Service Map

| Service | Port | Database | Stack |
|---|---|---|---|
| User Service | `8001` | `users_db` (or shared) | FastAPI, SQLAlchemy sync, PostgreSQL |
| Content Service | `8002` | `content_db` | FastAPI, SQLAlchemy sync, PostgreSQL |
| Progress Service | `8003` | `progress_db` | FastAPI, SQLAlchemy sync, PostgreSQL |
| Analytics Service | `8004` | `analytics_db` | FastAPI, SQLAlchemy sync, PostgreSQL |
| Path Service | `8006` | `path_service_db` | FastAPI, SQLAlchemy **async**, PostgreSQL |

---

## Shared Setup

All services share the same Python virtual environment at the **repo root**:

```bash
# From repo root
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Each service has its own `.env` file (copy from `.env.example`). See individual service READMEs for the required variables.

---

## Starting Services

### One-click (Windows)

Run `start_all.bat` from the repo root — it opens all five services in separate terminal windows.

### Manual

```bash
# User Service
cd backend/youtube_service/services/user-service
uvicorn app.main:app --reload --port 8001

# Content Service
cd backend/youtube_service/services/content-service
uvicorn app.main:app --reload --port 8002

# Progress Service
cd backend/youtube_service/services/progress-service
uvicorn app.main:app --reload --port 8003

# Analytics Service
cd backend/youtube_service/services/analytics-service
uvicorn app.main:app --reload --port 8004

# Path Service
cd backend/path-service
uvicorn main:app --reload --port 8006
```

---

## Content Service

**Port:** `8002` | **DB:** `content_db`

Manages all course content using a **fully manual approach** — no YouTube API key required. Admins create courses, lessons, and resources through the Admin Dashboard.

### Key Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/playlist/all` | Public | List all courses (paginated) |
| `GET` | `/playlist/{id}` | Public | Get a single course with all lessons |
| `GET` | `/playlist/search?q=` | Public | Full-text course search |
| `POST` | `/courses` | Staff/Admin | Create a course with lessons |
| `PUT` | `/courses/{id}` | Staff/Admin | Update course metadata |
| `DELETE` | `/courses/{id}` | Staff/Admin | Delete a course |
| `POST` | `/courses/{id}/lessons` | Staff/Admin | Add a lesson |
| `PUT` | `/courses/{id}/lessons/{lid}` | Staff/Admin | Update a lesson |
| `DELETE` | `/courses/{id}/lessons/{lid}` | Staff/Admin | Remove a lesson |
| `POST` | `/courses/{id}/resources` | Staff/Admin | Add a resource link |
| `POST` | `/courses/{id}/view` | Public | Increment view count |
| `POST` | `/courses/{id}/rate` | Public | Rate a course (1–5) |
| `POST` | `/auth/login` | Public | Get admin JWT token |
| `GET` | `/video/metadata/{video_id}` | Public | Get video + next video metadata |

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/content_db` |
| `ADMIN_JWT_SECRET_KEY` | Secret for signing/verifying admin tokens |
| `ADMIN_JWT_ALGORITHM` | Default: `HS256` |

---

## Progress Service

**Port:** `8003` | **DB:** `progress_db`

Tracks per-user, per-video watch progress and calculates whether a course is completed.

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/course/{course_id}/completion?user_id=` | Get completion % and status for a course |
| `POST` | `/video/{video_id}/progress` | Save watch progress for a video |
| `GET` | `/video/{video_id}/progress?user_id=` | Get current progress for a video |

---

## Analytics Service

**Port:** `8004` | **DB:** `analytics_db`

Records player events (play, pause, seek, complete) for aggregated reporting.

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/events` | Record a player event |
| `GET` | `/events/{video_id}` | Get events for a video |

---

## User Service

**Port:** `8001`

Handles learner registration, login, and identity management. Returns a `user_id` (UUID) which is used as the identity key across all other services.

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Register a new learner |
| `POST` | `/login` | Authenticate and get user_id |
| `GET` | `/users/{user_id}` | Get user profile |

---

## Auth Model

- Admin and Staff tokens are issued by the **Content Service** (`POST /auth/login`)
- Tokens are JWT-signed with `ADMIN_JWT_SECRET_KEY` and carry `role` and `is_admin` claims
- Protected routes in the Content Service and Path Service validate these tokens via `require_staff_token`
- Student sessions are identified only by their `user_id` UUID (stored client-side in AsyncStorage)

---

## Swagger Docs

| Service | URL |
|---|---|
| User Service | http://localhost:8001/docs |
| Content Service | http://localhost:8002/docs |
| Progress Service | http://localhost:8003/docs |
| Analytics Service | http://localhost:8004/docs |
| Path Service | http://localhost:8006/docs |
