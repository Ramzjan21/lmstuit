import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  GraduationCap,
  ListTodo,
  LogOut,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trophy,
  UserRound,
  Bot,
  Users,
  Settings as SettingsIcon,
  Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { lmsService } from '../services/lmsService';
import { getJson } from '../services/storageService';
import { useI18n } from '../i18n';
import { formatDate, formatTime } from '../utils/dateUtils';

const DAYS_UZ = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

const toDateText = (value, lang) => formatDate(value, lang);
const toTimeText = (value, lang) => formatTime(value, lang);


const countdown = (iso, t) => {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return t('tasks.noTime');
  const diff = target - Date.now();
  if (diff <= 0) return t('tasks.expired');
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) return t('tasks.leftMinutes', { value: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('tasks.leftHours', { h: hours, m: minutes % 60 });
  return t('tasks.leftDays', { d: Math.floor(hours / 24), h: hours % 24 });
};

const calcGpa = (subjects = []) => {
  if (!subjects.length) return '0.00';

  let credits = 0;
  let points = 0;
  subjects.forEach((subject) => {
    const score = Number(subject.score || 0);
    const credit = Number(subject.credit || 0);
    let point = 0;
    if (score >= 86) point = 4;
    else if (score >= 71) point = 3;
    else if (score >= 56) point = 2;
    else if (score >= 50) point = 1;
    credits += credit;
    points += point * credit;
  });
  if (!credits) return '0.00';
  return (points / credits).toFixed(2);
};

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const { t, lang } = useI18n();

  const [syncing, setSyncing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [profile, setProfile] = useState(null);
  const [grades, setGrades] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [activeSemester, setActiveSemester] = useState('');

  const load = async () => {
    if (!user) return;

    const [profileData, gradeData, taskData, timetableData, syncData] = await Promise.all([
      getJson(`profile_${user.email}`, null),
      getJson(`grades_${user.email}`, []),
      getJson(`tasks_${user.email}`, []),
      getJson(`timetable_${user.email}`, []),
      getJson(`lms_last_sync_${user.email}`, null)
    ]);

    setProfile(profileData);
    setGrades(Array.isArray(gradeData) ? gradeData : []);
    setTasks(Array.isArray(taskData) ? taskData : []);
    setSchedule(Array.isArray(timetableData) ? timetableData : []);
    setLastSync(syncData?.at || null);
    setActiveSemester(syncData?.activeSemester || '');
    setLoaded(true);
  };

  useEffect(() => {
    load();
  }, [user]);

  const syncNow = async () => {
    if (!user?.isLms || syncing) return;
    setSyncing(true);
    try {
      await lmsService.syncAll(user.email);
      await load();
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (loaded && user?.isLms && !grades.length && !schedule.length) {
      syncNow();
    }
  }, [loaded, user, grades.length, schedule.length]);

  const firstName = (profile?.firstName || user?.name || 'Talaba').split(' ')[0];
  const todayName = DAYS_UZ[new Date().getDay()];

  const todayLessons = useMemo(() => {
    return schedule
      .filter((lesson) => lesson.day === todayName)
      .sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || '')))
      .slice(0, 3);
  }, [schedule, todayName]);

  const nextLesson = useMemo(() => {
    const upcoming = schedule
      .filter((lesson) => lesson.dateISO && new Date(lesson.dateISO).getTime() > Date.now())
      .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());
    return upcoming[0] || null;
  }, [schedule]);

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter((task) => !task.completed && task.deadline)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 3);
  }, [tasks]);

  const avgScore = useMemo(() => {
    if (!grades.length) return 0;
    const sum = grades.reduce((acc, subject) => acc + Number(subject.score || 0), 0);
    return Math.round(sum / grades.length);
  }, [grades]);

  const credits = useMemo(() => grades.reduce((acc, subject) => acc + Number(subject.credit || 0), 0), [grades]);

  const riskCount = useMemo(() => {
    return grades.filter((subject) => {
      const limit = Number(subject.limit || 0);
      if (!limit) return false;
      return Number(subject.nb || 0) / limit >= 0.75;
    }).length;
  }, [grades]);

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1 className="text-gradient" style={{ fontSize: '28px' }}>
            {t('dashboard.online', { name: firstName })}
          </h1>
          <p className="text-secondary text-sm mt-1">{t('dashboard.subtitle')}</p>
        </div>

        <div className="flex-center gap-2">
          <button
            onClick={syncNow}
            disabled={syncing}
            className="glass-panel p-2 flex-center"
            style={{ border: 'none', background: 'rgba(34,211,238,0.12)', color: 'var(--accent-primary)', cursor: 'pointer', borderRadius: '12px' }}
            title="LMS ma'lumotlarini yangilash"
          >
            <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="glass-panel p-2 flex-center"
            style={{ border: 'none', background: 'rgba(255,255,255,0.08)', color: 'white', cursor: 'pointer', borderRadius: '12px' }}
            title="Sozlamalar"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </div>

      <div className="glass-panel p-3 mb-4" style={{ background: 'rgba(0,255,200,0.06)', borderColor: 'rgba(0,255,200,0.22)' }}>
        <div className="flex-between" style={{ alignItems: 'flex-start' }}>
          <div>
            <p className="text-xs text-secondary">{t('dashboard.activeSemester')}</p>
            <p className="font-semibold mt-1">{activeSemester || t('common.unknownSemester')}</p>
            <p className="text-xs text-secondary mt-1">{profile?.group || '--'} | {profile?.direction || t('common.unknown')}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="text-xs text-secondary">{t('dashboard.lastSync')}</p>
            <p className="text-xs">{lastSync ? `${toDateText(lastSync, lang)} ${toTimeText(lastSync, lang)}` : t('dashboard.noSync')}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '10px', marginBottom: '14px' }}>
        <div className="glass-panel p-3" style={{ background: 'rgba(0,255,200,0.07)' }}>
          <p className="text-xs text-secondary">{t('dashboard.gpa')}</p>
          <p className="font-semibold mt-1" style={{ color: 'var(--accent-primary)' }}>{calcGpa(grades)}</p>
        </div>
        <div className="glass-panel p-3" style={{ background: 'rgba(16,185,129,0.1)' }}>
          <p className="text-xs text-secondary">{t('dashboard.average')}</p>
          <p className="font-semibold mt-1" style={{ color: 'var(--success)' }}>{avgScore}</p>
        </div>
        <div className="glass-panel p-3" style={{ background: 'rgba(245,158,11,0.1)' }}>
          <p className="text-xs text-secondary">{t('dashboard.credits')}</p>
          <p className="font-semibold mt-1" style={{ color: 'var(--warning)' }}>{credits}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={() => navigate('/profile')}
          className="glass-panel p-3"
          style={{ border: 'none', textAlign: 'left', cursor: 'pointer', background: 'rgba(59,130,246,0.12)' }}
        >
          <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <UserRound size={16} color="var(--info)" />
            <span className="font-semibold text-sm">{t('dashboard.profile')}</span>
          </div>
          <p className="text-xs text-secondary mt-2">{t('dashboard.profileDesc')}</p>
        </button>

        <button
          onClick={() => navigate('/leaderboard')}
          className="glass-panel p-3"
          style={{ border: 'none', textAlign: 'left', cursor: 'pointer', background: 'rgba(236,72,153,0.12)' }}
        >
          <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <Trophy size={16} color="var(--accent-secondary)" />
            <span className="font-semibold text-sm">{t('dashboard.leaderboard')}</span>
          </div>
          <p className="text-xs text-secondary mt-2">{t('dashboard.leaderboardDesc')}</p>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={() => navigate('/grades')}
          className="glass-panel p-3"
          style={{ border: 'none', textAlign: 'left', cursor: 'pointer', background: 'rgba(34,197,94,0.12)' }}
        >
          <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <GraduationCap size={16} color="var(--success)" />
            <span className="font-semibold text-sm">{t('dashboard.grades')}</span>
          </div>
          <p className="text-xs text-secondary mt-2">{t('dashboard.gradesDesc')}</p>
        </button>

        <button
          onClick={() => navigate('/ai-chat')}
          className="glass-panel p-3"
          style={{ border: 'none', textAlign: 'left', cursor: 'pointer', background: 'rgba(0,209,255,0.12)' }}
        >
          <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <Bot size={16} color="var(--accent-primary)" />
            <span className="font-semibold text-sm">{t('dashboard.ai')}</span>
          </div>
          <p className="text-xs text-secondary mt-2">{t('dashboard.aiDesc')}</p>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={() => navigate('/teachers')}
          className="glass-panel p-3"
          style={{ border: 'none', textAlign: 'left', cursor: 'pointer', background: 'rgba(168,85,247,0.12)' }}
        >
          <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <Users size={16} color="#a855f7" />
            <span className="font-semibold text-sm">{t('dashboard.teachers')}</span>
          </div>
          <p className="text-xs text-secondary mt-2">{t('dashboard.teachersDesc')}</p>
        </button>

        <button
          onClick={() => navigate('/freelance')}
          className="glass-panel p-3"
          style={{ border: 'none', textAlign: 'left', cursor: 'pointer', background: 'rgba(245,158,11,0.12)' }}
        >
          <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <Briefcase size={16} color="#f59e0b" />
            <span className="font-semibold text-sm">Xizmatlar</span>
          </div>
          <p className="text-xs text-secondary mt-2">Talabalar xizmati (Freelance)</p>
        </button>
      </div>

      {riskCount > 0 && (
        <div className="glass-panel p-3 mb-4" style={{ borderColor: 'rgba(255,90,110,0.35)', background: 'rgba(255,90,110,0.1)' }}>
          <p className="font-semibold text-sm flex-center" style={{ justifyContent: 'flex-start', gap: '6px' }}>
            <ShieldAlert size={14} color="#ff5f7f" /> {t('dashboard.warning')}
          </p>
          <p className="text-xs text-secondary mt-1">{t('dashboard.warningDesc', { count: riskCount })}</p>
        </div>
      )}

      <div className="flex-between mb-2">
        <h2 className="text-lg font-medium">{t('dashboard.nextLesson')}</h2>
        <button onClick={() => navigate('/timetable')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '12px', cursor: 'pointer' }}>
          {t('dashboard.schedule')} <ChevronRight size={14} style={{ verticalAlign: 'middle' }} />
        </button>
      </div>

      {nextLesson ? (
        <div className="glass-panel p-3 mb-4" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
          <div className="flex-between" style={{ alignItems: 'flex-start', gap: '8px' }}>
            <div>
              <p className="font-semibold text-sm">{nextLesson.name}</p>
              <p className="text-xs text-secondary mt-1">{t(`timetable.types.${(nextLesson.type || '').toLowerCase()}`)} | {nextLesson.location}</p>
            </div>
            <span className="text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>{countdown(nextLesson.dateISO, t)}</span>
          </div>
          <p className="text-xs text-secondary mt-2 flex-center" style={{ justifyContent: 'flex-start', gap: '6px' }}>
            <Clock3 size={12} /> {nextLesson.time}
          </p>
        </div>
      ) : (
        <div className="glass-panel p-3 mb-4"><p className="text-sm text-secondary">{t('dashboard.noNextLesson')}</p></div>
      )}

      <div className="flex-between mb-2">
        <h2 className="text-lg font-medium">{t('dashboard.todayLessons')}</h2>
        <button onClick={() => navigate('/timetable')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '12px', cursor: 'pointer' }}>
          {t('common.viewAll')} <ChevronRight size={14} style={{ verticalAlign: 'middle' }} />
        </button>
      </div>

      <div className="flex-column gap-2 mb-4">
        {todayLessons.length ? (
          todayLessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => navigate('/timetable')}
              className="glass-panel p-3"
              style={{ border: 'none', textAlign: 'left', cursor: 'pointer', background: 'rgba(255,255,255,0.04)' }}
            >
              <div className="flex-between">
                <span className="font-semibold text-sm">{lesson.name}</span>
                <span className="text-xs text-secondary">{lesson.startTime || lesson.time}</span>
              </div>
              <p className="text-xs text-secondary mt-1">{t(`timetable.types.${(lesson.type || '').toLowerCase()}`)}</p>
            </button>
          ))
        ) : (
          <div className="glass-panel p-3"><p className="text-sm text-secondary">{t('dashboard.noTodayLessons')}</p></div>
        )}
      </div>

      <div className="flex-between mb-2">
        <h2 className="text-lg font-medium">{t('dashboard.upcomingTasks')}</h2>
        <button onClick={() => navigate('/tasks')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '12px', cursor: 'pointer' }}>
          {t('common.viewAll')} <ChevronRight size={14} style={{ verticalAlign: 'middle' }} />
        </button>
      </div>

      <div className="flex-column gap-2">
        {upcomingTasks.length ? (
          upcomingTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => navigate('/tasks')}
              className="glass-panel p-3"
              style={{ border: 'none', textAlign: 'left', cursor: 'pointer', background: 'rgba(255,255,255,0.04)' }}
            >
              <div className="flex-between" style={{ alignItems: 'flex-start', gap: '8px' }}>
                <div>
                  <p className="font-semibold text-sm">{task.title}</p>
                  <p className="text-xs text-secondary mt-1">{task.category || t('nav.tasks')}</p>
                </div>
                <span className="text-xs" style={{ color: task.priority === 'high' ? 'var(--danger)' : 'var(--warning)', fontWeight: 700 }}>
                  {countdown(task.deadline, t)}
                </span>
              </div>
            </button>
          ))
        ) : (
          <div className="glass-panel p-3"><p className="text-sm text-secondary">{t('dashboard.noTasks')}</p></div>
        )}
      </div>

      <div className="glass-panel p-3 mt-4" style={{ background: 'rgba(0,255,200,0.05)', borderColor: 'rgba(0,255,200,0.16)' }}>
        <div className="flex-between" style={{ gap: '8px' }}>
          <button onClick={() => navigate('/grades')} style={quickBtnStyle('#00d1ff')}><GraduationCap size={14} /> {t('nav.grades', {}, 'Baholar')}</button>
          <button onClick={() => navigate('/tasks')} style={quickBtnStyle('#f59e0b')}><ListTodo size={14} /> {t('nav.tasks', {}, 'Topshiriq')}</button>
          <button onClick={() => navigate('/timetable')} style={quickBtnStyle('#10b981')}><CalendarDays size={14} /> {t('nav.schedule', {}, 'Jadval')}</button>
          <button onClick={() => navigate('/leaderboard')} style={quickBtnStyle('#22d3ee')}><Trophy size={14} /> {t('nav.top', {}, 'Top')}</button>
        </div>
      </div>
    </div>
  );
}

const quickBtnStyle = (color) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.03)',
  color,
  padding: '8px 9px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: 600
});
