import React, { useState, useEffect } from 'react';
import { differenceInCalendarWeeks } from 'date-fns';
import { Preferences } from '@capacitor/preferences';
import { MapPin, Phone, MessageCircle, ChevronDown, ChevronUp, Plus, Edit2, Trash2, X, RefreshCw } from 'lucide-react';
import { lmsService } from '../services/lmsService';

export default function Timetable({ user }) {
  const [isEvenWeek, setIsEvenWeek] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);
  const [syncing, setSyncing] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: "Ma'ruza",
    time: '',
    location: '',
    teacherName: '',
    teacherPhone: '',
    teacherTelegram: ''
  });
  
  const [schedule, setSchedule] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const syncLms = async () => {
    if (!user?.isLms) return;
    setSyncing(true);
    const data = await lmsService.syncSchedule();
    if (data) {
      // Flatten the timetable object into the array format used by the component
      const flattened = [];
      Object.entries(data).forEach(([day, lessons]) => {
        lessons.forEach(l => {
          flattened.push({
            id: Math.random().toString(36).substr(2, 9),
            name: l.subject,
            type: l.type,
            time: l.time,
            location: l.room,
            day: day, // Store day for filtering if needed
            geo: "https://maps.google.com/?q=TUIT,Tashkent",
            teacher: { name: l.teacher, phone: '', telegram: '' }
          });
        });
      });
      setSchedule(flattened);
    }
    setSyncing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        const { value } = await Preferences.get({ key: `timetable_${user.email}` });
        if (value) {
          setSchedule(JSON.parse(value));
        } else if (user.isLms) {
          await syncLms();
        } else {
          setSchedule([
            {
              id: 1,
              name: "Ma'lumotlar bazasi",
              type: "Ma'ruza",
              time: "08:30 - 09:50",
              location: "Bino: Asosiy, 2-qavat, 215-xona",
              geo: "https://maps.google.com/?q=TUIT,Tashkent",
              teacher: { name: "Prof. Aliyev D.", phone: "+998 90 123 45 67", telegram: "https://t.me/aliyev_db" }
            },
            {
              id: 2,
              name: "Web Dasturlash",
              type: "Amaliyot",
              time: "10:00 - 11:20",
              location: "Bino: B, 3-qavat, 301-A",
              geo: "https://maps.google.com/?q=TUIT,Tashkent",
              teacher: { name: "O'qit. Karimov S.", phone: "+998 90 987 65 43", telegram: "https://t.me/karimov_web" }
            }
          ]);
        }
      }
      setLoaded(true);
    };
    loadData();
  }, [user]);

  useEffect(() => {
    if (loaded && user) {
      Preferences.set({ key: `timetable_${user.email}`, value: JSON.stringify(schedule) });
    }
  }, [schedule, user, loaded]);

  useEffect(() => {
    const semesterStart = new Date('2026-02-09'); 
    const current = new Date();
    const weeksDiff = differenceInCalendarWeeks(current, semesterStart, { weekStartsOn: 1 });
    setIsEvenWeek(weeksDiff % 2 === 0);
  }, []);

  const handleOpenModal = (cls = null) => {
    if (cls) {
      setEditingId(cls.id);
      setFormData({
        name: cls.name,
        type: cls.type,
        time: cls.time,
        location: cls.location,
        teacherName: cls.teacher.name,
        teacherPhone: cls.teacher.phone,
        teacherTelegram: cls.teacher.telegram || ''
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', type: "Ma'ruza", time: '', location: '', teacherName: '', teacherPhone: '', teacherTelegram: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    const newClass = {
      id: editingId || Date.now(),
      name: formData.name,
      type: formData.type,
      time: formData.time,
      location: formData.location,
      geo: "https://maps.google.com/?q=TUIT,Tashkent", // Default for now
      teacher: {
        name: formData.teacherName,
        phone: formData.teacherPhone,
        telegram: formData.teacherTelegram
      }
    };

    if (editingId) {
      setSchedule(prev => prev.map(c => c.id === editingId ? newClass : c));
    } else {
      setSchedule(prev => [...prev, newClass]);
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm("Rostdan ham bu darsni o'chirmoqchimisiz?")) {
      setSchedule(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <h1 className="text-gradient">Jadval</h1>
        <div className="flex gap-2">
          {user?.isLms && (
            <button 
              onClick={syncLms} 
              disabled={syncing}
              className="glass-panel p-2 flex-center" 
              style={{ background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', border: 'none' }}
            >
              <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            </button>
          )}
          <div className="glass-panel text-sm font-semibold" style={{ padding: '6px 14px', borderRadius: '20px', background: isEvenWeek ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)', color: isEvenWeek ? 'var(--success)' : 'var(--accent-primary)' }}>
            {isEvenWeek ? 'Juft Hafta' : 'Toq Hafta'}
          </div>
        </div>
      </div>
      
      <p className="text-secondary text-sm mb-4">Avtomatlashtirilgan o'zgaruvchan jadval tizimi</p>
      
      <div className="flex-column gap-3">
        {schedule.length === 0 ? (
          <p className="text-center text-secondary mt-5">Hozircha darslar yo'q</p>
        ) : (
          schedule.map(cls => (
            <div key={cls.id} className="glass-panel p-4" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: cls.type === "Ma'ruza" ? 'var(--accent-secondary)' : 'var(--info)'}}></div>

            
            <div className="flex-between mb-2">
              <p className="font-semibold text-lg" style={{ paddingRight: '12px' }}>{cls.name}</p>
              <span className="text-xs font-medium" style={{ 
                background: cls.type === "Ma'ruza" ? 'rgba(236, 72, 153, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                color: cls.type === "Ma'ruza" ? 'var(--accent-secondary)' : 'var(--info)', 
                padding: '4px 8px', borderRadius: '8px', whiteSpace: 'nowrap'
              }}>
                {cls.type}
              </span>
            </div>

            <div className="flex-between text-sm text-secondary mt-3">
              <div className="flex-center gap-2">
                <span className="font-medium text-primary">{cls.time}</span>
              </div>
            </div>

            <div className="mt-3 text-sm flex-between align-start" style={{ alignItems: 'flex-start' }}>
              <div className="flex-center gap-2 text-tertiary" style={{justifyContent: 'flex-start', flexWrap: 'wrap', flex: 1, paddingRight: '10px'}}>
                <MapPin size={14} style={{flexShrink: 0}} />
                <span style={{lineHeight: '1.4'}}>{cls.location}</span>
                <a href={cls.geo} target="_blank" rel="noreferrer" className="text-accent-primary" style={{textDecoration: 'none', color: 'var(--accent-primary)', fontSize: '12px', flexShrink: 0}}>Xarita 📍</a>
              </div>
              <div className="flex-center gap-3">
                <button onClick={() => handleOpenModal(cls)} style={{background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer', padding: '4px'}}><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(cls.id)} style={{background:'none', border:'none', color:'var(--danger)', cursor:'pointer', padding: '4px'}}><Trash2 size={16} /></button>
              </div>
            </div>

            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button 
                className="flex-between w-full text-sm text-secondary" 
                style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', outline: 'none' }}
                onClick={() => setExpandedCard(expandedCard === cls.id ? null : cls.id)}
              >
                <span>O'qituvchi ma'lumotlari</span>
                {expandedCard === cls.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {expandedCard === cls.id && (
                <div className="mt-3 p-3 rounded" style={{ background: 'rgba(0,0,0,0.2)', animation: 'fadeIn 0.2s ease-out' }}>
                  <p className="font-medium">{cls.teacher.name}</p>
                  <div className="flex-column gap-2 mt-2">
                    <a href={`tel:${cls.teacher.phone}`} className="flex-center gap-2 text-sm text-secondary" style={{justifyContent: 'flex-start', textDecoration: 'none'}}>
                      <Phone size={14} color="var(--success)" /> {cls.teacher.phone}
                    </a>
                    <a href={cls.teacher.telegram} target="_blank" rel="noreferrer" className="flex-center gap-2 text-sm text-secondary" style={{justifyContent: 'flex-start', textDecoration: 'none'}}>
                      <MessageCircle size={14} color="var(--info)" /> Telegram orqali yozish
                    </a>
                  </div>
                </div>
              )}
            </div>

          </div>
          ))
        )}
      </div>

      <button 
        className="btn-primary flex-center mt-5 w-full shadow-lg" 
        style={{ 
          position: 'fixed', bottom: '90px', right: '20px', 
          width: '50px', height: '50px', borderRadius: '50%', padding: 0,
          fontSize: '24px', zIndex: 100
        }}
        onClick={() => handleOpenModal()}
      >
        <Plus size={24} />
      </button>

      {/* Modern Modal for Adding/Editing Classes */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '600px', background: 'var(--bg-main)',
            borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
            padding: '24px', animation: 'slideUp 0.3s ease-out', maxHeight: '85vh', overflowY: 'auto'
          }}>
            <div className="flex-between mb-4">
              <h2 className="text-lg">{editingId ? 'Darsni Tahrirlash' : "Yangi Dars Qo'shish"}</h2>
              <button onClick={handleCloseModal} style={{background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer'}}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} className="flex-column gap-3">
              <div>
                <label className="text-xs text-secondary mb-1 block">Fan nomi</label>
                <input required name="name" value={formData.name} onChange={handleChange} className="w-full p-2 rounded" style={{background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white', width: '100%', borderRadius: '8px', padding: '10px'}} />
              </div>
              
              <div className="flex-between gap-3">
                <div style={{flex: 1}}>
                  <label className="text-xs text-secondary mb-1 block">Turi</label>
                  <select name="type" value={formData.type} onChange={handleChange} style={{background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white', width: '100%', borderRadius: '8px', padding: '10px'}}>
                    <option value="Ma'ruza">Ma'ruza</option>
                    <option value="Amaliyot">Amaliyot</option>
                    <option value="Laboratoriya">Laboratoriya</option>
                  </select>
                </div>
                <div style={{flex: 1}}>
                  <label className="text-xs text-secondary mb-1 block">Vaqti (09:00 - 10:20)</label>
                  <input required name="time" value={formData.time} onChange={handleChange} style={{background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white', width: '100%', borderRadius: '8px', padding: '10px'}} />
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary mb-1 block">Xona/Bino</label>
                <input required name="location" value={formData.location} onChange={handleChange} style={{background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white', width: '100%', borderRadius: '8px', padding: '10px'}} />
              </div>

              <div style={{borderTop: '1px solid var(--border-color)', margin: '10px 0'}}></div>
              <h3 className="text-sm font-medium mb-1">O'qituvchi ma'lumotlari</h3>
              
              <div>
                <label className="text-xs text-secondary mb-1 block">F.I.SH</label>
                <input required name="teacherName" value={formData.teacherName} onChange={handleChange} style={{background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white', width: '100%', borderRadius: '8px', padding: '10px'}} />
              </div>
              
              <div className="flex-between gap-3">
                <div style={{flex: 1}}>
                  <label className="text-xs text-secondary mb-1 block">Telefon</label>
                  <input name="teacherPhone" value={formData.teacherPhone} onChange={handleChange} style={{background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white', width: '100%', borderRadius: '8px', padding: '10px'}} />
                </div>
                <div style={{flex: 1}}>
                  <label className="text-xs text-secondary mb-1 block">Telegram Link</label>
                  <input name="teacherTelegram" value={formData.teacherTelegram} onChange={handleChange} placeholder="https://t.me/..." style={{background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white', width: '100%', borderRadius: '8px', padding: '10px'}} />
                </div>
              </div>

              <button type="submit" className="btn-primary mt-4 w-full" style={{width: '100%'}}>
                {editingId ? 'Saqlash' : "Qo'shish"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
