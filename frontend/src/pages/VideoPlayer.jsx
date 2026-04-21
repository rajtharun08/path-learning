import { ArrowLeft, Bookmark, FileText, RotateCcw, CheckCircle2, PlayCircle, Lock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './VideoPlayer.css';

export default function VideoPlayer() {
  const { courseId } = useParams();

  const [syllabus, setSyllabus] = useState([]);
  const [courseProgress, setCourseProgress] = useState(0);
  const [currentLesson, setCurrentLesson] = useState('Lesson Loading...');
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const USER_ID = '5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859';
  
  // Custom YouTube Player reference
  const playerRef = window.ytPlayerRef || {};
  
  useEffect(() => {
    const targetCourse = courseId || 'playlist-fastapi-basics';
    fetch(`http://localhost:8006/courses/${targetCourse}?user_id=${USER_ID}`)
      .then(res => res.json())
      .then(data => {
        if(data) {
          if (data.current_lesson) {
             setCurrentLesson(data.current_lesson.title || `Lesson ${data.current_lesson.position}`);
             setCurrentVideoId(data.current_lesson.youtube_video_id);
          }
          setCourseProgress(data.progress_percent || 0);

          if (data.lessons && data.lessons.length > 0) {
            setSyllabus(data.lessons.map((l, i) => ({
              id: l.youtube_video_id || `temp-${i}`,
              title: l.title || `Lesson ${i+1}`,
              duration: l.duration ? `${Math.floor(l.duration / 60)}:${(l.duration % 60).toString().padStart(2, '0')}` : "15:00",
              status: l.completed ? 'complete' : (data.current_lesson && l.youtube_video_id === data.current_lesson.youtube_video_id ? 'playing' : 'locked'),
              nextId: data.lessons[i + 1]?.youtube_video_id || null
            })));
             if(!data.current_lesson && data.lessons[0]) {
               setCurrentVideoId(data.lessons[0].youtube_video_id);
               setCurrentLesson(data.lessons[0].title);
             }
          }
        }
      })
      .catch(err => console.log('Backend down or failed', err));
  }, [courseId]);

  // YouTube Script Injector
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => {
         setPlayerReady(true);
      };
    } else {
      setPlayerReady(true);
    }
  }, []);

  const sendProgressAnalytics = async (eventType, seconds, completed) => {
    try {
      await fetch(`http://localhost:8000/video/progress`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            user_id: USER_ID,
            video_id: currentVideoId,
            watched_seconds: Math.floor(seconds),
            event_type: eventType,
            completed: completed || false
         })
      });
    } catch(err) {
      console.log('Progress tracking error:', err);
    }
  };

  useEffect(() => {
    if (playerReady && currentVideoId && window.YT) {
      const playerEl = document.getElementById('youtube-player');
      if (playerEl) {
         playerEl.innerHTML = ''; 
      }
      
      const newPlayer = new window.YT.Player('youtube-player', {
        videoId: currentVideoId,
        height: '100%',
        width: '100%',
        playerVars: { autoplay: 1, rel: 0, controls: 1 },
        events: {
          onReady: (e) => {
             // You can seek to previously watched seconds if available via backend Resume API here
             setInterval(() => {
                const state = e.target.getPlayerState();
                if(state === window.YT.PlayerState.PLAYING) {
                   const currTime = e.target.getCurrentTime();
                   sendProgressAnalytics('progress', currTime, false);
                }
             }, 10000); // 10s ping 
          },
          onStateChange: (e) => {
             const currTime = e.target.getCurrentTime();
             if (e.data === window.YT.PlayerState.PLAYING) {
                sendProgressAnalytics('play', currTime, false);
             } else if (e.data === window.YT.PlayerState.PAUSED) {
                sendProgressAnalytics('pause', currTime, false);
             } else if (e.data === window.YT.PlayerState.ENDED) {
                sendProgressAnalytics('complete', currTime, true).then(() => {
                   // Unlock next lesson logic
                   const currentSyllabusItem = syllabus.find(s => s.id === currentVideoId);
                   if(currentSyllabusItem && currentSyllabusItem.nextId) {
                       setCurrentVideoId(currentSyllabusItem.nextId);
                       // Quick refresh course state
                       window.location.reload(); 
                   }
                });
             }
          }
        }
      });
      window.ytPlayerRef = newPlayer;
    }
  }, [playerReady, currentVideoId]);

  return (
    <div className="video-player-page">
      <div className="player-container">
        <button className="back-btn video-back" onClick={() => navigate(-1)} style={{zIndex: 9999, position: 'absolute', top: '16px', left: '16px', background: 'rgba(0,0,0,0.5)', padding: '8px', borderRadius: '50%'}}>
           <ArrowLeft size={24} color="white" />
        </button>
        <div id="youtube-player" style={{width: '100%', height: '100%', background: '#000'}}></div>
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
        <button className="btn-primary" onClick={() => {
            const currentItem = syllabus.find(s => s.id === currentVideoId);
            if(currentItem && currentItem.nextId) {
                setCurrentVideoId(currentItem.nextId);
                window.location.reload();
            }
        }}>
          Next Lesson &gt;
        </button>
      </div>
    </div>
  );
}
