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
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState({
     title: "Loading Course...",
     rating: 0,
     students: "0",
     duration: "-",
     desc: "",
     img: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&auto=format&fit=crop"
  });

  useEffect(() => {
    const courseId = id || 'playlist-fastapi-basics';
    fetch(`http://localhost:8006/courses/${courseId}?user_id=${USER_ID}`)
      .then(res => res.json())
      .then(data => {
        if(data && data.title) {
           setCourse({
             title: data.title,
             rating: data.rating || 4.8, 
             students: "1.2k",
             duration: data.duration || (data.total_lessons ? `${data.total_lessons * 1.5} hours` : "12 hours"),
             desc: data.description || course.desc,
             img: data.thumbnail || (data.lessons && data.lessons[0]?.thumbnail) || course.img
           });
           if (data.lessons) {
             setLessons(data.lessons.map((l, i) => ({
                id: l.youtube_video_id || i,
                title: l.title || `Lesson ${i+1}`,
                duration: l.duration ? `${Math.floor(l.duration / 60)}:${(l.duration % 60).toString().padStart(2, '0')}` : "15:00",
                status: l.completed ? 'complete' : 'playing'
             })));
           }
        }
      })
      .catch(err => console.log('Backend not available, using mock details.', err))
      .finally(() => setLoading(false));

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

  if (loading) {
    return (
      <div className="course-details">
        <header className="page-header">
          <div className="back-btn skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }}></div>
          <div className="skeleton" style={{ width: '150px', height: '24px' }}></div>
        </header>

        <div className="hero-img skeleton" style={{ height: '200px' }}></div>

        <div className="course-header">
          <div className="skeleton" style={{ width: '80px', height: '16px', marginBottom: '12px' }}></div>
          <div className="skeleton" style={{ width: '250px', height: '24px', marginBottom: '16px' }}></div>
          <div className="course-meta-large">
             <div className="skeleton" style={{ width: '60px', height: '16px' }}></div>
             <div className="skeleton" style={{ width: '80px', height: '16px' }}></div>
             <div className="skeleton" style={{ width: '70px', height: '16px' }}></div>
          </div>
          <div className="skeleton" style={{ width: '100%', height: '48px', marginTop: '16px' }}></div>
        </div>

        <div className="tabs">
            {[1, 2, 3].map(i => (
              <div key={i} className="tab skeleton" style={{ width: '80px', height: '32px' }}></div>
            ))}
        </div>

        <div className="tab-content" style={{ padding: '24px' }}>
          <div className="skeleton" style={{ width: '150px', height: '20px', marginBottom: '16px' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '8px' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '8px' }}></div>
          <div className="skeleton" style={{ width: '80%', height: '14px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="course-details">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1>Course Details</h1>
      </header>

      <div className="hero-img">
        <img src={course.img} alt={course.title} />
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
          <button className="btn-primary" onClick={() => navigate(`/video/${id || 'playlist-fastapi-basics'}`)} style={{background: 'var(--accent-honey)', color: 'var(--text-dark)'}}>
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
            <p style={{whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '14px', color: 'var(--text-silver)', marginBottom: '24px'}}>{course.desc || "Learn everything you need to know in this comprehensive and straightforward video course."}</p>
            
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
               <div className="course-lessons-list">
                 {lessons.length > 0 ? (
                   <div style={{display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     {lessons.map((lesson, idx) => (
                       <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light-2)', cursor: 'pointer' }} onClick={() => navigate(`/video/${id}`)}>
                         <div style={{ background: 'var(--bg-light)', color: 'var(--primary-dark)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold', fontSize: '14px', marginRight: '16px' }}>
                           {idx + 1}
                         </div>
                         <div style={{ flex: 1 }}>
                           <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{lesson.title}</h4>
                           <span style={{ color: 'var(--text-silver)', fontSize: '12px' }}>{lesson.duration}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <p style={{ color: 'var(--text-silver)' }}>Fetching playlist content...</p>
                 )}
               </div>
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
