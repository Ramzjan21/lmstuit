import React, { useEffect, useMemo, useState } from 'react';
import { differenceInCalendarWeeks } from 'date-fns';
import { RefreshCw, UserRound, MapPin } from 'lucide-react';
import { lmsService } from '../services/lmsService';
import { getJson } from '../services/storageService';
import { useI18n } from '../i18n';

const WEEK_DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

const parseTimeToMinutes = (value) => {
  const [h, m] = String(value || '').split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return Number.POSITIVE_INFINITY;
  return h * 60 + m;
};

const normalizeTime = (value = '') => {
  const [h, m] = String(value).split(':');
  if (h === undefined || m === undefined) return '';
  const hh = String(Number(h)).padStart(2, '0');
  const mm = String(Number(m)).padStart(2, '0');
  if (Number.isNaN(Number(hh)) || Number.isNaN(Number(mm))) return '';
  return `${hh}:${mm}`;
};

const buildTimeRange = (start, end) => {
  if (!start && !end) return '';
  if (!end) return start;
  if (!start) return end;
  return `${start} - ${end}`;
};

const normalizeLesson = (lesson, index, t) => {
  const startRaw = lesson.startTime || String(lesson.time || '').split(' - ')[0] || '';
  const endRaw = lesson.endTime || String(lesson.time || '').split(' - ')[1] || '';
  const startTime = normalizeTime(startRaw);
  const endTime = normalizeTime(endRaw);
  const day = WEEK_DAYS.includes(lesson.day) ? lesson.day : 'Dushanba';

  return {
    id: lesson.id || `lesson_${Date.now()}_${index}`,
    name: (lesson.name || '').trim() || t('timetable.unknownSubject'),
    type: lesson.type || "Ma'ruza",
    day,
    startTime,
    endTime,
    time: buildTimeRange(startTime, endTime),
    location: (lesson.location || '').trim() || t('timetable.roomMissing'),
    teacher: {
      name: lesson.teacher?.name || t('timetable.teacher')
    }
  };
};

const sortLessons = (items = [], t) => {
  const orderMap = new Map(WEEK_DAYS.map((day, index) => [day, index]));
  return [...items]
    .map((lesson, index) => normalizeLesson(lesson, index, t))
    .sort((a, b) => {
      const dayA = orderMap.get(a.day) ?? 99;
      const dayB = orderMap.get(b.day) ?? 99;
      if (dayA !== dayB) return dayA - dayB;
      const tA = parseTimeToMinutes(a.startTime);
      const tB = parseTimeToMinutes(b.startTime);
      if (tA !== tB) return tA - tB;
      return a.name.localeCompare(b.name);
    });
};

const typeStyle = (type = '') => {
  const key = String(type).toLowerCase();
  if (key.includes('lab')) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
  if (key.includes('amaliy')) return { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' };
  if (key.includes('seminar')) return { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' };
  return { color: '#00d1ff', bg: 'rgba(0,209,255,0.12)' };
};

export default function Timetable({ user }) {
  const { t, lang } = useI18n();
  const [lessons, setLessons] = useState([]);
  const [activeSemester, setActiveSemester] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [isEvenWeek, setIsEvenWeek] = useState(true);
  const [activeDay, setActiveDay] = useState('Dushanba');

  useEffect(() => {
    const semesterStart = new Date('2026-02-09');
    const current = new Date();
    const diff = differenceInCalendarWeeks(current, semesterStart, { weekStartsOn: 1 });
    setIsEvenWeek(diff % 2 === 0);
  }, []);

  useEffect(() => {
    const today = new Date();
    const dayMap = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const todayName = dayMap[today.getDay()] || 'Dushanba';
    if (WEEK_DAYS.includes(todayName)) {
      setActiveDay(todayName);
    } else {
      setActiveDay('Dushanba');
    }
  }, []);

  const loadData = async () => {
    if (!user) return;

    const [storedLessons, syncInfo] = await Promise.all([
      getJson(`timetable_${user.email}`, []),
      getJson(`lms_last_sync_${user.email}`, null)
    ]);

    setLessons(sortLessons(Array.isArray(storedLessons) ? storedLessons : [], t));
    setActiveSemester(syncInfo?.activeSemester || '');
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const syncLms = async () => {
    if (!user?.isLms || syncing) return;
    setSyncing(true);
    try {
      await lmsService.syncAll(user.email);
      await loadData();
    } finally {
      setSyncing(false);
    }
  };

  const lessonsByDay = useMemo(() => {
    const grouped = new Map(WEEK_DAYS.map((day) => [day, []]));
    lessons.forEach((lesson) => {
      const day = WEEK_DAYS.includes(lesson.day) ? lesson.day : 'Dushanba';
      grouped.get(day).push(lesson);
    });
    WEEK_DAYS.forEach((day) => {
      grouped.set(day, grouped.get(day).sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)));
    });
    return grouped;
  }, [lessons]);

  const visibleLessons = lessonsByDay.get(activeDay) || [];
  const totalLessons = lessons.length;

  const dayLabel = (day) => {
    if (lang !== 'ru') return day;
    const map = {
      Dushanba: 'Понедельник',
      Seshanba: 'Вторник',
      Chorshanba: 'Среда',
      Payshanba: 'Четверг',
      Juma: 'Пятница',
      Shanba: 'Суббота'
    };
    return map[day] || day;
  };

  return (
    <div>
      <div className="flex-between mb-3">
        <h1 className="text-gradient">{t('timetable.title')}</h1>
        <div className="flex-center gap-2">
          <button
            onClick={syncLms}
            disabled={syncing}
            className="glass-panel p-2 flex-center"
            style={{ border: 'none', background: 'rgba(0,209,255,0.12)', color: 'var(--accent-primary)', cursor: 'pointer' }}
            title={t('common.sync')}
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
          </button>

          <span
            className="glass-panel text-xs font-semibold"
            style={{
              padding: '7px 12px',
              borderRadius: '20px',
              background: isEvenWeek ? 'rgba(34,197,94,0.13)' : 'rgba(0,209,255,0.13)',
              color: isEvenWeek ? 'var(--success)' : 'var(--accent-primary)'
            }}
          >
            {isEvenWeek ? t('timetable.evenWeek') : t('timetable.oddWeek')}
          </span>
        </div>
      </div>

      <div className="glass-panel p-3 mb-3" style={{ background: 'rgba(0,209,255,0.06)', borderColor: 'rgba(0,209,255,0.22)' }}>
        <div className="flex-between" style={{ alignItems: 'flex-start', gap: '8px' }}>
          <div>
            <p className="text-xs text-secondary">{t('timetable.activeSemester')}</p>
            <p className="font-semibold mt-1">{activeSemester || t('common.unknown')}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="text-xs text-secondary">{t('timetable.weeklyLessons')}</p>
            <p className="font-semibold mt-1">{totalLessons}</p>
          </div>
        </div>
      </div>

      <div className="glass-panel p-2 mb-3" style={{ background: 'var(--glass-bg)' }}>
        <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {WEEK_DAYS.map((day) => {
            const count = (lessonsByDay.get(day) || []).length;
            const isActive = day === activeDay;
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                style={{
                  border: `1px solid ${isActive ? 'rgba(0,209,255,0.45)' : 'var(--border-color)'}`,
                  background: isActive ? 'rgba(0,209,255,0.18)' : 'var(--glass-bg)',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  borderRadius: '12px',
                  padding: '8px 10px',
                  minWidth: '92px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <p className="text-xs font-semibold">{dayLabel(day).slice(0, 3)}</p>
                <p className="text-xs">{t('timetable.lessonsCount', { count })}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-between mb-2">
        <h2 className="text-lg">{dayLabel(activeDay)}</h2>
        <span className="text-xs text-secondary">{t('timetable.lessonsCount', { count: visibleLessons.length })}</span>
      </div>

      <div className="flex-column gap-2">
        {visibleLessons.length ? (
          visibleLessons.map((lesson) => {
            const style = typeStyle(lesson.type);
            return (
              <div key={lesson.id} className="glass-panel p-3" style={{ background: style.bg, borderLeft: `3px solid ${style.color}` }}>
                <div className="flex-between" style={{ alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <p className="font-semibold text-sm">{lesson.name}</p>
                    <p className="text-xs text-secondary mt-1">{t(`timetable.types.${lesson.type.toLowerCase()}`)}</p>
                  </div>
                  <span className="text-xs" style={{ color: style.color, fontWeight: 700 }}>{lesson.time}</span>
                </div>

                <p className="text-xs text-secondary mt-2 flex-center" style={{ justifyContent: 'flex-start', gap: '6px' }}>
                  <MapPin size={12} /> {lesson.location || t('timetable.roomMissing')}
                </p>
                <p className="text-xs text-secondary mt-1 flex-center" style={{ justifyContent: 'flex-start', gap: '6px' }}>
                  <UserRound size={12} /> {lesson.teacher?.name || t('timetable.teacher')}
                </p>
              </div>
            );
          })
        ) : (
          <div className="glass-panel p-4" style={{ background: 'var(--glass-bg)' }}>
            <p className="text-sm text-secondary text-center">{t('timetable.noDayLessons')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
