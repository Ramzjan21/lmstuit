import React, { useEffect, useMemo, useState } from 'react';
import { Clock, ExternalLink, RefreshCw, ChevronRight, BookOpenCheck } from 'lucide-react';
import { lmsService } from '../services/lmsService';
import { getJson } from '../services/storageService';
import { useI18n } from '../i18n';

const categoryTabs = ['all', 'homework', 'lab', 'coursework', 'midterm'];

const categoryToCanonical = (label = '') => {
  const normalized = String(label).toLowerCase();
  if (normalized.includes('lab') || normalized.includes('лабо')) return 'lab';
  if (normalized.includes('kurs') || normalized.includes('курс')) return 'coursework';
  if (normalized.includes('oraliq') || normalized.includes('рубеж') || normalized.includes('контрол')) return 'midterm';
  if (normalized.includes('uy') || normalized.includes('дом')) return 'homework';
  return 'homework';
};

const formatDateTime = (iso, lang) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--';
  const locale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';
  return `${date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })} ${date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
};

const countdownLabel = (iso, t) => {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return t('tasks.noTime');

  const diff = target - Date.now();
  if (diff <= 0) return t('tasks.expired');

  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) return t('tasks.leftMinutes', { value: minutes });

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('tasks.leftHours', { h: hours, m: minutes % 60 });

  const days = Math.floor(hours / 24);
  return t('tasks.leftDays', { d: days, h: hours % 24 });
};

const priorityColor = (priority = 'medium') => {
  if (priority === 'high') return 'var(--danger)';
  if (priority === 'low') return 'var(--success)';
  return 'var(--warning)';
};

const normalizeSubjectFromTask = (task, t) => {
  if (task?.subject) return String(task.subject).trim();

  if (task?.description) {
    const fromDescription = String(task.description).match(/Fan:\s*([^|]+)/i)?.[1]?.trim();
    if (fromDescription) return fromDescription;
  }

  const text = String(task?.title || '').trim();
  if (!text) return t('tasks.unknownSubject');
  if (text.includes(':')) return text.split(':')[0].trim();
  return text.split('-')[0].trim();
};

const canonicalToLabel = (canonical, t) => {
  if (canonical === 'all') return t('tasks.categories.all');
  if (canonical === 'lab') return t('tasks.categories.lab');
  if (canonical === 'coursework') return t('tasks.categories.coursework');
  if (canonical === 'midterm') return t('tasks.categories.midterm');
  return t('tasks.categories.homework');
};

export default function Tasks({ user }) {
  const { t, lang } = useI18n();
  const [tasks, setTasks] = useState([]);
  const [grouped, setGrouped] = useState([]);
  const [activeSemester, setActiveSemester] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState(t('tasks.categories.all'));
  const [syncing, setSyncing] = useState(false);
  const [openSubject, setOpenSubject] = useState('');

  const allLabel = t('tasks.categories.all');

  const loadData = async () => {
    if (!user) return;

    const [storedTasks, syncData] = await Promise.all([
      getJson(`tasks_${user.email}`, []),
      getJson(`lms_last_sync_${user.email}`, null)
    ]);

    const lmsTasks = (Array.isArray(storedTasks) ? storedTasks : []).filter((task) => task.source === 'lms');
    const normalized = lmsTasks
      .map((task) => ({
        ...task,
        subject: task.subject || normalizeSubjectFromTask(task, t)
      }))
      .sort((a, b) => new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime());

    setTasks(normalized);
    setActiveSemester(syncData?.activeSemester || '');

    const bySubjectMap = new Map();
    normalized.forEach((task) => {
      const subject = task.subject || normalizeSubjectFromTask(task, t);
      if (!bySubjectMap.has(subject)) bySubjectMap.set(subject, []);
      bySubjectMap.get(subject).push(task);
    });

    const getUpcomingDeadline = (items) => {
      const now = Date.now();
      return items
        .map((task) => new Date(task.deadline || 0).getTime())
        .filter((time) => Number.isFinite(time) && time >= now)
        .sort((a, b) => a - b)[0] ?? null;
    };

    const getLatestDeadline = (items) => {
      return items
        .map((task) => new Date(task.deadline || 0).getTime())
        .filter((time) => Number.isFinite(time))
        .sort((a, b) => b - a)[0] ?? 0;
    };

    const groupedSubjects = Array.from(bySubjectMap.entries())
      .map(([subject, list]) => ({
        subject,
        tasks: list.sort((a, b) => new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime())
      }))
      .sort((a, b) => {
        const aUpcoming = getUpcomingDeadline(a.tasks);
        const bUpcoming = getUpcomingDeadline(b.tasks);

        if (aUpcoming !== null && bUpcoming !== null) return aUpcoming - bUpcoming;
        if (aUpcoming !== null) return -1;
        if (bUpcoming !== null) return 1;

        const aLatest = getLatestDeadline(a.tasks);
        const bLatest = getLatestDeadline(b.tasks);
        if (aLatest !== bLatest) return bLatest - aLatest;

        return a.subject.localeCompare(b.subject);
      });

    setGrouped(groupedSubjects);

    if (!openSubject && groupedSubjects.length) {
      setOpenSubject(groupedSubjects[0].subject);
    }
  };

  useEffect(() => {
    setSubjectFilter(allLabel);
  }, [allLabel]);

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

  const subjects = useMemo(() => {
    const set = new Set();
    tasks.forEach((task) => {
      const subject = task.subject || normalizeSubjectFromTask(task, t);
      if (subject) set.add(subject);
    });
    return [allLabel, ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [tasks, allLabel]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const byCategory = activeCategory === 'all' || categoryToCanonical(task.category || '') === activeCategory;
      const taskSubject = task.subject || normalizeSubjectFromTask(task, t);
      const bySubject = subjectFilter === allLabel || taskSubject === subjectFilter;
      return byCategory && bySubject;
    });
  }, [tasks, activeCategory, subjectFilter, allLabel, t]);

  const stats = useMemo(() => {
    const open = filteredTasks.filter((task) => !task.completed);
    return {
      total: open.length,
      urgent: open.filter((task) => (task.priority || 'medium') === 'high').length
    };
  }, [filteredTasks]);

  return (
    <div>
      <div className="flex-between mb-2">
        <h1 className="text-gradient">{t('tasks.title')}</h1>
        <button
          onClick={syncLms}
          disabled={syncing}
          className="glass-panel p-2 flex-center"
          style={{ border: 'none', background: 'rgba(0,209,255,0.12)', color: 'var(--accent-primary)', cursor: 'pointer' }}
          title={t('common.sync')}
        >
          <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
        </button>
      </div>

      <p className="text-secondary text-sm mb-1">{t('tasks.subtitle')}</p>
      <p className="text-xs text-secondary mb-3">{t('tasks.activeSemester')}: {activeSemester || t('common.unknown')}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '12px' }}>
        <div className="glass-panel p-3" style={{ background: 'rgba(0,209,255,0.12)' }}>
          <p className="text-xs text-secondary">{t('tasks.activeTasks')}</p>
          <p className="font-semibold mt-1">{stats.total}</p>
        </div>
        <div className="glass-panel p-3" style={{ background: 'rgba(239,68,68,0.12)' }}>
          <p className="text-xs text-secondary">{t('tasks.urgent')}</p>
          <p className="font-semibold mt-1">{stats.urgent}</p>
        </div>
      </div>

      <div className="glass-panel p-2 mb-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {categoryTabs.map((tabId) => (
            <button
              key={tabId}
              onClick={() => setActiveCategory(tabId)}
              style={{
                border: `1px solid ${activeCategory === tabId ? 'rgba(0,209,255,0.45)' : 'var(--border-color)'}`,
                background: activeCategory === tabId ? 'rgba(0,209,255,0.18)' : 'rgba(255,255,255,0.03)',
                color: activeCategory === tabId ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderRadius: '16px',
                padding: '6px 12px',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {canonicalToLabel(tabId, t)}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel p-2 mb-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {subjects.map((subject) => (
            <button
              key={subject}
              onClick={() => setSubjectFilter(subject)}
              style={{
                border: `1px solid ${subjectFilter === subject ? 'rgba(34,197,94,0.45)' : 'var(--border-color)'}`,
                background: subjectFilter === subject ? 'rgba(34,197,94,0.16)' : 'rgba(255,255,255,0.03)',
                color: subjectFilter === subject ? 'var(--success)' : 'var(--text-secondary)',
                borderRadius: '16px',
                padding: '6px 12px',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {subject}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-column gap-2">
        {filteredTasks.length ? (
          grouped
            .filter((groupItem) => {
              if (subjectFilter !== allLabel && groupItem.subject !== subjectFilter) return false;
              const hasCategory = groupItem.tasks.some((task) => activeCategory === 'all' || categoryToCanonical(task.category || '') === activeCategory);
              return hasCategory;
            })
            .map((groupItem) => {
              const subjectTasks = groupItem.tasks.filter((task) => activeCategory === 'all' || categoryToCanonical(task.category || '') === activeCategory);
              const isOpen = openSubject === groupItem.subject;

              return (
                <div key={groupItem.subject} className="glass-panel p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <button
                    onClick={() => setOpenSubject((prev) => (prev === groupItem.subject ? '' : groupItem.subject))}
                    className="w-full"
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div className="flex-between" style={{ alignItems: 'center', gap: '8px' }}>
                      <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
                        <BookOpenCheck size={15} color="var(--accent-primary)" />
                        <span className="font-semibold text-sm">{groupItem.subject}</span>
                      </div>
                      <div className="flex-center" style={{ gap: '6px' }}>
                        <span className="text-xs text-secondary">{t('tasks.countTasks', { count: subjectTasks.length })}</span>
                        <ChevronRight size={14} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .2s ease' }} />
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="flex-column gap-2 mt-3">
                      {subjectTasks.map((task) => (
                        <div key={task.id} className="glass-panel p-3" style={{ background: 'rgba(0,0,0,0.18)', borderLeft: `4px solid ${priorityColor(task.priority)}` }}>
                          <div className="flex-between" style={{ alignItems: 'flex-start', gap: '8px' }}>
                            <div>
                              <p className="font-semibold text-sm">{task.title}</p>
                              <p className="text-xs text-secondary mt-1">{canonicalToLabel(categoryToCanonical(task.category || ''), t)}</p>
                            </div>
                            <span className="text-xs" style={{ color: priorityColor(task.priority), fontWeight: 700 }}>
                              {countdownLabel(task.deadline, t)}
                            </span>
                          </div>

                          <p className="text-xs text-secondary mt-2 flex-center" style={{ justifyContent: 'flex-start', gap: '6px' }}>
                            <Clock size={12} /> {t('tasks.deadline')}: {formatDateTime(task.deadline, lang)}
                          </p>

                          {!!task.link && (
                            <a
                              href={task.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs mt-2 flex-center"
                              style={{ justifyContent: 'flex-start', gap: '6px', color: 'var(--info)', textDecoration: 'none' }}
                            >
                              <ExternalLink size={12} /> {t('tasks.openLms')}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
        ) : (
          <div className="glass-panel p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-center text-secondary text-sm">{t('tasks.noFiltered')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
