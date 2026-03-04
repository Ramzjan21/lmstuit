import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Save, FileText, Download, Play, Pause, Upload, Trash2 } from 'lucide-react';

export default function Library() {
  const [activeTab, setActiveTab] = useState('materials'); // 'materials' or 'notes'
  
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordError, setRecordError] = useState('');
  const recognitionRef = useRef(null);

  // Materials State
  const [materials, setMaterials] = useState([
    { id: 1, title: 'Web Dasturlash (1-Mavzu)', type: 'PDF', size: '2.4 MB', subject: 'Web Dasturlash', url: null },
    { id: 2, title: 'Fizika laboratoriya qoidalari', type: 'PDF', size: '1.1 MB', subject: 'Fizika', url: null },
    { id: 3, title: 'Baza arxitekturasi', type: 'PPTX', size: '5.6 MB', subject: "Ma'lumotlar bazasi", url: null }
  ]);
  const fileInputRef = useRef(null);

  const formatBytes = (bytes, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toUpperCase();
    const sizeStr = formatBytes(file.size);
    const url = URL.createObjectURL(file);

    const newMaterial = {
      id: Date.now(),
      title: file.name.replace(/\.[^/.]+$/, ""), // remove extension
      type: ext.length > 4 ? ext.substring(0, 4) : ext,
      size: sizeStr,
      subject: 'Yangi Yuklangan',
      url: url
    };

    setMaterials([newMaterial, ...materials]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = (mat) => {
    if (mat.url) {
      const a = document.createElement('a');
      a.href = mat.url;
      a.download = `${mat.title}.${mat.type.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert("Hozircha faqat o'zingiz yuklagan fayllarni yuklab olishingiz mumkin (bu demo fayl).");
    }
  };

  const handleDelete = (id) => {
    if(window.confirm("Rostdan ham bu faylni o'chirmoqchimisiz?")) {
      setMaterials(prev => prev.filter(m => m.id !== id));
    }
  };

  useEffect(() => {
    // Setup Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'uz-UZ'; // Uzbek support

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentTranscript += t + ' ';
          }
        }
        if (currentTranscript) {
          setTranscript(prev => prev + currentTranscript);
        }
      };

      recognitionRef.current.onstart = () => {
        setRecordError('');
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        if (event.error === 'network') {
          setRecordError("Tarmoq xatosi: Ovozni aniqlash uchun internet aloqasi zarur.");
        } else if (event.error === 'not-allowed') {
          setRecordError("Xatolik: Mikrofondan foydalanishga ruxsat berilmagan.");
        } else {
          setRecordError(`Xatolik yuz berdi: ${event.error}`);
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      } else {
        alert("Sizning brauzeringiz ovozdan matnga og'irishni (SpeechRecognition) qo'llab-quvvatlamaydi.");
      }
    }
    setIsRecording(!isRecording);
  };

  return (
    <div>
      <h1 className="text-gradient mb-1">Kutubxona</h1>
      <p className="text-secondary text-sm mb-4">O'quv materiallari va tezkor qaydlar</p>

      {/* Custom Tabs */}
      <div className="flex-center mb-5" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px' }}>
        <button 
          className="flex-center gap-2"
          onClick={() => setActiveTab('materials')}
          style={{
            flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none',
            background: activeTab === 'materials' ? 'var(--bg-card-hover)' : 'transparent',
            color: activeTab === 'materials' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontWeight: activeTab === 'materials' ? 600 : 400,
            transition: 'all 0.3s'
          }}
        >
          <FileText size={16} /> Materiallar
        </button>
        <button 
          className="flex-center gap-2"
          onClick={() => setActiveTab('notes')}
          style={{
            flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none',
            background: activeTab === 'notes' ? 'var(--bg-card-hover)' : 'transparent',
            color: activeTab === 'notes' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontWeight: activeTab === 'notes' ? 600 : 400,
            transition: 'all 0.3s'
          }}
        >
          <Mic size={16} /> Ovozli Qayd
        </button>
      </div>

      {activeTab === 'materials' ? (
        <div className="flex-column gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{display: 'none'}} />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="glass-panel p-3 flex-center gap-2 transition hover:bg-card-hover text-sm font-medium w-full"
            style={{ border: '1px dashed var(--accent-primary)', color: 'var(--text-primary)', cursor: 'pointer', marginBottom: '8px' }}
          >
            <Upload size={18} color="var(--accent-primary)" /> Yangi material yuklash
          </button>

          {materials.map(mat => (
            <div key={mat.id} className="glass-panel p-4 flex-between">
              <div className="flex-center gap-3">
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px', borderRadius: '10px', color: 'var(--accent-primary)' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <p className="font-medium text-sm text-primary mb-1" style={{maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    {mat.title}
                  </p>
                  <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                    <span className="text-xs text-secondary">{mat.subject}</span>
                    <span className="text-xs text-tertiary">| {mat.size} ({mat.type})</span>
                  </div>
                </div>
              </div>
              <div className="flex-center gap-2">
                <button onClick={() => handleDownload(mat)} className="transition" style={{ background: 'rgba(16, 185, 129, 0.1)', border: 'none', color: 'var(--success)', cursor: 'pointer', padding: '8px', borderRadius: '8px' }} title="Yuklab olish">
                  <Download size={16} />
                </button>
                <button onClick={() => handleDelete(mat.id)} className="transition" style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px', borderRadius: '8px' }} title="O'chirish">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {materials.length === 0 && <p className="text-center text-sm text-secondary mt-5">Materiallar yo'q</p>}
        </div>
      ) : (
        <div className="glass-panel p-4 flex-column">
          <div className="flex-between mb-3">
            <span className="font-semibold text-sm">Aqlli qayd (Dars davomida)</span>
            {isRecording && (
              <span className="text-xs text-danger flex-center gap-1" style={{ animation: 'pulse 1.5s infinite' }}>
                <span style={{ width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%'}}></span> Yozilmoqda...
              </span>
            )}
          </div>

          {recordError && (
            <div className="mb-3 p-2 rounded text-xs text-danger" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              {recordError}
            </div>
          )}
          
          <textarea 
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Ovozli yozishni boshlash uchun mikrofonni bosing yoki qo'lda kiriting..."
            style={{
              width: '100%', height: '150px',
              background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
              borderRadius: '8px', padding: '12px', color: 'var(--text-primary)',
              fontFamily: 'var(--font-base)', resize: 'none', marginBottom: '16px',
              outline: 'none'
            }}
          />

          <div className="flex-between">
            <button 
              onClick={toggleRecording}
              style={{
                background: isRecording ? 'var(--danger)' : 'var(--accent-primary)',
                color: 'white', border: 'none', borderRadius: '50%',
                width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isRecording ? '0 4px 14px rgba(239, 68, 68, 0.4)' : '0 4px 14px rgba(99, 102, 241, 0.4)',
                transition: 'all 0.3s'
              }}
            >
              {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            <button className="flex-center gap-2 text-sm text-white" style={{ background: 'var(--success)', border: 'none', padding: '10px 20px', borderRadius: '25px', cursor: 'pointer', fontWeight: 600 }}>
              <Save size={16} /> Saqlash
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
