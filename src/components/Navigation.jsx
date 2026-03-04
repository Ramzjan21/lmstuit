import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, CheckSquare, GraduationCap, BookOpen } from 'lucide-react';
import './Navigation.css';

export default function Navigation() {
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Asosiy' },
    { path: '/timetable', icon: CalendarDays, label: 'Jadval' },
    { path: '/tasks', icon: CheckSquare, label: 'Vazifalar' },
    { path: '/grades', icon: GraduationCap, label: 'Baho' },
    { path: '/library', icon: BookOpen, label: 'Kutubxona' }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink 
          key={item.path} 
          to={item.path} 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <item.icon size={24} className="nav-icon" />
          <span className="nav-label">{item.label}</span>
          <div className="nav-indicator"></div>
        </NavLink>
      ))}
    </nav>
  );
}
