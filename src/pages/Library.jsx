import React, { useEffect, useRef, useState } from 'react';
import { Download, FileText, Mic, MicOff, Save, Trash2, Upload } from 'lucide-react';
import { getJson, setJson } from '../services/storageService';
import { useI18n } from '../i18n';

export default function Library({ user }) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('materials');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordError, setRecordError] = useState('');
  const [materials, setMaterials] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      const [localData, coursesData] = await Promise.all([
        getJson(`library_${user.email}`, []),
        getJson(`courses_${user.email}`, [])
      ]);

      const localMaterials = Array.isArray(localData) ? localData : [];
      const courseMaterials = Array.isArray(coursesData)
        ? coursesData.map((course, index) => ({
            id: `course_${index}_${course?.name || 'fan'}`,
            title: course?.name || 'Fan',
            type: 'LMS',
            size: `${Number(course?.credit || 0)} kredit`,
            subject: 'LMS course',
            url: null,
            readonly: true
          }))
        : [];

      setMaterials([...courseMaterials, ...localMaterials]);
      setLoaded(true);
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (!loaded || !user) return;
    const writableOnly = materials.filter((item) => !item.readonly);
    setJson(`library_${user.email}`, writableOnly);
  }, [materials, user, loaded]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'uz-UZ';

    recognition.onresult = (event) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) text += `${event.results[i][0].transcript} `;
      }
      if (text) setTranscript((prev) => prev + text);
    };

    recognition.onerror = (event) => {
      setIsRecording(false);
      if (event.error === 'network') {
        setRecordError('Tarmoq xatosi: ovozli aniqlash uchun internet kerak.');
      } else if (event.error === 'not-allowed') {
        setRecordError('Mikrofondan foydalanishga ruxsat berilmagan.');
      } else {
        setRecordError(`Xatolik: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes';
    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, index);
    return `${value.toFixed(1)} ${units[index]}`;
  };

  const uploadFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';

    const item = {
      id: Date.now(),
      title: file.name.replace(/\.[^/.]+$/, ''),
      type: ext,
      size: formatBytes(file.size),
      subject: 'Yuklangan fayl',
      url: URL.createObjectURL(file)
    };

    setMaterials((prev) => [item, ...prev]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeMaterial = (id) => {
    const target = materials.find((item) => String(item.id) === String(id));
    if (target?.readonly) {
      alert('LMS course ma`lumotlarini o`chirib bo`lmaydi.');
      return;
    }

    if (!window.confirm("Rostdan ham bu faylni o'chirmoqchimisiz?")) return;
    setMaterials((prev) => prev.filter((item) => item.id !== id));
  };

  const downloadMaterial = (item) => {
    if (!item.url) return;
    const anchor = document.createElement('a');
    anchor.href = item.url;
    anchor.download = `${item.title}.${item.type.toLowerCase()}`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setRecordError('Brauzer speech recognition funksiyasini qo`llamaydi.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    setRecordError('');
    recognitionRef.current.start();
    setIsRecording(true);
  };

  return (
    <div>
      <h1 className="text-gradient mb-1">Kutubxona</h1>
      <p className="text-secondary text-sm mb-4">{t('library.subtitle')}</p>

      <div className="flex-center mb-5" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px' }}>
        <button
          className="flex-center gap-2"
          onClick={() => setActiveTab('materials')}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'materials' ? 'var(--bg-card-hover)' : 'transparent',
            color: activeTab === 'materials' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontWeight: activeTab === 'materials' ? 600 : 400,
            transition: 'all 0.3s'
          }}
        >
          <FileText size={16} /> {t('library.materials')}
        </button>
        <button
          className="flex-center gap-2"
          onClick={() => setActiveTab('notes')}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'notes' ? 'var(--bg-card-hover)' : 'transparent',
            color: activeTab === 'notes' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontWeight: activeTab === 'notes' ? 600 : 400,
            transition: 'all 0.3s'
          }}
        >
          <Mic size={16} /> {t('library.notes')}
        </button>
      </div>

      {activeTab === 'materials' ? (
        <div className="flex-column gap-3">
          <input ref={fileInputRef} type="file" onChange={uploadFile} style={{ display: 'none' }} />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="glass-panel p-3 flex-center gap-2 transition hover:bg-card-hover text-sm font-medium w-full"
            style={{ border: '1px dashed var(--accent-primary)', color: 'var(--text-primary)', cursor: 'pointer', marginBottom: '8px' }}
          >
            <Upload size={18} color="var(--accent-primary)" /> {t('library.upload')}
          </button>

          {materials.length ? (
            materials.map((item) => (
              <div key={item.id} className="glass-panel p-4 flex-between">
                <div className="flex-center gap-3">
                  <div style={{ background: 'rgba(0,209,255,0.1)', padding: '10px', borderRadius: '10px', color: 'var(--accent-primary)' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-primary mb-1" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </p>
                    <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                      <span className="text-xs text-secondary">{item.subject}</span>
                      <span className="text-xs text-tertiary">| {item.size} ({item.type})</span>
                    </div>
                  </div>
                </div>

                <div className="flex-center gap-2">
                  <button
                    onClick={() => downloadMaterial(item)}
                    style={{ background: 'rgba(16,185,129,0.1)', border: 'none', color: 'var(--success)', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}
                    title="Yuklab olish"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => removeMaterial(item.id)}
                    disabled={item.readonly}
                    style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}
                    title="O`chirish"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-secondary mt-5">{t('library.empty')}</p>
          )}
        </div>
      ) : (
        <div className="glass-panel p-4 flex-column">
          <div className="flex-between mb-3">
            <span className="font-semibold text-sm">{t('library.noteTitle')}</span>
            {isRecording && <span className="text-xs text-danger">{t('library.recording')}</span>}
          </div>

          {!!recordError && (
            <div className="mb-3 p-2 rounded text-xs text-danger" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              {recordError}
            </div>
          )}

          <textarea
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            placeholder={t('library.notePlaceholder')}
            style={{
              width: '100%',
              height: '150px',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '12px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-base)',
              resize: 'none',
              marginBottom: '16px',
              outline: 'none'
            }}
          />

          <div className="flex-between">
            <button
              onClick={toggleRecording}
              style={{
                background: isRecording ? 'var(--danger)' : 'var(--accent-primary)',
                border: 'none',
                color: 'white',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              {isRecording ? t('library.stop') : t('library.start')}
            </button>

            <button
              onClick={() => alert('Qayd saqlandi (demo)')}
              style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid var(--success)',
                color: 'var(--success)',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Save size={16} /> {t('library.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
