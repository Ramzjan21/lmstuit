import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, UserPlus } from 'lucide-react';

export default function Register({ onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && email && password) {
      onLogin({ name, email });
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '80vh', padding: '20px' }}>
      <div className="glass-panel p-4" style={{ width: '100%', maxWidth: '400px', animation: 'slideUp 0.4s ease-out' }}>
        <div className="text-center mb-6">
          <h1 className="text-gradient" style={{ fontSize: '32px', marginBottom: '8px' }}>Ro'yxatdan O'tish</h1>
          <p className="text-secondary text-sm">Yangi talaba hisobini yarating</p>
        </div>

        <form onSubmit={handleSubmit} className="flex-column gap-3">
          <div>
            <label className="text-xs text-secondary mb-1 block">To'liq ismingiz</label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 flex-center px-3 text-secondary">
                <User size={18} />
              </div>
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jasur Jo'rayev" 
                className="w-full rounded" 
                style={{
                  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', 
                  color: 'white', padding: '12px 12px 12px 40px', outline: 'none'
                }} 
              />
            </div>
          </div>

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
            <label className="text-xs text-secondary mb-1 block">Parol o'ylab toping</label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 flex-center px-3 text-secondary">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8 ta belgidan kam bo'lmasin" 
                className="w-full rounded" 
                style={{
                  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', 
                  color: 'white', padding: '12px 12px 12px 40px', outline: 'none'
                }} 
              />
            </div>
          </div>

          <button type="submit" className="btn-primary mt-4 flex-center gap-2 w-full" style={{ padding: '14px', background: 'linear-gradient(135deg, var(--success), #059669)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}>
            <UserPlus size={18} /> Hisob Yaratish
          </button>
        </form>

        <p className="text-center text-xs text-secondary mt-6">
          Allaqachon hisobingiz bormi? <Link to="/login" className="text-success font-semibold" style={{ textDecoration: 'none' }}>Kirish</Link>
        </p>
      </div>
    </div>
  );
}
