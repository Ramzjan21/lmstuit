import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, CheckSquare, Trophy, ListTodo } from 'lucide-react';
import './Navigation.css';
import { useI18n } from '../i18n';

export default function Navigation() {
  const { t } = useI18n();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('nav.home') },
    { path: '/timetable', icon: CalendarDays, label: t('nav.schedule') },
    { path: '/grades', icon: CheckSquare, label: t('nav.attendance') },
    { path: '/tasks', icon: ListTodo, label: t('nav.tasks') },
    { path: '/leaderboard', icon: Trophy, label: t('nav.top') }
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
