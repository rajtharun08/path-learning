import { ArrowLeft, Star, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './CourseDetails.css';

export default function CourseDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Overview');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const USER_ID = '5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859';
  const [course, setCourse] = useState({
     title: "React Complete Course 2024",
     rating: 4.9,
     students: "18.2k",
     duration: "12 hours",
     desc: "Master React from basics to advanced concepts. Build real-world applications with hooks, context, and modern patterns."
  });

  useEffect(() => {
    const courseId = id || 'playlist-fastapi-basics';
    fetch(`http://localhost:8006/courses/${courseId}?user_id=${USER_ID}`)
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

      const enrolledCourses = JSON.parse(localStorage.getItem('enrolled_courses') || '[]');
      if(enrolledCourses.includes(courseId)) {
        setIsEnrolled(true);
      }
  }, [id]);

  const handleCourseEnroll = () => {
    const courseId = id || 'playlist-fastapi-basics';
    const enrolledCourses = JSON.parse(localStorage.getItem('enrolled_courses') || '[]');
    if(!enrolledCourses.includes(courseId)) {
      enrolledCourses.push(courseId);
      localStorage.setItem('enrolled_courses', JSON.stringify(enrolledCourses));
    }
    setIsEnrolled(true);
  };

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
        {isEnrolled ? (
          <button className="btn-primary" onClick={() => navigate('/video')} style={{background: 'var(--accent-honey)', color: 'var(--text-dark)'}}>
            Resume Course
          </button>
        ) : (
          <button className="btn-primary" onClick={handleCourseEnroll}>
            Enroll in Course
          </button>
        )}
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
             {!isEnrolled ? (
               <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-light)', borderRadius: '12px' }}>
                 <p style={{fontWeight: 'bold', color: 'var(--text-silver)', marginBottom: '8px'}}>Content Locked</p>
                 <p style={{fontSize: '13px', color: 'var(--text-silver)', marginBottom: '16px'}}>Please enroll in the course to view the full curriculum map.</p>
                 <button className="btn-primary small-btn" onClick={handleCourseEnroll}>Enroll</button>
               </div>
             ) : (
               <p>Lessons and Video player link goes here.</p>
             )}
           </div>
        )}

        {activeTab === 'Reviews' && (
           <div className="overview">
             <p>4.8 out of 5 stars based on 1,200 reviews</p>
           </div>
        )}
      </div>
    </div>
  );
}
