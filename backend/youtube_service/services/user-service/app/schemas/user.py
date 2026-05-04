from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, Field


UserRole = Literal["student", "admin", "staff"]


class UserCreateRequest(BaseModel):
    email: EmailStr = Field(..., description="Unique email address for the learner")

    model_config = {"json_schema_extra": {"example": {"email": "learner@example.com"}}}


class UserResponse(BaseModel):
    id: str
    email: str
    role: UserRole = "student"
    created_at: datetime

    model_config = {"from_attributes": True}


class ErrorResponse(BaseModel):
    detail: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: UserRole = "student"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class AuthSessionResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    role: UserRole
