import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, Sparkles } from 'lucide-react';
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
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

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

  const buildConversation = (nextUserText) => {
    const recentMessages = messages
      .filter((msg) => msg.role === 'assistant' || msg.role === 'user')
      .slice(-10)
      .map((msg) => ({ role: msg.role, content: msg.content }));

    return [...recentMessages, { role: 'user', content: nextUserText }];
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

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
  };

  const handleKeyDown = (e) => {
    // Send on Enter, newline on Shift+Enter (like Telegram)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const generateFallbackResponse = (question) => {
    const lowerQ = question.toLowerCase();
    const isRu = /[а-яё]/i.test(question);

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

  return (
    <div className="flex-column" style={{ height: 'calc(100vh - 140px)' }}>
      {/* Header */}
      <div className="glass-panel p-4 mb-3" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(236,72,153,0.2) 100%)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px' }}>
        <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
          <div style={{ background: 'var(--accent-gradient)', padding: '10px', borderRadius: '50%', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
            <Sparkles size={22} color="white" />
          </div>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '20px', marginBottom: '2px' }}>{t('ai.title')}</h1>
            <p className="text-secondary text-xs">{t('ai.subtitle')}</p>
          </div>
        </div>
      </div>

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
                background: msg.role === 'assistant' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.1)',
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
                <p className="text-sm" style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', color: 'white' }}>{msg.content}</p>
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)', marginTop: '4px', textAlign: msg.role === 'user' ? 'right' : 'left', paddingLeft: msg.role === 'assistant' ? '4px' : 0, paddingRight: msg.role === 'user' ? '4px' : 0 }}>
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
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
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
            color: 'white',
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
        <button
          onClick={handleSend}
          disabled={!canSend}
          style={{
            width: '40px',
            height: '40px',
            flexShrink: 0,
            background: canSend ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.06)',
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
          <Send size={18} color={canSend ? 'white' : 'rgba(255,255,255,0.3)'} style={{ marginLeft: '2px' }} />
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
