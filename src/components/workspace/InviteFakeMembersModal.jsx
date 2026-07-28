import { useState, useEffect } from 'react';
import { X, Loader2, Plus, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';

export default function InviteFakeMembersModal({ projectId, onClose, onMembersAdded }) {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());
  const [allAdded, setAllAdded] = useState([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('https://randomuser.me/api/?results=10');
        const data = await res.json();
        setSuggestedUsers(data.results);
      } catch (err) {
        console.error('Failed to fetch suggested users', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % suggestedUsers.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + suggestedUsers.length) % suggestedUsers.length);

  async function addCurrentMember() {
    const user = suggestedUsers[currentIndex];
    if (!user || addedIds.has(user.login.uuid)) return;
    
    setSaving(true);
    const fullName = `${user.name.first} ${user.name.last}`;
    const avatarUrl = user.picture.large;
    const email = user.email;

    const { data, error } = await supabase
      .from('project_mock_members')
      .insert({
        project_id: projectId,
        name: fullName,
        email: email,
        avatar_url: avatarUrl,
        role_title: 'Member',
      })
      .select()
      .single();

    if (data) {
      setAddedIds((prev) => new Set([...prev, user.login.uuid]));
      setAllAdded((prev) => [...prev, data]);
      setTimeout(() => {
        handleNext();
      }, 600); // Wait a bit to show success state before sliding to next
    }
    setSaving(false);
  }

  function handleClose() {
    if (onMembersAdded && allAdded.length > 0) {
      // Pass the added members back so parent can update immediately
      onMembersAdded(allAdded);
    }
    onClose();
  }

  const currentUser = suggestedUsers[currentIndex];
  const isAdded = currentUser && addedIds.has(currentUser.login.uuid);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(12px)',
      zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      {/* Close button outside */}
      <button 
        onClick={handleClose} 
        style={{ 
          position: 'absolute', top: 24, right: 24, 
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', 
          width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', cursor: 'pointer', backdropFilter: 'blur(4px)'
        }}
      >
        <X size={20} />
      </button>

      {loading ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: '#fff' }}
        >
          <Loader2 size={32} className="premium-spinner" style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: '0.02em' }}>Finding brilliant teammates...</div>
        </motion.div>
      ) : currentUser ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Left Arrow */}
          <button onClick={handlePrev} className="nav-arrow" style={arrowStyle}>
            <ChevronLeft size={24} />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentUser.login.uuid}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'relative',
                width: 380,
                height: 520,
                borderRadius: 32,
                overflow: 'hidden',
                boxShadow: '0 30px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset',
                background: '#000',
              }}
            >
              {/* Background Image */}
              <motion.img
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 4, ease: "easeOut" }}
                src={currentUser.picture.large}
                alt={`${currentUser.name.first} ${currentUser.name.last}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 0.85
                }}
              />

              {/* Top Gradient */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
                pointerEvents: 'none'
              }} />

              {/* Header Info */}
              <div style={{
                position: 'absolute', top: 40, left: 0, right: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                textAlign: 'center', zIndex: 2
              }}>
                <h2 style={{ 
                  margin: 0, color: '#fff', fontSize: 32, fontWeight: 700, 
                  letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                }}>
                  {currentUser.name.first} {currentUser.name.last}
                </h2>
                
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                  padding: '6px 14px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {!isAdded ? (
                    <>
                      <Loader2 size={13} color="#fff" style={{ animation: 'spin 1.5s linear infinite' }} />
                      <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>Connecting</span>
                    </>
                  ) : (
                    <>
                      <Check size={13} color="#4ade80" />
                      <span style={{ color: '#4ade80', fontSize: 13, fontWeight: 600 }}>Ready to Invite</span>
                    </>
                  )}
                </div>
              </div>

              {/* Bottom Gradient & Glass Panel */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '40px 24px 24px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0) 100%)',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                zIndex: 2
              }}>
                
                {/* User Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 36, height: 36, borderRadius: '50%', overflow: 'hidden',
                    border: '2px solid rgba(255,255,255,0.2)'
                  }}>
                    <img src={currentUser.picture.medium} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>@{currentUser.login.username}</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>{Math.floor(Math.random() * 59) + 1}m ago</div>
                  </div>
                </div>

                {/* Add Button */}
                <button
                  onClick={addCurrentMember}
                  disabled={isAdded || saving}
                  className="premium-add-btn"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: isAdded ? '#4ade80' : '#fff',
                    color: isAdded ? '#000' : '#000',
                    border: 'none', borderRadius: 100,
                    padding: '14px 24px', fontSize: 15, fontWeight: 700,
                    cursor: isAdded || saving ? 'default' : 'pointer',
                    boxShadow: isAdded ? '0 4px 15px rgba(74,222,128,0.4)' : '0 4px 15px rgba(255,255,255,0.2)',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit'
                  }}
                >
                  {saving ? (
                    <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                  ) : isAdded ? (
                    <Check size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                  {isAdded ? 'Added' : 'Add Member'}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Right Arrow */}
          <button onClick={handleNext} className="nav-arrow" style={arrowStyle}>
            <ChevronRight size={24} />
          </button>
        </div>
      ) : (
        <div style={{ color: '#fff' }}>No users found.</div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .nav-arrow {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          color: white;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
        }
        .nav-arrow:hover {
          background: rgba(255,255,255,0.2);
          transform: scale(1.05);
        }
        .nav-arrow:active {
          transform: scale(0.95);
        }
        .premium-add-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255,255,255,0.3) !important;
        }
        .premium-add-btn:active:not(:disabled) {
          transform: translateY(1px);
        }
      `}</style>
    </div>
  );
}

const arrowStyle = { /* moved to class for hover effects */ };
