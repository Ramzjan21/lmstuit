import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Timetable from './pages/Timetable';
import Tasks from './pages/Tasks';
import Grades from './pages/Grades';
import Library from './pages/Library';
import AIChat from './pages/AIChat';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Teachers from './pages/Teachers';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { getJson, removeKey, setJson } from './services/storageService';
import { lmsService } from './services/lmsService';
import { I18nContext, detectLanguageFromProfile, translate } from './i18n';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('uz');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await getJson('currentUser', null);
        if (storedUser) {
          setUser(storedUser);
          const storedLang = await getJson(`lang_${storedUser.email}`, null);
          if (storedLang === 'ru' || storedLang === 'uz') {
            setLang(storedLang);
          } else {
            const profile = await getJson(`profile_${storedUser.email}`, null);
            setLang(detectLanguageFromProfile(profile));
          }
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
    await setJson('currentUser', userData);

    const profile = await getJson(`profile_${userData.email}`, null);
    const detected = detectLanguageFromProfile(profile);
    setLang(detected);
    await setJson(`lang_${userData.email}`, detected);
  };

  const handleLogout = async () => {
    await lmsService.logout();
    if (user?.email) {
      await removeKey(`lang_${user.email}`);
    }
    setUser(null);
    await removeKey('currentUser');
    await removeKey('lms_user');
    setLang('uz');
  };

  const changeLanguage = async (newLang) => {
    setLang(newLang);
    if (user?.email) {
      await setJson(`lang_${user.email}`, newLang);
    }
  };

  if (loading) {
    return <div className="flex-center" style={{ height: '100vh', background: 'var(--bg-main)', color: 'white' }}>{translate(lang, 'app.loading')}</div>;
  }

  const t = (key, params) => translate(lang, key, params);

  return (
    <I18nContext.Provider value={{ lang, t, changeLanguage }}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" replace />} 
          />
          <Route path="/register" element={<Navigate to="/login" replace />} />

          {/* Protected Routes directly inside Layout */}
          <Route path="/" element={user ? <Layout /> : <Navigate to="/login" replace />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard user={user} onLogout={handleLogout} />} />
            <Route path="timetable" element={<Timetable user={user} />} />
            <Route path="tasks" element={<Tasks user={user} />} />
            <Route path="grades" element={<Grades user={user} />} />
            <Route path="library" element={<Library user={user} />} />
            <Route path="ai-chat" element={<AIChat user={user} />} />
            <Route path="profile" element={<Profile user={user} />} />
            <Route path="leaderboard" element={<Leaderboard user={user} />} />
            <Route path="teachers" element={<Teachers user={user} />} />
            <Route path="settings" element={<Settings user={user} onLogout={handleLogout} />} />
          </Route>
        </Routes>
      </Router>
    </I18nContext.Provider>
  );
}

export default App;
