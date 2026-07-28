/**
 * InviteFakeMembersModal.jsx — Card-grid member management panel
 *
 * Matches the "Daily Design Challenge" card anatomy:
 *   - Full-bleed portrait photo, rounded-2xl, soft shadow
 *   - Name centered at top, status row below
 *   - Footer: avatar + @handle on left, "+ Add member" pill on right
 *   - States: Online (green) / Connecting (spinner) / Pending (muted)
 *   - Role selector as overlay badge top-right of card
 *
 * Grid layout: 3–4 cards across on desktop.
 * Invite-link section below the grid.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  X, Loader2, Plus, Check, Copy, Link2, CheckCircle,
  Shield, Eye, Edit3, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';

/* ── helpers ────────────────────────────────────────────────── */
const ROLES = [
  { value: 'Owner',  icon: Shield, color: '#8b5cf6' },
  { value: 'Editor', icon: Edit3,  color: '#0ea5e9' },
  { value: 'Viewer', icon: Eye,    color: '#64748b' },
];

function genInviteId() {
  return 'terra-' + Math.random().toString(36).slice(2, 10);
}

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ── Role Badge Dropdown (overlaid on card) ─────────────────── */
function RoleBadge({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = ROLES.find((r) => r.value === value) || ROLES[1];

  return (
    <div className="mc-role-badge-wrap">
      <button
        className="mc-role-badge-btn"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
      >
        {current.value}
        <ChevronDown size={11} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="mc-role-dropdown"
          >
            {ROLES.map((r) => (
              <button
                key={r.value}
                className={`mc-role-option ${r.value === value ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onChange(r.value); setOpen(false); }}
              >
                {r.value}
                {r.value === value && <Check size={11} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Single Member Card ─────────────────────────────────────── */
function MemberCard({ user, status, role, onRoleChange, onAdd, addedAt }) {
  // status: 'idle' | 'connecting' | 'online' | 'pending'
  const isPending = status === 'pending';
  const isOnline = status === 'online';
  const isConnecting = status === 'connecting';
  const isIdle = status === 'idle';

  const name = user.name
    ? `${user.name.first} ${user.name.last}`
    : user.fullName || 'Unknown';
  const username = user.login?.username || user.username || name.toLowerCase().replace(/\s/g, '.');
  const photoUrl = user.picture?.large || user.avatar_url || '';
  const thumbUrl = user.picture?.medium || user.avatar_url || photoUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 22, stiffness: 200 }}
      className={`mc-card ${isPending ? 'mc-pending' : ''}`}
    >
      {/* Photo area (background) */}
      <img src={photoUrl} alt={name} className="mc-photo" />
      <div className="mc-gradient-top" />
      <div className="mc-gradient-bottom" />

      {/* Role badge overlay — top right */}
      <div className="mc-role-overlay">
        <RoleBadge value={role} onChange={onRoleChange} />
      </div>

      {/* Name + Status */}
      <div className="mc-header">
        <h3 className="mc-name">{name}</h3>
        <div className={`mc-status mc-status--${status}`}>
          {isConnecting && (
            <Loader2 size={13} className="mc-status-spinner" />
          )}
          {isOnline && <span className="mc-status-dot" />}
          {isPending && <span className="mc-status-dot pending" />}
          <span>
            {isIdle && 'Available'}
            {isConnecting && 'Connecting'}
            {isOnline && 'Online'}
            {isPending && 'Pending'}
          </span>
        </div>
      </div>

      {/* Spacer to push footer down */}
      <div style={{ flex: 1 }} />

      {/* Footer */}
      <div className="mc-footer">
        <div className="mc-user-info">
          <img src={thumbUrl} alt="" className="mc-mini-avatar" />
          <div className="mc-user-text">
            <span className="mc-handle">@{username}</span>
            {isPending && addedAt ? (
              <span className="mc-elapsed">{relativeTime(addedAt)}</span>
            ) : (
              <span className="mc-elapsed">New Member</span>
            )}
          </div>
        </div>
        <button
          className={`mc-add-btn ${(isOnline || isPending || isConnecting) ? 'mc-added' : ''}`}
          onClick={onAdd}
          disabled={isOnline || isPending || isConnecting}
        >
          {(isOnline || isPending) ? (
            <><Check size={14} /> Added</>
          ) : isConnecting ? (
            <><Loader2 size={14} className="mc-status-spinner" /> Adding</>
          ) : (
            <><Plus size={14} /> Add Member</>
          )}
        </button>
      </div>
    </motion.div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function InviteFakeMembersModal({ projectId, onClose, onMembersAdded }) {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [existingMembers, setExistingMembers] = useState([]);
  const [allAdded, setAllAdded] = useState([]);

  // Per-card state: { [uuid]: { status, role, addedAt } }
  const [cardStates, setCardStates] = useState({});

  // Invite link
  const [inviteLink, setInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Load existing members
  useEffect(() => {
    supabase
      .from('project_mock_members')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at')
      .then(({ data }) => {
        if (data) {
          setExistingMembers(data);
          // Initialize existing members as "online"
          const states = {};
          data.forEach((m) => {
            states[m.id] = { status: 'online', role: m.role_title || 'Editor', addedAt: m.created_at };
          });
          setCardStates((prev) => ({ ...prev, ...states }));
        }
      });
  }, [projectId]);

  // Fetch suggested users
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('https://randomuser.me/api/?results=8');
        const data = await res.json();
        setSuggestedUsers(data.results);
        // Initialize all as idle
        const states = {};
        data.results.forEach((u) => {
          states[u.login.uuid] = { status: 'idle', role: 'Editor' };
        });
        setCardStates((prev) => ({ ...prev, ...states }));
      } catch (err) {
        console.error('Failed to fetch suggested users', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    setInviteLink(`https://terra.ai/invite/${genInviteId()}`);
  }, []);

  const updateCardState = useCallback((id, updates) => {
    setCardStates((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...updates },
    }));
  }, []);

  async function addUser(user) {
    const uuid = user.login.uuid;
    const state = cardStates[uuid];
    if (!state || state.status !== 'idle') return;

    const role = state.role || 'Editor';
    const fullName = `${user.name.first} ${user.name.last}`;

    // → Connecting
    updateCardState(uuid, { status: 'connecting' });

    const { data } = await supabase
      .from('project_mock_members')
      .insert({
        project_id: projectId,
        name: fullName,
        email: user.email,
        avatar_url: user.picture.large,
        role_title: role,
      })
      .select()
      .single();

    if (data) {
      setAllAdded((prev) => [...prev, data]);

      // → Pending (with timestamp)
      updateCardState(uuid, { status: 'pending', addedAt: new Date().toISOString() });

      // → Online after 3s
      setTimeout(() => {
        updateCardState(uuid, { status: 'online' });
      }, 3000);
    } else {
      // Reset on failure
      updateCardState(uuid, { status: 'idle' });
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  function handleClose() {
    if (onMembersAdded && allAdded.length > 0) {
      onMembersAdded(allAdded);
    }
    onClose();
  }

  return (
    <div className="mc-overlay">
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 26, stiffness: 260 }}
        className="mc-panel"
      >
        {/* Header */}
        <div className="mc-panel-header">
          <div>
            <h2 className="mc-panel-title">Team Members</h2>
            <p className="mc-panel-sub">
              {existingMembers.length + allAdded.length} member{(existingMembers.length + allAdded.length) !== 1 ? 's' : ''} · Add collaborators to your project
            </p>
          </div>
          <button onClick={handleClose} className="mc-close-btn"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="mc-panel-body">
          {loading ? (
            <div className="mc-loading">
              <Loader2 size={28} className="mc-status-spinner" />
              <span>Finding teammates…</span>
            </div>
          ) : (
            <>
              {/* Existing members */}
              {existingMembers.length > 0 && (
                <>
                  <p className="mc-section-label">Current Members</p>
                  <div className="mc-grid">
                    {existingMembers.map((m) => {
                      const st = cardStates[m.id] || { status: 'online', role: m.role_title || 'Editor' };
                      return (
                        <MemberCard
                          key={m.id}
                          user={{
                            fullName: m.name,
                            username: m.email?.split('@')[0] || m.name.toLowerCase().replace(/\s/g, '.'),
                            avatar_url: m.avatar_url,
                          }}
                          status={st.status}
                          role={st.role}
                          onRoleChange={(r) => updateCardState(m.id, { role: r })}
                          onAdd={() => {}}
                          addedAt={m.created_at}
                        />
                      );
                    })}
                  </div>
                </>
              )}

              {/* Suggested / new */}
              <p className="mc-section-label">
                {existingMembers.length > 0 ? 'Suggested' : 'Discover Teammates'}
              </p>
              <div className="mc-grid">
                {suggestedUsers.map((u) => {
                  const uuid = u.login.uuid;
                  const st = cardStates[uuid] || { status: 'idle', role: 'Editor' };
                  return (
                    <MemberCard
                      key={uuid}
                      user={u}
                      status={st.status}
                      role={st.role}
                      onRoleChange={(r) => updateCardState(uuid, { role: r })}
                      onAdd={() => addUser(u)}
                      addedAt={st.addedAt}
                    />
                  );
                })}
              </div>

              {/* Invite link section */}
              <div className="mc-link-section">
                <div className="mc-link-row">
                  <Link2 size={16} color="#94a3b8" />
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="mc-link-input"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`mc-link-copy ${linkCopied ? 'copied' : ''}`}
                  >
                    {linkCopied ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy link</>}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mc-panel-footer">
          <span className="mc-footer-hint">
            {allAdded.length > 0
              ? `${allAdded.length} new member${allAdded.length !== 1 ? 's' : ''} added`
              : 'Click a card to invite a teammate'}
          </span>
          <button onClick={handleClose} className="mc-done-btn">
            <CheckCircle size={14} /> Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
