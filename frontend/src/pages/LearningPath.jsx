import { ArrowLeft, CheckCircle2, PlayCircle, Circle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './LearningPath.css';

export default function LearningPath() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [modules, setModules] = useState([]);
  const [pathName, setPathName] = useState("Frontend Development");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const USER_ID = '5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859'; // Simulated LoggedIn User

  useEffect(() => {
    const fetchPathData = async () => {
      try {
        const pathId = id || 'frontend-dev';
        
        // 1. Fetch Path Details
        const res = await fetch(`http://localhost:8006/paths/${pathId}?user_id=${USER_ID}`);
        if(res.ok) {
           const data = await res.json();
           setPathName(data.title || "Frontend Development");
           if(data.items) {
             setModules(data.items.map((item, index) => ({
                title: item.title,
                duration: item.duration || "2h 30m",
                status: item.is_completed ? "complete" : (index === 0 ? "playing" : "locked"),
                id: item.id || item.playlist_id
             })));
           }
        }

        // 2. Check Enrollment from History
        const historyRes = await fetch(`http://localhost:8006/paths/${pathId}/history?user_id=${USER_ID}`);
        if(historyRes.ok) {
           const historyData = await historyRes.json();
           const enrolledInHistory = historyData.some(ev => ev.event_type === 'enrolled');
           const storedPaths = JSON.parse(localStorage.getItem('enrolled_paths') || '[]');
           const isLocallyEnrolled = storedPaths.includes(pathId);
           const enrolled = enrolledInHistory || isLocallyEnrolled;

           setIsEnrolled(enrolled);
           
           if(enrolled) {
             // 3. Fetch Progress if Enrolled
             const progRes = await fetch(`http://localhost:8006/paths/${pathId}/progress?user_id=${USER_ID}`);
             if(progRes.ok) {
                const progData = await progRes.json();
                setProgressData(progData);
             }
           }
        }
      } catch (err) {
        console.log('Backend not available, using mock layout.', err);
      }
    };
    
    fetchPathData();
  }, [id]);

  const handleEnroll = async () => {
    try {
      const pathId = id || 'frontend-dev';
      const res = await fetch(`http://localhost:8006/paths/${pathId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID })
      });
      if(res.ok || res.status === 409) {
        setIsEnrolled(true);
        // Sync to local storage for Dashboard Continue Learning section
        const storedPaths = JSON.parse(localStorage.getItem('enrolled_paths') || '[]');
        if(!storedPaths.includes(pathId)) {
           storedPaths.push(pathId);
           localStorage.setItem('enrolled_paths', JSON.stringify(storedPaths));
        }
        window.location.reload();
      }
    } catch(err) {
       console.error("Failed to enroll", err);
    }
  };

  return (
    <div className="learning-path">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1>{pathName}</h1>
      </header>

      <div className="path-header-meta">
        <h2>{pathName}</h2>
        <span className="total-duration">Total Duration: 45h 30m</span>
      </div>

      {isEnrolled ? (
        <div className="progress-glass-card">
          <h3>Your Progress</h3>
          <div className="flex-between">
             <span>Overall Completion</span>
             <span className="percent-active">{progressData ? progressData.progress_percentage : 0}%</span>
          </div>
          <div className="progress-bar-lg">
             <div className="progress-fill-lg" style={{ width: `${progressData ? progressData.progress_percentage : 0}%` }}></div>
          </div>
          <p className="encouragement">You're making great progress! Keep going to complete this learning path.</p>
        </div>
      ) : (
        <div className="progress-glass-card" style={{ textAlign: 'center', padding: '24px' }}>
           <h3 style={{ margin: '0 0 8px 0'}}>Lock your future</h3>
           <p style={{ color: 'var(--text-silver)', fontSize: '13px', margin: '0 0 16px 0'}}>Enroll in this learning path to start tracking your curriculum progress and earn your certification.</p>
           <button className="btn-primary" onClick={handleEnroll} style={{width: '100%'}}>Enroll in Path</button>
        </div>
      )}

      <div className="curriculum">
        <h2>Curriculum <span className="module-count">({modules.length} Modules)</span></h2>
        
        <div className="module-list">
          {modules.map(mod => {
            return (
            <div key={mod.id} className={`module-card ${mod.status}`} onClick={() => navigate(`/course/${mod.id}`)}>
              <div className="module-img">
                <img src={`https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=200&auto=format&fit=crop`} alt="module" />
                {mod.status === 'complete' && <div className="status-icon success"><CheckCircle2 fill="white" size={24} /></div>}
                {mod.status === 'playing' && <div className="status-icon active"><PlayCircle fill="white" size={24} /></div>}
              </div>
              <div className="module-info">
                <h3>{mod.title}</h3>
                {mod.status === 'playing' && isEnrolled && <span className="playing-badge">Now Playing</span>}
                <div className="module-meta">
                  <span className="duration">{mod.duration}</span>
                  {mod.status === 'complete' && isEnrolled && <span className="complete-text">100% Complete</span>}
                  {mod.status === 'playing' && isEnrolled && <span className="active-text">Started</span>}
                </div>
              </div>
            </div>
          )})}
        </div>
      </div>

      {isEnrolled && (
        <div className="bottom-action">
          <button className="btn-primary" onClick={() => navigate('/video')}>
            <PlayCircle size={20} style={{ marginRight: 8 }} /> Resume Learning
          </button>
        </div>
      )}
    </div>
  );
}
