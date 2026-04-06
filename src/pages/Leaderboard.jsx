import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, Medal, Award, RefreshCw, Crown } from 'lucide-react';
import { lmsService } from '../services/lmsService';
import { getJson } from '../services/storageService';
import { useI18n } from '../i18n';

export default function Leaderboard({ user }) {
  const { t } = useI18n();
  const [rows, setRows] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data.ok && Array.isArray(data.users) && data.users.length > 0) {
        setRows(data.users);
      } else {
        const list = await getJson('leaderboard_users', []);
        setRows(Array.isArray(list) ? list : []);
      }
    } catch(e) {
      console.error('Failed to load global leaderboard, falling back to local', e);
      const list = await getJson('leaderboard_users', []);
      setRows(Array.isArray(list) ? list : []);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const refresh = async () => {
    if (!user?.isLms || syncing) return;
    setSyncing(true);
    try {
      await lmsService.syncAll(user.email);
      await load();
    } finally {
      setSyncing(false);
    }
  };

  const userIndex = useMemo(() => rows.findIndex((item) => item.userEmail === user?.email), [rows, user]);
  
  // Keep only top 50
  const topRows = useMemo(() => rows.slice(0, 50), [rows]);

  const top3 = topRows.slice(0, 3);
  const rest = topRows.slice(3);

  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <div style={{ paddingBottom: '80px', overflow: 'hidden', position: 'relative' }}>
      
      {/* Header */}
      <div className="flex-between mb-4">
        <div>
          <h1 className="text-gradient" style={{ fontSize: '26px', fontWeight: 800 }}>{t('leaderboard.title')}</h1>
          <p className="text-secondary text-xs mt-1">{t('leaderboard.subtitle')}</p>
        </div>
        <button
          onClick={refresh} disabled={syncing}
          className="glass-panel p-2 flex-center"
          style={{ width: 44, height: 44, border: 'none', background: 'rgba(16,185,129,0.15)', color: '#10b981', cursor: 'pointer', borderRadius: '50%' }}
        >
          <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
        </button>
      </div>

      {userIndex >= 0 && (
        <div className="glass-panel p-3 mb-2 flex-between" style={{ background: 'rgba(34,211,238,0.08)', borderColor: 'rgba(34,211,238,0.25)', borderRadius: '16px' }}>
          <div>
            <p className="text-xs text-secondary">{t('leaderboard.yourRank')}</p>
            <p className="font-bold text-md mt-1" style={{ color: '#22d3ee' }}>#{userIndex + 1} <span style={{ fontSize: '12px', color: 'var(--glass-text-muted)', fontWeight: 'normal' }}>/ {rows.length}</span></p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="text-xs text-secondary">Sizning balingiz</p>
            <p className="font-bold text-md mt-1" style={{ color: "var(--text-primary)" }}>{rows[userIndex]?.rating || 0}</p>
          </div>
        </div>
      )}

      {/* Podium */}
      {top3.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '10px', marginTop: '20px', marginBottom: '30px', position: 'relative' }}>
          
          {/* 2nd Place */}
          {top3[1] && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', paddingBottom: '10px', transform: 'none' }}>
              <div style={{ position: 'relative', width: 70, height: 70 }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', border: '3px solid #0ea5e9', boxShadow: '0 0 15px rgba(14,165,233,0.3)' }}>
                  {getInitials(top3[1].name)}
                </div>
                <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', background: '#0ea5e9', color: "var(--text-primary)", width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', border: '2px solid var(--bg-main)' }}>2</div>
              </div>
              <p className="font-semibold mt-3" style={{ fontSize: '13px', textAlign: 'center', lineHeight: 1.1, height: '30px', overflow: 'hidden' }}>{top3[1].name}</p>
              <p style={{ fontSize: '15px', color: '#38bdf8', fontWeight: 'bold', marginTop: '4px' }}>{top3[1].rating || 0}</p>
              <p style={{ fontSize: '10px', color: 'var(--glass-text-muted)', marginTop: '2px' }}>@{top3[1].group || 'TATU'}</p>
            </div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 10, transform: 'none' }}>
              <Crown size={36} color="#facc15" style={{ marginBottom: '-8px', filter: 'drop-shadow(0 0 8px rgba(250,204,21,0.6))', zIndex: 2 }} />
              <div style={{ position: 'relative', width: 96, height: 96 }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #facc15, #fef08a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a', border: '3px solid #facc15', boxShadow: '0 0 20px rgba(250,204,21,0.4)' }}>
                  {getInitials(top3[0].name)}
                </div>
                <div style={{ position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)', background: '#facc15', color: '#1a1a1a', width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', border: '2px solid var(--bg-main)' }}>1</div>
              </div>
              <p className="font-semibold mt-4" style={{ fontSize: '15px', textAlign: 'center', lineHeight: 1.2, height: '36px', overflow: 'hidden' }}>{top3[0].name}</p>
              <p style={{ fontSize: '20px', color: '#facc15', fontWeight: 'bold', marginTop: '2px' }}>{top3[0].rating || 0}</p>
              <p style={{ fontSize: '11px', color: 'var(--glass-text-muted)', marginTop: '2px' }}>@{top3[0].group || 'TATU'}</p>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', paddingBottom: '10px', transform: 'none' }}>
              <div style={{ position: 'relative', width: 70, height: 70 }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', border: '3px solid #10b981', boxShadow: '0 0 15px rgba(16,185,129,0.3)' }}>
                  {getInitials(top3[2].name)}
                </div>
                <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: "var(--text-primary)", width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', border: '2px solid var(--bg-main)' }}>3</div>
              </div>
              <p className="font-semibold mt-3" style={{ fontSize: '13px', textAlign: 'center', lineHeight: 1.1, height: '30px', overflow: 'hidden' }}>{top3[2].name}</p>
              <p style={{ fontSize: '15px', color: '#34d399', fontWeight: 'bold', marginTop: '4px' }}>{top3[2].rating || 0}</p>
              <p style={{ fontSize: '10px', color: 'var(--glass-text-muted)', marginTop: '2px' }}>@{top3[2].group || 'TATU'}</p>
            </div>
          )}
        </div>
      )}

      {/* Rest List Section */}
      <div style={{ background: 'var(--glass-bg)', borderRadius: '24px 24px 0 0', padding: '20px', margin: '0 -20px 0 -20px' }}>
        {!topRows.length ? (
            <p className="text-center text-secondary text-sm mt-4">{t('leaderboard.empty')}</p>
        ) : (
          <div className="flex-column gap-1">
            {rest.map((row, index) => {
              const isMe = row.userEmail === user?.email;
              const rank = index + 4;
              
              return (
                <div 
                  key={row.userEmail} 
                  className="flex-between py-3" 
                  style={{ 
                    borderBottom: '1px solid var(--glass-border)', 
                    padding: '12px 10px', 
                    borderRadius: '12px',
                    background: isMe ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
                    border: isMe ? '1px solid rgba(34, 211, 238, 0.3)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--glass-text-muted)', width: '24px', textAlign: 'center' }}>{rank}</span>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--glass-lightbg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 'bold', color: "var(--text-primary)" }}>
                      {getInitials(row.name)}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ fontSize: '14px', color: "var(--text-primary)" }}>{row.name} {isMe && <span style={{ color: '#22d3ee', fontSize: '12px', marginLeft: '4px' }}>(Siz)</span>}</p>
                      <p className="text-secondary" style={{ fontSize: '11px', marginTop: '2px' }}>@{row.group || 'Guruhsiz'} | {row.course ? `${row.course}-kurs` : '?'}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: '10px' }}>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{row.rating || 0}</p>
                    <p style={{ fontSize: '10px', color: 'var(--glass-text-muted)', marginTop: '2px' }}>gpa: {row.gpa || 0}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {!!topRows.length && (
          <p className="text-xs text-secondary mt-5 mb-4 text-center">
            {t('leaderboard.showing', { count: topRows.length })}
          </p>
        )}
      </div>
    </div>
  );
}
