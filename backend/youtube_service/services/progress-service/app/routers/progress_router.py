from fastapi import APIRouter, Depends, Request, status, BackgroundTasks
import httpx
from typing import Optional
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.config import settings
from app.controllers.progress_controller import ProgressController
from app.schemas.progress import (
    CourseCompletionResponse, CourseProgressResponse,
    CourseDetailResponse, ProgressResponse, ProgressUpdateRequest, ResumeResponse,
    BookmarkToggleRequest, NoteCreateRequest, NoteResponse, AssessmentStatusResponse
)

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(tags=["Progress"])


async def send_analytics_event_background(payload: ProgressUpdateRequest, completed: bool):
    url = f"{getattr(settings, 'analytics_service_url', 'http://analytics-service:8004')}/video/event"
    event_type = payload.event_type or ("complete" if completed else "play")
    data = {
        "user_id": payload.user_id,
        "video_id": payload.video_id,
        "event_type": event_type,
        "position_seconds": payload.watched_seconds
    }
    
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            await client.post(url, json=data)
    except Exception:
        pass  # Silently fail background analytics so it doesn't interrupt progress saving

@router.post("/video/progress", response_model=ProgressResponse, status_code=status.HTTP_200_OK)
@limiter.limit("100/minute")
def update_progress(request: Request, payload: ProgressUpdateRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    result = ProgressController(db).update_progress(payload)
    background_tasks.add_task(send_analytics_event_background, payload, result.completed)
    return result


@router.get("/video/resume/{video_id}", response_model=ResumeResponse)
@limiter.limit("100/minute")
def resume_video(request: Request, video_id: str, user_id: str, db: Session = Depends(get_db)):
    return ProgressController(db).resume_video(video_id, user_id)


@router.post("/video/bookmark")
@limiter.limit("100/minute")
def toggle_bookmark(request: Request, payload: BookmarkToggleRequest, db: Session = Depends(get_db)):
    return ProgressController(db).toggle_bookmark(payload.user_id, payload.video_id)


@router.post("/video/notes", response_model=NoteResponse)
@limiter.limit("50/minute")
def create_note(request: Request, payload: NoteCreateRequest, db: Session = Depends(get_db)):
    return ProgressController(db).create_note(
        payload.user_id, payload.video_id, payload.content, payload.video_timestamp, payload.title
    )


@router.get("/video/notes/{video_id}", response_model=list[NoteResponse])
@limiter.limit("100/minute")
def get_video_notes(request: Request, video_id: str, user_id: str, db: Session = Depends(get_db)):
    return ProgressController(db).get_video_notes(user_id, video_id)


@router.get("/course/{playlist_id}/progress", response_model=CourseProgressResponse)
@limiter.limit("100/minute")
def course_progress(request: Request, playlist_id: str, user_id: str, db: Session = Depends(get_db)):
    return ProgressController(db).course_progress(playlist_id, user_id)


@router.get("/course/{playlist_id}/completion", response_model=CourseCompletionResponse)
@limiter.limit("100/minute")
def course_completion(request: Request, playlist_id: str, user_id: str, db: Session = Depends(get_db)):
    return ProgressController(db).course_completion(playlist_id, user_id)


@router.get("/course/{playlist_id}/detail", response_model=CourseDetailResponse)
@limiter.limit("100/minute")
def course_detail(request: Request, playlist_id: str, user_id: str, db: Session = Depends(get_db)):
    return ProgressController(db).course_detail(playlist_id, user_id)


@router.get("/course/{playlist_id}/assessment", response_model=AssessmentStatusResponse)
def get_assessment(playlist_id: str, user_id: str, db: Session = Depends(get_db)):
    return ProgressController(db).get_assessment(playlist_id, user_id)


@router.post("/course/{playlist_id}/assessment/complete", response_model=AssessmentStatusResponse)
def complete_assessment(playlist_id: str, user_id: str, score: float = 100.0, db: Session = Depends(get_db)):
    return ProgressController(db).complete_assessment(playlist_id, user_id, score)

from app.schemas.video_qa import QuestionCreate, QuestionResponse, AnswerCreate, AnswerResponse
from app.models.video_qa import VideoQuestion, VideoAnswer, VideoQAUpvote

@router.get("/course/{course_id}/questions", response_model=list[QuestionResponse])
def get_course_questions(course_id: str, user_id: Optional[str] = None, db: Session = Depends(get_db)):
    questions = db.query(VideoQuestion).filter(VideoQuestion.course_id == course_id).order_by(VideoQuestion.created_at.desc()).all()
    
    # Get all upvotes for this user in this course context if user_id is provided
    user_upvotes = set()
    if user_id:
        upvote_records = db.query(VideoQAUpvote).filter(VideoQAUpvote.user_id == user_id).all()
        user_upvotes = {(r.item_type, r.item_id) for r in upvote_records}

    def process_answer(ans):
        ans.has_upvoted = ("answer", ans.id) in user_upvotes
        if ans.replies:
            for reply in ans.replies:
                process_answer(reply)

    # Filter answers to only include top-level ones; replies will be nested inside them
    for q in questions:
        q.has_upvoted = ("question", q.id) in user_upvotes
        q.answers = [a for a in q.answers if a.parent_id is None]
        for a in q.answers:
            process_answer(a)
            
    return questions

@router.post("/course/{course_id}/questions", response_model=QuestionResponse)
def create_course_question(course_id: str, payload: QuestionCreate, db: Session = Depends(get_db)):
    question = VideoQuestion(
        course_id=course_id,
        user_id=payload.user_id,
        user_name=payload.user_name,
        content=payload.content
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question

@router.post("/video/questions/{question_id}/answers", response_model=AnswerResponse)
def answer_video_question(question_id: int, payload: AnswerCreate, db: Session = Depends(get_db)):
    answer = VideoAnswer(
        question_id=question_id,
        parent_id=payload.parent_id,
        user_id=payload.user_id,
        user_name=payload.user_name,
        content=payload.content,
        is_instructor=payload.is_instructor
    )
    db.add(answer)
    
    question = db.query(VideoQuestion).filter(VideoQuestion.id == question_id).first()
    if question:
        question.status = "Answered"
        
    db.commit()
    db.refresh(answer)
    return answer

@router.post("/video/questions/{question_id}/upvote")
def upvote_question(question_id: int, user_id: str, db: Session = Depends(get_db)):
    # Check if already upvoted
    existing = db.query(VideoQAUpvote).filter(
        VideoQAUpvote.user_id == user_id,
        VideoQAUpvote.item_id == question_id,
        VideoQAUpvote.item_type == "question"
    ).first()
    
    question = db.query(VideoQuestion).filter(VideoQuestion.id == question_id).first()
    if not question:
        return {"status": "not_found"}
        
    if existing:
        # Unlike
        db.delete(existing)
        question.upvotes = max(0, question.upvotes - 1)
        action = "unliked"
    else:
        # Like
        new_upvote = VideoQAUpvote(user_id=user_id, item_id=question_id, item_type="question")
        db.add(new_upvote)
        question.upvotes += 1
        action = "liked"
        
    db.commit()
    return {"status": "success", "action": action, "upvotes": question.upvotes}

@router.post("/video/answers/{answer_id}/upvote")
def upvote_answer(answer_id: int, user_id: str, db: Session = Depends(get_db)):
    # Check if already upvoted
    existing = db.query(VideoQAUpvote).filter(
        VideoQAUpvote.user_id == user_id,
        VideoQAUpvote.item_id == answer_id,
        VideoQAUpvote.item_type == "answer"
    ).first()
    
    answer = db.query(VideoAnswer).filter(VideoAnswer.id == answer_id).first()
    if not answer:
        return {"status": "not_found"}
        
    if existing:
        # Unlike
        db.delete(existing)
        answer.upvotes = max(0, answer.upvotes - 1)
        action = "unliked"
    else:
        # Like
        new_upvote = VideoQAUpvote(user_id=user_id, item_id=answer_id, item_type="answer")
        db.add(new_upvote)
        answer.upvotes += 1
        action = "liked"
        
    db.commit()
    return {"status": "success", "action": action, "upvotes": answer.upvotes}
