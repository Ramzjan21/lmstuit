import React, { useEffect, useState, useMemo } from 'react';
import { Search, Star, MessageSquare, X, Send, Crown, PenLine, ChevronLeft } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../utils/dateUtils';
import { useI18n } from '../i18n';

export default function Teachers({ user }) {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [teachers, setTeachers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await axios.get('/api/teachers');
      setTeachers(res.data.teachers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openTeacher = async (teacher) => {
    setSelectedTeacher(teacher);
    setNewReview('');
    setNewRating(0);
    try {
      const res = await axios.get(`/api/teachers/${teacher.id}/reviews`);
      setReviews(res.data.reviews || []);
    } catch (e) {
      console.error(e);
      setReviews([]);
    }
  };

  const closeTeacher = () => {
    setSelectedTeacher(null);
    setReviews([]);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!newReview.trim() || newRating === 0) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`/api/teachers/${selectedTeacher.id}/reviews`, {
        text: newReview.trim(),
        rating: newRating
      });
      setReviews(res.data.reviews || []);
      setNewReview('');
      setNewRating(0);
      await fetchTeachers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || t('common.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  const sortedTeachers = useMemo(() => {
    const list = teachers.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (t.department && t.department.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return list.sort((a, b) => {
      const aRating = a.rating || 0;
      const bRating = b.rating || 0;
      if (aRating !== bRating) return bRating - aRating;
      const aCount = a.reviewCount || 0;
      const bCount = b.reviewCount || 0;
      if (aCount !== bCount) return bCount - aCount;
      return a.name.localeCompare(b.name);
    });
  }, [teachers, searchQuery]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const top3 = sortedTeachers.slice(0, 3);
  const rest = sortedTeachers.slice(3);

  return (
    <div style={{ paddingBottom: '20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div className="flex-between mb-2">
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '10px 0' }}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{t('teachers.title')}</h1>
        <div style={{ width: 24 }}></div>
      </div>

      <div className="glass-panel p-2 mt-2 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '16px' }}>
        <Search size={18} className="text-secondary ml-2" />
        <input
          type="text"
          placeholder={t('teachers.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', padding: '6px' }}
        />
      </div>

      {loading ? (
        <div className="flex-center" style={{ flex: 1 }}>
          <div style={{ width: 30, height: 30, border: '3px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '10px', marginTop: '10px', marginBottom: '30px' }}>
              {/* 2nd Place */}
              {top3[1] && (
                <div onClick={() => openTeacher(top3[1])} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative', paddingBottom: '10px' }}>
                  <div style={{ position: 'relative', width: 70, height: 70 }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: "var(--text-primary)", border: '3px solid #0ea5e9', boxShadow: '0 0 15px rgba(14,165,233,0.3)' }}>
                      {getInitials(top3[1].name)}
                    </div>
                    <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', background: '#0ea5e9', color: "var(--text-primary)", width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', border: '2px solid var(--bg-main)' }}>2</div>
                  </div>
                  <p className="font-semibold mt-3" style={{ fontSize: '13px', textAlign: 'center', lineHeight: 1.1, height: '30px', overflow: 'hidden', color: 'var(--text-primary)' }}>{top3[1].name}</p>
                  <p style={{ fontSize: '15px', color: '#38bdf8', fontWeight: 'bold', marginTop: '4px' }}>{top3[1].rating > 0 ? top3[1].rating : '0.0'}</p>
                </div>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <div onClick={() => openTeacher(top3[0])} style={{ flex: 1.2, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative', zIndex: 10 }}>
                  <Crown size={32} color="#facc15" style={{ marginBottom: '-6px', filter: 'drop-shadow(0 0 8px rgba(250,204,21,0.6))', zIndex: 2 }} />
                  <div style={{ position: 'relative', width: 90, height: 90 }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #facc15, #fef08a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', fontWeight: 'bold', color: '#1a1a1a', border: '3px solid #facc15', boxShadow: '0 0 20px rgba(250,204,21,0.4)' }}>
                      {getInitials(top3[0].name)}
                    </div>
                    <div style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', background: '#facc15', color: '#1a1a1a', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', border: '2px solid var(--bg-main)' }}>1</div>
                  </div>
                  <p className="font-semibold mt-3" style={{ fontSize: '14px', textAlign: 'center', lineHeight: 1.2, height: '34px', overflow: 'hidden', color: 'var(--text-primary)' }}>{top3[0].name}</p>
                  <p style={{ fontSize: '18px', color: '#facc15', fontWeight: 'bold', marginTop: '2px' }}>{top3[0].rating > 0 ? top3[0].rating : '0.0'}</p>
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <div onClick={() => openTeacher(top3[2])} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative', paddingBottom: '10px' }}>
                  <div style={{ position: 'relative', width: 70, height: 70 }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: "var(--text-primary)", border: '3px solid #10b981', boxShadow: '0 0 15px rgba(16,185,129,0.3)' }}>
                      {getInitials(top3[2].name)}
                    </div>
                    <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: "var(--text-primary)", width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', border: '2px solid var(--bg-main)' }}>3</div>
                  </div>
                  <p className="font-semibold mt-3" style={{ fontSize: '13px', textAlign: 'center', lineHeight: 1.1, height: '30px', overflow: 'hidden', color: 'var(--text-primary)' }}>{top3[2].name}</p>
                  <p style={{ fontSize: '15px', color: '#34d399', fontWeight: 'bold', marginTop: '4px' }}>{top3[2].rating > 0 ? top3[2].rating : '0.0'}</p>
                </div>
              )}
            </div>
          )}

          {/* List Section */}
          <div className="glass-panel" style={{ borderRadius: '24px 24px 0 0', padding: '20px', margin: '0 -20px -20px -20px', flex: 1 }}>
            {rest.map((teacher, index) => (
              <div 
                key={teacher.id} 
                onClick={() => openTeacher(teacher)}
                className="flex-between py-3 hover-effect" 
                style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.2s', padding: '12px 10px', borderRadius: '12px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', width: '20px', textAlign: 'center' }}>{index + 4}</span>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {getInitials(teacher.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="font-semibold" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{teacher.name}</p>
                    <p className="text-secondary" style={{ fontSize: '11px', marginTop: '2px' }}>{teacher.department}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: teacher.rating > 0 ? '#facc15' : 'var(--text-secondary)' }}>{teacher.rating > 0 ? teacher.rating : '0.0'}</span>
                    <Star size={12} color={teacher.rating > 0 ? '#facc15' : 'var(--text-secondary)'} fill={teacher.rating > 0 ? '#facc15' : 'transparent'} />
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{teacher.reviewCount || 0} {t('teachers.reviews')}</span>
                </div>
              </div>
            ))}
            {sortedTeachers.length === 0 && (
              <p className="text-center text-secondary text-sm mt-4">{t('teachers.empty')}</p>
            )}
          </div>
        </>
      )}

      {/* Teacher Detail & Review Modal */}
      {selectedTeacher && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
             background: 'var(--bg-main)', width: '100%', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
             maxWidth: '600px', margin: 'auto auto 0 auto', maxHeight: '90vh',
             display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
            <div className="p-4 flex-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h2 className="font-semibold" style={{ fontSize: '18px', color: 'var(--text-primary)' }}>{selectedTeacher.name}</h2>
                <div className="text-xs text-secondary mt-1 flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
                  <span style={{ background: 'var(--border-color)', padding: '2px 8px', borderRadius: '10px' }}>
                    {selectedTeacher.title || 'Ustoz'}
                  </span>
                  <span>{selectedTeacher.department}</span>
                </div>
              </div>
              <button onClick={closeTeacher} className="flex-center" style={{ background: 'var(--border-color)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Overall Rating Header */}
            <div className="p-4" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-card)' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '40px', fontWeight: 800, color: '#f59e0b', lineHeight: '1' }}>{selectedTeacher.rating > 0 ? selectedTeacher.rating : '0.0'}</span>
                <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>{t('teachers.avgRating')}</p>
              </div>
              <div style={{ flex: 1 }}>
                <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '2px', marginBottom: '4px' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={18} color="#f59e0b" fill={s <= Math.round(selectedTeacher.rating) ? '#f59e0b' : 'transparent'} />
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('teachers.totalReviews', { count: selectedTeacher.reviewCount || 0 })}</p>
              </div>
            </div>

            {/* List of reviews */}
            <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px', background: 'var(--bg-card-hover)' }}>
              {reviews.length ? (
                <div className="flex-column gap-3">
                  {reviews.map(review => (
                    <div key={review.id} className="glass-panel p-3">
                      <div className="flex-between mb-2">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#a855f7', fontWeight: 'bold' }}>{getInitials(review.author)}</div>
                           <span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{review.author}</span>
                        </div>
                        <div className="flex-center" style={{ gap: '2px', background: 'rgba(250,204,21,0.1)', padding: '2px 6px', borderRadius: '10px' }}>
                          <Star size={10} color="#facc15" fill="#facc15" />
                          <span style={{ fontSize: '11px', color: '#facc15', fontWeight: 600, marginLeft: '2px' }}>{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm" style={{ lineHeight: '1.5', color: 'var(--text-primary)' }}>{review.text}</p>
                      <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>{formatDateTime(review.date, lang)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-center flex-column" style={{ padding: '40px 0', opacity: 0.6 }}>
                  <PenLine size={32} color="var(--text-secondary)" style={{ marginBottom: '10px' }} />
                  <p className="text-secondary text-sm text-center" style={{ whiteSpace: 'pre-line' }}>{t('teachers.reviewEmpty')}</p>
                </div>
              )}
            </div>

            {/* Add review form */}
            <div className="p-4" style={{ background: 'var(--bg-main)', paddingBottom: '30px' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>{t('teachers.rate')}</p>
              <div className="flex-center mb-3" style={{ background: 'var(--bg-card-hover)', padding: '8px', borderRadius: '16px', width: 'fit-content' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button" onClick={() => setNewRating(star)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 6px', transition: 'transform 0.2s', transform: newRating === star ? 'scale(1.2)' : 'none' }}>
                    <Star size={28} color={star <= newRating ? '#f59e0b' : 'var(--text-secondary)'} fill={star <= newRating ? '#f59e0b' : 'transparent'} />
                  </button>
                ))}
              </div>

              <form onSubmit={submitReview} className="flex-column gap-3 mt-2">
                <textarea
                  placeholder={t('teachers.reviewPlaceholder')}
                  value={newReview} onChange={(e) => setNewReview(e.target.value)} disabled={submitting} rows="3"
                  className="tg-input"
                  style={{ resize: 'none' }}
                />
                <button
                  type="submit" disabled={submitting || !newReview.trim() || newRating === 0}
                  className="flex-center"
                  style={{
                    width: '100%', height: '50px',
                    background: (!newReview.trim() || newRating === 0) ? 'var(--bg-card)' : 'linear-gradient(135deg, #a855f7, #c084fc)',
                    border: 'none', borderRadius: '14px', color: "var(--text-primary)", fontWeight: 'bold', fontSize: '15px',
                    cursor: (!newReview.trim() || newRating === 0) ? 'not-allowed' : 'pointer', transition: '0.2s',
                    boxShadow: (!newReview.trim() || newRating === 0) ? 'none' : '0 4px 15px rgba(168, 85, 247, 0.4)'
                  }}
                >
                  {t('teachers.submitReview')} <Send size={18} style={{ marginLeft: '8px' }} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
