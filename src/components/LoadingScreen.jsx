import React from 'react';
import { GraduationCap, TerminalSquare } from 'lucide-react';
import { useI18n } from '../i18n';

export default function LoadingScreen() {
  const { t } = useI18n();

  return (
    <div className="loading-screen">
      <div className="bg-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="loading-particles">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>

      <div className="loading-content">
        <div className="loading-logo">
          <div className="loading-rings">
            <div className="ring ring-1" />
            <div className="ring ring-2" />
            <div className="ring ring-3" />
          </div>
          <div className="hex" />
          <div className="hex-inner" />
          <div className="hex-icon">
            <GraduationCap size={40} color="#020611" />
          </div>
        </div>

        <div>
          <h1 className="loading-title">TATU Portal</h1>
          <p className="loading-subtitle">{t('loading.subtitle', 'Akademik tizimga xush kelibsiz')}</p>
        </div>

        <div className="loading-bar-container">
          <div className="loading-bar" />
        </div>

        <div className="loading-dots">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
        </div>
      </div>
    </div>
  );
}
