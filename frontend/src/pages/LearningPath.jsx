import { ArrowLeft, CheckCircle2, PlayCircle, Circle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './LearningPath.css';

export default function LearningPath() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [modules, setModules] = useState([
    { title: "Introduction to HTML5 & Semantic Tags", duration: "3h 15m", status: "complete", id: 1 },
    { title: "CSS3 Masterclass: Flexbox and Grid", duration: "5h 45m", status: "complete", id: 2 },
    { title: "JavaScript Essentials", duration: "8h 20m", status: "playing", id: 3 },
    { title: "React Basics: Components and Props", duration: "10h 30m", status: "locked", id: 4 },
  ]);
  const [pathName, setPathName] = useState("Frontend Development");

  useEffect(() => {
    // Attempt to fetch specific path details from localhost:8006
    fetch(`http://localhost:8006/paths/${id || 'frontend-dev'}`)
      .then(res => res.json())
      .then(data => {
        if(data && data.title) {
           setPathName(data.title);
        }
        if(data && data.items) {
           // Parse path items into our curriculum structure
           setModules(data.items.map((item, index) => ({
              title: item.title,
              duration: "2h 30m", // Add fallback duration
              status: item.is_completed ? "complete" : (index === 0 ? "playing" : "locked"),
              id: item.id || item.playlist_id
           })));
        }
      })
      .catch(err => console.log('Backend not available, using mock layout.', err));
  }, [id]);

  return (
    <div className="learning-path">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1>{pathName}</h1>
      </header>

      <div className="path-intro">
        <p>You're making great progress! Keep going to complete this learning path.</p>
      </div>

      <div className="curriculum">
        <h2>Curriculum <span className="module-count">({modules.length} Modules)</span></h2>
        
        <div className="module-list">
          {modules.map(mod => (
            <div key={mod.id} className={`module-card ${mod.status}`} onClick={() => mod.status === 'playing' ? navigate('/video') : null}>
              <div className="module-img">
                <img src={`https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=200&auto=format&fit=crop`} alt="module" />
                {mod.status === 'complete' && <div className="status-icon success"><CheckCircle2 fill="white" size={24} /></div>}
                {mod.status === 'playing' && <div className="status-icon active"><PlayCircle fill="white" size={24} /></div>}
              </div>
              <div className="module-info">
                <h3>{mod.title}</h3>
                {mod.status === 'playing' && <span className="playing-badge">Now Playing</span>}
                <div className="module-meta">
                  <span className="duration">{mod.duration}</span>
                  {mod.status === 'complete' && <span className="complete-text">100% Complete</span>}
                  {mod.status === 'playing' && <span className="active-text">40% Complete</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bottom-action">
        <button className="btn-primary" onClick={() => navigate('/video')}>
          <PlayCircle size={20} style={{ marginRight: 8 }} /> Resume Learning
        </button>
      </div>
    </div>
  );
}
