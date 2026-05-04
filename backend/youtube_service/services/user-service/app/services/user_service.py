from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import SignupRequest, UserCreateRequest


class UserService:

    def __init__(self, db: Session):
        self.repo = UserRepository(db)

    def register_user(self, payload: UserCreateRequest) -> User:
        return self.repo.create(payload)

    def signup_user(self, payload: SignupRequest) -> User:
        user_payload = UserCreateRequest(email=payload.email)
        return self.repo.create(
            user_payload,
            password_hash=hash_password(payload.password),
            role=payload.role,
        )

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        user = self.repo.get_by_email(email)
        if user is None or not user.password_hash:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        return self.repo.get_by_id(user_id)

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.repo.get_by_email(email)

    def list_users(self, offset: int = 0, limit: int = 20) -> Tuple[List[User], int]:
        users = self.repo.get_all(offset=offset, limit=limit)
        total = self.repo.count()
        return users, total
