import { useState, useEffect } from 'react';
import { Search, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All Courses');
  const tabs = ['All Courses', 'Design', 'Development', 'Business'];

  const [popularCourses, setPopularCourses] = useState([
    {
      id: "course-1",
      title: "UI/UX Design Fundamentals",
      category: "Design",
      rating: 4.8,
      students: "12.5k",
      img: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=600&auto=format&fit=crop"
    },
    {
      id: "course-2",
      title: "React Complete Course 2024",
      category: "Development",
      rating: 4.9,
      students: "18.2k",
      img: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop"
    },
    {
      id: "course-3",
      title: "Data Science with Python",
      category: "Development",
      rating: 4.7,
      students: "9.8k",
      img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop"
    }
  ]);

  useEffect(() => {
    // Attempt to fetch from local backend (Path Service searching / list)
    fetch('http://localhost:8006/paths/search?q=')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          // Map backend standard models to our frontend UI expectations if needed
          const formatted = data.map(path => ({
            id: path.path_id || path.playlist_id,
            title: path.title,
            category: "Development", // Mock category
            rating: path.rating || 4.5,
            students: "1.2k",
            img: path.thumbnail_url || "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=600&auto=format&fit=crop"
          }));
          setPopularCourses(formatted);
        }
      })
      .catch(err => console.log('Backend not available or offline, using mock layout.', err));
  }, []);

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Welcome Back</h1>
        <div className="search-bar">
          <Search size={20} color="var(--text-silver)" />
          <input type="text" placeholder="Search learning paths" />
        </div>
      </header>

      <section className="continue-learning">
        <h2>Continue Learning</h2>
        <div className="continue-cards">
          <div className="continue-card" onClick={() => navigate('/path/frontend-dev')}>
            <h3>Frontend Development</h3>
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '70%' }}></div>
              </div>
              <span className="progress-text">70% complete</span>
            </div>
            <button className="btn-primary small-btn">Resume</button>
          </div>
          <div className="continue-card">
            <h3>Python Developer</h3>
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '45%' }}></div>
              </div>
              <span className="progress-text">45% complete</span>
            </div>
            <button className="btn-primary small-btn">Resume</button>
          </div>
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
