import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Timetable from './pages/Timetable';
import Tasks from './pages/Tasks';
import Grades from './pages/Grades';
import Library from './pages/Library';
import AIChat from './pages/AIChat';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { value } = await Preferences.get({ key: 'currentUser' });
        if (value) {
          setUser(JSON.parse(value));
        }
      } catch (e) {
        console.error("Local storage read error", e);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const handleLogin = async (userData) => {
    setUser(userData);
    await Preferences.set({ key: 'currentUser', value: JSON.stringify(userData) });
  };

  const handleLogout = async () => {
    setUser(null);
    await Preferences.remove({ key: 'currentUser' });
  };

  if (loading) {
    return <div className="flex-center" style={{ height: '100vh', background: 'var(--bg-main)', color: 'white' }}>Yuklanmoqda...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/register" 
          element={!user ? <Register onLogin={handleLogin} /> : <Navigate to="/dashboard" replace />} 
        />

        {/* Protected Routes directly inside Layout */}
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" replace />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard user={user} onLogout={handleLogout} />} />
          <Route path="timetable" element={<Timetable user={user} />} />
          <Route path="tasks" element={<Tasks user={user} />} />
          <Route path="grades" element={<Grades user={user} />} />
          <Route path="library" element={<Library user={user} />} />
          <Route path="ai-chat" element={<AIChat user={user} />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
