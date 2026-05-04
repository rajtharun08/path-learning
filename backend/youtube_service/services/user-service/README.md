# User Service

Handles user registration, authentication, and role management for the Hexaware Luminous platform.

**Port:** `8001`  
**Database:** `user_db` (PostgreSQL)

---

## Responsibilities

- Register new users (students, staff, admins)
- Authenticate users and issue **JWT tokens**
- Manage user roles (`student`, `staff`, `admin`)

---

## Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login and receive a JWT token |
| `GET` | `/users/{user_id}` | Get user profile |

---

## Roles

| Role | Description |
|---|---|
| `student` | Can browse, enroll, and track learning progress |
| `staff` | Can create and manage courses and lessons |
| `admin` | Full access including learning path management |

---

## Models

### User
| Field | Type | Notes |
|---|---|---|
| `id` | `String(36)` | UUID primary key |
| `email` | `String(255)` | Unique, indexed |
| `password_hash` | `String(255)` | bcrypt hashed password |
| `role` | `String(32)` | `student` / `staff` / `admin` |
| `created_at` | `DateTime` | Timestamp of registration |

---

## Running Locally

```bash
cd backend/youtube_service/services/user-service
uvicorn app.main:app --reload --port 8001
```

**Environment Variables:**
```
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/user_db
```

**Swagger UI:** http://localhost:8001/docs
