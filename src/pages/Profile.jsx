import React, { useEffect, useMemo, useState } from 'react';
import { GraduationCap, MapPin, UserRound, WalletCards, RefreshCw } from 'lucide-react';
import { lmsService } from '../services/lmsService';
import { getJson } from '../services/storageService';
import { useI18n } from '../i18n';

const profileItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '10px',
  fontSize: '12px',
  color: 'var(--text-secondary)'
};

export default function Profile({ user }) {
  const { t } = useI18n();
  const [profile, setProfile] = useState(null);
  const [activeSemester, setActiveSemester] = useState('');
  const [lastSync, setLastSync] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    if (!user) return;
    const [profileData, syncData] = await Promise.all([
      getJson(`profile_${user.email}`, null),
      getJson(`lms_last_sync_${user.email}`, null)
    ]);
    setProfile(profileData);
    setLastSync(syncData?.at || null);
    setActiveSemester(syncData?.activeSemester || '');
  };

  useEffect(() => {
    load();
  }, [user]);

  const refreshProfile = async () => {
    if (!user?.isLms || syncing) return;
    setSyncing(true);
    try {
      await lmsService.syncAll(user.email);
      await load();
    } finally {
      setSyncing(false);
    }
  };

  const cards = useMemo(() => {
    if (!profile) return [];
    return [
      { id: 'name', icon: <UserRound size={16} />, label: t('profile.labels.fio'), value: profile.fullName || '--' },
      { id: 'group', icon: <WalletCards size={16} />, label: t('profile.labels.group'), value: profile.group || '--' },
      { id: 'course', icon: <GraduationCap size={16} />, label: t('profile.labels.course'), value: profile.course ? String(profile.course) : '--' },
      { id: 'direction', icon: <MapPin size={16} />, label: t('profile.labels.direction'), value: profile.direction || '--' }
    ];
  }, [profile]);

  return (
    <div>
      <div className="flex-between mb-2">
        <h1 className="text-gradient">{t('profile.title')}</h1>
        {user?.isLms && (
          <button
            onClick={refreshProfile}
            disabled={syncing}
            className="glass-panel p-2 flex-center"
            style={{ border: 'none', background: 'rgba(255,255,255,0.06)', color: 'white', cursor: 'pointer' }}
            title={t('common.sync')}
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      <p className="text-secondary text-sm mb-4">{t('profile.subtitle')}</p>

      <div className="glass-panel p-4 mb-4" style={{ background: 'rgba(0,255,200,0.06)', borderColor: 'rgba(0,255,200,0.25)' }}>
        <p className="text-xs text-secondary">{t('profile.lastSync')}</p>
        <p className="text-sm mt-1">{lastSync ? new Date(lastSync).toLocaleString('uz-UZ') : t('profile.noSync')}</p>
        <p className="text-xs text-secondary mt-2">{t('profile.activeSemester')}: {activeSemester || t('common.unknown')}</p>
      </div>

      <div className="flex-column gap-3 mb-4">
        {cards.map((item) => (
          <div key={item.id} className="glass-panel p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
              <span style={{ color: 'var(--accent-primary)' }}>{item.icon}</span>
              <span className="text-xs text-secondary">{item.label}</span>
            </div>
            <p className="text-sm font-semibold mt-2">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="flex-column gap-2">
          <p style={profileItemStyle}>{t('profile.labels.birthDate')} <span style={{ color: 'var(--text-primary)' }}>{profile?.birthDate || '--'}</span></p>
          <p style={profileItemStyle}>{t('profile.labels.gender')} <span style={{ color: 'var(--text-primary)' }}>{profile?.gender || '--'}</span></p>
          <p style={profileItemStyle}>{t('profile.labels.recordBook')} <span style={{ color: 'var(--text-primary)' }}>{profile?.recordBook || '--'}</span></p>
          <p style={profileItemStyle}>{t('profile.labels.degree')} <span style={{ color: 'var(--text-primary)' }}>{profile?.degree || '--'}</span></p>
          <p style={profileItemStyle}>{t('profile.labels.language')} <span style={{ color: 'var(--text-primary)' }}>{profile?.language || '--'}</span></p>
          <p style={profileItemStyle}>{t('profile.labels.educationType')} <span style={{ color: 'var(--text-primary)' }}>{profile?.educationType || '--'}</span></p>
          <p style={profileItemStyle}>{t('profile.labels.curator')} <span style={{ color: 'var(--text-primary)' }}>{profile?.curator || '--'}</span></p>
          <p style={profileItemStyle}>{t('profile.labels.scholarship')} <span style={{ color: 'var(--text-primary)' }}>{profile?.scholarship || '--'}</span></p>
          <p style={profileItemStyle}>{t('profile.labels.permanentAddress')} <span style={{ color: 'var(--text-primary)', textAlign: 'right' }}>{profile?.permanentAddress || '--'}</span></p>
          <p style={profileItemStyle}>{t('profile.labels.currentAddress')} <span style={{ color: 'var(--text-primary)', textAlign: 'right' }}>{profile?.currentAddress || '--'}</span></p>
        </div>
      </div>
    </div>
  );
}
