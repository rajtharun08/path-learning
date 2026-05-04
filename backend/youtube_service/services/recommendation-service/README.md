# Recommendation Service

Generates personalized learning path recommendations for students based on their progress and platform analytics.

**Port:** `8005`  
**No dedicated database** — reads from Progress and Analytics services.

---

## Responsibilities

- Aggregate user progress data from the Progress Service
- Use analytics signals from the Analytics Service
- Recommend relevant learning paths to students

---

## Running Locally

```bash
cd backend/youtube_service/services/recommendation-service
uvicorn app.main:app --reload --port 8005
```

**Environment Variables:**
```
PROGRESS_SERVICE_URL=http://localhost:8003
CONTENT_SERVICE_URL=http://localhost:8002
ANALYTICS_SERVICE_URL=http://localhost:8004
```

**Swagger UI:** http://localhost:8005/docs
