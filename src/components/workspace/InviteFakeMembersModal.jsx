/**
 * InviteFakeMembersModal.jsx — Premium Member Management Panel
 *
 * Two-section layout:
 *   TOP:    Card carousel for discovering & adding new members (randomuser.me)
 *   BOTTOM: Added-members grid + invite-link generator
 *
 * Persists to project_mock_members table via Supabase.
 */
import { useState, useEffect } from 'react';
import {
  X, Loader2, Plus, ChevronLeft, ChevronRight, Check,
  Copy, Link2, UserPlus, Shield, Eye, Edit3, CheckCircle,
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

function timeAgo() {
  const mins = Math.floor(Math.random() * 58) + 1;
  return `${mins}m ago`;
}

/* ── Role Selector Pill ─────────────────────────────────────── */
function RoleSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = ROLES.find((r) => r.value === value) || ROLES[2];
  const Icon = current.icon;

  return (
    <div className="invite-role-selector">
      <button
        className="invite-role-btn"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{ '--role-color': current.color }}
      >
        <Icon size={12} />
        {current.value}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="invite-role-dropdown"
          >
            {ROLES.map((r) => {
              const RIcon = r.icon;
              return (
                <button
                  key={r.value}
                  className={`invite-role-option ${r.value === value ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onChange(r.value); setOpen(false); }}
                >
                  <RIcon size={13} color={r.color} />
                  <span>{r.value}</span>
                  {r.value === value && <Check size={12} color={r.color} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Member Card (added members grid) ───────────────────────── */
function MemberGridCard({ member, isPending }) {
  const role = ROLES.find((r) => r.value === member.role_title) || ROLES[2];
  const RoleIcon = role.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`invite-member-card ${isPending ? 'pending' : ''}`}
    >
      <div className="invite-member-avatar-wrap">
        <img
          src={member.avatar_url}
          alt={member.name}
          className="invite-member-avatar"
        />
        <span className={`invite-presence-dot ${isPending ? 'pending' : 'active'}`} />
      </div>
      <div className="invite-member-info">
        <span className="invite-member-name">{member.name}</span>
        {member.email && (
          <span className="invite-member-email">{member.email}</span>
        )}
      </div>
      <div className="invite-member-meta">
        <span
          className="invite-role-badge"
          style={{ '--role-color': role.color }}
        >
          <RoleIcon size={11} />
          {role.value}
        </span>
        {isPending && (
          <span className="invite-pending-tag">Pending</span>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function InviteFakeMembersModal({ projectId, onClose, onMembersAdded }) {
  // Card carousel state
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());
  const [selectedRole, setSelectedRole] = useState('Editor');

  // Members management state
  const [allAdded, setAllAdded] = useState([]);
  const [existingMembers, setExistingMembers] = useState([]);
  const [pendingIds, setPendingIds] = useState(new Set());

  // Invite link state
  const [inviteLink, setInviteLink] = useState('');
  const [linkRole, setLinkRole] = useState('Viewer');
  const [linkCopied, setLinkCopied] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('discover');

  // Load existing members
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

  // Fetch suggested users
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

  // Generate invite link on mount
  useEffect(() => {
    setInviteLink(`https://terra.ai/invite/${genInviteId()}`);
  }, []);

  const handleNext = () => setCurrentIndex((p) => (p + 1) % suggestedUsers.length);
  const handlePrev = () => setCurrentIndex((p) => (p - 1 + suggestedUsers.length) % suggestedUsers.length);

  async function addCurrentMember() {
    const user = suggestedUsers[currentIndex];
    if (!user || addedIds.has(user.login.uuid)) return;

    setSaving(true);
    const fullName = `${user.name.first} ${user.name.last}`;

    const { data } = await supabase
      .from('project_mock_members')
      .insert({
        project_id: projectId,
        name: fullName,
        email: user.email,
        avatar_url: user.picture.large,
        role_title: selectedRole,
      })
      .select()
      .single();

    if (data) {
      setAddedIds((prev) => new Set([...prev, user.login.uuid]));
      setPendingIds((prev) => new Set([...prev, data.id]));
      setAllAdded((prev) => [...prev, data]);

      // Clear pending after 3s
      setTimeout(() => {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(data.id);
          return next;
        });
      }, 3000);

      // Advance card after brief delay
      setTimeout(handleNext, 600);
    }
    setSaving(false);
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  function regenerateLink() {
    setInviteLink(`https://terra.ai/invite/${genInviteId()}`);
    setLinkCopied(false);
  }

  function handleClose() {
    if (onMembersAdded && allAdded.length > 0) {
      onMembersAdded(allAdded);
    }
    onClose();
  }

  const currentUser = suggestedUsers[currentIndex];
  const isAdded = currentUser && addedIds.has(currentUser.login.uuid);
  const combinedMembers = [...existingMembers, ...allAdded];

  return (
    <div className="invite-overlay">
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="invite-panel"
      >
        {/* ─── Header ─────────────────────────────────────────── */}
        <div className="invite-header">
          <div className="invite-header-left">
            <div className="invite-header-icon">
              <UserPlus size={18} color="#10b981" />
            </div>
            <div>
              <h2 className="invite-title">Team Members</h2>
              <p className="invite-subtitle">
                {combinedMembers.length} member{combinedMembers.length !== 1 ? 's' : ''} · Manage your project team
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="invite-close-btn">
            <X size={16} />
          </button>
        </div>

        {/* ─── Tabs ───────────────────────────────────────────── */}
        <div className="invite-tabs">
          <button
            className={`invite-tab ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            <UserPlus size={14} />
            Discover
          </button>
          <button
            className={`invite-tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <Shield size={14} />
            Members
            {combinedMembers.length > 0 && (
              <span className="invite-tab-count">{combinedMembers.length}</span>
            )}
          </button>
          <button
            className={`invite-tab ${activeTab === 'invite' ? 'active' : ''}`}
            onClick={() => setActiveTab('invite')}
          >
            <Link2 size={14} />
            Invite Link
          </button>
        </div>

        {/* ─── Tab Content ────────────────────────────────────── */}
        <div className="invite-body">
          <AnimatePresence mode="wait">
            {/* ── Discover Tab ───────────────────────────────── */}
            {activeTab === 'discover' && (
              <motion.div
                key="discover"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="invite-discover-tab"
              >
                {loading ? (
                  <div className="invite-loading">
                    <Loader2 size={28} className="invite-spinner" />
                    <span>Finding teammates…</span>
                  </div>
                ) : currentUser ? (
                  <div className="invite-carousel-area">
                    {/* Role selector above the card */}
                    <div className="invite-role-row">
                      <span className="invite-role-label">Assign role:</span>
                      <RoleSelector value={selectedRole} onChange={setSelectedRole} />
                    </div>

                    <div className="invite-carousel">
                      <button onClick={handlePrev} className="invite-nav-arrow">
                        <ChevronLeft size={20} />
                      </button>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentUser.login.uuid}
                          initial={{ opacity: 0, y: 20, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -20, scale: 0.96 }}
                          transition={{ type: 'spring', damping: 24, stiffness: 220 }}
                          className="invite-profile-card"
                        >
                          {/* Profile image */}
                          <div className="invite-profile-image-wrap">
                            <motion.img
                              initial={{ scale: 1.06 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 3.5, ease: 'easeOut' }}
                              src={currentUser.picture.large}
                              alt={`${currentUser.name.first} ${currentUser.name.last}`}
                              className="invite-profile-image"
                            />
                            <div className="invite-profile-gradient-top" />
                            <div className="invite-profile-gradient-bottom" />
                          </div>

                          {/* Name & status overlay */}
                          <div className="invite-profile-overlay">
                            <h3 className="invite-profile-name">
                              {currentUser.name.first} {currentUser.name.last}
                            </h3>
                            <div className={`invite-status-pill ${isAdded ? 'ready' : ''}`}>
                              {!isAdded ? (
                                <>
                                  <Loader2 size={12} className="invite-spinner" />
                                  <span>Connecting</span>
                                </>
                              ) : (
                                <>
                                  <Check size={12} />
                                  <span>Added</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="invite-profile-footer">
                            <div className="invite-profile-user">
                              <img
                                src={currentUser.picture.medium}
                                alt=""
                                className="invite-profile-mini-avatar"
                              />
                              <div>
                                <div className="invite-profile-username">
                                  @{currentUser.login.username}
                                </div>
                                <div className="invite-profile-ago">{timeAgo()}</div>
                              </div>
                            </div>
                            <button
                              onClick={addCurrentMember}
                              disabled={isAdded || saving}
                              className={`invite-add-btn ${isAdded ? 'added' : ''}`}
                            >
                              {saving ? (
                                <Loader2 size={16} className="invite-spinner" />
                              ) : isAdded ? (
                                <Check size={16} />
                              ) : (
                                <Plus size={16} />
                              )}
                              {isAdded ? 'Added' : 'Add Member'}
                            </button>
                          </div>
                        </motion.div>
                      </AnimatePresence>

                      <button onClick={handleNext} className="invite-nav-arrow">
                        <ChevronRight size={20} />
                      </button>
                    </div>

                    {/* Carousel dots */}
                    <div className="invite-carousel-dots">
                      {suggestedUsers.map((u, i) => (
                        <button
                          key={u.login.uuid}
                          className={`invite-dot ${i === currentIndex ? 'active' : ''} ${addedIds.has(u.login.uuid) ? 'added' : ''}`}
                          onClick={() => setCurrentIndex(i)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="invite-loading">
                    <span>No users found.</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Members Tab ────────────────────────────────── */}
            {activeTab === 'members' && (
              <motion.div
                key="members"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="invite-members-tab"
              >
                {combinedMembers.length === 0 ? (
                  <div className="invite-empty-state">
                    <UserPlus size={32} color="#cbd5e1" />
                    <p>No members yet. Switch to <strong>Discover</strong> to add teammates.</p>
                  </div>
                ) : (
                  <div className="invite-members-grid">
                    {combinedMembers.map((m) => (
                      <MemberGridCard
                        key={m.id}
                        member={m}
                        isPending={pendingIds.has(m.id)}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Invite Link Tab ────────────────────────────── */}
            {activeTab === 'invite' && (
              <motion.div
                key="invite"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="invite-link-tab"
              >
                <div className="invite-link-card">
                  <div className="invite-link-header">
                    <Link2 size={18} color="#10b981" />
                    <div>
                      <h4>Share invite link</h4>
                      <p>Anyone with this link can join your project</p>
                    </div>
                  </div>

                  <div className="invite-link-role-row">
                    <span>New members will join as:</span>
                    <RoleSelector value={linkRole} onChange={setLinkRole} />
                  </div>

                  <div className="invite-link-input-row">
                    <div className="invite-link-input">
                      <Link2 size={14} color="#94a3b8" />
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                      />
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className={`invite-copy-btn ${linkCopied ? 'copied' : ''}`}
                    >
                      {linkCopied ? (
                        <>
                          <CheckCircle size={14} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>

                  <button onClick={regenerateLink} className="invite-regen-btn">
                    Regenerate link
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Footer ─────────────────────────────────────────── */}
        <div className="invite-footer">
          <span className="invite-footer-hint">
            {allAdded.length > 0
              ? `${allAdded.length} new member${allAdded.length !== 1 ? 's' : ''} added this session`
              : 'Add teammates to collaborate on this project'}
          </span>
          <button onClick={handleClose} className="invite-done-btn">
            <CheckCircle size={14} />
            Done
          </button>
        </div>
      </motion.div>

      {/* Scoped keyframes */}
      <style>{`
        @keyframes invite-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
