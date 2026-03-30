import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { Preferences } from '@capacitor/preferences';
import { lmsService } from '../services/lmsService';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLmsMode, setIsLmsMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLmsMode) {
        setLoading(true);
        setLoadingText('LMS ga ulanmoqda...');
        const res = await lmsService.login(email, password);
        if (res.success) {
            const userEmail = `lms_${email}`;
            setLoadingText('Ma\'lumotlar yuklanmoqda...');
            await lmsService.syncAll(userEmail);
            const userData = { name: res.name || email, email: userEmail, isLms: true, lmsLogin: email };
            onLogin(userData);
            navigate('/dashboard');
        } else {
            setLoading(false);
            alert(res.error);
        }
        return;
    }

    if (email && password) {
      const { value } = await Preferences.get({ key: 'users' });
      const users = value ? JSON.parse(value) : [];
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        onLogin({ name: user.name, email: user.email });
        navigate('/dashboard');
      } else {
        alert("Elektron pochta yoki parol noto'g'ri!");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-center flex-column" style={{ minHeight: '80vh', gap: '20px' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p className="text-accent-primary font-medium">{loadingText}</p>
        <p className="text-secondary text-sm">TUIT LMS dan ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="flex-center" style={{ minHeight: '80vh', padding: '20px' }}>
      <div className="glass-panel p-4" style={{ width: '100%', maxWidth: '400px', animation: 'slideUp 0.4s ease-out' }}>
        <div className="text-center mb-4">
          <h1 className="text-gradient" style={{ fontSize: '28px', marginBottom: '4px' }}>Xush Kelibsiz!</h1>
          <p className="text-secondary text-sm">Aqlli Dars Jadvali tizimiga kiring</p>
        </div>
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setIsLmsMode(false)}
            className={`flex-1 py-2 rounded-t-lg transition-all ${!isLmsMode ? 'bg-accent-primary text-white border-b-2 border-white' : 'bg-transparent text-secondary'}`}
            style={{ borderBottom: !isLmsMode ? '2px solid white' : 'none' }}
          >
            Oddiy Kirish
          </button>
          <button 
            onClick={() => setIsLmsMode(true)}
            className={`flex-1 py-2 rounded-t-lg transition-all ${isLmsMode ? 'bg-accent-primary text-white border-b-2 border-white' : 'bg-transparent text-secondary'}`}
            style={{ borderBottom: isLmsMode ? '2px solid white' : 'none' }}
          >
            LMS (TUIT) Kirish
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-column gap-4">
          <div>
            <label className="text-xs text-secondary mb-1 block">
              {isLmsMode ? 'HEMIS ID (Login)' : 'Elektron pochta'}
            </label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 flex-center px-3 text-secondary">
                <Mail size={18} />
              </div>
              <input 
                type="text" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isLmsMode ? "1BK34678" : "student@tuit.uz"} 
                className="w-full rounded" 
                style={{
                  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', 
                  color: 'white', padding: '12px 12px 12px 40px', outline: 'none'
                }} 
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-secondary mb-1 block">Parol</label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 flex-center px-3 text-secondary">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full rounded" 
                style={{
                  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', 
                  color: 'white', padding: '12px 12px 12px 40px', outline: 'none'
                }} 
              />
            </div>
          </div>

          <button type="submit" className="btn-primary mt-2 flex-center gap-2 w-full" style={{ padding: '14px' }}>
            <LogIn size={18} /> {isLmsMode ? 'LMS orqali kirish' : 'Kirish'}
          </button>
        </form>

        {!isLmsMode && (
          <p className="text-center text-xs text-secondary mt-6">
            Hali hisobingiz yo'qmi? <Link to="/register" className="text-accent-primary font-semibold" style={{ textDecoration: 'none' }}>Ro'yxatdan o'tish</Link>
          </p>
        )}
      </div>
    </div>
  );
}
