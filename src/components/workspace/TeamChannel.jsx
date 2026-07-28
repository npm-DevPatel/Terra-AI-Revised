/**
 * TeamChannel.jsx — Three-pane Slack-style workspace
 * LEFT: channel/DM sidebar  |  CENTER: message view + composer  |  RIGHT: profile/details panel
 *
 * Data flows through Supabase tables: workspace_channels, workspace_messages, project_mock_members.
 * @Terra AI mentions trigger backend/copilot/routes.py for inline AI replies.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash, Plus, Search, Info, Send, X, MessageCircle,
  Bold, Italic, Link2, List, Smile, AtSign, Paperclip,
  Headphones, ChevronDown, UserPlus, Bot,
} from 'lucide-react';
import useTerraStore from '../../store/useTerraStore';
import { supabase } from '../../lib/supabaseClient';
import { API_BASE_URL as API_BASE } from '../../lib/apiBase';
import aiIcon from '../../assets/ai_chat/ai_icon.png';
import InviteFakeMembersModal from './InviteFakeMembersModal';
import '../../styles/workspace.css';

const DEFAULT_CHANNELS = ['general', 'site-notes', 'budget'];
const EMOJI_QUICK = ['👍', '🔥', '👀', '✅', '❤️', '😂'];

function dicebearUrl(name) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'M')}&backgroundColor=c084fc,818cf8,60a5fa,34d399,f59e0b,f87171&backgroundType=gradientLinear`;
}

function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ═══════════════════════════════════════════════════════════════
   LEFT PANE — Channel / DM sidebar
   ═══════════════════════════════════════════════════════════════ */
function ChannelSidebar({
  projectName, channels, mockMembers, activeChannelId, activeDmId,
  onSelectChannel, onSelectDm, onNewChannel, onInvite, unreadMap,
}) {
  return (
    <div className="team-channel-sidebar">
      {/* Project header */}
      <div className="team-channel-sidebar-header">
        <div className="team-channel-project-name">{projectName || 'Project'}</div>
        <span className="team-channel-project-badge">Team Workspace</span>
      </div>

      {/* Channels */}
      <div className="team-channel-section">
        <div className="team-channel-section-head">
          <span>Channels</span>
          <button onClick={onNewChannel} className="team-channel-add-btn" title="New channel"><Plus size={11} /></button>
        </div>
        {channels.map((ch) => {
          const active = ch.id === activeChannelId && !activeDmId;
          const unread = unreadMap[ch.id] || 0;
          return (
            <button key={ch.id} onClick={() => onSelectChannel(ch)} className={`team-channel-item ${active ? 'active' : ''}`}>
              <Hash size={13} />
              <span className="team-channel-item-label">{ch.name}</span>
              {unread > 0 && <span className="team-channel-unread">{unread}</span>}
            </button>
          );
        })}
      </div>

      {/* Direct Messages */}
      <div className="team-channel-section">
        <div className="team-channel-section-head">
          <span>Direct Messages</span>
        </div>
        {/* Terra AI — always pinned first */}
        <button
          onClick={() => onSelectDm({ id: '__terra_ai__', name: 'Terra AI', avatar_url: aiIcon, role_title: 'AI Assistant' })}
          className={`team-channel-item dm ${activeDmId === '__terra_ai__' ? 'active' : ''}`}
        >
          <img src={aiIcon} alt="" className="team-channel-dm-avatar" />
          <span className="team-channel-item-label">Terra AI</span>
          <span className="team-channel-ai-badge">AI</span>
        </button>
        {mockMembers.map((m) => (
          <button key={m.id} onClick={() => onSelectDm(m)} className={`team-channel-item dm ${activeDmId === m.id ? 'active' : ''}`}>
            <img src={m.avatar_url || dicebearUrl(m.name)} alt="" className="team-channel-dm-avatar" />
            <span className="team-channel-item-label">{m.name}</span>
          </button>
        ))}
      </div>

      {/* Add members */}
      <div className="team-channel-sidebar-footer">
        <button onClick={onInvite} className="team-channel-invite-btn">
          <UserPlus size={13} /> Add Members
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NEW CHANNEL INLINE MODAL
   ═══════════════════════════════════════════════════════════════ */
function NewChannelInline({ projectId, onCreated, onClose }) {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
    const { data } = await supabase
      .from('workspace_channels')
      .insert({ project_id: projectId, name: slug })
      .select()
      .single();
    if (data) onCreated(data);
    setCreating(false);
    onClose();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
      backdropFilter: 'blur(6px)', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{
          background: '#fff', borderRadius: 20, padding: 28, width: 400,
          boxShadow: '0 40px 80px rgba(0,0,0,0.15)',
          fontFamily: "'Gabarito', 'Inter', system-ui",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>New channel</h3>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '5px 7px', cursor: 'pointer', display: 'flex', color: '#64748b' }}><X size={14} /></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '0 14px', marginBottom: 16 }}>
          <Hash size={14} color="#94a3b8" />
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            placeholder="channel-name"
            style={{ flex: 1, padding: '10px 10px', border: 'none', background: 'transparent', color: '#0f172a', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: 100, padding: '10px 0', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={create} disabled={!name.trim() || creating} style={{
            flex: 2, background: name.trim() ? '#8b5cf6' : '#e2e8f0', border: 'none', borderRadius: 100, padding: '10px 0',
            color: name.trim() ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'default',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Hash size={13} /> Create
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CENTER PANE — Message view + Composer
   ═══════════════════════════════════════════════════════════════ */
function MessageView({
  projectId, channelId, channelName, dmMember, mockMembers,
  user, session, onOpenProfile, onOpenDetails,
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiThinking, setAiThinking] = useState(false);
  const [senderAs, setSenderAs] = useState('self'); // 'self' | mock member id
  const [showSenderPicker, setShowSenderPicker] = useState(false);
  const [reactions, setReactions] = useState({}); // { msgId: { emoji: count } }
  const [showEmojiFor, setShowEmojiFor] = useState(null);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionResults, setMentionResults] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isDm = !!dmMember;
  const isAiDm = dmMember?.id === '__terra_ai__';
  const headerName = isDm ? dmMember.name : `# ${channelName}`;

  // Fetch profile data
  const [profileName, setProfileName] = useState('');
  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('display_name, username').eq('id', user.id).single()
      .then(({ data }) => {
        const n = data?.display_name || data?.username;
        if (n) setProfileName(n);
      });
  }, [user?.id]);
  const displayName = profileName || user?.user_metadata?.full_name || user?.email?.split('@')?.[0] || 'You';

  // Load messages
  useEffect(() => {
    if (!channelId && !isDm) return;
    loadMessages();

    // Realtime subscription
    let filterStr;
    if (isDm && !isAiDm) {
      filterStr = `dm_with_id=eq.${dmMember.id}`;
    } else if (isDm && isAiDm) {
      filterStr = `dm_with_id=eq.${dmMember.id}`;
    } else {
      filterStr = `channel_id=eq.${channelId}`;
    }

    const sub = supabase.channel(`wm:${channelId || dmMember?.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'workspace_messages',
        filter: filterStr,
      }, (payload) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      }).subscribe();

    return () => supabase.removeChannel(sub);
  }, [channelId, dmMember?.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiThinking]);

  async function loadMessages() {
    setLoading(true);
    let query = supabase.from('workspace_messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .limit(200);

    if (isDm) {
      query = query.eq('dm_with_id', dmMember.id);
    } else {
      query = query.eq('channel_id', channelId);
    }

    const { data } = await query;
    setMessages(data || []);
    setLoading(false);
  }

  // Send message
  async function handleSend() {
    const msg = text.trim();
    if (!msg) return;
    setText('');

    // Determine sender
    let senderType = 'user';
    let senderName = displayName;
    let senderAvatar = null;
    if (senderAs !== 'self') {
      const mockMember = mockMembers.find((m) => m.id === senderAs);
      if (mockMember) {
        senderType = 'mock_member';
        senderName = mockMember.name;
        senderAvatar = mockMember.avatar_url || dicebearUrl(mockMember.name);
      }
    }

    const newMsg = {
      project_id: projectId,
      channel_id: isDm ? null : channelId,
      dm_with_id: isDm ? dmMember.id : null,
      sender_type: senderType,
      sender_name: senderName,
      sender_avatar: senderAvatar,
      content: msg,
    };

    await supabase.from('workspace_messages').insert(newMsg);

    // Check for @Terra AI mention or if this is an AI DM
    const mentionsTerraAI = /(@terra\s*ai|@terraai)/i.test(msg);
    if (mentionsTerraAI || isAiDm) {
      triggerAiReply(msg);
    }
  }

  async function triggerAiReply(userMessage) {
    setAiThinking(true);
    try {
      // Gather recent context
      const recentMessages = messages.slice(-10).map((m) => `${m.sender_name}: ${m.content}`).join('\n');
      const contextMessage = `[Channel context]\n${recentMessages}\n\n[New message]\n${userMessage}`;

      const res = await fetch(`${API_BASE}/api/copilot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          message: contextMessage,
          project_id: projectId,
          resolved_refs: [],
        }),
      });
      const data = await res.json();
      const reply = data.answer || 'I couldn\'t process that right now.';

      // Post AI reply
      await supabase.from('workspace_messages').insert({
        project_id: projectId,
        channel_id: isDm ? null : channelId,
        dm_with_id: isDm ? dmMember.id : null,
        sender_type: 'ai',
        sender_name: 'Terra AI',
        sender_avatar: null,
        content: reply,
      });
    } catch {
      await supabase.from('workspace_messages').insert({
        project_id: projectId,
        channel_id: isDm ? null : channelId,
        dm_with_id: isDm ? dmMember.id : null,
        sender_type: 'ai',
        sender_name: 'Terra AI',
        sender_avatar: null,
        content: 'Terra AI is temporarily unavailable. Please try again.',
      });
    }
    setAiThinking(false);
  }

  // @mention handling
  function handleInputChange(e) {
    const val = e.target.value;
    setText(val);

    const atIdx = val.lastIndexOf('@');
    if (atIdx !== -1) {
      const afterAt = val.slice(atIdx + 1).split(' ')[0].toLowerCase();
      if (afterAt.length >= 1) {
        const results = [];
        // Match Terra AI
        if ('terra ai'.includes(afterAt) || 'terraai'.includes(afterAt)) {
          results.push({ id: '__terra_ai__', name: 'Terra AI', avatar_url: aiIcon });
        }
        // Match mock members
        mockMembers.forEach((m) => {
          if (m.name.toLowerCase().includes(afterAt)) {
            results.push(m);
          }
        });
        if (results.length > 0) {
          setMentionResults(results);
          setShowMentionDropdown(true);
          return;
        }
      }
    }
    setShowMentionDropdown(false);
  }

  function insertMention(member) {
    const atIdx = text.lastIndexOf('@');
    const before = text.slice(0, atIdx);
    setText(`${before}@${member.name} `);
    setShowMentionDropdown(false);
    inputRef.current?.focus();
  }

  function toggleReaction(msgId, emoji) {
    setReactions((prev) => {
      const msgReactions = { ...(prev[msgId] || {}) };
      msgReactions[emoji] = (msgReactions[emoji] || 0) > 0 ? 0 : 1;
      return { ...prev, [msgId]: msgReactions };
    });
    setShowEmojiFor(null);
  }

  return (
    <div className="team-channel-center">
      {/* Header */}
      <div className="team-channel-center-header">
        <div className="team-channel-center-title">
          {isDm ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={dmMember.avatar_url || dicebearUrl(dmMember.name)} alt="" className="team-channel-header-avatar" />
              <div>
                <span className="team-channel-header-name">{dmMember.name}</span>
                {dmMember.role_title && <span className="team-channel-header-role">{dmMember.role_title}</span>}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Hash size={16} color="#8b5cf6" />
              <span className="team-channel-header-name">{channelName}</span>
            </div>
          )}
        </div>
        <div className="team-channel-center-actions">
          <button className="team-channel-icon-btn" title="Huddle"><Headphones size={15} /></button>
          <button className="team-channel-icon-btn" title="Search"><Search size={15} /></button>
          {!isDm && (
            <button className="team-channel-icon-btn" title="Channel details" onClick={onOpenDetails}>
              <Info size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="team-channel-messages">
        {loading ? (
          <div className="team-channel-loading">Loading messages…</div>
        ) : (
          <>
            {/* Start banner */}
            <div className="team-channel-start-banner">
              {isDm ? (
                <>
                  <img src={dmMember.avatar_url || dicebearUrl(dmMember.name)} alt="" style={{ width: 48, height: 48, borderRadius: 14 }} />
                  <h3>This is the start of your conversation with {dmMember.name}</h3>
                </>
              ) : (
                <>
                  <div className="team-channel-start-icon"><Hash size={22} color="#8b5cf6" /></div>
                  <h3>Welcome to #{channelName}</h3>
                  <p>This is the beginning of the #{channelName} channel. Send a message to start the conversation.</p>
                </>
              )}
            </div>

            {/* Message list */}
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => {
                const prev = messages[i - 1];
                const sameUser = prev?.sender_name === msg.sender_name &&
                  new Date(msg.created_at) - new Date(prev?.created_at) < 120000;
                const isAi = msg.sender_type === 'ai';
                const msgReactions = reactions[msg.id] || {};

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`team-channel-msg ${sameUser ? 'consecutive' : ''}`}
                    onMouseEnter={() => {}}
                  >
                    {!sameUser && (
                      <button
                        className="team-channel-msg-avatar-btn"
                        onClick={() => onOpenProfile(isAi
                          ? { id: '__terra_ai__', name: 'Terra AI', avatar_url: aiIcon, role_title: 'AI Assistant' }
                          : mockMembers.find((m) => m.name === msg.sender_name) || { name: msg.sender_name, avatar_url: msg.sender_avatar }
                        )}
                      >
                        <img src={isAi ? aiIcon : (msg.sender_avatar || dicebearUrl(msg.sender_name))} alt="" className="team-channel-msg-avatar" />
                      </button>
                    )}
                    {sameUser && <div className="team-channel-msg-spacer" />}
                    <div className="team-channel-msg-body">
                      {!sameUser && (
                        <div className="team-channel-msg-meta">
                          <button
                            className="team-channel-msg-sender"
                            onClick={() => onOpenProfile(isAi
                              ? { id: '__terra_ai__', name: 'Terra AI', avatar_url: aiIcon, role_title: 'AI Assistant' }
                              : mockMembers.find((m) => m.name === msg.sender_name) || { name: msg.sender_name }
                            )}
                          >
                            {msg.sender_name}
                          </button>
                          {isAi && <span className="team-channel-ai-tag">AI</span>}
                          <span className="team-channel-msg-time">{fmtTime(msg.created_at)}</span>
                        </div>
                      )}
                      <p className="team-channel-msg-content">{msg.content}</p>

                      {/* Reactions */}
                      <div className="team-channel-msg-reactions">
                        {Object.entries(msgReactions).filter(([, c]) => c > 0).map(([emoji]) => (
                          <button key={emoji} className="team-channel-reaction active" onClick={() => toggleReaction(msg.id, emoji)}>
                            {emoji}
                          </button>
                        ))}
                        <button
                          className="team-channel-reaction add"
                          onClick={() => setShowEmojiFor(showEmojiFor === msg.id ? null : msg.id)}
                        >
                          <Smile size={12} />
                        </button>
                        {showEmojiFor === msg.id && (
                          <div className="team-channel-emoji-picker">
                            {EMOJI_QUICK.map((em) => (
                              <button key={em} onClick={() => toggleReaction(msg.id, em)}>{em}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* AI thinking indicator */}
            {aiThinking && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="team-channel-msg"
              >
                <img src={aiIcon} alt="" className="team-channel-msg-avatar" />
                <div className="team-channel-msg-body">
                  <div className="team-channel-msg-meta">
                    <span className="team-channel-msg-sender">Terra AI</span>
                    <span className="team-channel-ai-tag">AI</span>
                  </div>
                  <div className="team-channel-typing">
                    <span /><span /><span />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer */}
      <div className="team-channel-composer">
        {/* Sender-select dropdown */}
        <div className="team-channel-sender-select">
          <button onClick={() => setShowSenderPicker(!showSenderPicker)} className="team-channel-sender-btn">
            Sending as: <strong>{senderAs === 'self' ? displayName : mockMembers.find((m) => m.id === senderAs)?.name || 'Unknown'}</strong>
            <ChevronDown size={12} />
          </button>
          <AnimatePresence>
            {showSenderPicker && (
              <motion.div
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                className="team-channel-sender-dropdown"
              >
                <button onClick={() => { setSenderAs('self'); setShowSenderPicker(false); }} className={senderAs === 'self' ? 'active' : ''}>
                  {displayName} <span>(You)</span>
                </button>
                {mockMembers.map((m) => (
                  <button key={m.id} onClick={() => { setSenderAs(m.id); setShowSenderPicker(false); }} className={senderAs === m.id ? 'active' : ''}>
                    <img src={m.avatar_url || dicebearUrl(m.name)} alt="" style={{ width: 18, height: 18, borderRadius: 6 }} />
                    {m.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* @mention dropdown */}
        <AnimatePresence>
          {showMentionDropdown && mentionResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              className="team-channel-mention-dropdown"
            >
              {mentionResults.map((m) => (
                <button key={m.id} onClick={() => insertMention(m)}>
                  <img src={m.avatar_url || dicebearUrl(m.name)} alt="" style={{ width: 20, height: 20, borderRadius: 6 }} />
                  <span>{m.name}</span>
                  {m.id === '__terra_ai__' && <span className="team-channel-ai-tag" style={{ marginLeft: 4 }}>AI</span>}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar */}
        <div className="team-channel-toolbar">
          <button className="team-channel-toolbar-btn" title="Bold"><Bold size={14} /></button>
          <button className="team-channel-toolbar-btn" title="Italic"><Italic size={14} /></button>
          <button className="team-channel-toolbar-btn" title="Link"><Link2 size={14} /></button>
          <button className="team-channel-toolbar-btn" title="List"><List size={14} /></button>
          <div className="team-channel-toolbar-sep" />
          <button className="team-channel-toolbar-btn" title="Emoji"><Smile size={14} /></button>
          <button className="team-channel-toolbar-btn" title="Mention" onClick={() => { setText(text + '@'); inputRef.current?.focus(); }}><AtSign size={14} /></button>
          <button className="team-channel-toolbar-btn" title="Attach"><Paperclip size={14} /></button>
        </div>

        {/* Input */}
        <div className="team-channel-input-row">
          <textarea
            ref={inputRef}
            className="team-channel-textarea"
            placeholder={isDm ? `Message ${dmMember.name}` : `Message #${channelName}`}
            value={text}
            onChange={handleInputChange}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            rows={1}
          />
          <button
            className="team-channel-send-btn"
            onClick={handleSend}
            disabled={!text.trim()}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RIGHT PANE — Profile / Details panel
   ═══════════════════════════════════════════════════════════════ */
function RightPanel({ type, data, onClose, onMessageMember, channelInfo }) {
  if (type === 'profile') {
    return (
      <motion.div
        initial={{ x: 280, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 280, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="team-channel-right-panel"
      >
        <div className="team-channel-right-header">
          <span>Profile</span>
          <button onClick={onClose} className="team-channel-icon-btn"><X size={14} /></button>
        </div>
        <div className="team-channel-profile">
          <img src={data?.avatar_url || dicebearUrl(data?.name)} alt="" className="team-channel-profile-photo" />
          <h3>{data?.name || 'Unknown'}</h3>
          {data?.role_title && <p className="team-channel-profile-role">{data.role_title}</p>}
          {data?.email && <p className="team-channel-profile-email">{data.email}</p>}
          <div className="team-channel-profile-status">
            <span className="team-channel-status-dot active" />
            {data?.id === '__terra_ai__' ? 'Always available' : 'Available'}
          </div>
          {data?.id !== '__terra_ai__' && (
            <button
              onClick={() => onMessageMember(data)}
              className="team-channel-profile-msg-btn"
            >
              <MessageCircle size={14} /> Message
            </button>
          )}
          {data?.id === '__terra_ai__' && (
            <button
              onClick={() => onMessageMember(data)}
              className="team-channel-profile-msg-btn ai"
            >
              <Bot size={14} /> Open DM
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  if (type === 'details' && channelInfo) {
    return (
      <motion.div
        initial={{ x: 280, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 280, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="team-channel-right-panel"
      >
        <div className="team-channel-right-header">
          <span>Channel Details</span>
          <button onClick={onClose} className="team-channel-icon-btn"><X size={14} /></button>
        </div>
        <div className="team-channel-details">
          <div className="team-channel-details-name">
            <Hash size={16} color="#8b5cf6" /> {channelInfo.name}
          </div>
          {channelInfo.topic && (
            <div className="team-channel-details-topic">
              <span className="label">Topic</span>
              <p>{channelInfo.topic}</p>
            </div>
          )}
          <div className="team-channel-details-created">
            <span className="label">Created</span>
            <p>{fmtDate(channelInfo.created_at)}</p>
          </div>
          {channelInfo.members && (
            <div className="team-channel-details-members">
              <span className="label">Members ({channelInfo.members.length})</span>
              {channelInfo.members.map((m) => (
                <div key={m.id || m.name} className="team-channel-details-member-row">
                  <img src={m.avatar_url || dicebearUrl(m.name)} alt="" style={{ width: 28, height: 28, borderRadius: 8 }} />
                  <span>{m.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN — TeamChannel orchestrator
   ═══════════════════════════════════════════════════════════════ */
export default function TeamChannel({ projectId, projectName }) {
  const {
    workspace, setTeamActiveChannel, setTeamActiveDm,
    openTeamRightPanel, closeTeamRightPanel, user, session,
  } = useTerraStore();
  const { teamChannel } = workspace;

  const [channels, setChannels] = useState([]);
  const [mockMembers, setMockMembers] = useState([]);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeChannel, setActiveChannel] = useState(null);
  const [activeDmMember, setActiveDmMember] = useState(null);

  // Load channels — seed defaults if empty
  useEffect(() => {
    loadChannels();
    loadMockMembers();
  }, [projectId]);

  async function loadChannels() {
    const { data } = await supabase
      .from('workspace_channels')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');

    if (!data || data.length === 0) {
      // Seed default channels
      const inserts = DEFAULT_CHANNELS.map((name) => ({ project_id: projectId, name }));
      const { data: seeded } = await supabase
        .from('workspace_channels')
        .insert(inserts)
        .select();
      if (seeded) {
        setChannels(seeded);
        setActiveChannel(seeded[0]);
        setTeamActiveChannel(seeded[0].id);
      }
    } else {
      setChannels(data);
      if (!teamChannel.activeChannelId && !teamChannel.activeDmMemberId) {
        setActiveChannel(data[0]);
        setTeamActiveChannel(data[0].id);
      } else if (teamChannel.activeChannelId) {
        setActiveChannel(data.find((c) => c.id === teamChannel.activeChannelId) || data[0]);
      }
    }
  }

  async function loadMockMembers() {
    const { data } = await supabase
      .from('project_mock_members')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');
    if (data) setMockMembers(data);
  }

  function handleSelectChannel(ch) {
    setActiveChannel(ch);
    setActiveDmMember(null);
    setTeamActiveChannel(ch.id);
    closeTeamRightPanel();
  }

  function handleSelectDm(member) {
    setActiveDmMember(member);
    setActiveChannel(null);
    setTeamActiveDm(member.id);
    closeTeamRightPanel();
  }

  function handleOpenProfile(memberData) {
    openTeamRightPanel('profile', memberData);
  }

  function handleOpenDetails() {
    if (!activeChannel) return;
    const channelInfo = {
      ...activeChannel,
      members: [
        { id: '__terra_ai__', name: 'Terra AI', avatar_url: aiIcon },
        ...mockMembers,
      ],
    };
    openTeamRightPanel('details', channelInfo);
  }

  function handleMessageFromProfile(member) {
    handleSelectDm(member);
    closeTeamRightPanel();
  }

  function handleChannelCreated(ch) {
    setChannels((prev) => [...prev, ch]);
    handleSelectChannel(ch);
  }

  return (
    <div className={`team-channel-layout ${teamChannel.rightPanelOpen ? 'with-right-panel' : ''}`}>
      {/* Left pane */}
      <ChannelSidebar
        projectName={projectName}
        channels={channels}
        mockMembers={mockMembers}
        activeChannelId={activeChannel?.id}
        activeDmId={activeDmMember?.id}
        onSelectChannel={handleSelectChannel}
        onSelectDm={handleSelectDm}
        onNewChannel={() => setShowNewChannel(true)}
        onInvite={() => setShowInviteModal(true)}
        unreadMap={{}}
      />

      {/* Center pane */}
      <MessageView
        projectId={projectId}
        channelId={activeChannel?.id}
        channelName={activeChannel?.name}
        dmMember={activeDmMember}
        mockMembers={mockMembers}
        user={user}
        session={session}
        onOpenProfile={handleOpenProfile}
        onOpenDetails={handleOpenDetails}
      />

      {/* Right pane */}
      <AnimatePresence>
        {teamChannel.rightPanelOpen && (
          <RightPanel
            type={teamChannel.rightPanelType}
            data={teamChannel.rightPanelData}
            onClose={closeTeamRightPanel}
            onMessageMember={handleMessageFromProfile}
            channelInfo={teamChannel.rightPanelType === 'details' ? teamChannel.rightPanelData : null}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showNewChannel && (
          <NewChannelInline
            projectId={projectId}
            onCreated={handleChannelCreated}
            onClose={() => setShowNewChannel(false)}
          />
        )}
        {showInviteModal && (
          <InviteFakeMembersModal
            projectId={projectId}
            onClose={() => setShowInviteModal(false)}
            onMembersAdded={(newMembers) => {
              setMockMembers(newMembers);
              setShowInviteModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
