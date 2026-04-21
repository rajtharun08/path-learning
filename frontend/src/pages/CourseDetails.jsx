import { ArrowLeft, Star, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './CourseDetails.css';

export default function CourseDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Overview');
  const [course, setCourse] = useState({
     title: "React Complete Course 2024",
     rating: 4.9,
     students: "18.2k",
     duration: "12 hours",
     desc: "Master React from basics to advanced concepts. Build real-world applications with hooks, context, and modern patterns."
  });

  useEffect(() => {
    fetch(`http://localhost:8006/courses/${id || 'playlist-fastapi-basics'}`)
      .then(res => res.json())
      .then(data => {
        if(data && data.title) {
           setCourse({
             title: data.title,
             rating: 4.8, 
             students: "1.2k",
             duration: data.total_lessons ? `${data.total_lessons * 1.5} hours` : "12 hours",
             desc: data.description || course.desc
           });
        }
      })
      .catch(err => console.log('Backend not available, using mock details.', err));
  }, [id]);

  return (
    <div className="course-details">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1>Course Details</h1>
      </header>

      <div className="hero-img">
        <img src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop" alt="hero" />
      </div>

      <div className="course-header">
        <span className="tag">Development</span>
        <h2>{course.title}</h2>
        <div className="course-meta-large">
          <span className="rating"><Star size={16} fill="var(--accent-honey)" color="var(--accent-honey)" /> {course.rating}</span>
          <span className="students">{course.students} students</span>
          <span className="duration"><Clock size={16} /> {course.duration}</span>
        </div>
        <button className="btn-primary" onClick={() => navigate('/path/details')}>
          Start Learning
        </button>
      </div>

      <div className="tabs">
        {['Overview', 'Lessons', 'Reviews'].map(tab => (
          <button 
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'Overview' && (
          <div className="overview">
            <h3>About this course</h3>
            <p>{course.desc}</p>
            
            <h3>Instructor</h3>
            <div className="instructor">
              <img src="https://ui-avatars.com/api/?name=Mike+Chen&background=07125E&color=fff" alt="Mike Chen" />
              <div className="instructor-info">
                <h4>Mike Chen</h4>
                <p>React Developer</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'Lessons' && (
           <div className="overview">
             <p>Lessons go here (mirrors curriculum list)</p>
           </div>
        )}

        {activeTab === 'Reviews' && (
           <div className="overview">
             <p>Reviews go here</p>
           </div>
        )}
      </div>
    </div>
  );
}
