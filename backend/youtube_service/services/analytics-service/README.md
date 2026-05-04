# Analytics Service

Records and aggregates platform-level analytics events, such as course views and user activity. Used by the Recommendation Service to generate personalized suggestions.

**Port:** `8004`  
**Database:** `analytics_db` (PostgreSQL)

---

## Responsibilities

- Receive and store analytics events (views, completions, etc.)
- Aggregate event data for use by the Recommendation Service

---

## Running Locally

```bash
cd backend/youtube_service/services/analytics-service
uvicorn app.main:app --reload --port 8004
```

**Environment Variables:**
```
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/analytics_db
```

**Swagger UI:** http://localhost:8004/docs
