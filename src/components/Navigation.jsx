import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, CheckSquare, GraduationCap, MessageSquare } from 'lucide-react';
import './Navigation.css';

export default function Navigation() {
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Asosiy' },
    { path: '/timetable', icon: CalendarDays, label: 'Jadval' },
    { path: '/tasks', icon: CheckSquare, label: 'Vazifalar' },
    { path: '/grades', icon: GraduationCap, label: 'Baho' },
    { path: '/ai-chat', icon: MessageSquare, label: 'AI Chat' }
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
