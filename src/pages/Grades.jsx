import React, { useState } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { AlertTriangle, TrendingUp, CheckCircle, GraduationCap, Plus, Minus } from 'lucide-react';

export default function Grades() {
  const [subjects, setSubjects] = useState([
    { id: 1, name: 'Web Dasturlash', credit: 4, score: 85, nb: 2, limit: 12 },
    { id: 2, name: 'Fizika', credit: 3, score: 72, nb: 5, limit: 8 },
    { id: 3, name: "Ma'lumotlar bazasi", credit: 4, score: 92, nb: 0, limit: 12 }
  ]);
  
  const [editingLimitId, setEditingLimitId] = useState(null);
  const [tempLimit, setTempLimit] = useState("");

  // Update NB
  const updateNb = (id, change) => {
    setSubjects(prev => prev.map(sub => {
      if (sub.id === id) {
        const newNb = Math.max(0, sub.nb + change);
        return { ...sub, nb: newNb };
      }
      return sub;
    }));
  };

  const saveLimit = (id) => {
    let parsedLimit = parseInt(tempLimit);
    if(isNaN(parsedLimit) || parsedLimit <= 0) parsedLimit = 12; // fallback

    setSubjects(prev => prev.map(sub => {
      if (sub.id === id) {
        return { ...sub, limit: parsedLimit };
      }
      return sub;
    }));
    setEditingLimitId(null);
  };

  // Calculate GPA roughly (A: 4, B: 3, C: 2)
  const calculateGPA = () => {
    let totalPoints = 0;
    let totalCredits = 0;
    
    subjects.forEach(sub => {
      let gpaPoint = 0;
      if (sub.score >= 90) gpaPoint = 4.0;
      else if (sub.score >= 80) gpaPoint = 3.0;
      else if (sub.score >= 70) gpaPoint = 2.0;
      else gpaPoint = 1.0;
      
      totalPoints += gpaPoint * sub.credit;
      totalCredits += sub.credit;
    });
    
    return totalCredits === 0 ? 0 : (totalPoints / totalCredits).toFixed(2);
  };

  return (
    <div>
      <h1 className="text-gradient mb-1">Baho & Davomat</h1>
      <p className="text-secondary text-sm mb-5">GPA hisobotlari va qoldirilgan darslar (NB)</p>

      {/* Main Stats Header */}
      <div className="flex-between gap-4 mb-6">
        <div className="glass-panel p-4 flex-center flex-column w-full" style={{ flex: 1 }}>
          <span className="text-sm text-secondary mb-1">Umumiy GPA</span>
          <span className="text-3xl font-bold text-gradient">{calculateGPA()}</span>
          <span className="text-xs text-success flex-center gap-1 mt-1"><TrendingUp size={12} /> Yuqori o'zlashtirish</span>
        </div>
      </div>

      <h2 className="text-lg font-medium mb-3">Fanlar bo'yicha ko'rsatkich</h2>
      
      <div className="flex-column gap-3">
        {subjects.map(sub => {
          const nbPercentage = (sub.nb / sub.limit) * 100;
          const isWarning = nbPercentage > 75; // 75% of limit reached

          return (
            <div key={sub.id} className="glass-panel p-4 pb-5">
              <div className="flex-between mb-3">
                <span className="font-semibold">{sub.name}</span>
                <span className="text-xs font-bold" style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                  {sub.credit} Kredit
                </span>
              </div>
              
              <div className="flex-between items-center" style={{ gap: '20px' }}>
                {/* Score Circular Bar */}
                <div style={{ width: '60px', height: '60px' }}>
                  <CircularProgressbar 
                    value={sub.score} 
                    text={`${sub.score}`} 
                    styles={buildStyles({
                      textColor: 'var(--text-primary)',
                      pathColor: sub.score >= 85 ? 'var(--success)' : (sub.score >= 70 ? 'var(--info)' : 'var(--danger)'),
                      trailColor: 'var(--bg-card-hover)',
                      textSize: '24px'
                    })}
                  />
                </div>
                
                {/* NB Status Bar */}
                <div style={{ flex: 1 }}>
                  <div className="flex-between mb-1">
                    <span className="text-xs text-secondary flex-center gap-1">Davomat (NB)</span>
                    <div className="flex-center gap-2">
                       <button onClick={() => updateNb(sub.id, -2)} style={{background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-primary)', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center'}}><Minus size={14}/></button>
                       
                       {editingLimitId === sub.id ? (
                         <div className="flex-center gap-1">
                           <span className="text-xs font-bold text-primary">{sub.nb} / </span>
                           <input 
                             type="number" 
                             value={tempLimit} 
                             onChange={(e) => setTempLimit(e.target.value)}
                             onBlur={() => saveLimit(sub.id)}
                             onKeyDown={(e) => e.key === 'Enter' && saveLimit(sub.id)}
                             autoFocus
                             style={{width: '35px', background: 'var(--bg-main)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '12px', textAlign: 'center', padding: '4px'}}
                           />
                         </div>
                       ) : (
                         <span 
                           className="text-xs font-bold cursor-pointer" 
                           onClick={() => { setEditingLimitId(sub.id); setTempLimit(sub.limit.toString()); }}
                           style={{ color: isWarning ? 'var(--danger)' : 'var(--text-primary)', borderBottom: '1px dashed var(--text-tertiary)', padding: '0 4px' }}
                           title="Limitni o'zgartirish"
                         >
                           {sub.nb} / {sub.limit} soat
                         </span>
                       )}

                       <button onClick={() => updateNb(sub.id, 2)} style={{background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-primary)', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center'}}><Plus size={14}/></button>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-card-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.min(nbPercentage, 100)}%`, 
                      height: '100%', 
                      background: isWarning ? 'var(--danger)' : 'var(--success)',
                      transition: 'width 1s ease-out'
                    }}></div>
                  </div>
                  {isWarning && (
                    <p className="text-xs text-danger mt-1 flex-center gap-1" style={{justifyContent: 'flex-start'}}>
                      <AlertTriangle size={12} /> Limitga yaqinlashdingiz!
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
