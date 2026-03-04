import React, { useState } from 'react';
import { Bell, BellOff, Sun, Moon, MapPin, Target, Mic, FileText, ChevronRight, Clock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard({ user, onLogout }) {
  const [dndActive, setDndActive] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const navigate = useNavigate();

  const firstName = user?.name ? user.name.split(' ')[0] : 'Talaba';

  return (
    <div>
      {/* Header & Motivation */}
      <div className="flex-between mb-5">
        <div>
          <h1 className="text-gradient" style={{fontSize: '28px', letterSpacing: '-0.5px'}}>Xayrli tong, {firstName}!</h1>
          <p className="text-secondary text-sm flex-center mt-1" style={{ justifyContent: 'flex-start', gap: '6px' }}>
            <Sun size={14} color="var(--warning)" /> Bugun o'rganish uchun ajoyib kun
          </p>
        </div>
        <div className="flex-center gap-2">
          <div 
            className="flex-center" 
            style={{ width: '40px', height: '40px', background: 'var(--bg-card)', borderRadius: '50%', cursor: 'pointer' }}
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          >
            {notificationsEnabled ? <Bell size={20} color="var(--accent-primary)" /> : <BellOff size={20} color="var(--text-tertiary)" />}
          </div>
          <div 
            className="flex-center" 
            style={{ width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', cursor: 'pointer' }}
            onClick={onLogout}
            title="Tizimdan chiqish"
          >
            <LogOut size={20} color="var(--danger)" />
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex-between gap-3 mb-6">
        <button 
          onClick={() => navigate('/library')}
          className="glass-panel p-3 flex-center flex-column gap-2" 
          style={{ flex: 1, padding: '16px', border: '1px solid rgba(99, 102, 241, 0.3)', background: 'linear-gradient(145deg, rgba(99,102,241,0.1) 0%, rgba(0,0,0,0) 100%)', cursor: 'pointer', transition: 'transform 0.2s' }}
        >
          <div style={{ background: 'var(--accent-primary)', padding: '10px', borderRadius: '50%', color: 'white', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}>
            <Mic size={20} />
          </div>
          <span className="text-xs font-semibold mt-1">Tezkor Qayd</span>
        </button>
        <button 
          onClick={() => navigate('/tasks')}
          className="glass-panel p-3 flex-center flex-column gap-2" 
          style={{ flex: 1, padding: '16px', border: '1px solid rgba(236, 72, 153, 0.3)', background: 'linear-gradient(145deg, rgba(236,72,153,0.1) 0%, rgba(0,0,0,0) 100%)', cursor: 'pointer', transition: 'transform 0.2s' }}
        >
          <div style={{ background: 'var(--accent-secondary)', padding: '10px', borderRadius: '50%', color: 'white', boxShadow: '0 4px 15px rgba(236,72,153,0.4)' }}>
            <Target size={20} />
          </div>
          <span className="text-xs font-semibold">Yangi Vazifa</span>
        </button>
      </div>

      {/* DND Suggestion */}
      {!dndActive && (
        <div className="glass-panel p-4 mb-6" style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.15) 0%, rgba(236,72,153,0.15) 100%)', border: '1px solid rgba(236,72,153,0.3)', position: 'relative', overflow: 'hidden' }}>
          <div style={{position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1, transform: 'rotate(15deg)'}}>
            <BellOff size={100} />
          </div>
          <div className="flex-between relative z-10">
            <div style={{ paddingRight: '10px' }}>
              <p className="font-semibold text-sm mb-1" style={{ lineHeight: '1.4' }}>Dars vaqti yaqinlashmoqda 🤫</p>
              <p className="text-xs text-secondary" style={{ lineHeight: '1.3' }}>Telefonni "Bezovta qilinmasin" rejimiga o'tkazaylikmi?</p>
            </div>
            <button 
              onClick={() => setDndActive(true)}
              style={{ background: 'var(--accent-gradient)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(236,72,153,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              Yoqish
            </button>
          </div>
        </div>
      )}

      {/* Today's Classes Summary */}
      <div className="flex-between items-end mb-3 mt-2">
        <h2 className="text-lg font-medium">Bugungi darslar <span className="text-xs text-secondary font-normal bg-card px-2 py-1 rounded-full ml-1" style={{background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px'}}>2 ta</span></h2>
        <button onClick={() => navigate('/timetable')} style={{background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center'}}>Barchasi <ChevronRight size={14} /></button>
      </div>
      
      <div className="flex-column gap-3 mb-6">
        <div className="glass-panel p-3 cursor-pointer hover:bg-card-hover transition" style={{ borderLeft: '4px solid var(--accent-primary)' }} onClick={() => navigate('/timetable')}>
          <div className="flex-between">
            <span className="font-semibold text-sm">Web Dasturlash (Amaliy)</span>
            <span className="text-xs font-bold text-accent-primary" style={{background: 'rgba(99,102,241,0.1)', padding: '4px 8px', borderRadius: '6px'}}>10:00 - 11:20</span>
          </div>
          <div className="flex-between mt-3">
            <span className="text-xs text-secondary flex-center gap-1"><MapPin size={12} color="var(--accent-primary)" /> B, 301-A xona</span>
            <span className="text-xs font-medium bg-card rounded px-2 py-1" style={{background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px'}}>1 soat qoldi</span>
          </div>
        </div>
        
        <div className="glass-panel p-3 cursor-pointer hover:bg-card-hover transition" style={{ borderLeft: '4px solid var(--success)' }} onClick={() => navigate('/timetable')}>
          <div className="flex-between">
            <span className="font-semibold text-sm">Fizika (Lab)</span>
            <span className="text-xs font-bold text-success" style={{background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: '6px'}}>13:30 - 14:50</span>
          </div>
          <div className="flex-between mt-3">
            <span className="text-xs text-secondary flex-center gap-1"><MapPin size={12} color="var(--success)" /> D, 102-xona</span>
            <span className="text-xs font-medium bg-card rounded px-2 py-1" style={{background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px'}}>4 soat qoldi</span>
          </div>
        </div>
      </div>

      {/* Today's Tasks Summary */}
      <div className="flex-between items-end mb-3">
        <h2 className="text-lg font-medium flex-center gap-2" style={{ justifyContent: 'flex-start' }}><Target size={18} color="var(--warning)" /> Topshirilishi kerak</h2>
        <button onClick={() => navigate('/tasks')} style={{background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center'}}>Barchasi <ChevronRight size={14} /></button>
      </div>
      
      <div className="glass-panel p-4 mb-3 cursor-pointer hover:bg-card-hover transition" style={{ borderLeft: '4px solid var(--warning)', position: 'relative', overflow: 'hidden' }} onClick={() => navigate('/tasks')}>
        <div style={{position: 'absolute', right: '-15px', bottom: '-15px', opacity: 0.05}}>
          <FileText size={80} />
        </div>
        <div className="relative z-10">
          <p className="font-semibold text-sm mb-1">Laboratoriya ishi #3 (Fizika)</p>
          <div className="flex-between mt-3">
            <span className="text-xs text-secondary bg-card rounded" style={{background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px'}}>Gacha: Bugun 23:59</span>
            <span className="text-xs font-bold text-warning flex-center gap-1" style={{background: 'rgba(245,158,11,0.1)', padding: '4px 8px', borderRadius: '4px'}}><Clock size={12} /> Bugun!</span>
          </div>
        </div>
      </div>

    </div>
  );
}
