import React, { useEffect, useState, useMemo } from 'react';
import { Search, Star, MessageSquare, X, Send, Crown, PenLine, ChevronLeft, Briefcase, Plus } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Freelance({ user }) {
  const navigate = useNavigate();
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
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!newReview.trim() || newRating === 0) return;
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
      await fetchFreelancers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAd = async (e) => {
    e.preventDefault();
    if (!formTitle || !formDesc || !formPrice || !formContact) {
      return alert("Barcha maydonlarni to'ldiring");
    }
    setSubmitting(true);
    try {
      await axios.post('/api/freelancers', {
        title: formTitle,
        description: formDesc,
        price: formPrice,
        contact: formContact,
        userEmail: user?.email,
        userName: user?.name
      });
      setShowAddModal(false);
      await fetchFreelancers();
    } catch(err) {
      alert(err.response?.data?.error || 'Xatolik yuz berdi');
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
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '10px 0' }}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Talabalar Xizmati</h1>
        <button onClick={openAddModal} style={{ background: 'rgba(255,165,0,0.15)', border: 'none', color: '#ffa500', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Plus size={20} />
        </button>
      </div>

      <div className="glass-panel p-2 mt-2 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '16px' }}>
        <Search size={18} className="text-secondary ml-2" />
        <input
          type="text"
          placeholder="Ism yoki mutaxassislik..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, background: 'none', border: 'none', color: 'white', fontSize: '14px', outline: 'none', padding: '6px' }}
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
              let rankStyle = { color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' };
              if (isTop) {
                 if (rank === 1) rankStyle = { color: '#1a1a1a', background: 'linear-gradient(135deg, #facc15, #fef08a)' };
                 else if (rank === 2) rankStyle = { color: '#fff', background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' };
                 else rankStyle = { color: '#fff', background: 'linear-gradient(135deg, #10b981, #34d399)' };
              }

              return (
              <div 
                key={pItem.id} 
                className="glass-panel"
                style={{
                   padding: '16px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '12px',
                   background: isTop ? (rank === 1 ? 'rgba(250,204,21,0.05)' : 'rgba(255,255,255,0.03)') : 'rgba(255,255,255,0.02)',
                   border: isTop && rank === 1 ? '1px solid rgba(250,204,21,0.3)' : '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                     <div className="flex-center" style={{ width: 32, height: 32, borderRadius: '50%', ...rankStyle, fontWeight: 'bold', fontSize: '13px', flexShrink: 0 }}>
                        {rank}
                     </div>
                     <div>
                       <p className="font-bold" style={{ fontSize: '15px', color: isTop && rank === 1 ? '#facc15' : 'white', lineHeight: '1.2' }}>{pItem.title}</p>
                       <p className="text-secondary mt-1" style={{ fontSize: '12px' }}>{pItem.name}</p>
                     </div>
                  </div>
                  <div className="flex-column" style={{ alignItems: 'flex-end', marginLeft: '12px' }}>
                     <div className="flex-center" style={{ gap: '4px' }}>
                       <span style={{ fontSize: '16px', fontWeight: 'bold', color: pItem.rating > 0 ? '#f59e0b' : 'rgba(255,255,255,0.5)' }}>{pItem.rating > 0 ? pItem.rating : 'new'}</span>
                       <Star size={14} color={pItem.rating > 0 ? '#f59e0b' : 'rgba(255,255,255,0.2)'} fill={pItem.rating > 0 ? '#f59e0b' : 'transparent'} />
                     </div>
                     <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{pItem.reviewCount || 0} sharh</span>
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                   <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>{pItem.description}</p>
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
                     Sharh qoldirish
                   </button>
                </div>
              </div>
            )})}
            
            {sortedProfiles.length === 0 && (
              <div className="text-center p-4">
                 <p className="text-secondary text-sm my-6">Hech qanday maxsus xizmat elon qilinmadi!</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Profile Detail & Review Modal */}
      {selectedProfile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
             background: '#1a1d26', width: '100%', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
             maxWidth: '600px', margin: 'auto auto 0 auto', maxHeight: '90vh',
             display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
          }}>
            <div className="p-4 flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <h2 className="font-semibold" style={{ fontSize: '18px' }}>{selectedProfile.name}</h2>
                <div className="text-xs text-secondary mt-1 flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
                  <span style={{ background: 'rgba(255,165,0,0.15)', color: '#ffa500', padding: '2px 8px', borderRadius: '10px' }}>{selectedProfile.title}</span>
                </div>
              </div>
              <button onClick={closeProfile} className="flex-center" style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'white', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="p-4" style={{ background: 'rgba(255,165,0,0.03)' }}>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Xizmat haqida:</p>
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{selectedProfile.description}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                     <div className="glass-panel p-2">
                        <p className="text-xs text-secondary">Narx:</p>
                        <p className="font-semibold text-sm" style={{ color: '#22d3ee' }}>{selectedProfile.price}</p>
                     </div>
                     <div className="glass-panel p-2">
                        <p className="text-xs text-secondary">Aloqa:</p>
                        <p className="font-semibold text-sm" style={{ color: '#10b981' }}>{selectedProfile.contact}</p>
                     </div>
                </div>
            </div>

            <div className="p-4" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(251,191,36,0.03)' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '40px', fontWeight: 800, color: '#f59e0b', lineHeight: '1' }}>{selectedProfile.rating > 0 ? selectedProfile.rating : '0.0'}</span>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>O'RTACHA BAHO</p>
              </div>
              <div style={{ flex: 1 }}>
                <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '2px', marginBottom: '4px' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={18} color={s <= Math.round(selectedProfile.rating) ? '#f59e0b' : 'rgba(255,255,255,0.1)'} fill={s <= Math.round(selectedProfile.rating) ? '#f59e0b' : 'transparent'} />
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Umumiy {selectedProfile.reviewCount || 0} ta sharh</p>
              </div>
            </div>

            <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px', background: 'rgba(0,0,0,0.2)' }}>
              {reviews.length ? (
                <div className="flex-column gap-3">
                  {reviews.map(review => (
                    <div key={review.id} className="glass-panel p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                      <div className="flex-between mb-2">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#3b82f6', fontWeight: 'bold' }}>{getInitials(review.authorName)}</div>
                           <span className="font-semibold text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>{review.authorName}</span>
                        </div>
                        <div className="flex-center" style={{ gap: '2px', background: 'rgba(250,204,21,0.1)', padding: '2px 6px', borderRadius: '10px' }}>
                          <Star size={10} color="#facc15" fill="#facc15" />
                          <span style={{ fontSize: '11px', color: '#facc15', fontWeight: 600, marginLeft: '2px' }}>{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm" style={{ lineHeight: '1.5', color: 'rgba(255,255,255,0.9)' }}>{review.text}</p>
                      <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>{new Date(review.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-center flex-column" style={{ padding: '40px 0', opacity: 0.6 }}>
                  <PenLine size={32} color="var(--text-secondary)" style={{ marginBottom: '10px' }} />
                  <p className="text-secondary text-sm text-center">Hali sharhlar yo'q!<br/>Birinchi bo'lib baholang va sharh qoldiring.</p>
                </div>
              )}
            </div>

            <div className="p-4" style={{ background: '#1a1d26', paddingBottom: '30px' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>BAHO BERING:</p>
              <div className="flex-center mb-3" style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '16px', width: 'fit-content' }}>
                {[1, 2, 3, 4, 5].map(star => (
                   <button key={star} type="button" onClick={() => setNewRating(star)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 6px', transition: 'transform 0.2s', transform: newRating === star ? 'scale(1.2)' : 'none' }}>
                     <Star size={28} color={star <= newRating ? '#f59e0b' : 'rgba(255,255,255,0.1)'} fill={star <= newRating ? '#f59e0b' : 'transparent'} />
                   </button>
                 ))}
               </div>
 
               <form onSubmit={submitReview} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                 <div style={{ flex: 1 }}>
                   <textarea
                     placeholder="Xizmat sifati haqdagi fikringizni yozing..."
                     value={newReview} onChange={(e) => setNewReview(e.target.value)} disabled={submitting} rows="2"
                     style={{
                       width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                       borderRadius: '16px', padding: '14px', color: 'white', outline: 'none', resize: 'none', fontSize: '14px', fontFamily: 'inherit'
                     }}
                   />
                 </div>
                 <button
                   type="submit" disabled={submitting || !newReview.trim() || newRating === 0}
                   className="flex-center"
                   style={{
                     minWidth: '50px', height: '50px',
                     background: (!newReview.trim() || newRating === 0) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                     border: 'none', borderRadius: '16px', color: '#1a1a1a',
                     cursor: (!newReview.trim() || newRating === 0) ? 'not-allowed' : 'pointer', transition: '0.2s',
                     boxShadow: (!newReview.trim() || newRating === 0) ? 'none' : '0 4px 15px rgba(245, 158, 11, 0.4)'
                   }}
                 >
                   <Send size={20} />
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
            background: 'rgba(0,0,0,0.85)', zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out', padding: '20px', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: '#1a1d26', width: '100%', borderRadius: '24px',
                maxWidth: '600px', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
            }}>
                <div className="flex-between mb-4">
                  <h2 className="font-semibold" style={{ fontSize: '18px' }}>{user ? "O'z Xizmatingizni Qo'shing" : "Kirish talab etiladi"}</h2>
                  <button onClick={() => setShowAddModal(false)} className="flex-center" style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>

                {!user ? (
                   <p className="text-secondary">E'lon berish uchun ilovaga LMS tizimi orqali kiring.</p>
                ) : (
                <form onSubmit={submitAd} className="flex-column gap-3">
                  <div>
                     <label className="text-xs text-secondary mb-1" style={{ display: 'block' }}>Qaysi soha? (Masalan: Tarjimon, Web dasturchi, Dizayner)</label>
                     <input type="text" required value={formTitle} onChange={e => setFormTitle(e.target.value)} disabled={submitting} style={inputStyle} placeholder="Sohangiz nomini yozing..." />
                  </div>
                  <div>
                     <label className="text-xs text-secondary mb-1" style={{ display: 'block' }}>Xizmat tavsifi</label>
                     <textarea required rows={3} value={formDesc} onChange={e => setFormDesc(e.target.value)} disabled={submitting} style={{...inputStyle, resize: 'none'}} placeholder="Qanday xizmat ko'rsata olasiz? Tafsilotlarni yozing..."></textarea>
                  </div>
                  <div>
                     <label className="text-xs text-secondary mb-1" style={{ display: 'block' }}>Narx / Tolov</label>
                     <input type="text" required value={formPrice} onChange={e => setFormPrice(e.target.value)} disabled={submitting} style={inputStyle} placeholder="Masalan: 50,000 so'm yoki Kelishilgan holda" />
                  </div>
                  <div>
                     <label className="text-xs text-secondary mb-1" style={{ display: 'block' }}>Aloqa uchun (Telegram / Tel)</label>
                     <input type="text" required value={formContact} onChange={e => setFormContact(e.target.value)} disabled={submitting} style={inputStyle} placeholder="@username yoki +998901234567" />
                  </div>

                  <button type="submit" disabled={submitting} style={{
                    marginTop: '10px', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#1a1a1a', fontWeight: 'bold', border: 'none', borderRadius: '12px', padding: '14px', cursor: submitting ? 'not-allowed' : 'pointer'
                  }}>
                      {submitting ? 'Saqlanmoqda...' : "E'lonni Taqdim Etish"}
                  </button>
                </form>
                )}
            </div>
        </div>
       )}

    </div>
  );
}

const inputStyle = {
  width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px', padding: '12px 14px', color: 'white', outline: 'none', fontSize: '14px'
};
