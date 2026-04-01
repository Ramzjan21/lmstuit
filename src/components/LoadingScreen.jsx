import React, { useEffect, useState } from 'react';
import { Cpu, Fingerprint, Activity, GraduationCap } from 'lucide-react';

export default function LoadingScreen({ lang = 'uz' }) {
  const [initStep, setInitStep] = useState(0);

  const texts = {
    uz: [
      'Tizim tayyorlanmoqda...',
      'Akademik ma`lumotlar olinmoqda...',
      'Barcha modullar ulanmoqda...',
      'TATU LMS ishga tushirildi'
    ],
    ru: [
      'Подготовка системы...',
      'Получение академических данных...',
      'Подключение всех модулей...',
      'ТУИТ LMS запущен'
    ]
  };

  const steps = texts[lang] || texts['uz'];

  useEffect(() => {
    const timer1 = setTimeout(() => setInitStep(1), 800);
    const timer2 = setTimeout(() => setInitStep(2), 1600);
    const timer3 = setTimeout(() => setInitStep(3), 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="cyber-loading-screen">
      {/* Background elements */}
      <div className="cyber-grid" />
      <div className="cyber-light orb-top" />
      <div className="cyber-light orb-bottom" />
      
      {/* Central elements */}
      <div className="cyber-center-wrapper">
        {/* Animated Rings */}
        <div className="cyber-rings">
          <div className="c-ring c-ring-1" />
          <div className="c-ring c-ring-2" />
          <div className="c-ring c-ring-3" />
        </div>

        {/* Central Logo */}
        <div className="cyber-logo-box">
          <div className="cyber-logo-pulse" />
          <GraduationCap size={44} color="#00d1ff" className="cyber-icon" />
        </div>
      </div>

      {/* Terminal Loading Status */}
      <div className="cyber-terminal">
        <h1 className="cyber-title">TATU CYBER LMS</h1>
        
        <div className="cyber-steps">
          {steps.map((text, index) => (
            <div 
              key={index} 
              className={`cyber-step ${initStep >= index ? 'active' : ''}`}
            >
              <div className="step-icon">
                {initStep > index ? <Activity size={14} /> : initStep === index ? <Cpu size={14} className="animate-spin" /> : <Fingerprint size={14} />}
              </div>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="cyber-progress-container">
          <div 
            className="cyber-progress-bar" 
            style={{ width: `${((initStep + 1) / steps.length) * 100}%` }} 
          />
        </div>
      </div>
    </div>
  );
}
