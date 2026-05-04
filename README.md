# Hexaware Luminous — Learning Platform

A full-stack corporate learning platform built for **Hexaware Technologies**. The platform enables administrators to curate structured learning paths from custom-built video courses and learners to enroll, track their progress, and earn completions — accessible from both **web and mobile (iOS/Android)** via Expo React Native.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Expo / React Native)         │
│           Runs on Web (localhost:8081) + Mobile          │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API
         ┌─────────────┼──────────────────┐
         │             │                  │
    ┌────▼────┐  ┌─────▼──────┐  ┌───────▼──────┐
    │  User   │  │  Content   │  │     Path     │
    │ Service │  │  Service   │  │   Service    │
    │ :8001   │  │   :8002    │  │    :8006     │
    └─────────┘  └────────────┘  └──────────────┘
                       │
         ┌─────────────┼──────────────────┐
         │             │                  │
    ┌────▼────┐  ┌─────▼──────┐  ┌───────▼───────────┐
    │Progress │  │ Analytics  │  │  Recommendation   │
    │ Service │  │  Service   │  │     Service       │
    │  :8003  │  │   :8004    │  │    (internal)     │
    └─────────┘  └────────────┘  └───────────────────┘
```

### Microservices

| Service | Port | Description |
|---|---|---|
| **User Service** | `8001` | Learner registration, login, JWT auth |
| **Content Service** | `8002` | Manual course & lesson management |
| **Progress Service** | `8003` | Per-video watch progress, course completion |
| **Analytics Service** | `8004` | Player events, aggregated analytics |
| **Path Service** | `8006` | Learning paths, enrollments, ratings |

---

## Project Structure

```
path-learning/
├── backend/
│   ├── path-service/            # Learning path & enrollment management
│   └── youtube_service/
│       └── services/
│           ├── content-service/ # Course & lesson CRUD (manual)
│           ├── progress-service/# Watch progress tracking
│           ├── analytics-service/# Player event tracking
│           ├── user-service/    # Auth & user management
│           ├── api-gateway/     # (Optional) unified routing
│           └── recommendation-service/
├── frontend/
│   └── mobile/                  # Expo React Native app (web + mobile)
├── start_all.bat                # One-click backend launcher (Windows)
├── content_db.sql               # Content service DB schema
├── path_service_db.sql          # Path service DB schema
├── progress_db.sql              # Progress service DB schema
└── analytics_db.sql             # Analytics service DB schema
```

---

## Prerequisites

- **Python 3.12+** with a shared virtual environment (`venv/`) at the repo root
- **Node.js 18+** and **npm**
- **PostgreSQL 15+** with four separate databases:
  - `content_db`
  - `path_service_db`
  - `progress_db`
  - `analytics_db`
- **Expo CLI** (`npm install -g expo-cli`)

---

## Quick Start

### 1. Set up Python virtual environment

```bash
# From the repo root
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

### 2. Create PostgreSQL databases

```sql
CREATE DATABASE content_db;
CREATE DATABASE path_service_db;
CREATE DATABASE progress_db;
CREATE DATABASE analytics_db;
```

Run the `.sql` files to populate the schemas:

```bash
psql -U postgres -d content_db        -f content_db.sql
psql -U postgres -d path_service_db   -f path_service_db.sql
psql -U postgres -d progress_db       -f progress_db.sql
psql -U postgres -d analytics_db      -f analytics_db.sql
```

### 3. Configure environment variables

Copy the example env files and fill in your values:

```bash
cp backend\path-service\.env.example         backend\path-service\.env
cp backend\youtube_service\.env.example      backend\youtube_service\.env
```

See each service's own README for the required variables.

### 4. Start all backend services

```bash
# Windows — launches all 5 services in separate terminal windows
start_all.bat
```

Or start services individually (see each service's README).

### 5. Start the frontend

```bash
cd frontend\mobile
npm install
npx expo start --web      # Web browser at localhost:8081
npx expo start            # Expo Go QR for mobile
```

---

## Key Features

- **Curated Learning Paths** — Admins group multiple courses into structured, ordered paths
- **Manual Course Management** — No YouTube API required; courses are created and managed entirely through the Admin Dashboard
- **Enrollment & Progress Tracking** — Users enroll in paths and track completion per-course and per-video
- **Star Ratings** — Users rate paths; average ratings are calculated dynamically
- **Cross-Platform** — Single Expo codebase runs on iOS, Android, and Web
- **JWT Auth** — Role-based access (student / staff / admin) secured by JWT

---

## Admin Dashboard

The Admin Dashboard is accessible via the **Login** screen using `admin` or `staff` credentials. Admins can:

- Create, edit, and delete **courses** with custom lessons and resources
- Build and manage **learning paths** by selecting and ordering courses
- View enrolled student counts and path ratings

---

## API Documentation

Each service exposes interactive Swagger docs at its `/docs` endpoint:

| Service | Docs URL |
|---|---|
| User Service | http://localhost:8001/docs |
| Content Service | http://localhost:8002/docs |
| Progress Service | http://localhost:8003/docs |
| Analytics Service | http://localhost:8004/docs |
| Path Service | http://localhost:8006/docs |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native (Expo SDK 55), React 19 |
| Navigation | React Navigation v6 (Stack + Bottom Tabs) |
| Styling | StyleSheet (Vanilla RN), expo-linear-gradient |
| Backend | FastAPI, Python 3.12 |
| ORM | SQLAlchemy 2.0 (async for path-service) |
| Database | PostgreSQL 15 |
| Auth | JWT (PyJWT / python-jose) |
| Rate Limiting | slowapi |
| HTTP Client | httpx (async) |

---

## Contributing

1. Branch from `main`
2. Follow the existing service patterns (FastAPI router → controller → service → repository)
3. Keep each microservice fully self-contained with its own database
4. Do **not** share database connections across services