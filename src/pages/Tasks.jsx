import React, { useState, useEffect } from 'react';
import { Clock, Paperclip, Upload, Plus, Edit2, Trash2, X } from 'lucide-react';
import { differenceInDays, differenceInHours, differenceInMinutes, parseISO, format } from 'date-fns';

export default function Tasks() {
  const [activeTab, setActiveTab] = useState('Barchasi');
  
  const categories = ['Barchasi', 'Uy vazifasi', 'Kurs ishi', 'Laboratoriya', 'Oraliq'];

  const [tasks, setTasks] = useState([
    { id: 1, title: 'Web Dasturlash loyihasi', category: 'Kurs ishi', deadline: new Date(Date.now() + 86400000 * 3).toISOString() }, // 3 days
    { id: 2, title: 'Fizika 4-Lab', category: 'Laboratoriya', deadline: new Date(Date.now() + 10800000).toISOString() }, // 3 hours
    { id: 3, title: "Ma'lumotlar bazasi oraliq", category: 'Oraliq', deadline: new Date(Date.now() + 86400000 * 1).toISOString() } // 1 day
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Uy vazifasi',
    deadlineDate: '',
    deadlineTime: ''
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  const getCountdown = (deadline) => {
    const target = parseISO(deadline);
    const days = differenceInDays(target, currentTime);
    const hours = differenceInHours(target, currentTime) % 24;
    const minutes = differenceInMinutes(target, currentTime) % 60;
    
    if (days > 0) return `${days} kun, ${hours} soat qoldi`;
    if (hours > 0) return `${hours} soat, ${minutes} daqiqa qoldi`;
    if (minutes > 0) return `${minutes} daqiqa qoldi!`;
    return "Vaqti tugadi";
  };

  const handleOpenModal = (t = null) => {
    if (t) {
      setEditingId(t.id);
      const d = new Date(t.deadline);
      setFormData({
        title: t.title,
        category: t.category,
        deadlineDate: format(d, 'yyyy-MM-dd'),
        deadlineTime: format(d, 'HH:mm')
      });
    } else {
      setEditingId(null);
      setFormData({ title: '', category: 'Uy vazifasi', deadlineDate: '', deadlineTime: '' });
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
    if (!formData.title || !formData.deadlineDate || !formData.deadlineTime) return;

    // Combine date and time
    const [year, month, day] = formData.deadlineDate.split('-');
    const [hour, min] = formData.deadlineTime.split(':');
    const deadlineIso = new Date(year, month - 1, day, hour, min).toISOString();

    const newTask = {
      id: editingId || Date.now(),
      title: formData.title,
      category: formData.category,
      deadline: deadlineIso
    };

    if (editingId) {
      setTasks(prev => prev.map(t => t.id === editingId ? newTask : t));
    } else {
      setTasks(prev => [...prev, newTask]);
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm("Rostdan ham bu vazifani o'chirmoqchimisiz?")) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const filteredTasks = activeTab === 'Barchasi' ? tasks : tasks.filter(t => t.category === activeTab);

  return (
    <div>
      <h1 className="text-gradient">Vazifalar</h1>
      <p className="text-secondary text-sm mb-4">Muddati yaqinlashayotgan ishlar tizimi</p>

      {/* Tabs */}
      <div className="flex-center mb-5 mt-2 hide-scrollbar" style={{ gap: '8px', overflowX: 'auto', paddingBottom: '10px', justifyContent: 'flex-start' }}>
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveTab(cat)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              backgroundColor: activeTab === cat ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
              color: activeTab === cat ? '#fff' : 'var(--text-secondary)',
              border: '1px solid ' + (activeTab === cat ? 'transparent' : 'var(--border-color)'),
              transition: 'all 0.3s ease'
             }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="flex-column gap-4">
        {filteredTasks.map(task => {
          const isUrgent = differenceInHours(parseISO(task.deadline), currentTime) < 24;
          return (
            <div key={task.id} className="glass-panel p-4" style={{ position: 'relative' }}>
              <div className="flex-between mb-2">
                <span className="text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                  {task.category}
                </span>
                <span className="flex-center gap-1 text-xs" style={{ color: isUrgent ? 'var(--danger)' : 'var(--warning)', fontWeight: 600 }}>
                  <Clock size={12} /> {getCountdown(task.deadline)}
                </span>
              </div>
              
              <div className="flex-between items-start mt-1 mb-3">
                <h3 className="font-medium text-primary">{task.title}</h3>
                <div className="flex-center gap-2">
                  <button onClick={() => handleOpenModal(task)} className="transition" style={{background:'rgba(255,255,255,0.05)', border:'none', color:'var(--text-secondary)', cursor:'pointer', padding: '6px', borderRadius: '6px'}}><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(task.id)} className="transition" style={{background:'rgba(239,68,68,0.1)', border:'none', color:'var(--danger)', cursor:'pointer', padding: '6px', borderRadius: '6px'}}><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <button className="flex-center gap-2 text-xs text-secondary" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Paperclip size={14} /> Fayl biriktirish
                </button>
                <button className="flex-center gap-1 text-xs text-white" style={{ background: 'var(--success)', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
                  <Upload size={14} /> Topshirish
                </button>
              </div>
            </div>
          );
        })}
        {filteredTasks.length === 0 && (
          <p className="text-center text-secondary text-sm mt-5">Bu kategoriyada vazifalar yo'q 🎉</p>
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

      {/* Modern Modal for Adding/Editing Tasks */}
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
              <h2 className="text-lg">{editingId ? 'Vazifani Tahrirlash' : "Yangi Vazifa Qo'shish"}</h2>
              <button onClick={handleCloseModal} style={{background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer'}}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} className="flex-column gap-4">
              <div>
                <label className="text-xs text-secondary mb-1 block">Vazifa nomi</label>
                <input required name="title" value={formData.title} onChange={handleChange} placeholder="Mashqni bajarish..." className="w-full p-2 rounded" style={{background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white', width: '100%', borderRadius: '8px', padding: '10px'}} />
              </div>
              
              <div>
                <label className="text-xs text-secondary mb-1 block">Kategoriya</label>
                <select name="category" value={formData.category} onChange={handleChange} style={{background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white', width: '100%', borderRadius: '8px', padding: '10px'}}>
                  {categories.filter(c => c !== 'Barchasi').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex-between gap-3">
                <div style={{flex: 1}}>
                  <label className="text-xs text-secondary mb-1 block">Muddat (Sana)</label>
                  <input required type="date" name="deadlineDate" value={formData.deadlineDate} onChange={handleChange} style={{background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white', width: '100%', borderRadius: '8px', padding: '10px'}} />
                </div>
                <div style={{flex: 1}}>
                  <label className="text-xs text-secondary mb-1 block">Vaqt (Soat)</label>
                  <input required type="time" name="deadlineTime" value={formData.deadlineTime} onChange={handleChange} style={{background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white', width: '100%', borderRadius: '8px', padding: '10px'}} />
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
