import { useState, useEffect } from 'react';
import { Search as SearchIcon, Star, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Search.css';

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetch(`http://localhost:8000/playlist/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          const items = data.items || [];
          if (Array.isArray(items)) {
            const formatted = items.map(course => ({
              id: course.id || course.playlist_id,
              title: course.title,
              category: "Course",
              rating: course.rating || 4.8,
              students: "12.5k",
              img: course.thumbnail_url || "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=600&auto=format&fit=crop"
            }));
            setResults(formatted);
          } else {
            setResults([]);
          }
          setLoading(false);
        })
        .catch(err => {
          console.log('Error searching backend', err);
          setLoading(false);
        });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="search-page">
      <header className="page-header search-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="search-bar search-bar-active">
          <SearchIcon size={20} color="var(--text-silver)" />
          <input 
            type="text" 
            placeholder="Search all content..." 
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="search-results">
        {loading && <p className="loading-text">Searching...</p>}
        {!loading && query && results.length === 0 && (
          <p className="no-results">No paths found matching your query.</p>
        )}
        
        <div className="course-list">
          {!loading && results.map(course => (
            <div key={course.id} className="course-card" onClick={() => navigate(`/course/${course.id}`)}>
              <img src={course.img} alt={course.title} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
              <div className="course-info" style={{ padding: '16px' }}>
                <span className="course-cat" style={{ fontSize: '12px', color: 'var(--primary-dark)', fontWeight: 'bold' }}>{course.category}</span>
                <h3 style={{ margin: '4px 0', fontSize: '16px' }}>{course.title}</h3>
                <div className="course-meta" style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-silver)', marginTop: '8px' }}>
                  <span className="rating"><Star size={14} fill="var(--accent-honey)" color="var(--accent-honey)" /> {course.rating}</span>
                  <span className="students">{course.students} students</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
