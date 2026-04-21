import { ArrowLeft, Bookmark, FileText, RotateCcw, CheckCircle2, PlayCircle, Lock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './VideoPlayer.css';

export default function VideoPlayer() {
  const navigate = useNavigate();
  const location = useLocation();

  const [syllabus, setSyllabus] = useState([
    { id: 1, title: 'Introduction to React', duration: '12:30', status: 'complete' },
    { id: 2, title: 'Components & Props', duration: '15:45', status: 'complete' },
    { id: 3, title: 'State and Lifecycle', duration: '21:00', status: 'playing' },
    { id: 4, title: 'Handling Events', duration: '14:20', status: 'locked' },
    { id: 5, title: 'Forms in React', duration: '18:10', status: 'locked' },
  ]);
  const [courseProgress, setCourseProgress] = useState(52);
  const [currentLesson, setCurrentLesson] = useState('State and Lifecycle');
  
  useEffect(() => {
    fetch(`http://localhost:8000/course/playlist-fastapi-basics/detail`)
      .then(res => res.json())
      .then(data => {
        if(data && data.current_lesson) {
          setCurrentLesson(data.current_lesson.title);
          setCourseProgress(data.completion_percentage || 52);
          if (data.lessons && data.lessons.length > 0) {
            setSyllabus(data.lessons.map((l, i) => ({
              id: l.lesson_id,
              title: l.title,
              duration: "15:00",
              status: l.is_completed ? 'complete' : (l.lesson_id === data.current_lesson.lesson_id ? 'playing' : 'locked')
            })));
          }
        }
      })
      .catch(err => console.log('Backend down, remaining on mock UI.', err));
  }, []);

  return (
    <div className="video-player-page">
      <div className="player-container">
        {/* Placeholder for video player to represent Figma embedded video */}
        <div className="video-placeholder">
           <button className="back-btn video-back" onClick={() => navigate(-1)}>
             <ArrowLeft size={24} color="white" />
           </button>
           <PlayCircle size={64} color="var(--accent-electric)" fill="white" className="play-icon" />
           <div className="video-controls">
             <span>12:40</span>
             <span>Video Player</span>
             <span>21:00</span>
           </div>
        </div>
      </div>

      <div className="lesson-details">
        <h1>{currentLesson}</h1>
        <span className="lesson-count">Lesson 3 of 5</span>

        <div className="course-progress">
          <div className="progress-header">
            <span>Course Progress</span>
            <span className="percent">{courseProgress}% completed</span>
          </div>
          <div className="progress-bar-lg">
            <div className="progress-fill-lg" style={{ width: `${courseProgress}%` }}></div>
          </div>
        </div>

        <h2>Course Syllabus</h2>
        <div className="syllabus-list">
          {syllabus.map(item => (
            <div key={item.id} className={`syllabus-item ${item.status}`}>
              <div className="icon-wrapper">
                {item.status === 'complete' && <CheckCircle2 size={24} color="#10B981" />}
                {item.status === 'playing' && <PlayCircle size={24} color="var(--primary-dark)" fill="white" />}
                {item.status === 'locked' && <Lock size={20} color="var(--text-silver)" />}
              </div>
              <div className="syllabus-info">
                <h4>{item.title}</h4>
                <div className="syllabus-meta">
                  <span className="duration">{item.duration}</span>
                  {item.status === 'playing' && <span className="playing-badge">Now Playing</span>}
                </div>
              </div>
              <div className="syllabus-trailing">
                {item.status === 'complete' && <span className="complete-text">100%</span>}
                {item.status === 'playing' && <span className="active-text">50%</span>}
                {item.status === 'locked' && <span className="locked-text">0%</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="action-buttons">
          <button className="btn-icon">
            <FileText size={20} />
            Add Notes
          </button>
          <button className="btn-icon">
            <Bookmark size={20} />
            Bookmark
          </button>
          <button className="btn-icon">
            <RotateCcw size={20} />
            Resume
          </button>
        </div>
      </div>

      <div className="bottom-action">
        <button className="btn-primary" onClick={() => {}}>
          Next Lesson &gt;
        </button>
      </div>
    </div>
  );
}
