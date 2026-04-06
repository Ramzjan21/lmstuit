import React, { useEffect, useState, useMemo } from 'react';
import { Search, Star, MessageSquare, X, Send, Crown, PenLine, ChevronLeft, Briefcase, Plus } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function Freelance({ user }) {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [freelancers, setFreelancers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Add ad Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formError, setFormError] = useState('');
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    fetchFreelancers();
  }, []);

  const fetchFreelancers = async () => {
    try {
      const res = await axios.get('/api/freelancers');
      setFreelancers(res.data.freelancers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openProfile = async (profile) => {
    setSelectedProfile(profile);
    setNewReview('');
    setNewRating(0);
    try {
      const res = await axios.get(`/api/freelancers/${profile.id}/reviews`);
      setReviews(res.data.reviews || []);
    } catch (e) {
      console.error(e);
      setReviews([]);
    }
  };

  const closeProfile = () => {
    setSelectedProfile(null);
    setReviews([]);
    setNewReview('');
    setNewRating(0);
    setReviewError('');
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    
    // Validation
    if (newRating === 0) {
      setReviewError(lang === 'ru' ? 'Пожалуйста, выберите рейтинг' : 'Iltimos, reyting tanlang');
      return;
    }
    
    if (!newReview.trim()) {
      setReviewError(lang === 'ru' ? 'Пожалуйста, напишите отзыв' : 'Iltimos, sharh yozing');
      return;
    }
    
    if (newReview.trim().length < 10) {
      setReviewError(lang === 'ru' ? 'Отзыв должен содержать минимум 10 символов' : 'Sharh kamida 10 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await axios.post(`/api/freelancers/${selectedProfile.id}/reviews`, {
        text: newReview.trim(),
        rating: newRating,
        authorEmail: user?.email,
        authorName: user?.name
      });
      setReviews(res.data.reviews || []);
      setNewReview('');
      setNewRating(0);
      setReviewError('');
      await fetchFreelancers();
    } catch (err) {
      console.error(err);
      setReviewError(err.response?.data?.error || t('common.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  const submitAd = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Validation
    if (!formTitle.trim()) {
      setFormError(lang === 'ru' ? 'Введите название услуги' : 'Xizmat nomini kiriting');
      return;
    }
    
    if (formTitle.trim().length < 3) {
      setFormError(lang === 'ru' ? 'Название должно содержать минимум 3 символа' : 'Nom kamida 3 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    
    if (!formDesc.trim()) {
      setFormError(lang === 'ru' ? 'Введите описание' : 'Tavsif kiriting');
      return;
    }
    
    if (formDesc.trim().length < 20) {
      setFormError(lang === 'ru' ? 'Описание должно содержать минимум 20 символов' : 'Tavsif kamida 20 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    
    if (!formPrice.trim()) {
      setFormError(lang === 'ru' ? 'Введите цену' : 'Narx kiriting');
      return;
    }
    
    if (!formContact.trim()) {
      setFormError(lang === 'ru' ? 'Введите контакт' : 'Kontakt kiriting');
      return;
    }
    
    setSubmitting(true);
    try {
      await axios.post('/api/freelancers', {
        title: formTitle.trim(),
        description: formDesc.trim(),
        price: formPrice.trim(),
        contact: formContact.trim(),
        userEmail: user?.email,
        userName: user?.name
      });
      setShowAddModal(false);
      setFormTitle('');
      setFormDesc('');
      setFormPrice('');
      setFormContact('');
      setFormError('');
      await fetchFreelancers();
    } catch(err) {
      setFormError(err.response?.data?.error || t('common.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  const openAddModal = () => {
    // If current user already has an ad, populate it
    const me = freelancers.find(f => f.id === user?.email);
    if (me) {
      setFormTitle(me.title);
      setFormDesc(me.description);
      setFormPrice(me.price);
      setFormContact(me.contact);
    } else {
      setFormTitle('');
      setFormDesc('');
      setFormPrice('');
      setFormContact('');
    }
    setFormError('');
    setShowAddModal(true);
  };

  const sortedProfiles = useMemo(() => {
    const list = freelancers.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
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
  }, [freelancers, searchQuery]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const top3 = sortedProfiles.slice(0, 3);
  const rest = sortedProfiles.slice(3);

  return (
    <div style={{ paddingBottom: '80px' }}>
      
      {/* Header */}
      <div className="flex-between mb-2">
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '10px 0' }}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{t('freelance.title')}</h1>
        <button onClick={openAddModal} style={{ background: 'rgba(255,165,0,0.15)', border: 'none', color: '#ffa500', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Plus size={20} />
        </button>
      </div>

      <div className="glass-panel p-2 mt-2 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '16px' }}>
        <Search size={18} className="text-secondary ml-2" />
        <input
          type="text"
          placeholder={t('freelance.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="tg-input"
          style={{ padding: '10px 14px', background: 'transparent' }}
        />
      </div>

      {loading ? (
        <div className="flex-center" style={{ flex: 1, height: '40vh' }}>
          <div style={{ width: 30, height: 30, border: '3px solid #ffa500', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* Smart Card List Section */}
          <div className="flex-column gap-3 mt-3">
            {sortedProfiles.map((pItem, index) => {
              const rank = index + 1;
              const isTop = rank <= 3 && pItem.rating > 0;
              let rankStyle = { color: 'var(--text-secondary)', background: 'var(--border-color)' };
              if (isTop) {
                 if (rank === 1) rankStyle = { color: '#1a1a1a', background: 'linear-gradient(135deg, #facc15, #fef08a)' };
                 else if (rank === 2) rankStyle = { color: "var(--text-primary)", background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' };
                 else rankStyle = { color: "var(--text-primary)", background: 'linear-gradient(135deg, #10b981, #34d399)' };
              }

              return (
              <div 
                key={pItem.id} 
                className="glass-panel"
                style={{
                   padding: '16px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '12px',
                   background: isTop ? (rank === 1 ? 'rgba(250,204,21,0.05)' : 'var(--bg-card)') : 'var(--bg-card)',
                   border: isTop && rank === 1 ? '1px solid rgba(250,204,21,0.3)' : '1px solid var(--border-color)'
                }}
              >
                <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                     <div className="flex-center" style={{ width: 32, height: 32, borderRadius: '50%', ...rankStyle, fontWeight: 'bold', fontSize: '13px', flexShrink: 0 }}>
                        {rank}
                     </div>
                     <div>
                       <p className="font-bold" style={{ fontSize: '15px', color: isTop && rank === 1 ? '#facc15' : 'var(--text-primary)', lineHeight: '1.2' }}>{pItem.title}</p>
                       <p className="text-secondary mt-1" style={{ fontSize: '12px' }}>{pItem.name}</p>
                     </div>
                  </div>
                  <div className="flex-column" style={{ alignItems: 'flex-end', marginLeft: '12px' }}>
                     <div className="flex-center" style={{ gap: '4px' }}>
                       <span style={{ fontSize: '16px', fontWeight: 'bold', color: pItem.rating > 0 ? '#f59e0b' : 'var(--text-secondary)' }}>{pItem.rating > 0 ? pItem.rating : 'new'}</span>
                       <Star size={14} color={pItem.rating > 0 ? '#f59e0b' : 'var(--text-secondary)'} fill={pItem.rating > 0 ? '#f59e0b' : 'transparent'} />
                     </div>
                     <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{pItem.reviewCount || 0} {t('freelance.reviews')}</span>
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--bg-card-hover)', borderRadius: '12px' }}>
                   <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>{pItem.description}</p>
                </div>

                <div className="flex-between" style={{ alignItems: 'center', marginTop: '4px', gap: '10px', flexWrap: 'wrap' }}>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flex: 1 }}>
                     <span style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                        {pItem.price}
                     </span>
                     <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                        {pItem.contact}
                     </span>
                   </div>
                   
                   <button 
                     onClick={() => openProfile(pItem)}
                     style={{
                        background: 'rgba(255,165,0,0.15)', color: '#ffa500', border: 'none', padding: '8px 14px',
                        borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'background 0.2s', flexShrink: 0
                     }}
                     onMouseOver={(e) => e.target.style.background = 'rgba(255,165,0,0.25)'}
                     onMouseOut={(e) => e.target.style.background = 'rgba(255,165,0,0.15)'}
                   >
                     {t('freelance.submitReview')}
                   </button>
                </div>
              </div>
            )})}
            
            {sortedProfiles.length === 0 && (
              <div className="text-center p-4">
                 <p className="text-secondary text-sm my-6">{t('freelance.empty')}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Profile Detail & Review Modal */}
      {selectedProfile && (
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
            <div className="p-4 flex-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h2 className="font-semibold" style={{ fontSize: '18px', color: 'var(--text-primary)' }}>{selectedProfile.name}</h2>
                <div className="text-xs text-secondary mt-1 flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
                  <span style={{ background: 'rgba(255,165,0,0.15)', color: '#ffa500', padding: '2px 8px', borderRadius: '10px' }}>{selectedProfile.title}</span>
                </div>
              </div>
              <button onClick={closeProfile} className="flex-center" style={{ background: 'var(--border-color)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="p-4" style={{ background: 'rgba(255,165,0,0.03)' }}>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{t('freelance.description')}:</p>
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{selectedProfile.description}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                     <div className="glass-panel p-2">
                        <p className="text-xs text-secondary">{t('freelance.price')}</p>
                        <p className="font-semibold text-sm" style={{ color: '#22d3ee' }}>{selectedProfile.price}</p>
                     </div>
                     <div className="glass-panel p-2">
                        <p className="text-xs text-secondary">{t('freelance.contactInfo')}:</p>
                        <p className="font-semibold text-sm" style={{ color: '#10b981' }}>{selectedProfile.contact}</p>
                     </div>
                </div>
            </div>

            <div className="p-4" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-card)' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '40px', fontWeight: 800, color: '#f59e0b', lineHeight: '1' }}>{selectedProfile.rating > 0 ? selectedProfile.rating : '0.0'}</span>
                <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>{t('freelance.avgRating')}</p>
              </div>
              <div style={{ flex: 1 }}>
                <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '2px', marginBottom: '4px' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={18} color="#f59e0b" fill={s <= Math.round(selectedProfile.rating) ? '#f59e0b' : 'transparent'} />
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('freelance.totalReviews', { count: selectedProfile.reviewCount || 0 })}</p>
              </div>
            </div>

            <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px', background: 'var(--bg-card-hover)' }}>
              {reviews.length ? (
                <div className="flex-column gap-3">
                  {reviews.map(review => (
                    <div key={review.id} className="glass-panel p-3">
                      <div className="flex-between mb-2">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#3b82f6', fontWeight: 'bold' }}>{getInitials(review.authorName)}</div>
                           <span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{review.authorName}</span>
                        </div>
                        <div className="flex-center" style={{ gap: '2px', background: 'rgba(250,204,21,0.1)', padding: '2px 6px', borderRadius: '10px' }}>
                          <Star size={10} color="#facc15" fill="#facc15" />
                          <span style={{ fontSize: '11px', color: '#facc15', fontWeight: 600, marginLeft: '2px' }}>{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm" style={{ lineHeight: '1.5', color: 'var(--text-primary)' }}>{review.text}</p>
                      <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                         {new Date(review.date).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-center flex-column" style={{ padding: '40px 0', opacity: 0.6 }}>
                  <PenLine size={32} color="var(--text-secondary)" style={{ marginBottom: '10px' }} />
                  <p className="text-secondary text-sm text-center" style={{ whiteSpace: 'pre-line' }}>{t('freelance.reviewEmpty')}</p>
                </div>
              )}
            </div>

            <div className="p-4" style={{ background: 'linear-gradient(180deg, var(--bg-main) 0%, var(--bg-card) 100%)', paddingBottom: '30px', borderTop: '1px solid var(--border-color)' }}>
              <div className="glass-panel p-4 mb-3" style={{ background: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)', letterSpacing: '0.5px' }}>{t('freelance.rate')}</p>
                <div className="flex-center mb-2" style={{ gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      type="button" 
                      onClick={() => setNewRating(star)} 
                      style={{ 
                        background: star <= newRating ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                        border: 'none', 
                        cursor: 'pointer', 
                        padding: '8px', 
                        borderRadius: '12px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                        transform: newRating === star ? 'scale(1.15)' : 'scale(1)',
                        boxShadow: star <= newRating ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
                      }}
                    >
                      <Star size={32} color={star <= newRating ? '#f59e0b' : 'var(--text-tertiary)'} fill={star <= newRating ? '#f59e0b' : 'transparent'} />
                    </button>
                  ))}
                </div>
                {newRating > 0 && (
                  <p className="text-center text-xs mt-2" style={{ color: '#f59e0b', fontWeight: 600 }}>
                    {newRating === 5 && "⭐ A'lo!"}
                    {newRating === 4 && '👍 Yaxshi!'}
                    {newRating === 3 && '👌 Qoniqarli'}
                    {newRating === 2 && "😐 O'rtacha"}
                    {newRating === 1 && '😞 Yomon'}
                  </p>
                )}
              </div>

              <form onSubmit={submitReview} className="flex-column gap-3">
                <div>
                  <label className="text-xs font-semibold mb-2" style={{ display: 'block', color: 'var(--text-secondary)' }}>
                    {lang === 'ru' ? 'Ваш отзыв' : 'Sizning sharhingiz'}
                  </label>
                  <textarea
                    placeholder={t('freelance.reviewPlaceholder')}
                    value={newReview} 
                    onChange={(e) => {
                      setNewReview(e.target.value);
                      setReviewError('');
                    }} 
                    disabled={submitting} 
                    rows="4"
                    className={`tg-input ${reviewError ? 'error' : ''}`}
                    style={{ resize: 'none' }}
                    maxLength={500}
                  />
                  <div className="flex-between mt-1" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    <span>{newReview.length}/500</span>
                    {reviewError && (
                      <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                        {reviewError}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="submit" disabled={submitting || !newReview.trim() || newRating === 0}
                  className="flex-center"
                  style={{
                    width: '100%', height: '54px',
                    background: (!newReview.trim() || newRating === 0) ? 'var(--glass-bg)' : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                    border: 'none', 
                    borderRadius: '16px', 
                    color: (!newReview.trim() || newRating === 0) ? 'var(--text-tertiary)' : '#1a1a1a', 
                    fontWeight: 'bold', 
                    fontSize: '15px',
                    cursor: (!newReview.trim() || newRating === 0) ? 'not-allowed' : 'pointer', 
                    transition: 'all 0.3s ease',
                    boxShadow: (!newReview.trim() || newRating === 0) ? 'none' : '0 8px 20px rgba(245, 158, 11, 0.4)',
                    transform: (!newReview.trim() || newRating === 0) ? 'none' : 'translateY(-2px)'
                  }}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin" style={{ width: '18px', height: '18px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', marginRight: '8px' }}></div>
                      {lang === 'ru' ? 'Отправка...' : 'Yuborilmoqda...'}
                    </>
                  ) : (
                    <>
                      {t('freelance.submitReview')} <Send size={18} style={{ marginLeft: '8px' }} />
                    </>
                  )}
                </button>
              </form>
            </div>
 
               <form onSubmit={submitReview} className="flex-column gap-3 mt-2">
                 <div>
                   <textarea
                     placeholder={t('freelance.reviewPlaceholder')}
                     value={newReview} 
                     onChange={(e) => {
                       setNewReview(e.target.value);
                       setReviewError('');
                     }} 
                     disabled={submitting} 
                     rows="4"
                     className={`tg-input ${reviewError ? 'error' : ''}`}
                     style={{ resize: 'none' }}
                     maxLength={500}
                   />
                   <div className="flex-between mt-1" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                     <span>{newReview.length}/500</span>
                     {reviewError && (
                       <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                         {reviewError}
                       </span>
                     )}
                   </div>
                 </div>
                 <button
                   type="submit" disabled={submitting || !newReview.trim() || newRating === 0}
                   className="flex-center"
                   style={{
                     width: '100%', height: '50px',
                     background: (!newReview.trim() || newRating === 0) ? 'var(--bg-card)' : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                     border: 'none', borderRadius: '14px', color: '#1a1a1a', fontWeight: 'bold', fontSize: '15px',
                     cursor: (!newReview.trim() || newRating === 0) ? 'not-allowed' : 'pointer', transition: '0.2s',
                     boxShadow: (!newReview.trim() || newRating === 0) ? 'none' : '0 4px 15px rgba(245, 158, 11, 0.4)'
                   }}
                 >
                   {submitting ? (
                     <>
                       <div className="animate-spin" style={{ width: '18px', height: '18px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', marginRight: '8px' }}></div>
                       {lang === 'ru' ? 'Отправка...' : 'Yuborilmoqda...'}
                     </>
                   ) : (
                     <>
                       {t('freelance.submitReview')} <Send size={18} style={{ marginLeft: '8px' }} />
                     </>
                   )}
                 </button>
               </form>
             </div>
           </div>
         </div>
       )}

       {/* Add your Ad modal */}
       {showAddModal && (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out', padding: '20px', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: 'var(--bg-main)', width: '100%', borderRadius: '24px',
                maxWidth: '600px', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
            }}>
                <div className="flex-between mb-4">
                  <h2 className="font-semibold" style={{ fontSize: '18px', color: 'var(--text-primary)' }}>{user ? t('freelance.addService') : t('login.title')}</h2>
                  <button onClick={() => setShowAddModal(false)} className="flex-center" style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>

                {!user ? (
                   <p className="text-secondary">Tizimga kirishingiz kerak.</p>
                ) : (
                <form onSubmit={submitAd} className="flex-column gap-3">
                  <div>
                     <label className="text-xs text-secondary mb-1" style={{ display: 'block' }}>{t('freelance.serviceName')}</label>
                     <input 
                       type="text" 
                       required 
                       value={formTitle} 
                       onChange={e => {
                         setFormTitle(e.target.value);
                         setFormError('');
                       }} 
                       disabled={submitting} 
                       className={`tg-input ${formError && !formTitle.trim() ? 'error' : ''}`}
                       placeholder="Tarjimon, Web dasturchi"
                       maxLength={100}
                     />
                  </div>
                  <div>
                     <label className="text-xs text-secondary mb-1" style={{ display: 'block' }}>{t('freelance.description')}</label>
                     <textarea 
                       required 
                       rows={4} 
                       value={formDesc} 
                       onChange={e => {
                         setFormDesc(e.target.value);
                         setFormError('');
                       }} 
                       disabled={submitting} 
                       className={`tg-input ${formError && !formDesc.trim() ? 'error' : ''}`}
                       style={{resize: 'none'}} 
                       placeholder="Xizmat haqida batafsil ma'lumot..."
                       maxLength={500}
                     />
                     <div className="text-xs text-tertiary mt-1">{formDesc.length}/500</div>
                  </div>
                  <div>
                     <label className="text-xs text-secondary mb-1" style={{ display: 'block' }}>{t('freelance.priceLabel')}</label>
                     <input 
                       type="text" 
                       required 
                       value={formPrice} 
                       onChange={e => {
                         setFormPrice(e.target.value);
                         setFormError('');
                       }} 
                       disabled={submitting} 
                       className={`tg-input ${formError && !formPrice.trim() ? 'error' : ''}`}
                       placeholder="50,000 so'm / Kelishilgan"
                       maxLength={50}
                     />
                  </div>
                  <div>
                     <label className="text-xs text-secondary mb-1" style={{ display: 'block' }}>{t('freelance.contact')}</label>
                     <input 
                       type="text" 
                       required 
                       value={formContact} 
                       onChange={e => {
                         setFormContact(e.target.value);
                         setFormError('');
                       }} 
                       disabled={submitting} 
                       className={`tg-input ${formError && !formContact.trim() ? 'error' : ''}`}
                       placeholder="@username yoki +998901234567"
                       maxLength={50}
                     />
                  </div>

                  {formError && (
                    <div style={{ 
                      padding: '12px', 
                      background: 'rgba(255, 79, 122, 0.1)', 
                      border: '1px solid rgba(255, 79, 122, 0.3)',
                      borderRadius: '12px',
                      color: 'var(--danger)',
                      fontSize: '13px',
                      fontWeight: 600
                    }}>
                      {formError}
                    </div>
                  )}

                  <button type="submit" disabled={submitting} style={{
                    marginTop: '10px', 
                    background: submitting ? 'var(--bg-card)' : 'linear-gradient(135deg, #f59e0b, #fbbf24)', 
                    color: submitting ? 'var(--text-secondary)' : '#1a1a1a', 
                    fontWeight: 'bold', 
                    border: 'none', 
                    borderRadius: '12px', 
                    padding: '14px', 
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                      {submitting ? (
                        <>
                          <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                          {lang === 'ru' ? 'Сохранение...' : 'Saqlanmoqda...'}
                        </>
                      ) : (
                        t('freelance.save')
                      )}
                  </button>
                </form>
                )}
            </div>
        </div>
       )}

    </div>
  );
}
