# Path Service

Manages **learning paths** — curated sequences of courses that guide students through a topic. Handles path creation, course ordering, student enrollments, and progress aggregation.

**Port:** `8006`  
**Database:** `path_service_db` (PostgreSQL)  
**Framework:** Async FastAPI with `asyncpg`

---

## Responsibilities

- Create, update, and delete learning paths
- Add/reorder courses within a path
- Enroll students into paths
- Aggregate per-path progress from the Progress Service
- Serve enrolled path lists and progress to the frontend dashboard

---

## Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/paths/top` | Get top-ranked learning paths |
| `GET` | `/paths/search?q=` | Search paths by title/description |
| `POST` | `/paths` | Create a new learning path *(admin only)* |
| `DELETE` | `/paths/{path_id}` | Delete a learning path *(admin only)* |
| `GET` | `/paths/{path_id}` | Get path details with all courses |
| `GET` | `/courses/{playlist_id}` | Proxy course details from Content Svc (includes student progress) |
| `POST` | `/paths/{path_id}/items` | Set the ordered list of courses in a path *(admin only)* |
| `POST` | `/paths/{path_id}/enroll` | Enroll a user in a path |
| `GET` | `/paths/{path_id}/progress` | Get a user's progress across a path |
| `GET` | `/users/{user_id}/enrolled-paths` | Get all paths a user is enrolled in |
| `POST` | `/paths/{path_id}/rate` | Submit a rating for a path |

### Authentication
Endpoints marked *(admin only)* require a **Bearer JWT token** with `admin` role.

---

## Models

### LearningPath
| Field | Type | Notes |
|---|---|---|
| `path_id` | `UUID` | Primary key |
| `title` | `String(255)` | Path title |
| `description` | `Text` | Path description |
| `editor_name` | `String(255)` | Created by |
| `rating` | `Float` | Weighted average rating |
| `total_views` | `Integer` | Total view count |
| `average_completion_rate` | `Float` | Average % completion across enrolled users |

### PathItem (Course in a Path)
| Field | Type | Notes |
|---|---|---|
| `path_id` | `FK → learning_paths` | Parent path |
| `playlist_id` | `String` | References a course in the Content Service |
| `sequence_order` | `Integer` | Position in the path (1-indexed) |

### PathEnrollment
| Field | Type | Notes |
|---|---|---|
| `user_id` | `UUID` | The enrolled student |
| `path_id` | `FK → learning_paths` | The path enrolled in |

Deleting a path **automatically cascades** and removes all associated items, enrollments, and history.

---

## Running Locally

```bash
cd backend/path-service
uvicorn main:app --reload --port 8006
```

**Environment Variables:**
```
DATABASE_URL=postgresql+asyncpg://postgres:<password>@localhost:5432/path_service_db
CONTENT_SERVICE_BASE_URL=http://localhost:8002
PROGRESS_SERVICE_BASE_URL=http://localhost:8003
ANALYTICS_SERVICE_BASE_URL=http://localhost:8004
ADMIN_JWT_SECRET_KEY=local-dev-secret
```

**Swagger UI:** http://localhost:8006/docs
