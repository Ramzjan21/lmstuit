import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Lock, LogIn, ShieldCheck, TerminalSquare } from 'lucide-react';
import { lmsService } from '../services/lmsService';
import { useI18n } from '../i18n';

const getTelegramUser = () => {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
};

export default function Login({ onLogin }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const navigate = useNavigate();
  const tgUser = getTelegramUser();
  const { t } = useI18n();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!login || !password || loading) return;

    setLoading(true);
    setLoadingText(t('login.connecting'));

    const auth = await lmsService.login(login, password);
    if (!auth.success) {
      setLoading(false);
      alert(auth.error || t('login.errorGeneric'));
      return;
    }

    const userEmail = `lms_${login}`;
    setLoadingText(t('login.syncing'));
    await lmsService.syncAll(userEmail);

    const userData = {
      name: auth.name || tgUser?.first_name || login,
      email: userEmail,
      isLms: true,
      lmsLogin: login,
      telegramId: tgUser?.id || null,
      telegramUsername: tgUser?.username || ''
    };

    onLogin(userData);
    navigate('/dashboard');
  };

  const canSubmit = Boolean(login.trim() && password.trim()) && !loading;

  if (loading) {
    return (
      <div className="flex-center flex-column" style={{ minHeight: '100vh', gap: '14px' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            border: '3px solid rgba(0,255,200,0.2)',
            borderTop: '3px solid var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}
        />
        <p className="font-medium" style={{ color: 'var(--accent-primary)' }}>{loadingText}</p>
        <p className="text-secondary text-sm">{t('login.loadingHint')}</p>
      </div>
    );
  }

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '16px' }}>
      <div
        className="glass-panel p-4"
        style={{
          width: '100%',
          maxWidth: '420px',
          border: '1px solid rgba(0,255,200,0.28)',
          background: 'linear-gradient(145deg, rgba(6,14,27,0.92) 0%, rgba(8,24,40,0.72) 100%)',
          boxShadow: '0 0 30px rgba(0,255,200,0.12), inset 0 0 40px rgba(0,255,200,0.04)'
        }}
      >
        <div className="text-center mb-4">
          <div className="flex-center mb-2" style={{ gap: '8px' }}>
            <TerminalSquare size={20} color="var(--accent-primary)" />
            <ShieldCheck size={20} color="var(--success)" />
          </div>
          <h1 className="text-gradient" style={{ fontSize: '28px', letterSpacing: '0.3px' }}>
            {t('login.title')}
          </h1>
          <p className="text-secondary text-sm mt-1">{t('login.subtitle')}</p>
          {tgUser && (
            <p className="text-xs text-secondary mt-1">
              {t('login.telegram')}: {tgUser.first_name || 'User'} {tgUser.last_name || ''}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex-column gap-4">
          <div>
            <label className="text-xs text-secondary mb-1 block">{t('login.loginLabel')}</label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 flex-center px-3 text-secondary" style={{ pointerEvents: 'none' }}>
                <KeyRound size={18} />
              </div>
              <input
                type="text"
                required
                value={login}
                onChange={(event) => setLogin(event.target.value)}
                placeholder={t('login.loginPlaceholder')}
                className="w-full rounded"
                style={{
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(0,255,200,0.24)',
                  color: 'white',
                  padding: '12px 12px 12px 42px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-secondary mb-1 block">{t('login.passwordLabel')}</label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 flex-center px-3 text-secondary" style={{ pointerEvents: 'none' }}>
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                className="w-full rounded"
                style={{
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(0,255,200,0.24)',
                  color: 'white',
                  padding: '12px 12px 12px 42px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary mt-1 flex-center gap-2 w-full"
            disabled={!canSubmit}
            style={{
              padding: '13px',
              background: 'linear-gradient(135deg, #00d1ff 0%, #00ffab 100%)',
              color: '#02131f',
              boxShadow: '0 0 20px rgba(0,255,200,0.35)',
              opacity: canSubmit ? 1 : 0.6,
              cursor: canSubmit ? 'pointer' : 'not-allowed'
            }}
          >
            <LogIn size={18} /> {t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
