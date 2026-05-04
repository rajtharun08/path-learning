# Path Service

The **Path Service** manages learning paths, enrollments, user progress, and path ratings for the Hexaware Luminous platform. It is an async FastAPI service backed by PostgreSQL.

**Port:** `8006`

---

## Responsibilities

- Create, update, and delete **Learning Paths** (admin)
- Add/remove **courses (modules)** from a path with ordered sequencing
- **Enroll** users in paths and track their enrollment status
- Calculate per-user **progress** across all courses in a path
- Store and aggregate **star ratings** submitted by enrolled users
- Record **learning history** events for auditing and analytics

---

## Getting Started

### Prerequisites

- Python 3.12+ with the shared virtual environment activated
- PostgreSQL with a `path_service_db` database

### Database Setup

```bash
psql -U postgres -d path_service_db -f path_service_db.sql
```

### Environment Variables

Copy the example file and configure it:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/path_service_db` | Async PostgreSQL connection string |
| `CONTENT_SERVICE_BASE_URL` | `http://127.0.0.1:8002` | URL of the Content Service |
| `PROGRESS_SERVICE_BASE_URL` | `http://127.0.0.1:8003` | URL of the Progress Service |
| `ANALYTICS_SERVICE_BASE_URL` | `http://127.0.0.1:8004` | URL of the Analytics Service |
| `ADMIN_JWT_SECRET_KEY` | *(required)* | Shared secret for validating admin JWT tokens |
| `ADMIN_JWT_ALGORITHM` | `HS256` | JWT signing algorithm |

### Start the service

```bash
# From the repo root (venv must be active)
cd backend/path-service
uvicorn main:app --reload --port 8006
```

Swagger docs: **http://localhost:8006/docs**

---

## Data Models

### `LearningPath`
| Field | Type | Description |
|---|---|---|
| `path_id` | UUID (PK) | Unique identifier |
| `title` | String | Path title |
| `description` | Text | Full description |
| `editor_name` | String | Admin who created the path |
| `total_views` | Integer | Enrolled student count (view proxy) |
| `average_completion_rate` | Float | Aggregated completion % across all enrolled users |
| `rating` | Float | Average star rating (1–5) |

### `PathItem`
Ordered course within a path.

| Field | Type | Description |
|---|---|---|
| `path_id` | UUID (FK) | Parent learning path |
| `playlist_id` | String | Course ID from the Content Service |
| `sequence_order` | Integer | Position within the path |

### `PathEnrollment`
| Field | Type | Description |
|---|---|---|
| `user_id` | UUID | Enrolled user |
| `path_id` | UUID (FK) | Path enrolled in |
| `enrolled_at` | Timestamp | Enrollment timestamp |

### `PathRating`
| Field | Type | Description |
|---|---|---|
| `user_id` | UUID | Rater |
| `path_id` | UUID (FK) | Rated path |
| `rating` | Integer (1–5) | Star rating submitted |

### `LearningHistory`
Append-only audit log of progress events.

---

## Key API Endpoints

### Paths (Admin)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/paths` | List all paths |
| `POST` | `/paths` | Create a new path |
| `GET` | `/paths/{path_id}` | Get path with full curriculum |
| `PUT` | `/paths/{path_id}` | Update path metadata |
| `DELETE` | `/paths/{path_id}` | Delete a path |

### Enrollments
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/paths/{path_id}/enroll` | Enroll a user in a path |
| `GET` | `/paths/{path_id}/enrollment/{user_id}` | Check enrollment status |
| `GET` | `/users/{user_id}/enrolled-paths` | List all enrolled paths with progress |

### Progress
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/paths/{path_id}/progress?user_id=` | Get detailed progress for a user |

### Ratings
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/paths/{path_id}/rate` | Submit or update a star rating |

### Path Items (Admin)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/paths/{path_id}/items` | Add a course to a path |
| `DELETE` | `/paths/{path_id}/items/{item_id}` | Remove a course from a path |

---

## Progress Calculation

Progress is computed on-the-fly by calling the **Progress Service** for each course in the path. It returns:

- `total_courses` / `completed_courses` / `remaining_courses`
- `progress_percentage` — average completion % across all courses
- `status` — `not_started` | `in_progress` | `completed`
- `next_up` — the next incomplete course (playlist_id + title)
- `certification_message` — human-readable completion message

---

## Architecture Notes

- Uses **SQLAlchemy async** with `asyncpg` for non-blocking database access
- Communicates with Content, Progress, and Analytics services via **httpx** (shared async client per request)
- JWT tokens are validated using the shared `ADMIN_JWT_SECRET_KEY` for all admin-protected endpoints
