from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship, backref
from datetime import datetime
from app.core.database import Base

class VideoQuestion(Base):
    __tablename__ = "video_questions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(50), nullable=False, index=True)
    course_id = Column(String(100), nullable=False, index=True)
    user_name = Column(String(100), nullable=True)
    content = Column(Text, nullable=False)
    status = Column(String(20), default="Pending") # "Pending", "Answered"
    upvotes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to answers
    answers = relationship("VideoAnswer", back_populates="question", cascade="all, delete-orphan")


class VideoAnswer(Base):
    __tablename__ = "video_answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("video_questions.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(Integer, ForeignKey("video_answers.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(String(50), nullable=False)
    user_name = Column(String(100), nullable=True)
    content = Column(Text, nullable=False)
    is_instructor = Column(Boolean, default=False)
    upvotes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    question = relationship("VideoQuestion", back_populates="answers")
    replies = relationship("VideoAnswer", cascade="all, delete-orphan", backref=backref("parent", remote_side=[id]))


class VideoQAUpvote(Base):
    __tablename__ = "video_qa_upvotes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(50), nullable=False, index=True)
    item_id = Column(Integer, nullable=False)
    item_type = Column(String(10), nullable=False) # "question" or "answer"
    created_at = Column(DateTime, default=datetime.utcnow)
