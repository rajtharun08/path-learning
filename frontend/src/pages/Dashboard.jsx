import { useState, useEffect } from 'react';
import { Search, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All Courses');
  const tabs = ['All Courses', 'Design', 'Development', 'Business'];

  const [popularCourses, setPopularCourses] = useState([]);
  const [continuePaths, setContinuePaths] = useState([]);
  const USER_ID = '5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859';

  useEffect(() => {
    // Fetch all courses using the basic list endpoint to avoid search parameter validation
    fetch('http://localhost:8002/playlist/all')
      .then(res => res.json())
      .then(data => {
        console.log('Dashboard Playlists Data:', data);
        const items = data.items || [];
        if (Array.isArray(items) && items.length > 0) {
          const formatted = items.map(course => ({
            id: course.youtube_playlist_id || course.id || course.playlist_id,
            title: course.title,
            category: "Development",
            rating: 4.8,
            students: "1.2k",
            img: course.thumbnail_url || (course.videos && course.videos[0] && course.videos[0].thumbnail) || "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=600&auto=format&fit=crop"
          }));
          setPopularCourses(formatted);
        } else {
          setPopularCourses([{
            id: 'mock-1', title: 'React Complete Course 2024', category: 'Development', rating: 4.9, students: '18.2k', img: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop"
          }]);
        }
      })
      .catch(err => {
         console.error('Dashboard Fetch failed:', err);
         setPopularCourses([]);
      });

    // Fetch continue paths
    fetch(`http://localhost:8006/users/${USER_ID}/enrolled-paths?started_only=true`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setContinuePaths(data);
        }
      })
      .catch(err => {
         console.log('Error fetching dynamic enrolled paths:', err);
         setContinuePaths([]);
      });
  }, []);

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Welcome Back</h1>
        <div className="search-bar" onClick={() => navigate('/search')}>
          <Search size={20} color="var(--text-silver)" />
          <input type="text" placeholder="Search courses and paths..." readOnly />
        </div>
      </header>

      <section className="continue-learning">
        <h2>Continue Learning</h2>
        {continuePaths.length > 0 ? (
          <div className="continue-cards">
            {continuePaths.map(path => (
              <div key={path.path_id} className="continue-card" onClick={() => navigate(`/path/${path.path_id}`)}>
                <h3>{path.title}</h3>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${path.progress || 0}%` }}></div>
                  </div>
                  <span className="progress-text">{path.progress || 0}% complete</span>
                </div>
                <button className="btn-primary small-btn" onClick={(e) => { e.stopPropagation(); navigate(`/path/${path.path_id}`); }}>Resume</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '24px', background: 'white', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-light-2)'}}>
            <p style={{ color: 'var(--text-silver)', fontSize: '13px', margin: '0 0 16px 0'}}>You haven't enrolled in any paths yet. Explore the Paths directory to start your journey!</p>
            <button className="btn-primary small-btn" onClick={() => navigate('/paths')}>Explore Paths</button>
          </div>
        )}
      </section>

      <section className="popular-courses">
        <div className="tags">
          {tabs.map(tab => (
            <button 
              key={tab} 
              className={`tag ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="section-head">
          <h2>Popular Courses</h2>
          <a href="#">See All</a>
        </div>

        <div className="course-list">
          {popularCourses.map(course => (
            <div key={course.id} className="course-card" onClick={() => navigate(`/course/${course.id}`)}>
              <img src={course.img} alt={course.title} />
              <div className="course-info">
                <span className="course-cat">{course.category}</span>
                <h3>{course.title}</h3>
                <div className="course-meta">
                  <span className="rating"><Star size={14} fill="var(--accent-honey)" color="var(--accent-honey)" /> {course.rating}</span>
                  <span className="students">{course.students} students</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
