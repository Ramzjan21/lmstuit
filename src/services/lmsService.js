import { getJson, removeKey, setJson } from './storageService';

const DEFAULT_PROXY_BASE = import.meta.env.VITE_LMS_PROXY_URL || '/api/lms';

const getLmsCookie = () => {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem('lms_cookie'); } catch { return null; }
};

const setLmsCookie = (cookie) => {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem('lms_cookie', cookie); } catch {}
};

const clearLmsCookie = () => {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem('lms_cookie'); } catch {}
};

const getSessionId = () => {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem('lms_session_id'); } catch { return null; }
};

const setSessionId = (sid) => {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem('lms_session_id', sid); } catch {}
};

const clearSessionId = () => {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem('lms_session_id'); } catch {}
};

const requestJson = async (path, options = {}) => {
  const lmsCookie = getLmsCookie();
  const sessionId = getSessionId();
  console.log('[lmsService] requestJson:', path, 'sessionId:', sessionId ? '✅' : '❌', 'lmsCookie:', lmsCookie ? '✅' : '❌');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (lmsCookie) {
    headers['x-lms-cookie'] = lmsCookie;
  }
  if (sessionId) {
    headers['x-session-id'] = sessionId;
  }

  const response = await fetch(`${DEFAULT_PROXY_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body?.error || body?.message || 'LMS so`rovda xatolik yuz berdi';
    throw new Error(message);
  }

  return body;
};

let cachedBundle = null;
let cachedAt = 0;

const CACHE_MS = 15000;

const getBundle = async () => {
  const now = Date.now();
  if (cachedBundle && now - cachedAt < CACHE_MS) {
    return cachedBundle;
  }
  const data = await requestJson('/sync-all');
  cachedBundle = data;
  cachedAt = now;
  return data;
};

const clearBundleCache = () => {
  cachedBundle = null;
  cachedAt = 0;
};

const sortByDeadline = (tasks = []) => {
  return [...tasks].sort((a, b) => new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime());
};

const updateLeaderboard = async ({ userEmail, profile, grades }) => {
  const items = await getJson('leaderboard_users', []);
  const current = Array.isArray(items) ? items : [];
  const validGrades = Array.isArray(grades) ? grades : [];

  if (!validGrades.length) return;

  const avgScore = Math.round(validGrades.reduce((sum, item) => sum + Number(item.score || 0), 0) / validGrades.length);
  const attendanceScores = validGrades
    .filter((item) => Number(item.limit || 0) > 0)
    .map((item) => 100 - Math.min(100, Math.max(0, (Number(item.nb || 0) / Number(item.limit || 1)) * 100)));

  const attendanceScore = attendanceScores.length
    ? Math.round(attendanceScores.reduce((sum, item) => sum + item, 0) / attendanceScores.length)
    : 0;

  const creditSum = validGrades.reduce((sum, item) => sum + Number(item.credit || 0), 0);
  const pointSum = validGrades.reduce((sum, item) => {
    const score = Number(item.score || 0);
    const credit = Number(item.credit || 0);
    if (score >= 86) return sum + 4 * credit;
    if (score >= 71) return sum + 3 * credit;
    if (score >= 56) return sum + 2 * credit;
    if (score >= 50) return sum + 1 * credit;
    return sum;
  }, 0);

  const entry = {
    userEmail,
    name: profile?.fullName || profile?.firstName || 'Talaba',
    group: profile?.group || '',
    course: profile?.course || 0,
    direction: profile?.direction || '',
    subjectCount: validGrades.length,
    avgScore,
    attendanceScore,
    gpa: creditSum ? Number((pointSum / creditSum).toFixed(2)) : 0,
    rating: Math.round(avgScore * 0.7 + attendanceScore * 0.3),
    updatedAt: new Date().toISOString()
  };

  const updated = [
    ...current.filter((item) => item.userEmail !== userEmail),
    entry
  ].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
    return b.attendanceScore - a.attendanceScore;
  });

  await setJson('leaderboard_users', updated.slice(0, 200));

  try {
    const sessionId = getSessionId();
    const headers = { 'Content-Type': 'application/json' };
    if (sessionId) headers['x-session-id'] = sessionId;
    await fetch('/api/leaderboard', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(entry)
    });
  } catch (e) {
    console.warn('Backend leaderboard sync failed:', e.message);
  }
};

export const lmsService = {
  async login(login, password) {
    try {
      const data = await requestJson('/login', {
        method: 'POST',
        body: JSON.stringify({ login, password })
      });

      console.log('[lmsService] login response:', JSON.stringify(data));
      if (data?.sessionId) {
        setSessionId(data.sessionId);
        console.log('[lmsService] sessionId saqlandi:', data.sessionId);
      } else {
        console.warn('[lmsService] login response da sessionId yo\'q!');
      }
      if (data?.lmsCookie) {
        setLmsCookie(data.lmsCookie);
        console.log('[lmsService] lmsCookie saqlandi');
      }

      await setJson('lms_user', { login, name: data?.name || login });
      return { success: true, name: data?.name || login };
    } catch (error) {
      return { success: false, error: error.message || "Login yoki parol noto'g'ri" };
    }
  },

  async getCookies() {
    return '';
  },

  async syncProfile() {
    try {
      const data = await getBundle();
      return data?.profile || null;
    } catch (error) {
      console.error('syncProfile error:', error);
      return null;
    }
  },

  async syncSchedule() {
    try {
      const data = await getBundle();
      return Array.isArray(data?.schedule) ? data.schedule : [];
    } catch (error) {
      console.error('syncSchedule error:', error);
      return [];
    }
  },

  async syncDeadlines() {
    try {
      const data = await getBundle();
      return Array.isArray(data?.tasks) ? sortByDeadline(data.tasks) : [];
    } catch (error) {
      console.error('syncDeadlines error:', error);
      return [];
    }
  },

  async syncStudyPlan() {
    try {
      const data = await getBundle();
      const source = data?.studyPlan || data;
      return {
        gpa: source?.gpa ?? null,
        semesters: Array.isArray(source?.semesters) ? source.semesters : [],
        subjects: Array.isArray(source?.subjects) ? source.subjects : [],
        totalCredits: Number(source?.totalCredits || 0),
        activeSemester: data?.activeSemester || source?.activeSemester || ''
      };
    } catch (error) {
      console.error('syncStudyPlan error:', error);
      return { gpa: null, semesters: [], subjects: [], totalCredits: 0 };
    }
  },

  async syncFinals() {
    try {
      const data = await getBundle();
      const source = data?.finals || data;
      return {
        semesterId: source?.semesterId || null,
        semesterLabel: source?.semesterLabel || '',
        rows: Array.isArray(source?.rows) ? source.rows : []
      };
    } catch (error) {
      console.error('syncFinals error:', error);
      return { semesterId: null, semesterLabel: '', rows: [] };
    }
  },

  async syncCourses() {
    try {
      const data = await getBundle();
      if (Array.isArray(data?.courses)) return data.courses;
      if (Array.isArray(data?.coursesPreview)) return data.coursesPreview;
      return [];
    } catch (error) {
      console.error('syncCourses error:', error);
      return [];
    }
  },

  async syncGrades() {
    try {
      const data = await getBundle();
      return Array.isArray(data?.grades) ? data.grades : [];
    } catch (error) {
      console.error('syncGrades error:', error);
      return [];
    }
  },

  async syncGradesRealtime(userEmail) {
    clearBundleCache();
    const data = await requestJson('/grades/realtime');
    const grades = Array.isArray(data?.grades) ? data.grades : [];
    const activeSemester = data?.activeSemester || '';
    const studyPlan = data?.studyPlan || null;

    const [prevSync, profile] = await Promise.all([
      getJson(`lms_last_sync_${userEmail}`, null),
      getJson(`profile_${userEmail}`, null)
    ]);

    await Promise.all([
      setJson(`grades_${userEmail}`, grades),
      ...(studyPlan
        ? [
            setJson(`studyplan_${userEmail}`, {
              ...studyPlan,
              activeSemester: studyPlan?.activeSemester || activeSemester
            })
          ]
        : []),
      setJson(`lms_last_sync_${userEmail}`, {
        ...(prevSync || {}),
        at: new Date().toISOString(),
        activeSemester,
        counts: {
          ...(prevSync?.counts || {}),
          grades: grades.length
        }
      })
    ]);

    await updateLeaderboard({ userEmail, profile, grades });

    return {
      grades: grades.length,
      activeSemester
    };
  },

  async syncAll(userEmail) {
    clearBundleCache();
    let data;
    try {
      data = await requestJson('/sync-all');
    } catch (error) {
      console.error('syncAll /sync-all xatosi:', error);
      throw new Error('Sinxronizatsiya muvaffaqiyatsiz: ' + error.message);
    }
    cachedBundle = data;
    cachedAt = Date.now();

    const profile = data?.profile || {};
    const schedule = Array.isArray(data?.schedule) ? data.schedule : [];
    const tasks = Array.isArray(data?.tasks) ? sortByDeadline(data.tasks) : [];
    const grades = Array.isArray(data?.grades) ? data.grades : [];
    const studyPlan = data?.studyPlan || { gpa: null, semesters: [], subjects: [] };
    const finals = data?.finals || { semesterId: null, semesterLabel: '', rows: [] };
    const activeSemester = data?.activeSemester || finals?.semesterLabel || '';

    await Promise.all([
      setJson(`profile_${userEmail}`, profile),
      setJson(`timetable_${userEmail}`, schedule),
      setJson(`tasks_${userEmail}`, tasks),
      setJson(`grades_${userEmail}`, grades),
      setJson(`studyplan_${userEmail}`, {
        ...studyPlan,
        activeSemester
      }),
      setJson(`finals_${userEmail}`, finals),
      setJson(`lms_last_sync_${userEmail}`, {
        at: new Date().toISOString(),
        activeSemester,
        counts: {
          profile: profile ? 1 : 0,
          schedule: schedule.length,
          tasks: tasks.length,
          grades: grades.length,
          finals: Array.isArray(finals?.rows) ? finals.rows.length : 0,
          courses: Number(data?.coursesCount || 0)
        }
      })
    ]);

    await updateLeaderboard({ userEmail, profile, grades });

    // Trigger Telegram NB notification check silently
    try {
      const sessionId = getSessionId();
      const headers = { 'Content-Type': 'application/json' };
      if (sessionId) headers['x-session-id'] = sessionId;
      await fetch('/api/telegram/check-nb', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ grades })
      });
    } catch (e) {
      console.warn('Telegram NB check failed:', e.message);
    }

    await setJson(`courses_${userEmail}`, Array.isArray(data?.coursesPreview) ? data.coursesPreview : []);

    return {
      profile: profile ? 1 : 0,
      schedule: schedule.length,
      tasks: tasks.length,
      grades: grades.length,
      finals: Array.isArray(finals?.rows) ? finals.rows.length : 0,
      courses: Number(data?.coursesCount || 0),
      activeSemester
    };
  },

  async logout() {
    const sessionId = getSessionId();
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (sessionId) headers['x-session-id'] = sessionId;
      await fetch(`${DEFAULT_PROXY_BASE}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers
      });
    } catch (error) {
      console.warn('LMS logout warning:', error.message);
    }

    clearSessionId();
    clearLmsCookie();
    await removeKey('lms_user');
    clearBundleCache();
  }
};
