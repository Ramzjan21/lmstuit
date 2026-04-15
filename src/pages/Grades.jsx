import React, { useEffect, useMemo, useState } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { AlertTriangle, CheckCircle, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { lmsService } from '../services/lmsService';
import { getJson, setJson } from '../services/storageService';
import { useI18n } from '../i18n';
import { formatTime } from '../utils/dateUtils';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const scoreToPoint = (score) => {
  if (score >= 86) return 4;
  if (score >= 71) return 3;
  if (score >= 56) return 2;
  if (score >= 50) return 1;
  return 0;
};

const calculateGpa = (subjects) => {
  if (!subjects.length) return '0.00';

  let credits = 0;
  let points = 0;

  subjects.forEach((subject) => {
    const credit = Number(subject.credit || 0);
    const score = Number(subject.score || 0);
    credits += credit;
    points += scoreToPoint(score) * credit;
  });

  if (!credits) return '0.00';
  return (points / credits).toFixed(2);
};

const averageScore = (subjects) => {
  if (!subjects.length) return 0;
  const sum = subjects.reduce((acc, subject) => acc + Number(subject.score || 0), 0);
  return Math.round(sum / subjects.length);
};

const statusTone = (score) => {
  if (score >= 86) return { color: 'var(--success)', key: 'grades.high', icon: <TrendingUp size={12} /> };
  if (score >= 71) return { color: 'var(--info)', key: 'grades.good', icon: <CheckCircle size={12} /> };
  return { color: 'var(--danger)', key: 'grades.low', icon: <TrendingDown size={12} /> };
};

const getAttendanceRatio = (subject) => {
  const nb = Number(subject.nb || 0);
  const limit = Number(subject.limit || 0);
  if (!limit) return 0;
  return clamp((nb / limit) * 100, 0, 100);
};

export default function Grades({ user }) {
  const { t, lang } = useI18n();
  const [subjects, setSubjects] = useState([]);
  const [studyPlan, setStudyPlan] = useState({ gpa: null, semesters: [], activeSemester: '' });
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [autoRefreshOn, setAutoRefreshOn] = useState(true);
  const [lastRealtimeSync, setLastRealtimeSync] = useState(null);

  const syncLms = async () => {
    if (!user?.isLms || syncing) return;

    setSyncing(true);
    try {
      const data = await lmsService.syncGrades();
      if (Array.isArray(data)) {
        setSubjects(data);
        await setJson(`grades_${user.email}`, data);
      }

      const plan = await lmsService.syncStudyPlan();
      if (plan) {
        const syncMeta = await getJson(`lms_last_sync_${user.email}`, null);
        const normalizedPlan = {
          ...plan,
          activeSemester: plan?.activeSemester || syncMeta?.activeSemester || ''
        };
        setStudyPlan(normalizedPlan);
        await setJson(`studyplan_${user.email}`, normalizedPlan);
      }
      setLastRealtimeSync(new Date().toISOString());
    } finally {
      setSyncing(false);
    }
  };

  const syncRealtimeAttendance = async () => {
    if (!user?.isLms || syncing) return;
    setSyncing(true);
    try {
      await lmsService.syncGradesRealtime(user.email);

      const [storedGrades, storedPlan, syncData] = await Promise.all([
        getJson(`grades_${user.email}`, []),
        getJson(`studyplan_${user.email}`, { gpa: null, semesters: [], activeSemester: '' }),
        getJson(`lms_last_sync_${user.email}`, null)
      ]);

      setSubjects(Array.isArray(storedGrades) ? storedGrades : []);
      setStudyPlan(storedPlan || { gpa: null, semesters: [], activeSemester: '' });
      setLastRealtimeSync(syncData?.at || new Date().toISOString());
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      const [stored, storedPlan, syncData] = await Promise.all([
        getJson(`grades_${user.email}`, []),
        getJson(`studyplan_${user.email}`, { gpa: null, semesters: [], activeSemester: '' }),
        getJson(`lms_last_sync_${user.email}`, null)
      ]);
      setSubjects(Array.isArray(stored) ? stored : []);
      setStudyPlan({
        ...(storedPlan || { gpa: null, semesters: [], activeSemester: '' }),
        activeSemester: storedPlan?.activeSemester || syncData?.activeSemester || ''
      });
      setLastRealtimeSync(syncData?.at || null);
      setLoaded(true);
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (!loaded || !user) return;
    setJson(`grades_${user.email}`, subjects);
  }, [subjects, loaded, user]);

  useEffect(() => {
    if (loaded && user?.isLms && !subjects.length) {
      syncLms();
    }
  }, [loaded, subjects.length, user]);

  useEffect(() => {
    if (!loaded || !user?.isLms || !autoRefreshOn) return;
    const id = setInterval(() => {
      syncRealtimeAttendance();
    }, 60000);
    return () => clearInterval(id);
  }, [loaded, user, autoRefreshOn]);

  const gpa = useMemo(() => calculateGpa(subjects), [subjects]);
  const avg = useMemo(() => averageScore(subjects), [subjects]);
  const credits = useMemo(() => subjects.reduce((sum, subject) => sum + Number(subject.credit || 0), 0), [subjects]);
  const riskyAttendance = useMemo(() => subjects.filter((subject) => getAttendanceRatio(subject) >= 75), [subjects]);

  const semesterOverview = useMemo(() => {
    const semesters = Array.isArray(studyPlan?.semesters) ? studyPlan.semesters : [];
    const activeToken = String(studyPlan?.activeSemester || '').toLowerCase();
    return semesters
      .filter((semester) => {
        if (!activeToken) return true;
        return String(semester.semester || '').toLowerCase().includes(activeToken) ||
          activeToken.includes(String(semester.semester || '').toLowerCase());
      })
      .map((semester) => {
        const subjects = Array.isArray(semester.subjects) ? semester.subjects : [];
        const graded = subjects.filter((subject) => subject.grade5 !== null && subject.grade5 !== undefined);
        const avg5 = graded.length
          ? (graded.reduce((sum, subject) => sum + Number(subject.grade5 || 0), 0) / graded.length).toFixed(2)
          : null;

        return {
          semester: semester.semester,
          subjectCount: subjects.length,
          credits: semester.credits || subjects.reduce((sum, subject) => sum + Number(subject.credit || 0), 0),
          avg5
        };
      })
      .slice(0, 3);
  }, [studyPlan]);

  return (
    <div>
      <div className="flex-between mb-2">
        <h1 className="text-gradient">{t('grades.title')}</h1>
        <div className="flex-center gap-2">
          {user?.isLms && (
            <button
              onClick={syncRealtimeAttendance}
              disabled={syncing}
              className="glass-panel p-2 flex-center"
              style={{ border: 'none', background: 'rgba(0,209,255,0.12)', color: 'var(--accent-primary)', cursor: 'pointer' }}
              title={t('common.sync')}
            >
              <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            </button>
          )}
          {user?.isLms && (
            <button
              onClick={() => setAutoRefreshOn((prev) => !prev)}
              className="glass-panel p-2"
              style={{
                border: 'none',
                background: autoRefreshOn ? 'rgba(34,197,94,0.16)' : 'rgba(239,68,68,0.14)',
                color: autoRefreshOn ? 'var(--success)' : 'var(--danger)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700
              }}
              title="Auto refresh"
            >
              {autoRefreshOn ? t('grades.liveOn') : t('grades.liveOff')}
            </button>
          )}
        </div>
      </div>

      <p className="text-secondary text-sm mb-1">{t('grades.subtitle')}</p>
      <p className="text-xs text-secondary mb-1">{t('grades.activeSemester')}: {studyPlan?.activeSemester || t('common.unknown')}</p>
      <p className="text-xs text-secondary mb-4">{t('grades.lastLiveSync')}: {lastRealtimeSync ? formatTime(lastRealtimeSync, lang) : '--:--'}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px', marginBottom: '14px' }}>
        <div className="glass-panel p-3" style={{ background: 'rgba(99,102,241,0.12)' }}>
          <p className="text-xs text-secondary">{t('grades.gpa')}</p>
          <p className="font-semibold mt-1" style={{ color: 'var(--accent-primary)' }}>
            {gpa}
          </p>
        </div>
        <div className="glass-panel p-3" style={{ background: 'rgba(16,185,129,0.12)' }}>
          <p className="text-xs text-secondary">{t('grades.avgScore')}</p>
          <p className="font-semibold mt-1" style={{ color: 'var(--success)' }}>
            {avg}
          </p>
        </div>
        <div className="glass-panel p-3" style={{ background: 'rgba(245,158,11,0.12)' }}>
          <p className="text-xs text-secondary">{t('grades.credits')}</p>
          <p className="font-semibold mt-1" style={{ color: 'var(--warning)' }}>
            {credits}
          </p>
        </div>
      </div>

      {riskyAttendance.length > 0 && (
        <div
          className="glass-panel p-3 mb-4"
          style={{ border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.12)' }}
        >
          <p className="font-semibold text-sm flex-center" style={{ justifyContent: 'flex-start', gap: '6px' }}>
            <AlertTriangle size={14} color="var(--danger)" /> {t('grades.warning')}
          </p>
          <p className="text-xs text-secondary mt-1">
            {t('grades.warningDesc', { count: riskyAttendance.length })}
          </p>
        </div>
      )}

      {!!semesterOverview.length && (
        <div className="glass-panel p-3 mb-4" style={{ background: 'var(--glass-bg)' }}>
          <p className="font-semibold text-sm mb-2">{t('grades.semesterOverview')}</p>
          <div className="flex-column gap-2">
            {semesterOverview.map((semester) => (
              <div key={semester.semester} className="flex-between" style={{ gap: '8px' }}>
                <div>
                  <p className="text-xs font-medium">{semester.semester}</p>
                  <p className="text-xs text-secondary">{semester.subjectCount} {lang === 'ru' ? 'предметов' : 'fan'} | {semester.credits} {lang === 'ru' ? 'кредитов' : 'kredit'}</p>
                </div>
                <p className="text-xs" style={{ color: semester.avg5 ? 'var(--success)' : 'var(--text-secondary)' }}>
                  {semester.avg5 ? `Avg: ${semester.avg5}` : t('grades.noGrade')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-column gap-3">
        {subjects.length ? (
          subjects.map((subject) => {
            const percentScore = Number(subject.score || subject.attendancePercent || 0);
            const earned = subject.earned ?? null;
            const maxBall = subject.maxBall ?? null;
            const attendancePercent = subject.attendancePercent ?? null;
            const currentGrade = subject.currentGrade ?? null;
            const tone = statusTone(percentScore);
            const limit = Number(subject.limit || 0) || (subject.credit ? Math.max(4, Number(subject.credit) + 3) : 7);
            const nb = Number(subject.nb || 0);
            // Use nb/limit ratio for the progress bar (not attendancePercent which is score-based)
            const nbRatio = limit > 0 ? Math.min(100, (nb / limit) * 100) : 0;

            return (
              <div key={subject.id || subject.name} className="glass-panel p-4" style={{ background: 'var(--glass-bg)' }}>
                <div className="flex-between mb-3" style={{ alignItems: 'flex-start', gap: '10px' }}>
                  <div>
                    <p className="font-semibold text-sm">{subject.name}</p>
                    <p className="text-xs text-secondary mt-1">
                      {subject.semester ? `${subject.semester} | ` : ''}
                      {subject.credit || 0} {lang === 'ru' ? 'кредитов' : 'kredit'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span
                      className="text-xs flex-center"
                      style={{ gap: '4px', color: tone.color, fontWeight: 700, background: 'var(--glass-lightbg)', padding: '4px 8px', borderRadius: '999px' }}
                    >
                      {tone.icon} {t(tone.key)}
                    </span>
                    {currentGrade !== null && (
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {lang === 'ru' ? 'Оценка:' : 'Baho:'} <b style={{ color: currentGrade >= 4 ? 'var(--success)' : currentGrade >= 3 ? 'var(--warning)' : 'var(--danger)' }}>{currentGrade}/5</b>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-between" style={{ gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '70px', height: '70px' }}>
                    <CircularProgressbar
                      value={percentScore}
                      text={earned !== null && maxBall !== null ? `${earned}/${maxBall}` : `${percentScore}%`}
                      styles={buildStyles({
                        pathColor: tone.color,
                        textColor: 'var(--text-primary)',
                        trailColor: 'var(--glass-lightbg)',
                        textSize: earned !== null ? '18px' : '24px'
                      })}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    {/* Attendance (NB) row */}
                    <div className="flex-between mb-1">
                      <p className="text-xs text-secondary">{t('grades.attendance')}</p>
                      <p className="text-xs" style={{ color: nbRatio >= 75 ? 'var(--danger)' : 'var(--text-primary)', fontWeight: 700 }}>
                        {lang === 'ru' ? 'НБ:' : 'NB:'} {nb} / {limit}
                      </p>
                    </div>

                    <div style={{ width: '100%', height: '8px', background: 'var(--glass-lightbg)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${nbRatio}%`,
                          height: '100%',
                          background: nbRatio >= 75 ? 'var(--danger)' : nbRatio >= 50 ? 'var(--warning)' : 'var(--success)'
                        }}
                      />
                    </div>

                    {/* Score row */}
                    {attendancePercent !== null && (
                      <div className="flex-between mt-2">
                        <p className="text-xs text-secondary">{lang === 'ru' ? 'Успеваемость:' : 'O\'zlashtirish:'}</p>
                        <p className="text-xs font-semibold" style={{ color: attendancePercent >= 70 ? 'var(--success)' : attendancePercent >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                          {attendancePercent}%
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-secondary mt-1">{t('grades.attendanceRealtime')}</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-panel p-4">
            <p className="text-center text-secondary text-sm">{t('grades.noSubjects')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
