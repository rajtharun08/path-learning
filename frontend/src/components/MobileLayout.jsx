import { Outlet, NavLink } from 'react-router-dom';
import { Home, PlayCircle } from 'lucide-react';
import './MobileLayout.css';

export default function MobileLayout() {
  return (
    <div className="app-container">
      <div className="scroll-content">
        <Outlet />
      </div>
      
      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home size={24} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/path/frontend-dev" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <PlayCircle size={24} />
          <span>Path</span>
        </NavLink>
      </nav>
    </div>
  );
}
