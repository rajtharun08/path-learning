import jwt
from fastapi import APIRouter, Depends, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_db
from app.core.pagination import PaginationParams
from app.controllers.user_controller import UserController
from app.schemas.user import (
    AuthSessionResponse,
    LoginRequest,
    SignupRequest,
    UserCreateRequest,
    UserResponse,
)

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/auth/signup", response_model=AuthSessionResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("50/minute")
def signup(
    request: Request,
    payload: SignupRequest,
    db: Session = Depends(get_db),
):
    user = UserController(db).signup_user(payload)
    token = jwt.encode(
        {
            "sub": user.id,
            "email": user.email,
            "role": user.role,
            "is_admin": user.role in {"admin", "staff"},
        },
        settings.auth_jwt_secret_key,
        algorithm=settings.auth_jwt_algorithm,
    )
    return AuthSessionResponse(access_token=token, user=user, role=user.role)


@router.post("/auth/login", response_model=AuthSessionResponse)
@limiter.limit("100/minute")
def login(
    request: Request,
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    user = UserController(db).login_user(payload)
    token = jwt.encode(
        {
            "sub": user.id,
            "email": user.email,
            "role": user.role,
            "is_admin": user.role in {"admin", "staff"},
        },
        settings.auth_jwt_secret_key,
        algorithm=settings.auth_jwt_algorithm,
    )
    return AuthSessionResponse(access_token=token, user=user, role=user.role)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("100/minute")
def create_user(
    request: Request,
    payload: UserCreateRequest,
    db: Session = Depends(get_db),
):
    return UserController(db).create_user(payload)


@router.get("", summary="List all users (paginated)")
@limiter.limit("100/minute")
def list_users(
    request: Request,
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
):
    return UserController(db).list_users(pagination)


@router.get("/{user_id}", response_model=UserResponse)
@limiter.limit("100/minute")
def get_user(
    request: Request,
    user_id: str,
    db: Session = Depends(get_db),
):
    return UserController(db).get_user(user_id)
