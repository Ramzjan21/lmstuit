import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, Sparkles, Mic, Volume2, VolumeX, Settings, X } from 'lucide-react';
import { aiService } from '../services/aiService';
import { useI18n } from '../i18n';
import { formatTime } from '../utils/dateUtils';

export default function AIChat({ user }) {
  const { t, lang } = useI18n();
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content:
        lang === 'ru'
          ? `Здравствуйте, ${user?.name || 'Студент'}! Я ваш персональный AI-помощник. Задайте вопрос на любом языке — отвечу на том же! 🎓`
          : `Salom ${user?.name || 'Talaba'}! Men sizning shaxsiy AI yordamchingizman. Istalgan tilda yozing — o'sha tilda javob beraman! 🎓`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [liveMode, setLiveMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceLang, setVoiceLang] = useState('uz-UZ');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea like Telegram
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = liveMode;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = voiceLang;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        setInput(transcript);
        
        // In live mode, auto-send when speech ends
        if (liveMode && event.results[event.results.length - 1].isFinal) {
          setTimeout(() => {
            if (transcript.trim()) {
              handleSend(transcript.trim());
            }
          }, 500);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setIsListening(false);
        }
      };

      recognitionRef.current.onend = () => {
        // In live mode, restart listening after processing
        if (liveMode && isListening && !loading) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.log('Recognition restart failed:', e);
          }
        } else {
          setIsListening(false);
        }
      };
    }

    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [voiceLang, liveMode, isListening, loading]);

  // Update recognition settings when they change
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = voiceLang;
      recognitionRef.current.continuous = liveMode;
    }
  }, [voiceLang, liveMode]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleLiveMode = () => {
    const newLiveMode = !liveMode;
    setLiveMode(newLiveMode);
    
    if (newLiveMode) {
      // Start listening when enabling live mode
      startListening();
    } else {
      // Stop listening when disabling live mode
      stopListening();
    }
  };

  const speak = (text) => {
    if (!synthRef.current || !voiceEnabled) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceLang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      // In live mode, restart listening after speaking
      if (liveMode && !isListening) {
        setTimeout(() => startListening(), 500);
      }
    };
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const buildConversation = (nextUserText) => {
    const recentMessages = messages
      .filter((msg) => msg.role === 'assistant' || msg.role === 'user')
      .slice(-10)
      .map((msg) => ({ role: msg.role, content: msg.content }));

    return [...recentMessages, { role: 'user', content: nextUserText }];
  };

  const handleSend = async (textOverride = null) => {
    const userText = textOverride || input.trim();
    if (!userText || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Stop listening while processing (only in non-live mode)
    if (isListening && !liveMode) {
      stopListening();
    }

    const conversation = buildConversation(userText);
    const aiResult = await aiService.getReply({
      conversation,
      userName: user?.name,
      userLang: lang
    });

    const assistantText = aiResult.success
      ? aiResult.message
      : `${aiResult.error}\n\n${generateFallbackResponse(userText)}`;

    setMessages(prev => [
      ...prev,
      {
        id: Date.now() + 1,
        role: 'assistant',
        content: assistantText,
        timestamp: new Date()
      }
    ]);
    setLoading(false);

    // Auto-speak the response if voice is enabled
    if (voiceEnabled && aiResult.success) {
      speak(assistantText);
    } else if (liveMode && !voiceEnabled) {
      // In live mode without voice, restart listening immediately
      setTimeout(() => startListening(), 500);
    }
  };

  const handleKeyDown = (e) => {
    // Send on Enter, newline on Shift+Enter (like Telegram)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const generateFallbackResponse = (question) => {
    const questionStr = String(question || '');
    const lowerQ = questionStr.toLowerCase();
    const isRu = /[а-яё]/i.test(questionStr);

    if (lowerQ.includes('dars') || lowerQ.includes('jadval') || lowerQ.includes('расписан') || lowerQ.includes('занят')) {
      return isRu
        ? "Чтобы увидеть расписание, откройте раздел 'Расписание'. Там есть пары, время и аудитории."
        : "Sizning dars jadvalingizni ko'rish uchun 'Jadval' bo'limiga o'ting.";
    }
    if (lowerQ.includes('vazifa') || lowerQ.includes('topshiriq') || lowerQ.includes('задан') || lowerQ.includes('homework')) {
      return isRu
        ? "Ваши задания находятся в разделе 'Задания'. Там указаны сроки и приоритеты."
        : "Vazifalaringizni 'Vazifalar' bo'limida ko'rishingiz mumkin.";
    }
    if (lowerQ.includes('baho') || lowerQ.includes('ball') || lowerQ.includes('оценк') || lowerQ.includes('grade')) {
      return isRu
        ? "Оценки смотрите в разделе 'Посещаемость'. Там есть баллы, GPA и NB."
        : "Baholaringizni 'Baholar' sahifasida ko'rishingiz mumkin.";
    }
    
    return isRu
      ? "Уточните, пожалуйста, тему: расписание, задания, оценки или LMS синхронизация. 😊"
      : "Darslar, vazifalar, baholar yoki LMS integratsiyasi haqida aniqroq savol bering! 😊";
  };

  const fmtTime = (date) => formatTime(date, lang);

  const canSend = input.trim() && !loading;

  const voiceLanguages = [
    { code: 'uz-UZ', label: "O'zbek", flag: '🇺🇿' },
    { code: 'ru-RU', label: 'Русский', flag: '🇷🇺' },
    { code: 'en-US', label: 'English', flag: '🇺🇸' }
  ];

  return (
    <div className="flex-column" style={{ height: 'calc(100vh - 140px)' }}>
      {/* Header */}
      <div className="glass-panel p-4 mb-3" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(236,72,153,0.2) 100%)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px' }}>
        <div className="flex-between">
          <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
            <div style={{ background: 'var(--accent-gradient)', padding: '10px', borderRadius: '50%', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
              <Sparkles size={22} color="white" />
            </div>
            <div>
              <h1 className="text-gradient" style={{ fontSize: '20px', marginBottom: '2px' }}>{t('ai.title')}</h1>
              <p className="text-secondary text-xs">{t('ai.subtitle')}</p>
            </div>
          </div>
          <div className="flex-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              style={{
                width: '40px',
                height: '40px',
                background: 'rgba(99,102,241,0.2)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Sozlamalar"
            >
              <Settings size={18} color="var(--accent-primary)" />
            </button>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              style={{
                width: '40px',
                height: '40px',
                background: voiceEnabled ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                border: `1px solid ${voiceEnabled ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title={voiceEnabled ? 'Ovozni o\'chirish' : 'Ovozni yoqish'}
            >
              {voiceEnabled ? <Volume2 size={18} color="var(--success)" /> : <VolumeX size={18} color="var(--danger)" />}
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel p-4" style={{ 
            maxWidth: '400px', 
            width: '100%',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-lightbg)',
            borderRadius: '20px'
          }}>
            <div className="flex-between mb-4">
              <h2 className="text-gradient" style={{ fontSize: '18px' }}>Ovoz sozlamalari</h2>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px'
                }}
              >
                <X size={20} color="var(--text-secondary)" />
              </button>
            </div>

            <div className="flex-column gap-3">
              <div>
                <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Ovoz tili:</p>
                <div className="flex-column gap-2">
                  {voiceLanguages.map(vl => (
                    <button
                      key={vl.code}
                      onClick={() => setVoiceLang(vl.code)}
                      style={{
                        padding: '12px 16px',
                        background: voiceLang === vl.code ? 'rgba(99,102,241,0.2)' : 'var(--glass-lightbg)',
                        border: `1px solid ${voiceLang === vl.code ? 'rgba(99,102,241,0.4)' : 'var(--glass-border)'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>{vl.flag}</span>
                      <span style={{ 
                        color: voiceLang === vl.code ? 'var(--accent-primary)' : 'var(--text-primary)',
                        fontWeight: voiceLang === vl.code ? 600 : 400
                      }}>{vl.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Jonli suhbat rejimi:</p>
                <button
                  onClick={toggleLiveMode}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: liveMode ? 'rgba(34,197,94,0.2)' : 'var(--glass-lightbg)',
                    border: `1px solid ${liveMode ? 'rgba(34,197,94,0.4)' : 'var(--glass-border)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ 
                    color: liveMode ? 'var(--success)' : 'var(--text-primary)',
                    fontWeight: liveMode ? 600 : 400
                  }}>
                    {liveMode ? '✅ Yoqilgan' : '⭕ O\'chirilgan'}
                  </span>
                  <span style={{ fontSize: '20px' }}>🎙️</span>
                </button>
                <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Jonli rejimda gapirganingizdan keyin avtomatik javob beradi
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 hide-scrollbar" style={{ overflowY: 'auto', paddingRight: '2px', marginBottom: '12px' }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '12px',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              animation: 'fadeIn 0.25s ease-out'
            }}
          >
            <div
              className="flex-center"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: msg.role === 'assistant' ? 'var(--accent-gradient)' : 'var(--glass-lightbg)',
                flexShrink: 0,
                alignSelf: 'flex-end',
                boxShadow: msg.role === 'assistant' ? '0 4px 15px rgba(99,102,241,0.3)' : 'none'
              }}
            >
              {msg.role === 'assistant' ? <Bot size={18} color="white" /> : <User size={18} color="white" />}
            </div>

            <div style={{ maxWidth: '78%' }}>
              <div
                style={{
                  padding: '10px 14px',
                  background: msg.role === 'assistant' ? 'rgba(99,102,241,0.12)' : 'rgba(168,85,247,0.18)',
                  border: msg.role === 'assistant' ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(168,85,247,0.3)',
                  borderRadius: msg.role === 'assistant' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                }}
              >
                <p className="text-sm" style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', color: "var(--text-primary)" }}>{msg.content}</p>
              </div>
              <p className="text-xs" style={{ color: 'var(--glass-text-muted)', marginTop: '4px', textAlign: msg.role === 'user' ? 'right' : 'left', paddingLeft: msg.role === 'assistant' ? '4px' : 0, paddingRight: msg.role === 'user' ? '4px' : 0 }}>
                {fmtTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <div className="flex-center" style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--accent-gradient)', flexShrink: 0, alignSelf: 'flex-end' }}>
              <Bot size={18} color="white" />
            </div>
            <div style={{ padding: '10px 16px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '4px 16px 16px 16px' }}>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-primary)', animation: 'bounce 1.2s infinite 0s' }} />
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-primary)', animation: 'bounce 1.2s infinite 0.2s' }} />
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-primary)', animation: 'bounce 1.2s infinite 0.4s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Telegram-style Input Area */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '10px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-lightbg)',
        borderRadius: '24px',
        padding: '8px 8px 8px 16px',
      }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={lang === 'ru' ? 'Написать сообщение...' : 'Xabar yozing...'}
          disabled={loading}
          rows={1}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            color: "var(--text-primary)",
            fontSize: '15px',
            lineHeight: '1.5',
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            padding: '6px 0',
            maxHeight: '120px',
            overflowY: 'auto',
          }}
        />
        
        {/* Microphone Button */}
        <button
          onClick={liveMode ? toggleLiveMode : (isListening ? stopListening : startListening)}
          disabled={loading}
          style={{
            width: '40px',
            height: '40px',
            flexShrink: 0,
            background: isListening 
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
              : liveMode 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'var(--glass-lightbg)',
            border: 'none',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: isListening 
              ? '0 4px 15px rgba(239,68,68,0.4)' 
              : liveMode 
                ? '0 4px 15px rgba(16,185,129,0.4)'
                : 'none',
            animation: isListening ? 'pulse 1.5s infinite' : 'none'
          }}
          title={liveMode ? 'Jonli rejimni to\'xtatish' : (isListening ? 'Tinglashni to\'xtatish' : 'Ovoz bilan yozish')}
        >
          <Mic size={18} color={isListening || liveMode ? 'white' : 'var(--text-secondary)'} />
        </button>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          style={{
            width: '40px',
            height: '40px',
            flexShrink: 0,
            background: canSend ? 'var(--accent-gradient)' : 'var(--glass-border)',
            border: 'none',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: canSend ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            boxShadow: canSend ? '0 4px 15px rgba(99,102,241,0.4)' : 'none',
            transform: canSend ? 'scale(1)' : 'scale(0.95)'
          }}
        >
          <Send size={18} color={canSend ? 'white' : 'var(--glass-text-muted)'} style={{ marginLeft: '2px' }} />
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
