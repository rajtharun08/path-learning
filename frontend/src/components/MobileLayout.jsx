import { Outlet, NavLink } from 'react-router-dom';
import { Home, PlayCircle } from 'lucide-react';
import './MobileLayout.css';

export default function MobileLayout() {
  return (
    <div className="app-container">
      <header style={{ padding: '16px', backgroundColor: '#fff', borderBottom: '1px solid #eee' }}>
        <h1 style={{ color: '#07125E', fontSize: '22px', fontWeight: 'bold', fontStyle: 'italic', margin: 0, textAlign: 'left' }}>Hexaware liminous</h1>
      </header>
      <div className="scroll-content">
        <Outlet />
      </div>
      
      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home size={24} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/paths" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <PlayCircle size={24} />
          <span>Path</span>
        </NavLink>
      </nav>
    </div>
  );
}
