import React, { useState } from 'react';
import { ChevronLeft, LogOut, Globe, Moon, Database, Trash2, Info, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import TelegramLink from '../components/TelegramLink';

export default function Settings({ user, onLogout }) {
  const navigate = useNavigate();
  const { lang, changeLanguage, t, theme, changeTheme } = useI18n();
  const [clearing, setClearing] = useState(false);

  const clearCache = () => {
    if (window.confirm(t('settings.confirmClear'))) {
      setClearing(true);
      const keys = Object.keys(localStorage);
      for(let key of keys) {
         if (!['currentUser', 'lms_user', `lang_${user?.email}`, 'leaderboard_users'].includes(key)) {
             localStorage.removeItem(key);
         }
      }
      setTimeout(() => {
        setClearing(false);
        alert(t('settings.cleared'));
      }, 600);
    }
  };

  return (
    <div style={{ paddingBottom: '20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div className="flex-between mb-4">
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '10px 0' }}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700 }}>{t('settings.title')}</h1>
        <div style={{ width: 24 }}></div>
      </div>

      <div className="flex-column gap-3">
        
        {/* Account Info */}
        <div className="glass-panel p-4" style={{ borderRadius: '16px', background: 'var(--bg-card)' }}>
          <p className="text-xs mb-3 uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('settings.profileInfo')}</p>
          <div className="flex-between" style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
             <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{t('settings.regName')}</span>
             <span className="font-semibold" style={{ color: 'var(--accent-primary)', fontSize: '14px' }}>{user?.name || user?.email || '--'}</span>
          </div>
          <div className="flex-between" style={{ paddingTop: '12px' }}>
             <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{t('settings.sysId')}</span>
             <span className="font-semibold text-secondary" style={{ fontSize: '14px' }}>{user?.email || '--'}</span>
          </div>
        </div>

        {/* Global Configuration */}
        <div className="glass-panel p-4" style={{ borderRadius: '16px', background: 'var(--bg-card)' }}>
          <p className="text-xs mb-3 uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('settings.sysConfig')}</p>
          
          <div className="flex-between py-2 mb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex-center" style={{ gap: '10px' }}>
              <Globe size={18} className="text-secondary" />
              <span style={{ fontSize: '15px' }}>{t('settings.appLang')}</span>
            </div>
            <div className="flex-center gap-2">
               <button 
                 onClick={() => changeLanguage('uz')} 
                 className="flex-center" 
                 style={{ border: 'none', cursor: 'pointer', background: lang === 'uz' ? 'rgba(34,211,238,0.15)' : 'rgba(128,128,128,0.1)', color: lang === 'uz' ? '#22d3ee' : 'var(--text-primary)', padding: '6px 12px', borderRadius: '8px', fontWeight: 600, fontSize: '12px', transition: '0.2s' }}
               >
                 UZ {lang === 'uz' && <Check size={14} style={{ marginLeft: 4 }}/>}
               </button>
               <button 
                 onClick={() => changeLanguage('ru')} 
                 className="flex-center" 
                 style={{ border: 'none', cursor: 'pointer', background: lang === 'ru' ? 'rgba(34,211,238,0.15)' : 'rgba(128,128,128,0.1)', color: lang === 'ru' ? '#22d3ee' : 'var(--text-primary)', padding: '6px 12px', borderRadius: '8px', fontWeight: 600, fontSize: '12px', transition: '0.2s' }}
               >
                 RU {lang === 'ru' && <Check size={14} style={{ marginLeft: 4 }}/>}
               </button>
            </div>
          </div>

          <div className="flex-between py-2 mb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex-center" style={{ gap: '10px' }}>
              <Moon size={18} className="text-secondary" />
              <span style={{ fontSize: '15px' }}>{t('settings.theme')}</span>
            </div>
            <div className="flex-center gap-2">
               <button 
                 onClick={() => changeTheme('dark')} 
                 className="flex-center" 
                 style={{ border: 'none', cursor: 'pointer', background: theme === 'dark' ? 'rgba(34,211,238,0.15)' : 'rgba(128,128,128,0.1)', color: theme === 'dark' ? '#22d3ee' : 'var(--text-primary)', padding: '6px 10px', borderRadius: '8px', fontWeight: 600, fontSize: '11px', transition: '0.2s' }}
               >
                 {t('settings.themeDark')} {theme === 'dark' && <Check size={14} style={{ marginLeft: 4 }}/>}
               </button>
               <button 
                 onClick={() => changeTheme('light')} 
                 className="flex-center" 
                 style={{ border: 'none', cursor: 'pointer', background: theme === 'light' ? 'rgba(34,211,238,0.15)' : 'rgba(128,128,128,0.1)', color: theme === 'light' ? '#22d3ee' : 'var(--text-primary)', padding: '6px 10px', borderRadius: '8px', fontWeight: 600, fontSize: '11px', transition: '0.2s' }}
               >
                 {t('settings.themeLight')} {theme === 'light' && <Check size={14} style={{ marginLeft: 4 }}/>}
               </button>
            </div>
          </div>

          <div className="flex-between py-2">
            <div className="flex-center" style={{ gap: '10px' }}>
              <Database size={18} className="text-secondary" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '15px' }}>{t('settings.clearCache')}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 2 }}>{t('settings.clearCacheDesc')}</span>
              </div>
            </div>
            <button 
               onClick={clearCache} disabled={clearing}
               className="flex-center" 
               style={{ border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '8px 12px', borderRadius: '8px', fontWeight: 600, fontSize: '12px' }}
             >
               {clearing ? t('settings.clearing') : <Trash2 size={16} />}
             </button>
          </div>

        </div>

        {/* Telegram Bot */}
        <p className="text-xs uppercase tracking-wider font-semibold mt-2" style={{ color: 'var(--text-secondary)' }}>{t('settings.notifications')}</p>
        <TelegramLink user={user} />

        {/* Info */}
        <div className="glass-panel p-4" style={{ borderRadius: '16px', background: 'var(--bg-card)' }}>
          <p className="text-xs mb-3 uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('settings.about')}</p>
          <div className="flex-between mb-3" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
             <div className="flex-center" style={{ gap: '10px' }}><Info size={18} className="text-secondary" /><span>{t('settings.version')}</span></div>
             <span className="font-semibold text-secondary">v2.1.0</span>
          </div>
          <div className="flex-between" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
             <div className="flex-center" style={{ gap: '10px' }}><Info size={18} className="text-secondary" /><span>{t('settings.backendStatus')}</span></div>
             <span className="font-semibold" style={{ color: '#10b981' }}>{t('settings.online')}</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="glass-panel p-3 flex-center mt-2"
          style={{ border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', gap: '8px', cursor: 'pointer', borderRadius: '16px', width: '100%', fontSize: '15px', fontWeight: 'bold' }}
        >
          <LogOut size={20} />
          {t('settings.logout')}
        </button>

      </div>
    </div>
  );
}
