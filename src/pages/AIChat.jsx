import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, Sparkles, MessageSquare } from 'lucide-react';

export default function AIChat({ user }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: `Salom ${user?.name || 'Talaba'}! Men sizning shaxsiy AI yordamchingizman. Darslar, vazifalar, baholar va o'quv jarayoni bo'yicha savollaringizga javob berishga tayyorman. 🎓`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage.content);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      }]);
      setLoading(false);
    }, 1000);
  };

  const generateAIResponse = (question) => {
    const lowerQ = question.toLowerCase();
    
    if (lowerQ.includes('dars') || lowerQ.includes('jadval')) {
      return "Sizning dars jadvalingizni ko'rish uchun 'Jadval' bo'limiga o'ting. U yerda barcha darslaringiz, vaqtlari va xonalar haqida ma'lumot bor. Qaysi kun yoki dars haqida batafsil ma'lumot kerak?";
    }
    
    if (lowerQ.includes('vazifa') || lowerQ.includes('topshiriq')) {
      return "Vazifalaringizni 'Vazifalar' bo'limida ko'rishingiz mumkin. U yerda barcha topshiriqlar, muddatlar va prioritetlar ko'rsatilgan. Yangi vazifa qo'shish yoki mavjudlarini tahrirlash ham mumkin.";
    }
    
    if (lowerQ.includes('baho') || lowerQ.includes('ball')) {
      return "Baholaringizni 'Baholar' sahifasida ko'rishingiz mumkin. U yerda har bir fan bo'yicha ballaringiz, GPA va NB (qoldirgan darslar) haqida ma'lumot bor. LMS bilan sinxronlash orqali eng so'nggi ma'lumotlarni olishingiz mumkin.";
    }
    
    if (lowerQ.includes('lms') || lowerQ.includes('sinxron')) {
      return "LMS bilan sinxronlash uchun Login sahifasida 'LMS (TUIT) Kirish' tugmasini bosing va HEMIS ID hamda parolingizni kiriting. Tizim avtomatik ravishda darslar, baholar va vazifalarni yuklab oladi.";
    }
    
    if (lowerQ.includes('kutubxona') || lowerQ.includes('material')) {
      return "Kutubxona bo'limida o'quv materiallari va ovozli qaydlaringizni saqlashingiz mumkin. Fayllarni yuklash, ovozli qayd yaratish va ularni boshqarish imkoniyatlari mavjud.";
    }
    
    if (lowerQ.includes('yordam') || lowerQ.includes('qanday')) {
      return "Men sizga quyidagi mavzularda yordam bera olaman:\n\n📅 Dars jadvali va darslar haqida\n📝 Vazifalar va topshiriqlar\n📊 Baholar va akademik ko'rsatkichlar\n🔄 LMS integratsiyasi\n📚 Kutubxona va materiallar\n\nQaysi mavzu bo'yicha savol berishni xohlaysiz?";
    }
    
    return "Savolingizni tushundim. Ushbu funksiya hozircha ishlab chiqilmoqda. Darslar, vazifalar, baholar yoki LMS integratsiyasi haqida aniqroq savol bering, men yordam berishga harakat qilaman! 😊";
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-column" style={{ height: 'calc(100vh - 140px)' }}>
      {/* Header */}
      <div className="glass-panel p-4 mb-4" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(236,72,153,0.2) 100%)', border: '1px solid rgba(99,102,241,0.3)' }}>
        <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
          <div style={{ background: 'var(--accent-gradient)', padding: '12px', borderRadius: '50%', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
            <Sparkles size={24} color="white" />
          </div>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '22px', marginBottom: '2px' }}>AI Yordamchi</h1>
            <p className="text-secondary text-xs">O'quv jarayoni bo'yicha savollaringizga javob beraman</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto mb-4 px-1" style={{ scrollBehavior: 'smooth' }}>
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 mb-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          >
            <div 
              className="flex-center" 
              style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                background: msg.role === 'assistant' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.1)',
                flexShrink: 0,
                boxShadow: msg.role === 'assistant' ? '0 4px 15px rgba(99,102,241,0.3)' : 'none'
              }}
            >
              {msg.role === 'assistant' ? <Bot size={20} color="white" /> : <User size={20} color="white" />}
            </div>
            
            <div 
              className="glass-panel p-3" 
              style={{ 
                maxWidth: '75%',
                background: msg.role === 'assistant' 
                  ? 'rgba(99,102,241,0.1)' 
                  : 'rgba(236,72,153,0.1)',
                border: msg.role === 'assistant'
                  ? '1px solid rgba(99,102,241,0.2)'
                  : '1px solid rgba(236,72,153,0.2)',
                borderRadius: msg.role === 'assistant' ? '0 12px 12px 12px' : '12px 0 12px 12px'
              }}
            >
              <p className="text-sm" style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              <p className="text-xs text-secondary mt-2" style={{ opacity: 0.6 }}>{formatTime(msg.timestamp)}</p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-3 mb-4">
            <div 
              className="flex-center" 
              style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                background: 'var(--accent-gradient)',
                flexShrink: 0
              }}
            >
              <Bot size={20} color="white" />
            </div>
            <div className="glass-panel p-3" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div className="flex-center gap-2">
                <Loader size={16} className="animate-spin" color="var(--accent-primary)" />
                <span className="text-sm text-secondary">Javob tayyorlanmoqda...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="glass-panel p-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Savolingizni yozing..."
            className="flex-1 rounded"
            style={{
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--border-color)',
              color: 'white',
              padding: '12px 16px',
              outline: 'none',
              fontSize: '14px'
            }}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex-center"
            style={{
              background: input.trim() && !loading ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 16px',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: input.trim() && !loading ? '0 4px 15px rgba(99,102,241,0.4)' : 'none'
            }}
          >
            <Send size={20} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}
