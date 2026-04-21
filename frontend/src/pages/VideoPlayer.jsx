import { ArrowLeft, Bookmark, FileText, RotateCcw, CheckCircle2, PlayCircle, Lock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './VideoPlayer.css';

export default function VideoPlayer() {
  const navigate = useNavigate();
  const { courseId } = useParams();

  const [syllabus, setSyllabus] = useState([]);
  const [courseProgress, setCourseProgress] = useState(0);
  const [currentLesson, setCurrentLesson] = useState('Lesson Loading...');
   const [currentVideoId, setCurrentVideoId] = useState(null);
   const [playerReady, setPlayerReady] = useState(false);
   const [videoStats, setVideoStats] = useState({ current: 0, total: 1 });
   const [lessonUnlocked, setLessonUnlocked] = useState(false);
   const [isBookmarked, setIsBookmarked] = useState(false);
   const [showNotesModal, setShowNotesModal] = useState(false);
   const [noteText, setNoteText] = useState('');
   const [videoNotes, setVideoNotes] = useState([]);
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
               setIsBookmarked(data.lessons[0].is_bookmarked || false);
             } else if (data.current_lesson) {
                 const currentFromLessons = data.lessons.find(l => l.youtube_video_id === data.current_lesson.youtube_video_id);
                 setIsBookmarked(currentFromLessons?.is_bookmarked || false);
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

  const fetchNotes = async () => {
    if (!currentVideoId) return;
    try {
      const res = await fetch(`http://localhost:8003/video/notes/${currentVideoId}?user_id=${USER_ID}`);
      const data = await res.json();
      setVideoNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [currentVideoId]);

  const toggleBookmark = async () => {
    try {
       const res = await fetch(`http://localhost:8003/video/bookmark`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: USER_ID, video_id: currentVideoId })
       });
       const data = await res.json();
       if (data.bookmarked !== undefined) {
           setIsBookmarked(data.bookmarked);
       }
    } catch (err) {
       console.error("Bookmark toggle failed", err);
    }
  };

  const saveNote = async () => {
      if (!noteText.trim()) return;
      const playerEl = window.ytPlayerRef;
      const ts = playerEl && typeof playerEl.getCurrentTime === 'function' ? Math.floor(playerEl.getCurrentTime()) : 0;
      try {
          await fetch(`http://localhost:8003/video/notes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: USER_ID, video_id: currentVideoId, content: noteText, video_timestamp: ts })
          });
          setNoteText('');
          setShowNotesModal(false);
          fetchNotes();
      } catch (err) {
          console.error("Save note failed", err);
      }
  };

  const handleResume = async () => {
      try {
          const res = await fetch(`http://localhost:8003/video/resume/${currentVideoId}?user_id=${USER_ID}`);
          const data = await res.json();
          const player = window.ytPlayerRef;
          if (data.resume_at_seconds > 0 && player && typeof player.seekTo === 'function') {
              player.seekTo(data.resume_at_seconds, true);
          }
      } catch (err) {
          console.error("Resume failed", err);
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
                  const newlyClicked = syllabus.find(s => s.id === clickedId);
                  setIsBookmarked(newlyClicked?.is_bookmarked || false);
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
          <button className="btn-icon" onClick={() => setShowNotesModal(true)}>
            <FileText size={20} />
            Add Notes
          </button>
          <button className="btn-icon" onClick={toggleBookmark}>
            <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          <button className="btn-icon" onClick={handleResume}>
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
                      setIsBookmarked(nextLesson.is_bookmarked || false);
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

      {/* Notes Modal */}
      {showNotesModal && (
         <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '400px' }}>
               <h3 style={{marginTop: 0}}>Add Note</h3>
               <textarea 
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Type your notes here..."
                  style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '16px', fontFamily: 'var(--font-body)' }}
               />
               <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowNotesModal(false)} style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={saveNote} style={{ padding: '8px 16px', background: 'var(--primary-dark)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Save Note</button>
               </div>

               {videoNotes.length > 0 && (
                  <div style={{marginTop: '24px', maxHeight: '150px', overflowY: 'auto'}}>
                     <h4 style={{fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '8px'}}>Previous Notes</h4>
                     {videoNotes.map(n => (
                        <div key={n.id} style={{padding: '8px 0', borderBottom: '1px solid #eee'}}>
                           <span style={{fontSize: '12px', color: 'var(--primary-dark)', fontWeight: 'bold'}}>{Math.floor(n.video_timestamp / 60)}:{String(n.video_timestamp % 60).padStart(2, '0')}</span>
                           <p style={{margin: '4px 0 0 0', fontSize: '13px'}}>{n.content}</p>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>
      )}
    </div>
  );
}
