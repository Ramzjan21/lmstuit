import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';

export default function Layout() {
  return (
    <div className="app-container">
      <main className="page-content">
        <Outlet />
      </main>
      <Navigation />
    </div>
  );
}
