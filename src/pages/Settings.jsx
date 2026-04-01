import React, { useState } from 'react';
import { ChevronLeft, LogOut, Globe, Moon, Database, Trash2, Info, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import TelegramLink from '../components/TelegramLink';

export default function Settings({ user, onLogout }) {
  const navigate = useNavigate();
  const { lang, changeLanguage } = useI18n();
  const [clearing, setClearing] = useState(false);

  const clearCache = () => {
    if (window.confirm('Haqiqatdan ham barcha oflayn kesh ma`lumotlarni tozalaysizmi? (Kiritilgan sozlamalar saqlab qolinadi)')) {
      setClearing(true);
      const keys = Object.keys(localStorage);
      for(let key of keys) {
         if (!['currentUser', 'lms_user', `lang_${user?.email}`, 'leaderboard_users'].includes(key)) {
             localStorage.removeItem(key);
         }
      }
      setTimeout(() => {
        setClearing(false);
        alert('Ma`lumotlar xotiradan muvaffaqiyatli tozalandi!');
      }, 600);
    }
  };

  return (
    <div style={{ paddingBottom: '20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div className="flex-between mb-4">
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '10px 0' }}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Sozlamalar</h1>
        <div style={{ width: 24 }}></div>
      </div>

      <div className="flex-column gap-3">
        
        {/* Account Info */}
        <div className="glass-panel p-4" style={{ borderRadius: '16px', background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-xs mb-3 uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>Profil ma'lumotlari</p>
          <div className="flex-between" style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
             <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Ro'yxatdan o'tgan nom:</span>
             <span className="font-semibold" style={{ color: '#22d3ee', fontSize: '14px' }}>{user?.name || user?.email || '--'}</span>
          </div>
          <div className="flex-between" style={{ paddingTop: '12px' }}>
             <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Tizim ID (LMS):</span>
             <span className="font-semibold text-secondary" style={{ fontSize: '14px' }}>{user?.email || '--'}</span>
          </div>
        </div>

        {/* Global Configuration */}
        <div className="glass-panel p-4" style={{ borderRadius: '16px', background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-xs mb-3 uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>Tizim moslamalari</p>
          
          <div className="flex-between py-2 mb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex-center" style={{ gap: '10px' }}>
              <Globe size={18} className="text-secondary" />
              <span style={{ fontSize: '15px' }}>Ilova Tili</span>
            </div>
            <div className="flex-center gap-2">
               <button 
                 onClick={() => changeLanguage('uz')} 
                 className="flex-center" 
                 style={{ border: 'none', cursor: 'pointer', background: lang === 'uz' ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.05)', color: lang === 'uz' ? '#22d3ee' : 'white', padding: '6px 12px', borderRadius: '8px', fontWeight: 600, fontSize: '12px', transition: '0.2s' }}
               >
                 UZ {lang === 'uz' && <Check size={14} style={{ marginLeft: 4 }}/>}
               </button>
               <button 
                 onClick={() => changeLanguage('ru')} 
                 className="flex-center" 
                 style={{ border: 'none', cursor: 'pointer', background: lang === 'ru' ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.05)', color: lang === 'ru' ? '#22d3ee' : 'white', padding: '6px 12px', borderRadius: '8px', fontWeight: 600, fontSize: '12px', transition: '0.2s' }}
               >
                 RU {lang === 'ru' && <Check size={14} style={{ marginLeft: 4 }}/>}
               </button>
            </div>
          </div>

          <div className="flex-between py-2 mb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex-center" style={{ gap: '10px' }}>
              <Moon size={18} className="text-secondary" />
              <span style={{ fontSize: '15px' }}>Dizayn Mavzusi</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
              Faqat Dark mode
            </div>
          </div>

          <div className="flex-between py-2">
            <div className="flex-center" style={{ gap: '10px' }}>
              <Database size={18} className="text-secondary" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '15px' }}>Oflayn keshni tozalash</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Dastur xotirani ko'p band qilsa</span>
              </div>
            </div>
            <button 
               onClick={clearCache} disabled={clearing}
               className="flex-center" 
               style={{ border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '8px 12px', borderRadius: '8px', fontWeight: 600, fontSize: '12px' }}
             >
               {clearing ? 'Tozalanmoqda...' : <Trash2 size={16} />}
             </button>
          </div>

        </div>

        {/* Telegram Bot */}
        <p className="text-xs uppercase tracking-wider font-semibold mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Bildirishnomalar</p>
        <TelegramLink user={user} />

        {/* Info */}
        <div className="glass-panel p-4" style={{ borderRadius: '16px', background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-xs mb-3 uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>Dastur haqida</p>
          <div className="flex-between mb-3" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
             <div className="flex-center" style={{ gap: '10px' }}><Info size={18} className="text-secondary" /><span>Loyiha versiyasi</span></div>
             <span className="font-semibold text-secondary">v2.1.0</span>
          </div>
          <div className="flex-between" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
             <div className="flex-center" style={{ gap: '10px' }}><Info size={18} className="text-secondary" /><span>LMS Server (Backend)</span></div>
             <span className="font-semibold" style={{ color: '#10b981' }}>Faol (Online)</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="glass-panel p-3 flex-center mt-2"
          style={{ border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', gap: '8px', cursor: 'pointer', borderRadius: '16px', width: '100%', fontSize: '15px', fontWeight: 'bold' }}
        >
          <LogOut size={20} />
          Hisobdan chiqish
        </button>

      </div>
    </div>
  );
}
