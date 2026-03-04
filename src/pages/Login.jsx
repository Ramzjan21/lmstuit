import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      // Simulate fetching user name from DB using email
      const userName = email.split('@')[0] || 'Talaba';
      const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);
      
      onLogin({ name: capitalizedName, email });
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '80vh', padding: '20px' }}>
      <div className="glass-panel p-4" style={{ width: '100%', maxWidth: '400px', animation: 'slideUp 0.4s ease-out' }}>
        <div className="text-center mb-6">
          <h1 className="text-gradient" style={{ fontSize: '32px', marginBottom: '8px' }}>Xush Kelibsiz!</h1>
          <p className="text-secondary text-sm">Aqlli Dars Jadvali tizimiga kiring</p>
        </div>

        <form onSubmit={handleSubmit} className="flex-column gap-4">
          <div>
            <label className="text-xs text-secondary mb-1 block">Elektron pochta</label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 flex-center px-3 text-secondary">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@tuit.uz" 
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
            <div className="text-right mt-1">
              <a href="#" className="text-xs text-accent-primary" style={{ textDecoration: 'none' }}>Parolni unutdingizmi?</a>
            </div>
          </div>

          <button type="submit" className="btn-primary mt-2 flex-center gap-2 w-full" style={{ padding: '14px' }}>
            <LogIn size={18} /> Kirish
          </button>
        </form>

        <p className="text-center text-xs text-secondary mt-6">
          Hali hisobingiz yo'qmi? <Link to="/register" className="text-accent-primary font-semibold" style={{ textDecoration: 'none' }}>Ro'yxatdan o'tish</Link>
        </p>
      </div>
    </div>
  );
}
