from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class AnswerCreate(BaseModel):
    user_id: str
    user_name: Optional[str] = None
    content: str
    is_instructor: bool = False
    parent_id: Optional[int] = None

class AnswerResponse(BaseModel):
    id: int
    question_id: int
    parent_id: Optional[int] = None
    user_id: str
    user_name: Optional[str] = None
    content: str
    is_instructor: bool
    upvotes: int
    has_upvoted: bool = False
    created_at: datetime
    replies: List["AnswerResponse"] = []

    class Config:
        from_attributes = True

class QuestionCreate(BaseModel):
    user_id: str
    user_name: Optional[str] = None
    content: str

class QuestionResponse(BaseModel):
    id: int
    user_id: str
    user_name: Optional[str] = None
    course_id: str
    content: str
    status: str
    upvotes: int
    has_upvoted: bool = False
    created_at: datetime
    answers: List[AnswerResponse] = []

    class Config:
        from_attributes = True

# For recursive models in Pydantic v2
AnswerResponse.model_rebuild()
