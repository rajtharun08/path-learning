import { useState, useEffect } from 'react';
import { Search as SearchIcon, Star, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './PathsDirectory.css';

export default function PathsDirectory() {
  const navigate = useNavigate();
  const [paths, setPaths] = useState([]);
  const [continuePaths, setContinuePaths] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const url = searchQuery.trim() === '' 
        ? 'http://localhost:8006/paths/top' 
        : `http://localhost:8006/paths/search?q=${encodeURIComponent(searchQuery)}`;

      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            const formatted = data.map(path => ({
              id: path.path_id,
              title: path.title,
              desc: path.description || "Master modern web development with React, TypeScript, and responsive design patterns.",
              rating: path.rating || 4.5,
              duration: "45hr 30min",
              enrollments: path.total_views || "1,234"
            }));
            setPaths(formatted);
            // Only update continue learning on initial load (empty search)
            if (searchQuery.trim() === '') {
              setContinuePaths(formatted.slice(0, 2));
            }
          } else {
            setPaths([]);
          }
        })
        .catch(err => {
          console.error('Error fetching paths:', err);
          // Fallback UI data if backend is offline
          const mock = [
            { id: '11111111-1111-4111-a111-111111111111', title: 'Frontend Development', desc: 'Complete roadmap to becoming a frontend master.', rating: 4.8, duration: '45h', enrollments: '2.5k' },
            { id: '22222222-2222-4222-a222-222222222222', title: 'Python Developer', desc: 'Zero to hero Python syllabus.', rating: 4.7, duration: '38h', enrollments: '1.8k' }
          ];
          setPaths(mock);
          if (searchQuery.trim() === '') setContinuePaths(mock.slice(0, 2));
        });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <div className="paths-directory">
      <header className="dir-header">
        <p className="subtitle">Track your learning progress and continue where you left off. Stay on track with your learning goals.</p>
      </header>

      <div className="dir-section-title">
        <span className="blue-bar-text">All paths</span>
        <h2>All paths</h2>
        <p className="desc">Browse and find all public Hexaware paths here.</p>
        
        <div className="search-bar-with-btn">
          <input 
            type="text" 
            placeholder="Search learning paths" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="search-submit">
            <SearchIcon size={20} color="white" />
          </button>
        </div>
      </div>

      <section className="continue-learning">
        <h2>Continue Learning</h2>
        <div className="continue-cards">
          {continuePaths.map(path => (
            <div key={`continue-${path.id}`} className="continue-card" onClick={() => navigate(`/path/${path.id}`)}>
              <h3>{path.title}</h3>
              <div className="progress-container">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '70%' }}></div>
                </div>
                <span className="progress-text">70% complete</span>
              </div>
              <button className="btn-primary small-btn">Resume</button>
            </div>
          ))}
        </div>
      </section>

      <div className="paths-list">
        {paths.map(path => (
          <div key={`path-${path.id}`} className="course-card-textual" onClick={() => navigate(`/path/${path.id}`)}>
            <div className="text-header">
              <h3>{path.title}</h3>
              <span className="rating"><Star size={14} fill="var(--accent-honey)" color="var(--accent-honey)" /> {path.rating}</span>
            </div>
            <p className="course-desc">{path.desc}</p>
            <div className="course-meta-bottom">
              <span>Total Time: {path.duration}</span>
              <span>Enrollments: {path.enrollments}</span>
            </div>
            <button className="btn-primary full-btn" onClick={(e) => { e.stopPropagation(); navigate(`/path/${path.id}`); }}>View Path</button>
          </div>
        ))}
      </div>
    </div>
  );
}
