# YouTube Learning Platform with Path Service

A comprehensive microservices ecosystem that transforms YouTube content into a structured learning environment, featuring automated syncing, progress persistence, intelligent recommendations, and structured learning paths.

## Overview

This platform consists of two primary components:
1. **YouTube Learning Platform** - Core microservices ecosystem (5 services + API Gateway)
2. **Path Service** - Additional microservice for creating and managing structured learning paths

The Path Service integrates with the YouTube Learning Platform by consuming the Content Service and Progress Service to enrich learning paths with metadata and progress tracking.

## Architecture

```mermaid
graph TD
    subgraph "YouTube Learning Platform"
        APIGateway[API Gateway<br/>Port 8000] --> UserService[User Service<br/>Port 8001]
        APIGateway --> ContentService[Content Service<br/>Port 8002]
        APIGateway --> ProgressService[Progress Service<br/>Port 8003]
        APIGateway --> AnalyticsService[Analytics Service<br/>Port 8004]
        APIGateway --> RecommendService[Recommend Service<br/>Port 8005]
        
        UserService --> UserDB[(User DB)]
        ContentService --> ContentDB[(Content DB)]
        ProgressService --> ProgressDB[(Progress DB)]
        AnalyticsService --> AnalyticsDB[(Analytics DB)]
        RecommendService --> RecommendDB[(Recommend DB)]
    end
    
    subgraph "Path Service"
        PathService[Path Service<br/>Port 8006] --> PathDB[(Path DB)]
    end
    
    PathService -->|HTTP Requests| ContentService
    PathService -->|HTTP Requests| ProgressService
    
    style APIGateway fill:#f9f,stroke:#333
    style PathService fill:#bbf,stroke:#333
```

### Service Details

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 8000 | Unified entry point routing to all microservices |
| User Service | 8001 | Manages learner identity profiles |
| Content Service | 8002 | Integrates with YouTube API to fetch and cache playlists/videos |
| Progress Service | 8003 | Tracks watch-time, resume points, and course completion |
| Analytics Service | 8004 | Logs background interaction events |
| Recommend Service | 8005 | Provides intelligent video recommendations |
| Path Service | 8006 | Creates and manages structured learning paths |

## Features

### YouTube Learning Platform
- Automatic synchronization of YouTube content (playlists, videos)
- User management and authentication
- Progress tracking with resume functionality and higher precision analytics
- **Advanced Lesson Interaction**: Integrated note-taking and video bookmarking
- **Granular Completion Logic**: Intelligent progress calculation based on watch-time percentage, not just binary status
- Intelligent recommendation engine based on viewing patterns

### Path Service
- Creation and management of learning paths (ordered collections of playlists/courses)
- Each path item is treated as a course with detailed lesson-level progress tracking
- **Smarter Path Progress**: Real-time average completion tracking across multiple courses in a path
- **Ultra-Fast Loading**: Consolidated endpoints for fetching Path detail + Enrollment + Progress in a single network roundtrip
- **Premium UX**: Professional **Skeleton Loaders** and shimmer animations for instantaneous perceived performance
- Live average completion rate computation from enrolled users
- Ranked search functionality across paths
- User enrollment and tracking for learning paths
- Special handling for final lessons: returns "Take Assessment" as next action instead of "Next Lesson"

## Data Models

### Path Service Database Schema

```mermaid
erDiagram
    LEARNING_PATHS {
        uuid path_id PK
        title varchar
        description text
        editor_name varchar
        int total_views
        float average_completion_rate
        float rating
    }
    PATH_ITEMS {
        int id PK
        uuid path_id FK
        varchar playlist_id
        int sequence_order
    }
    PATH_ENROLLMENTS {
        int id PK
        uuid user_id
        uuid path_id FK
        timestamp enrolled_at
    }
    
    LEARNING_PATHS ||..o{ PATH_ITEMS : contains
    LEARNING_PATHS ||..o{ PATH_ENROLLMENTS : has
```

### YouTube Platform Database Schema (per service)

Each service maintains its own database following the database-per-service pattern:
- User Service: User profiles and authentication data
- Content Service: Cached YouTube playlist and video metadata
- Progress Service: User progress tracking for videos and courses
- Analytics Service: Interaction events and platform metrics
- Recommend Service: Recommendation cache and learned patterns

## API Reference

### Response Examples

#### Course Card (in path list)
```json
{
  "playlist_id": "playlist-fastapi-basics",
  "title": "FastAPI Basics",
  "description": "Learn FastAPI from scratch",
  "thumbnail_url": "https://example.com/thumbnail.jpg",
  "total_lessons": 12,
  "completed_lessons": 5,
  "completion_percentage": 41.7,
  "current_lesson": {
    "lesson_id": "lesson-6",
    "title": "Path Operations",
    "sequence_order": 6
  },
  "next_action": "Next Lesson",
  "is_completed": false
}
```

#### Course Detail Screen
```json
{
  "playlist_id": "playlist-fastapi-basics",
  "title": "FastAPI Basics",
  "description": "Learn FastAPI from scratch",
  "thumbnail_url": "https://example.com/thumbnail.jpg",
  "total_lessons": 12,
  "completed_lessons": 5,
  "completion_percentage": 41.7,
  "current_lesson": {
    "lesson_id": "lesson-6",
    "title": "Path Operations",
    "sequence_order": 6,
    "video_id": "video-123",
    "duration": "15:30"
  },
  "next_lesson": {
    "lesson_id": "lesson-7",
    "title": "Query Parameters",
    "sequence_order": 7,
    "video_id": "video-124",
    "duration": "12:45"
  },
  "lessons": [
    {
      "lesson_id": "lesson-1",
      "title": "Introduction",
      "sequence_order": 1,
      "video_id": "video-118",
      "is_completed": true
    },
    {
      "lesson_id": "lesson-2",
      "title": "Setup",
      "sequence_order": 2,
      "video_id": "video-119",
      "is_completed": true
    }
    // ... more lessons
  ],
  "next_action": "Next Lesson"
}
```

#### Final Lesson (assessment CTA)
```json
{
  "playlist_id": "playlist-fastapi-basics",
  "title": "FastAPI Basics",
  "description": "Learn FastAPI from scratch",
  "thumbnail_url": "https://example.com/thumbnail.jpg",
  "total_lessons": 12,
  "completed_lessons": 11,
  "completion_percentage": 91.7,
  "current_lesson": {
    "lesson_id": "lesson-12",
    "title": "Deployment and Testing",
    "sequence_order": 12,
    "video_id": "video-129",
    "duration": "18:20"
  },
  "next_lesson": null,
  "lessons": [
    // ... all lessons with completion status
  ],
  "next_action": "Take Assessment",
  "is_completed": false
}
```

### Path Service Endpoints

#### Health Check
```
GET /health
```
Returns service health status.

#### Create Learning Path
```
POST /paths
```
Creates a new learning path.

**Request Body:**
```json
{
  "title": "Backend Engineering Roadmap",
  "description": "A structured path for mastering backend development.",
  "editor_name": "Platform Editorial Team",
  "rating": 4.7
}
```

#### Add Items to Path
```
POST /paths/{path_id}/items
```
Adds playlist items to a learning path.

**Request Body:**
```json
{
  "playlist_ids": [
    "playlist-fastapi-basics",
    "playlist-async-python"
  ]
}
```

#### Get Learning Path
```
GET /paths/{path_id}
```
Retrieves a learning path with enriched metadata and progress information. Each path item is returned as a course with lesson-level progress, completion state, and next action (including "Take Assessment" for final lessons).

#### Enroll User
```
POST /paths/{path_id}/enroll
```
Enrolls a user in a learning path.

**Request Body:**
```json
{
  "user_id": "5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859"
}
```

#### Get User Progress
```
GET /paths/{path_id}/progress?user_id={id}
```
Returns progress details for a user in a specific learning path.

#### Search Paths
```
GET /paths/search?q={keyword}
```
Searches learning paths by title and description with relevance ranking.

#### Get Course Detail
```
GET /courses/{playlist_id}
```
Returns a full course detail payload for a specific playlist, including lesson-level metadata and progress information.

#### Get Enrolled Paths (Dashboard)
```
GET /users/{user_id}/enrolled-paths
```
Returns a list of paths the user has started, including their real-time progress percentages, specifically optimized for the "Continue Learning" dashboard section.

### YouTube Platform Endpoints (via API Gateway)

All YouTube platform endpoints are accessible through the API Gateway at `http://localhost:8000`.

#### User Module (`/users`)
- `POST /users` - Create new user
- `GET /users` - List all users
- `GET /users/{user_id}` - Get user profile

#### Content Module (`/playlist`, `/video`)
- `GET /playlist/{playlist_id}` - Import and get playlist details
- `GET /playlist/all` - List all imported playlists
- `GET /video/metadata/{video_id}` - Get video metadata with embed code
- `GET /video/next/{video_id}` - Get next video in sequence

#### Progress Module (`/video/progress`, `/course`)
- `POST /video/progress` - Record video progress
- `GET /video/resume/{video_id}?user_id={id}` - Get resume point
- `GET /course/{playlist_id}/progress?user_id={id}` - Get course progress
- `GET /course/{playlist_id}/completion?user_id={id}` - Check course completion
- `GET /course/{playlist_id}/detail` - Get lesson-level course detail (current lesson, next lesson, assessment CTA)

#### Analytics Module (`/analytics`)
- `GET /analytics/dropoff/{video_id}` - Get drop-off points
- `GET /analytics/popular?limit=10` - Get popular content

#### Recommend Module (`/recommend`)
- `GET /recommend/{playlist_id}?user_id={id}` - Get video recommendation

## Local Development

### Prerequisites
- Docker and Docker Compose (for YouTube Platform)
- Python 3.8+ (for Path Service)
- PostgreSQL database
- YouTube Data API v3 Key (for YouTube Platform)

### YouTube Platform Setup

1. Obtain a YouTube Data API v3 Key from Google Cloud Console
2. Copy `.env.example` to `.env` in the youtube_service directory
3. Add your API key to the `.env` file:
   ```
   YOUTUBE_API_KEY=your_actual_api_key_here
   ```
4. Launch the platform:
   ```bash
   cd youtube_service
   docker-compose up --build -d
   ```
5. Access API documentation at: `http://localhost:8000/docs`

### Path Service Setup

1. Install dependencies:
   ```bash
   cd path-service
   pip install -r requirements.txt
   ```
2. Configure environment variables in `path-service/.env` or set environment variables:
   ```
   APP_PORT=8006
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/path_service_db
   CONTENT_SERVICE_BASE_URL=http://127.0.0.1:8002
   PROGRESS_SERVICE_BASE_URL=http://127.0.0.1:8003
   HTTP_TIMEOUT_SECONDS=5
   ```
3. Initialize the database (tables created automatically at startup)
4. Run the service:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8006
   ```
5. Access API documentation at: `http://localhost:8006/docs`

### Environment Variables

#### YouTube Platform (`youtube_service/.env`)
```
YOUTUBE_API_KEY=your_youtube_api_key_here
```

#### Path Service (`path-service/.env` or environment)
```
APP_PORT=8006
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/path_service_db
CONTENT_SERVICE_BASE_URL=http://127.0.0.1:8002
PROGRESS_SERVICE_BASE_URL=http://127.0.0.1:8003
HTTP_TIMEOUT_SECONDS=5
```

## Deployment Considerations

### For Production Use
1. **Database Migrations**: Implement Alembic migrations for schema versioning
2. **Logging**: Add structured logging with appropriate log levels
3. **Monitoring**: Implement metrics collection and distributed tracing
4. **Resilience**: Add retry mechanisms and circuit breakers for service calls
5. **Security**: Implement authentication and authorization for path management
6. **Scaling**: Configure horizontal pod autoscaling for Kubernetes deployments
7. **Load Balancing**: Use ingress controllers or service meshes for traffic management

### Database Per Service Pattern
Each service maintains its own database to ensure loose coupling:
- Independent scaling and deployment
- Technology flexibility per service
- Failure isolation
- Team autonomy

Communication between services occurs through well-defined HTTP APIs.

## Operational Notes

### Path Service
- Tables are created automatically at application startup
- Uses a shared async `httpx.AsyncClient` for efficient HTTP requests
- Service gracefully handles downstream service failures (Content/Progress)
- For local testing without YouTube API, manually seed Content Service database

### YouTube Platform
- Implements cache-first pattern for YouTube data
- Services communicate via internal Docker network
- Only API Gateway port (8000) is exposed externally
- Internal service communication uses Docker hostname resolution

## Technology Stack

### YouTube Learning Platform
- **Framework**: FastAPI
- **Containerization**: Docker & Docker Compose
- **Service Discovery**: Docker networking
- **Communication**: REST/HTTP
- **Databases**: PostgreSQL (per service)

### Path Service
- **Framework**: FastAPI
- **Language**: Python 3.8+
- **ORM**: SQLAlchemy with asyncpg
- **HTTP Client**: httpx
- **Database**: PostgreSQL

## Project Structure
```
path-learning/
├── youtube-service/          # YouTube Learning Platform (5 microservices)
│   ├── services/             # Individual microservices
│   ├── diagrams/             # Architecture and ERD diagrams
│   ├── docker-compose.yml    # Container orchestration
│   └── README.md             # Detailed platform documentation
├── path-service/             # Path Service microservice
│   ├── app/                  # Application source code
│   ├── README.md             # Service documentation
│   ├── main.py               # Application entry point
│   └── requirements.txt      # Python dependencies
└── README.md                 # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is proprietary and confidential. All rights reserved.

---
*Documentation last updated: 2026-04-21*