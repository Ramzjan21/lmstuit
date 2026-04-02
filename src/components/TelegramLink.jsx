import React, { useState, useEffect, useRef } from 'react';
import { BotMessageSquare, Check, ExternalLink, Unlink, Loader } from 'lucide-react';
import { useI18n } from '../i18n';

export default function TelegramLink({ user }) {
  const { lang } = useI18n();
  const [linked, setLinked] = useState(false);
  const [chatId, setChatId] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [botUrl, setBotUrl] = useState('');
  const [msg, setMsg] = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    fetchStatus();
    return () => stopPolling();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/telegram/status');
      const data = await res.json();
      setLinked(data.linked);
      setChatId(data.chatId || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = () => {
    // Poll every 2 seconds for up to 5 minutes
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 150) { // 5 min timeout
        stopPolling();
        setMsg('⏰ Muddati o\'tdi. Qayta urinib ko\'ring.');
        setBotUrl('');
        return;
      }
      try {
        const res = await fetch('/api/telegram/status');
        const data = await res.json();
        if (data.linked) {
          setLinked(true);
          setChatId(data.chatId || '');
          stopPolling();
          setBotUrl('');
          setMsg('');
        }
      } catch {}
    }, 2000);
  };

  const handleGenerateLink = async () => {
    setGenerating(true);
    setMsg('');
    try {
      const res = await fetch('/api/telegram/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang })
      });
      const data = await res.json();
      if (data.ok && data.url) {
        setBotUrl(data.url);
        // Auto-open on mobile
        window.open(data.url, '_blank');
        // Start polling for confirmation
        startPolling();
        setMsg('');
      } else {
        setMsg('❌ Havola yaratishda xatolik. TELEGRAM_BOT_TOKEN o\'rnatilganmi?');
      }
    } catch (e) {
      setMsg('❌ Server bilan ulanishda xatolik');
    } finally {
      setGenerating(false);
    }
  };

  const handleUnlink = async () => {
    if (!window.confirm('Botdan uzilishni xohlaysizmi?')) return;
    stopPolling();
    try {
      await fetch('/api/telegram/unlink', { method: 'DELETE' });
      setLinked(false);
      setChatId('');
      setBotUrl('');
      setMsg('');
    } catch (e) {}
  };

  const handleTestMessage = async () => {
    try {
      const res = await fetch('/api/telegram/test-message', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        alert('Test xabar yuborildi! Telegramni tekshiring.');
      } else {
        alert("❌ Xabar yuborishda xatolik. Bot ulanmagan bo'lishi mumkin.");
      }
    } catch (e) {
      alert('❌ Server bilan ulanishda xatolik');
    }
  };

  if (loading) return null;

  return (
    <div className="glass-panel p-4" style={{ borderRadius: '16px', background: 'rgba(0,136,204,0.06)', border: '1px solid rgba(0,136,204,0.2)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{ background: 'rgba(0,136,204,0.15)', width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BotMessageSquare size={20} color="#0088cc" />
        </div>
        <div style={{ flex: 1 }}>
          <p className="font-semibold" style={{ fontSize: '15px' }}>Telegram Bot</p>
          <p className="text-xs text-secondary" style={{ marginTop: '2px' }}>NB va topshiriq eslatmalari</p>
        </div>
        {linked && (
          <div style={{ background: 'rgba(16,185,129,0.15)', padding: '4px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={12} color="#10b981" />
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Faol</span>
          </div>
        )}
        {botUrl && !linked && (
          <div style={{ background: 'rgba(251,191,36,0.15)', padding: '4px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Loader size={11} color="#f59e0b" className="animate-spin" />
            <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>Kutilmoqda...</span>
          </div>
        )}
      </div>

      {linked ? (
        /* ── Linked state ── */
        <div>
          <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px', border: '1px solid rgba(16,185,129,0.15)' }}>
            <p className="text-xs text-secondary mb-1">Bot faol — bildirishnomalar yoqiq:</p>
            <p className="text-sm mt-1">✅ Yangi NB qo'yilganda</p>
            <p className="text-sm">✅ Topshiriq muddati yaqinlashganda (har 5 daqiqa)</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={handleTestMessage} style={{ flex: 1, background: 'rgba(59,130,246,0.1)', border: 'none', color: '#3b82f6', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'inherit', fontWeight: 600 }}>
              <BotMessageSquare size={14} /> Test xabar
            </button>
            <button onClick={handleUnlink} style={{ flex: 1, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'inherit', fontWeight: 600 }}>
              <Unlink size={14} /> Botdan uzish
            </button>
          </div>
        </div>
      ) : botUrl ? (
        /* ── Waiting for user to click Start in bot ── */
        <div>
          <div style={{ background: 'rgba(251,191,36,0.08)', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px', border: '1px solid rgba(251,191,36,0.2)' }}>
            <p className="text-sm font-semibold mb-2" style={{ color: '#f59e0b' }}>Telegram botni oching va START ni bosing</p>
            <p className="text-xs text-secondary" style={{ lineHeight: '1.6' }}>Bot avtomatik ulanadi va bu sahifa yangilanadi. Agar bot avtomatik ochilmagan bo'lsa 👇</p>
          </div>
          <a href={botUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#0088cc', border: 'none', color: 'white', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', marginBottom: '8px' }}>
            <ExternalLink size={16} /> Telegram botni ochish
          </a>
          <button onClick={() => { setBotUrl(''); stopPolling(); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '12px', cursor: 'pointer', width: '100%' }}>
            Bekor qilish
          </button>
        </div>
      ) : (
        /* ── Not linked ── */
        <div>
          <div style={{ background: 'rgba(0,136,204,0.08)', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px' }}>
            <p className="text-xs text-secondary" style={{ lineHeight: '1.8' }}>
              Tugmani bosing → Bot ochiladi → <b>START</b> ni bosing → Avtomatik ulanadi ✨
            </p>
          </div>
          <button
            onClick={handleGenerateLink}
            disabled={generating}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', background: generating ? 'rgba(0,136,204,0.3)' : '#0088cc', border: 'none', color: 'white', padding: '13px', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
          >
            {generating ? <Loader size={18} className="animate-spin" /> : <BotMessageSquare size={18} />}
            {generating ? 'Tayyorlanmoqda...' : 'Telegram orqali ulash'}
          </button>
          {msg && <p className="text-xs mt-3" style={{ color: msg.startsWith('❌') ? '#ef4444' : 'rgba(255,255,255,0.6)' }}>{msg}</p>}
        </div>
      )}
    </div>
  );
}
