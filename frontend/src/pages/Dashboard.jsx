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

  useEffect(() => {
    // Fetch all courses for the list
    fetch('http://localhost:8002/playlist/all')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const formatted = data.map(course => ({
            id: course.id || course.playlist_id,
            title: course.title,
            category: "Development",
            rating: 4.8,
            students: "12.5k",
            img: course.thumbnail_url || "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=600&auto=format&fit=crop"
          }));
          setPopularCourses(formatted);
        }
      })
      .catch(err => {
         console.log('Backend offline or empty', err);
         setPopularCourses([{
            id: 'mock-1', title: 'React Complete Course 2024', category: 'Development', rating: 4.9, students: '18.2k', img: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop"
         }]);
      });

    // Fetch continue paths
    fetch('http://localhost:8006/paths/search?q=')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
           setContinuePaths(data.slice(0, 2).map(p => ({
              id: p.path_id, title: p.title
           })));
        } else {
           setContinuePaths([{ id: 'mock-path', title: 'Frontend Development' }]);
        }
      }).catch(() => setContinuePaths([{ id: 'mock-path', title: 'Frontend Development' }]));
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
        {continuePaths.length === 0 && <p style={{ color: 'var(--text-silver)', fontSize: 14 }}>No paths found in your backend. Import a playlist to get started.</p>}
        <div className="continue-cards">
          {continuePaths.map(path => (
            <div key={path.id} className="continue-card" onClick={() => navigate(`/path/${path.id}`)}>
              <h3>{path.title}</h3>
              <div className="progress-container">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '0%' }}></div>
                </div>
                <span className="progress-text">0% complete</span>
              </div>
              <button className="btn-primary small-btn">Resume</button>
            </div>
          ))}
        </div>
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
