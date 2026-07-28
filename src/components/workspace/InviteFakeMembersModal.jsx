/**
 * InviteFakeMembersModal.jsx — Card-based fake member invite flow
 * Each pending invite renders as a card with avatar, name, status pill,
 * and "+ Add Member" action. Persists to project_mock_members table.
 */
import { useState, useEffect } from 'react';
import { X, UserPlus, Loader2, CheckCircle, Plus, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';

function dicebearUrl(name) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'Member')}&backgroundColor=c084fc,818cf8,60a5fa,34d399,f59e0b,f87171&backgroundType=gradientLinear`;
}

function MemberCard({ member, onRemove }) {
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    const timer = setTimeout(() => setStatus('added'), 1400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.25 }}
      style={{
        background: '#fff',
        border: '1.5px solid #f1f5f9',
        borderRadius: 18,
        padding: 20,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <img
          src={member.avatar_url || dicebearUrl(member.name)}
          alt=""
          style={{ width: 48, height: 48, borderRadius: 14, objectFit: 'cover', background: '#f1f5f9' }}
        />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{member.name}</p>
          {member.email && (
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{member.email}</p>
          )}
          {member.role_title && (
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b', fontWeight: 500 }}>{member.role_title}</p>
          )}
        </div>
        <div>
          {status === 'connecting' ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 100,
              background: '#fef3c7', color: '#d97706',
              fontSize: 11, fontWeight: 700,
            }}>
              <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />
              Connecting…
            </span>
          ) : (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 100,
                background: '#f0fdf4', color: '#16a34a',
                fontSize: 11, fontWeight: 700,
              }}
            >
              <CheckCircle size={12} />
              Added
            </motion.span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>Added just now</span>
        <button
          onClick={() => onRemove(member.id)}
          style={{
            background: 'none', border: 'none', color: '#94a3b8',
            fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Remove
        </button>
      </div>
    </motion.div>
  );
}

export default function InviteFakeMembersModal({ projectId, onClose, onMembersAdded }) {
  const [members, setMembers] = useState([]); // persisted members shown as cards
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [existingMembers, setExistingMembers] = useState([]);

  // Load existing mock members on mount
  useEffect(() => {
    supabase
      .from('project_mock_members')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at')
      .then(({ data }) => {
        if (data) setExistingMembers(data);
      });
  }, [projectId]);

  async function addMember() {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setSaving(true);

    const avatarUrl = dicebearUrl(trimmedName);
    const { data, error } = await supabase
      .from('project_mock_members')
      .insert({
        project_id: projectId,
        name: trimmedName,
        email: email.trim() || null,
        avatar_url: avatarUrl,
        role_title: roleTitle.trim() || null,
      })
      .select()
      .single();

    if (data) {
      setMembers((prev) => [...prev, data]);
      setName('');
      setEmail('');
      setRoleTitle('');
    }
    setSaving(false);
  }

  function removeMember(id) {
    supabase.from('project_mock_members').delete().eq('id', id).then(() => {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setExistingMembers((prev) => prev.filter((m) => m.id !== id));
    });
  }

  function handleDone() {
    if (onMembersAdded) onMembersAdded([...existingMembers, ...members]);
    onClose();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(8px)',
      zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: '#fff', borderRadius: 24, padding: 32,
          width: 520, maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 40px 80px rgba(0,0,0,0.18)',
          fontFamily: "'Gabarito','Inter',system-ui",
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={18} color="#8b5cf6" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Add team members</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>Create demo teammates for your project workspace</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', color: '#64748b' }}>
            <X size={16} />
          </button>
        </div>

        {/* Input form */}
        <div style={{
          background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 16,
          padding: 18, marginBottom: 16,
        }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name *"
              style={{
                flex: 2, padding: '10px 14px', borderRadius: 10,
                border: '1.5px solid #e2e8f0', background: '#fff',
                color: '#0f172a', fontSize: 13, fontFamily: 'inherit', outline: 'none',
              }}
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optional)"
              style={{
                flex: 2, padding: '10px 14px', borderRadius: 10,
                border: '1.5px solid #e2e8f0', background: '#fff',
                color: '#0f172a', fontSize: 13, fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="Role / title (optional)"
              onKeyDown={(e) => e.key === 'Enter' && addMember()}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                border: '1.5px solid #e2e8f0', background: '#fff',
                color: '#0f172a', fontSize: 13, fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button
              onClick={addMember}
              disabled={!name.trim() || saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0 18px', borderRadius: 10, border: 'none',
                background: name.trim() ? '#8b5cf6' : '#e2e8f0',
                color: name.trim() ? '#fff' : '#94a3b8',
                fontSize: 13, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'default',
                fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}
            >
              {saving ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={14} />}
              Add Member
            </button>
          </div>
        </div>

        {/* Existing members */}
        {existingMembers.length > 0 && members.length === 0 && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Existing members
            </p>
            {existingMembers.map((m) => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', background: '#f8fafc', borderRadius: 12, marginBottom: 6,
              }}>
                <img
                  src={m.avatar_url || dicebearUrl(m.name)}
                  alt=""
                  style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{m.name}</p>
                  {m.role_title && <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>{m.role_title}</p>}
                </div>
                <span style={{
                  padding: '4px 10px', borderRadius: 100,
                  background: '#f0fdf4', color: '#16a34a',
                  fontSize: 10, fontWeight: 700,
                }}>
                  Member
                </span>
                <button
                  onClick={() => removeMember(m.id)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Newly added member cards */}
        <AnimatePresence>
          {members.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                Just added
              </p>
              {members.map((m) => (
                <MemberCard key={m.id} member={m} onRemove={removeMember} />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Footer actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: '#f1f5f9', border: 'none', borderRadius: 100,
              padding: '12px 0', color: '#64748b', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <SkipForward size={13} /> Skip for now
          </button>
          <button
            onClick={handleDone}
            style={{
              flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: '#8b5cf6', border: 'none', borderRadius: 100,
              padding: '12px 0', color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <CheckCircle size={14} /> Done
          </button>
        </div>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
