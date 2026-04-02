import React, { useState, useEffect, useRef } from 'react';
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
import Freelance from './pages/Freelance';
import Settings from './pages/Settings';
import Login from './pages/Login';
import LoadingScreen from './components/LoadingScreen';
import { getJson, removeKey, setJson } from './services/storageService';
import { lmsService } from './services/lmsService';
import { I18nContext, detectLanguageFromProfile, translate } from './i18n';

const getSessionId = () => {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem('lms_session_id'); } catch { return null; }
};

const getLmsCookie = () => {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem('lms_cookie'); } catch { return null; }
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('uz');
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('app_theme') || 'dark'; } catch { return 'dark'; }
  });
  const autoSyncRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const AUTO_SYNC_INTERVAL = 30 * 60 * 1000; // 30 daqiqa

  const startAutoSync = (userData) => {
    if (!userData?.isLms || !userData?.email) return;
    stopAutoSync();
    // Sync immediately on start
    lmsService.syncAll(userData.email).catch(console.warn);
    // Then every 30 min
    autoSyncRef.current = setInterval(() => {
      lmsService.syncAll(userData.email).catch(console.warn);
    }, AUTO_SYNC_INTERVAL);
  };

  const stopAutoSync = () => {
    if (autoSyncRef.current) {
      clearInterval(autoSyncRef.current);
      autoSyncRef.current = null;
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await getJson('currentUser', null);
        const sessionId = getSessionId();
        const lmsCookie = getLmsCookie();
        if (storedUser && (sessionId || lmsCookie)) {
          setUser(storedUser);
          const storedLang = await getJson(`lang_${storedUser.email}`, null);
          if (storedLang === 'ru' || storedLang === 'uz') {
            setLang(storedLang);
          } else {
            const profile = await getJson(`profile_${storedUser.email}`, null);
            setLang(detectLanguageFromProfile(profile));
          }
        } else if (storedUser && !sessionId && !lmsCookie) {
          console.warn('[App] Eski user topildi lekin session yo\'q - logout qilinmoqda');
          await removeKey('currentUser');
          await removeKey(`lang_${storedUser.email}`);
          await removeKey(`profile_${storedUser.email}`);
          await removeKey(`timetable_${storedUser.email}`);
          await removeKey(`tasks_${storedUser.email}`);
          await removeKey(`grades_${storedUser.email}`);
          await removeKey(`studyplan_${storedUser.email}`);
          await removeKey(`finals_${storedUser.email}`);
          await removeKey(`lms_last_sync_${storedUser.email}`);
          await removeKey(`courses_${storedUser.email}`);
        }
      } catch (e) {
        console.error("Local storage read error", e);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  // Start auto-sync when user changes
  useEffect(() => {
    if (user) startAutoSync(user);
    else stopAutoSync();
    return () => stopAutoSync();
  }, [user?.email]);

  const handleLogin = async (userData) => {
    setUser(userData);
    await setJson('currentUser', userData);

    try {
      const profile = await getJson(`profile_${userData.email}`, null);
      if (profile) {
        const detectedLang = detectLanguageFromProfile(profile);
        setLang(detectedLang);
        await setJson(`lang_${userData.email}`, detectedLang);
      } else {
        const detectedLang = userData.lang || 'uz';
        setLang(detectedLang);
        await setJson(`lang_${userData.email}`, detectedLang);
      }
    } catch(e) {
      console.warn('Lang detect error:', e);
    }
    
    startAutoSync(userData);
  };

  const handleLogout = async () => {
    await lmsService.logout();
    if (user?.email) {
      await removeKey(`lang_${user.email}`);
      await removeKey(`profile_${user.email}`);
      await removeKey(`timetable_${user.email}`);
      await removeKey(`tasks_${user.email}`);
      await removeKey(`grades_${user.email}`);
      await removeKey(`studyplan_${user.email}`);
      await removeKey(`finals_${user.email}`);
      await removeKey(`lms_last_sync_${user.email}`);
      await removeKey(`courses_${user.email}`);
    }
    setUser(null);
    await removeKey('currentUser');
    setLang('uz');
  };

  const changeLanguage = async (newLang) => {
    setLang(newLang);
    if (user?.email) {
      await setJson(`lang_${user.email}`, newLang);
    }
  };

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    try { localStorage.setItem('app_theme', newTheme); } catch {}
  };

  if (loading) {
    return <LoadingScreen lang={lang} />;
  }

  const t = (key, params) => translate(lang, key, params);

  return (
    <I18nContext.Provider value={{ lang, t, changeLanguage, theme, changeTheme }}>
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
            <Route path="freelance" element={<Freelance user={user} />} />
            <Route path="settings" element={<Settings user={user} onLogout={handleLogout} />} />
          </Route>
        </Routes>
      </Router>
    </I18nContext.Provider>
  );
}

export default App;
