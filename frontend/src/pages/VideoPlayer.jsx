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
   const [videoStats, setVideoStats] = useState({ current: 0, total: 1 });
   const [lessonUnlocked, setLessonUnlocked] = useState(false);
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
            setSyllabus(data.lessons.map((l, i) => {
              const isPlaying = data.current_lesson && l.youtube_video_id === data.current_lesson.youtube_video_id;
              return {
                id: l.youtube_video_id || `temp-${i}`,
                title: l.title || `Lesson ${i+1}`,
                duration: l.duration ? `${Math.floor(l.duration / 60)}:${(l.duration % 60).toString().padStart(2, '0')}` : "15:00",
                status: l.completed ? 'complete' : (isPlaying ? 'playing' : 'available'),
                completed: l.completed || false,
                nextId: data.lessons[i + 1]?.youtube_video_id || null
              };
            }));
             if(!data.current_lesson && data.lessons[0]) {
               setCurrentVideoId(data.lessons[0].youtube_video_id);
               setCurrentLesson(data.lessons[0].title);
             }
          }
        }
      })
      .catch(err => console.log('Backend down or failed', err));
  }, [courseId]);
  
  useEffect(() => {
    if (syllabus.length > 0) {
      const completedCount = syllabus.filter(s => s.completed).length;
      const newProgress = Math.round((completedCount / syllabus.length) * 100);
      setCourseProgress(newProgress);
    }
  }, [syllabus]);

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
      await fetch(`http://localhost:8003/video/progress`, {
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
      
      let progressInterval;
      
      const newPlayer = new window.YT.Player('youtube-player', {
        videoId: currentVideoId,
        height: '100%',
        width: '100%',
        playerVars: { autoplay: 1, rel: 0, controls: 1 },
        events: {
          onReady: (e) => {
             if (e.target && typeof e.target.getDuration === 'function') {
                setVideoStats(prev => ({ ...prev, total: e.target.getDuration() || 1 }));
             }
             progressInterval = setInterval(() => {
                if(e.target && typeof e.target.getPlayerState === 'function') {
                   const state = e.target.getPlayerState();
                   const cur = e.target.getCurrentTime();
                   const tot = e.target.getDuration() || 1;
                   setVideoStats({ current: cur, total: tot });
                   
                   if (cur / tot >= 0.4) {
                      setLessonUnlocked(true);
                   }
                   
                   if(state === window.YT.PlayerState.PLAYING) {
                      sendProgressAnalytics('progress', cur, false);
                   }
                }
             }, 1000); // 1s sync for smooth percentages
          },
          onStateChange: (e) => {
             if (!e.target || typeof e.target.getCurrentTime !== 'function') return;
             
             const currTime = e.target.getCurrentTime();
             if (e.data === window.YT.PlayerState.PLAYING) {
                sendProgressAnalytics('play', currTime, false);
             } else if (e.data === window.YT.PlayerState.PAUSED) {
                sendProgressAnalytics('pause', currTime, false);
             } else if (e.data === window.YT.PlayerState.ENDED) {
                sendProgressAnalytics('complete', currTime, true).then(() => {
                   const currentIndex = syllabus.findIndex(s => s.id === currentVideoId);
                   if (currentIndex !== -1) {
                       setSyllabus(prev => prev.map((s, idx) => ({
                          ...s,
                          status: idx === currentIndex ? 'complete' : s.status,
                          completed: idx === currentIndex ? true : s.completed
                       })));

                       if (currentIndex < syllabus.length - 1) {
                           const nextLesson = syllabus[currentIndex + 1];
                           setCurrentVideoId(nextLesson.id);
                           setCurrentLesson(nextLesson.title);
                           setSyllabus(prev => prev.map((s, idx) => ({
                              ...s,
                              status: idx === currentIndex + 1 ? 'playing' : (idx === currentIndex ? 'complete' : s.status),
                              completed: idx === currentIndex ? true : s.completed
                           })));
                       }
                   }
                });
             }
          }
        }
      });
      window.ytPlayerRef = newPlayer;

      return () => {
         if (progressInterval) clearInterval(progressInterval);
         if (newPlayer && typeof newPlayer.destroy === 'function') {
            newPlayer.destroy();
         }
      };
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
        <span className="lesson-count">
          Lesson {syllabus.findIndex(s => s.id === currentVideoId) + 1} of {syllabus.length}
        </span>

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
            <div 
              key={item.id} 
              className={`syllabus-item ${item.status}`}
              onClick={() => {
                if (item.status !== 'locked') {
                  const clickedId = item.id;
                  const clickedTitle = item.title;
                  setCurrentVideoId(clickedId);
                  setCurrentLesson(clickedTitle);
                  setLessonUnlocked(false);
                  setVideoStats({ current: 0, total: 1 });
                  setSyllabus(prev => prev.map(s => ({
                    ...s,
                    status: s.id === clickedId ? 'playing' : (s.status === 'playing' ? (s.completed ? 'complete' : 'available') : s.status)
                  })));
                }
              }}
              style={{ cursor: item.status !== 'locked' ? 'pointer' : 'default' }}
            >
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
                {item.completed && <span className="complete-text">100%</span>}
                {item.status === 'playing' && !item.completed && (
                  <span className="active-text">
                    {Math.floor((videoStats.current / videoStats.total) * 100)}%
                  </span>
                )}
                {!item.completed && item.status !== 'playing' && <span className="locked-text">0%</span>}
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
        {(() => {
            const currentIndex = syllabus.findIndex(s => s.id === currentVideoId);
            const isLast = currentIndex === syllabus.length - 1;
            const progress = videoStats.current / (videoStats.total || 1);
            const currentItem = syllabus[currentIndex];
            const currentItem = syllabus[currentIndex];
            const canProceed = lessonUnlocked || (currentItem && currentItem.completed); 

            return (
              <button 
                className={`btn-primary ${!canProceed ? 'btn-disabled' : ''}`}
                disabled={!canProceed}
                onClick={() => {
                  if (isLast) {
                      alert('Take Assessment module coming soon!');
                  } else {
                      const nextLesson = syllabus[currentIndex + 1];
                      setCurrentVideoId(nextLesson.id);
                      setCurrentLesson(nextLesson.title);
                      setSyllabus(prev => prev.map((s, idx) => ({
                        ...s,
                        status: idx === currentIndex + 1 ? 'playing' : (idx === currentIndex ? 'complete' : s.status),
                        completed: idx === currentIndex ? true : s.completed
                      })));
                      setVideoStats({ current: 0, total: 1 });
                      setLessonUnlocked(false);
                  }
                }}
              >
                {isLast ? 'Take Assessment' : 'Next Lesson'}
                {!canProceed && <span style={{fontSize: '11px', display: 'block', opacity: 0.7}}>Watch 40% to unlock</span>}
              </button>
            );
        })()}
      </div>
    </div>
  );
}
