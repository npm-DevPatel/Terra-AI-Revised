import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  ScanSearch, LayoutDashboard, FileText, Hash, Plus,
  Sparkles, ChevronLeft, Settings, X, Send, Loader2, Kanban,
  UserPlus, Mail, CheckCircle, AlertCircle, Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useTerraStore from '../../store/useTerraStore';
import { supabase } from '../../lib/supabaseClient';
import { API_BASE_URL } from '../../lib/apiBase';
import TerraCopilot from './TerraCopilot';

const PRODUCTS = [
  { id: 'lens',    label: 'Terra Lens',    Icon: ScanSearch,      color: '#10b981', bg: '#f0fdf4', path: 'lens' },
  { id: 'planner', label: 'Terra Planner', Icon: Kanban,           color: '#60a5fa', bg: '#eff6ff', path: 'planner' },
  { id: 'sim',     label: 'Terra Sim',     Icon: LayoutDashboard, color: '#3b82f6', bg: '#eff6ff', path: 'sim' },
  { id: 'flow',    label: 'Terra Report',  Icon: FileText,        color: '#8b5cf6', bg: '#f5f3ff', path: 'flow' },
];

/* ─── Invite Modal ─────────────────────────────────────────── */
function InviteModal({ projectId, onClose, session }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null); // null | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingInvites, setPendingInvites] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/invites/pending?project_id=${projectId}`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    }).then(r => r.json()).then(d => setPendingInvites(d.invites || [])).catch(() => {});
  }, [projectId, session]);

  async function send() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) return;
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/invites/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ project_id: projectId, email: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || 'Failed to send invite.'); setStatus('error'); }
      else {
        setStatus('success');
        setPendingInvites(prev => [{ id: data.invite_id, email: trimmed, created_at: new Date().toISOString() }, ...prev]);
        setEmail('');
      }
    } catch { setErrorMsg('Network error.'); setStatus('error'); }
    setSending(false);
  }

  async function revoke(inviteId) {
    await fetch(`${API_BASE_URL}/api/invites/${inviteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: '#fff', borderRadius: 24, padding: 32, width: 460, boxShadow: '0 40px 80px rgba(0,0,0,0.18)', fontFamily: "'Gabarito','Inter',system-ui", maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={18} color="#10b981" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Invite teammate</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>They'll get a branded Terra AI email</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', color: '#64748b' }}><X size={16} /></button>
        </div>

        {/* Email input */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '0 14px' }}>
            <Mail size={14} color="#94a3b8" />
            <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="colleague@email.com"
              style={{ flex: 1, padding: '11px 0', border: 'none', background: 'transparent', color: '#0f172a', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
          <button onClick={send} disabled={!email.trim() || sending}
            style={{ background: email.trim() ? '#10b981' : '#e2e8f0', border: 'none', borderRadius: 10, padding: '0 18px', color: email.trim() ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: email.trim() ? 'pointer' : 'default', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            {sending ? <Loader2 size={14} className="spin" /> : <Send size={13} />} Send
          </button>
        </div>

        {status === 'success' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#16a34a' }}>
            <CheckCircle size={14} /> Invite sent! They'll receive a branded email shortly.
          </div>
        )}
        {status === 'error' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#dc2626' }}>
            <AlertCircle size={14} /> {errorMsg}
          </div>
        )}

        {/* Pending invites list */}
        {pendingInvites.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Pending invites</p>
            {pendingInvites.map(inv => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={12} color="#0284c7" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{inv.email}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Awaiting acceptance</p>
                  </div>
                </div>
                <button onClick={() => revoke(inv.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Revoke</button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ─── New Channel Modal ────────────────────────────────────── */
function NewChannelModal({ projectId, onClose, onCreate }) {
  const { user } = useTerraStore();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
    const { data } = await supabase.from('channels').insert({ project_id: projectId, name: slug, created_by: user?.id }).select().single();
    if (data) onCreate(data);
    setCreating(false);
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: '#fff', borderRadius: 20, padding: 32, width: 400, boxShadow: '0 40px 80px rgba(0,0,0,0.15)', fontFamily: "'Gabarito', 'Inter', system-ui" }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>New channel</h2>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', color: '#64748b' }}><X size={16} /></button>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Choose a name for your channel. Spaces become hyphens.</p>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '0 14px' }}>
          <Hash size={14} color="#94a3b8" />
          <input
            value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && create()}
            placeholder="channel-name"
            style={{ flex: 1, padding: '11px 10px', border: 'none', background: 'transparent', color: '#0f172a', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onClose} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: 100, padding: '11px 0', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={create} disabled={!name.trim() || creating} style={{ flex: 2, background: name.trim() ? '#8b5cf6' : '#e2e8f0', border: 'none', borderRadius: 100, padding: '11px 0', color: name.trim() ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'default', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {creating ? <Loader2 size={14} className="spin" /> : <Hash size={13} />} Create channel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Channel Feed ─────────────────────────────────────────── */
function ChannelFeed({ channelId, channelName, members, onInvite }) {
  const { user } = useTerraStore();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelId) return;
    loadMessages();
    const sub = supabase.channel(`ch:${channelId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` }, (payload) => {
        // Fetch profile details for new message if not present
        const newMsg = payload.new;
        supabase.from('profiles').select('display_name, username, avatar_url').eq('id', newMsg.sender_id).single()
          .then(({ data }) => {
            newMsg.profiles = data;
            setMessages(m => [...m, newMsg]);
          });
      }).subscribe();
    return () => supabase.removeChannel(sub);
  }, [channelId]);

  async function loadMessages() {
    setLoading(true);
    const { data } = await supabase.from('messages').select('id, content, created_at, sender_id, profiles(display_name, username, avatar_url)').eq('channel_id', channelId).order('created_at', { ascending: true }).limit(100);
    setMessages(data || []);
    setLoading(false);
  }

  async function sendMessage() {
    if (!text.trim()) return;
    const msg = text.trim();
    setText('');
    await supabase.from('messages').insert({ channel_id: channelId, sender_id: user?.id, content: msg });
  }

  const initials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const avatarColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#f87171'];
  const avatarColor = (str) => { let h = 0; for (let i = 0; i < (str?.length || 0); i++) h = str.charCodeAt(i) + ((h << 5) - h); return avatarColors[Math.abs(h) % avatarColors.length]; };
  const fmtTime = (d) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', borderLeft: '1px solid #f1f5f9' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Hash size={13} color="#8b5cf6" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{channelName}</span>
        </div>

        {/* Member Avatars + Invite button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginRight: 4 }}>
            {members.slice(0, 3).map((m, idx) => {
              const name = m.profiles?.display_name || m.profiles?.username || 'Teammate';
              return (
                <div
                  key={idx}
                  title={name}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 100,
                    background: avatarColor(name),
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 700,
                    border: '2px solid #fff',
                    marginLeft: idx > 0 ? -8 : 0,
                    zIndex: 10 - idx,
                  }}
                >
                  {initials(name)}
                </div>
              );
            })}
            {members.length > 3 && (
              <div style={{
                width: 26,
                height: 26,
                borderRadius: 100,
                background: '#e2e8f0',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                fontWeight: 700,
                border: '2px solid #fff',
                marginLeft: -8,
                zIndex: 5,
              }}>
                +{members.length - 3}
              </div>
            )}
          </div>
          <button onClick={onInvite} style={{ background: '#f0fdf4', border: 'none', borderRadius: 100, padding: '6px 14px', color: '#10b981', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
            <UserPlus size={12} /> Invite
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94a3b8', fontSize: 13 }}>
            <Loader2 size={18} className="spin" style={{ marginRight: 8 }} /> Loading messages…
          </div>
        )}
        
        {!loading && (
          <>
            {/* Start of channel banner */}
            <div style={{ padding: '24px 20px', border: '1.5px dashed #e2e8f0', borderRadius: 16, background: '#fafbfd', marginBottom: 8, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Hash size={18} color="#0284c7" />
              </div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>This is the start of #{channelName}</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>Send a message to start collaborating with your team in this channel.</p>
              {members.length <= 1 && (
                <button onClick={onInvite} style={{ marginTop: 4, background: '#10b981', border: 'none', borderRadius: 100, padding: '6px 14px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  + Invite teammates
                </button>
              )}
            </div>

            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              const name = msg.profiles?.display_name || msg.profiles?.username || 'Unknown';
              const sameUser = prev?.sender_id === msg.sender_id;
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row', marginTop: sameUser ? -8 : 0 }}>
                  {!sameUser && (
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: avatarColor(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {initials(name)}
                    </div>
                  )}
                  {sameUser && <div style={{ width: 32, flexShrink: 0 }} />}
                  <div style={{ maxWidth: '72%' }}>
                    {!sameUser && (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{name}</span>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>{fmtTime(msg.created_at)}</span>
                      </div>
                    )}
                    <div style={{ background: isMe ? '#10b981' : '#f8fafc', color: isMe ? '#fff' : '#0f172a', padding: '9px 13px', borderRadius: isMe ? '14px 14px 4px 14px' : '4px 14px 14px 14px', fontSize: 13, lineHeight: 1.5 }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, flexShrink: 0 }}>
        <input
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder={`Message #${channelName}`}
          style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
        />
        <button onClick={sendMessage} disabled={!text.trim()} style={{ width: 40, height: 40, borderRadius: 10, background: text.trim() ? '#10b981' : '#e2e8f0', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: text.trim() ? 'pointer' : 'default', flexShrink: 0 }}>
          <Send size={15} color={text.trim() ? '#fff' : '#94a3b8'} />
        </button>
      </div>
    </div>
  );
}

/* ─── WorkspaceLayout ──────────────────────────────────────── */
export default function WorkspaceLayout() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { workspace, setActiveProject, setActiveChannel, toggleCopilot, user, session } = useTerraStore();

  const [project, setProject] = useState(null);
  const [channels, setChannels] = useState([]);
  const [members, setMembers] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [channelFeedOpen, setChannelFeedOpen] = useState(false);
  const [activeChannelName, setActiveChannelName] = useState('');

  const activeProduct = PRODUCTS.find(p => location.pathname.includes(`/${p.path}`));

  useEffect(() => {
    if (!projectId) return;
    loadProject();
    loadChannels();
    loadMembers();
  }, [projectId]);

  async function loadProject() {
    try {
      const { data } = await supabase.from('projects').select('id, name, description, product').eq('id', projectId).single();
      if (data) { setProject(data); setActiveProject(data.id, data.name); }
    } catch {}
  }

  async function loadChannels() {
    try {
      const { data } = await supabase.from('channels').select('id, name').eq('project_id', projectId).order('created_at');
      if (data?.length) {
        setChannels(data);
        if (!workspace.activeChannelId) { setActiveChannel(data[0].id); setActiveChannelName(data[0].name); }
      }
    } catch {}
  }

  async function loadMembers() {
    try {
      const { data } = await supabase.from('project_members').select('user_id, role, profiles(display_name, avatar_url, username)').eq('project_id', projectId);
      if (data) setMembers(data);
    } catch {}
  }

  const navigateTo = (path) => navigate(`/workspace/${projectId}/${path}`);
  const initials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const avatarColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#f87171'];
  const avatarColor = (str) => { let h = 0; for (let i = 0; i < (str?.length || 0); i++) h = str.charCodeAt(i) + ((h << 5) - h); return avatarColors[Math.abs(h) % avatarColors.length]; };

  function openChannel(ch) {
    setActiveChannel(ch.id);
    setActiveChannelName(ch.name);
    setChannelFeedOpen(true);
    navigate(`/workspace/${projectId}`);
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: "'Gabarito', 'Inter', system-ui", overflow: 'hidden' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={{ width: 240, background: '#fff', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
        {/* Back + project name */}
        <div style={{ padding: '16px 16px 12px' }}>
          <button onClick={() => navigate('/workspace')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 12, padding: 0, marginBottom: 12, fontFamily: 'inherit' }}>
            <ChevronLeft size={13} /> All Projects
          </button>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 2, lineHeight: 1.3 }}>{project?.name || '…'}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Project workspace</div>
        </div>

        <div style={{ height: 1, background: '#f1f5f9', margin: '0 16px' }} />

        {/* Products */}
        <div style={{ padding: '14px 16px 6px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Products</div>
          {PRODUCTS.map(({ id, label, Icon, color, bg, path }) => {
            const isActive = activeProduct?.id === id;
            return (
              <button
                key={id}
                onClick={() => { navigateTo(path); setChannelFeedOpen(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10, border: 'none', background: isActive ? bg : 'transparent', color: isActive ? color : '#475569', fontSize: 13, fontWeight: isActive ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s', marginBottom: 2 }}
              >
                <Icon size={14} color={isActive ? color : '#94a3b8'} />{label}
              </button>
            );
          })}
        </div>

        <div style={{ height: 1, background: '#f1f5f9', margin: '6px 16px' }} />

        {/* Channels */}
        <div style={{ padding: '8px 16px 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Channels</div>
            <button onClick={() => setShowChannelModal(true)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '3px 5px', cursor: 'pointer', display: 'flex', color: '#64748b' }}><Plus size={11} /></button>
          </div>
          {channels.map((ch) => {
            const isActive = workspace.activeChannelId === ch.id && channelFeedOpen;
            return (
              <button
                key={ch.id}
                onClick={() => openChannel(ch)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10, border: 'none', background: isActive ? '#f5f3ff' : 'transparent', color: isActive ? '#7c3aed' : '#475569', fontSize: 13, fontWeight: isActive ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s', marginBottom: 1 }}
              >
                <Hash size={12} color={isActive ? '#7c3aed' : '#94a3b8'} />{ch.name}
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        <div style={{ height: 1, background: '#f1f5f9', margin: '0 16px' }} />

        {/* Copilot + Settings */}
        <div style={{ padding: '8px 16px' }}>
          <button
            onClick={() => { setChannelFeedOpen(false); toggleCopilot(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10, border: 'none', background: workspace.copilotOpen ? '#f0fdf4' : 'transparent', color: workspace.copilotOpen ? '#10b981' : '#475569', fontSize: 13, fontWeight: workspace.copilotOpen ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 2 }}
          >
            <Sparkles size={14} color={workspace.copilotOpen ? '#10b981' : '#94a3b8'} />Terra Copilot
          </button>
          <button onClick={() => navigate('/workspace')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10, border: 'none', background: 'transparent', color: '#475569', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Settings size={14} color="#94a3b8" />Settings
          </button>
        </div>

        {/* Team avatars */}
        <div style={{ padding: '8px 16px 16px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {members.slice(0, 5).map((m) => {
            const name = m.profiles?.display_name || m.profiles?.username || '?';
            return (
              <div key={m.user_id} title={name} style={{ width: 28, height: 28, borderRadius: 8, background: avatarColor(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover' }} /> : initials(name)}
              </div>
            );
          })}
          <button onClick={() => setShowInviteModal(true)} style={{ width: 28, height: 28, borderRadius: 8, background: '#f1f5f9', border: '1.5px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}>
            <Plus size={12} />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{ height: 56, background: '#fff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activeProduct && (
              <>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: activeProduct.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <activeProduct.Icon size={14} color={activeProduct.color} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{activeProduct.label}</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>/</span>
                <span style={{ fontSize: 13, color: '#64748b' }}>{project?.name}</span>
              </>
            )}
            {channelFeedOpen && !activeProduct && (
              <>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Hash size={14} color="#7c3aed" /></div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{activeChannelName}</span>
              </>
            )}
            {!activeProduct && !channelFeedOpen && <span style={{ fontSize: 14, color: '#94a3b8' }}>Select a product or channel</span>}
          </div>
          <button
            onClick={toggleCopilot}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: workspace.copilotOpen ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${workspace.copilotOpen ? '#bbf7d0' : '#e2e8f0'}`, color: workspace.copilotOpen ? '#10b981' : '#64748b', padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
          >
            <Sparkles size={13} />Copilot
          </button>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {channelFeedOpen && !activeProduct ? (
            <ChannelFeed
              channelId={workspace.activeChannelId}
              channelName={activeChannelName}
              members={members}
              onInvite={() => setShowInviteModal(true)}
            />
          ) : (
            <Outlet />
          )}
        </div>
      </div>

      {/* ── Copilot panel ── */}
      <TerraCopilot projectId={projectId} projectName={project?.name} />

      {/* ── Modals ── */}
      <AnimatePresence>
        {showInviteModal && <InviteModal projectId={projectId} onClose={() => setShowInviteModal(false)} session={session} />}
        {showChannelModal && <NewChannelModal projectId={projectId} onClose={() => setShowChannelModal(false)} onCreate={(ch) => setChannels(c => [...c, ch])} />}
      </AnimatePresence>
    </div>
  );
}
