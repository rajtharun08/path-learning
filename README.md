# Hexaware Luminous — Dashboard-Centric Learning Platform

A premium, high-performance learning platform built for Hexaware. Features a unified "Explore-as-Dashboard" model, smart path discovery, and persistent "Permanent Memory" caching for an instantaneous user experience.

---
## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    React Native App                      │
│          (Expo — iOS / Android / Web)                    │
└──────────────────┬───────────────────────────────────────┘
                   │ HTTP
┌──────────────────▼───────────────────────────────────────┐
│                   Backend Microservices                   │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │ User Service│  │Content Svc  │  │ Progress Service │  │
│  │  Port 8001  │  │  Port 8002  │  │   Port 8003      │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘  │
│         │               │                   │            │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌────────▼─────────┐  │
│  │  user-db   │  │ content-db  │  │   progress-db    │  │
│  └─────────────┘  └─────────────┘  └──────────────────┘  │
│                         │                                │
│                         │ HTTP (Import Only)             │
│                  ┌──────▼──────┐                         │
│                  │ YouTube API │                         │
│                  └─────────────┘                         │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │ Analytics   │  │  Path Svc   │  │Recommendation Svc│  │
│  │  Port 8004  │  │  Port 8006  │  │   Port 8005      │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────────────┘  │
│         │               │                                │
│  ┌──────▼──────┐  ┌──────▼──────┐                        │
│  │analytics-db │  │   path-db   │                        │
│  └─────────────┘  └─────────────┘                        │
└──────────────────────────────────────────────────────────┘
```

---

## Services

| Service | Port | Description |
|---|---|---|
| **User Service** | `8001` | Authentication, JWT tokens, role management (student / staff / admin) |
| **Content Service** | `8002` | Manage courses and lessons. Supports **Manual Creation** and **YouTube Playlist Import** (with sync capabilities). |
| **Progress Service** | `8003` | Track per-user video watch time, completion status, and lesson progress |
| **Analytics Service** | `8004` | Record and aggregate platform analytics (views, events) |
| **Recommendation Service** | `8005` | Suggest learning paths based on progress and analytics data |
| **Path Service** | `8006` | Create and manage learning paths; handle enrollments and path progress |

Each service has its own isolated PostgreSQL database.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React Native + Expo (iOS, Android, Web) |
| **Backend** | Python 3.12, FastAPI, Uvicorn |
| **Database** | PostgreSQL 15 (one per service) |
| **ORM** | SQLAlchemy 2.0 (sync for most services, async for Path Service) |
| **Validation** | Pydantic v2 |
| **Containerization** | Docker + Docker Compose |
| **Auth** | JWT (PyJWT) — role-based (student / staff / admin) |
| **External APIs** | YouTube Data API v3 (for Course Import) |

---

## Project Structure

```
path-learning/
├── README.md
├── docker-compose.yml        # Spins up all services and databases
├── start_all.bat             # Local dev launcher (no Docker)
├── requirements.txt          # Shared Python dependencies
│
├── backend/
│   ├── path-service/         # Learning path microservice (async FastAPI)
│   └── youtube_service/
│       └── services/
│           ├── user-service/
│           ├── content-service/
│           ├── progress-service/
│           ├── analytics-service/
│           ├── recommendation-service/
│           └── api-gateway/
│
└── frontend/
    └── mobile/               # React Native Expo app
        └── src/
            ├── screens/
            ├── constants/
            └── theme/
```

---

## Running Locally

### Option 1 — Docker (Recommended)

Spins up all services and databases automatically.

```bash
docker-compose up --build
```

### Option 2 — Local Dev (Batch Script)

Runs all backend services in separate terminal windows using the shared virtual environment.

```bash
# From the project root:
start_all.bat
```

**Services must start in order.** The batch script handles this. Ports used:

| Service | URL |
|---|---|
| User Service | http://localhost:8001 |
| Content Service | http://localhost:8002 |
| Progress Service | http://localhost:8003 |
| Analytics Service | http://localhost:8004 |
| Path Service | http://localhost:8006 |

### Starting the Frontend

```bash
cd frontend/mobile
npx expo start
```

- **Web:** Press `w`
- **Mobile:** Scan QR with Expo Go app

> **Mobile Config:** Update `frontend/mobile/src/constants/Config.js` and set `BASE_IP` to your machine's local IP address so the mobile app can reach your backend.

---

## Roles & Access

| Role | Permissions |
|---|---|
| `student` | Browse paths, enroll, watch lessons, track progress |
| `staff` | All student permissions + create/edit/delete courses, import from YouTube |
| `admin` | All staff permissions + create/edit/delete learning paths |

---

## API Docs (Swagger)

Each service exposes Swagger UI at `/docs`:

- Content Service: http://localhost:8002/docs
- User Service: http://localhost:8001/docs
- Progress Service: http://localhost:8003/docs
- Analytics Service: http://localhost:8004/docs
- Path Service: http://localhost:8006/docs

---

## Important Notes

- **YouTube Import:** Requires a `YOUTUBE_API_KEY` in the `content-service/.env` file. This allows admins to pull entire playlists into the platform as courses.
- **Permanent Memory:** The platform features advanced `AsyncStorage` caching. Once a course or path is loaded, it remains available instantly, with silent background updates.
- **High-Performance Dashboard:** The primary entry point is the unified Dashboard, which consolidates course discovery with active learning progress.
- **Databases:** Are auto-created on first startup via SQLAlchemy's `create_all`.
- **Thumbnails:** Handled via URLs (YouTube) or Base64 (Manual) as needed.