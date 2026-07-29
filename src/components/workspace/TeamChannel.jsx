/**
 * TeamChannel.jsx — Terra Workspace demo room
 *
 * Starts with empty chat box.
 * Shows the 3 active team members in the sidebar invite card.
 * Answers @Terra AI queries using Gabarito font.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, UserPlus, MessageSquare } from 'lucide-react';
import imaniPhoto from '../../assets/invite/Imani_Wafula(surveyor).jpeg';
import alexanderPhoto from '../../assets/invite/Alexander_Whitfield(structural-engineer).jpeg';
import bekelePhoto from '../../assets/invite/Bekele_Tesfaye(site-agent).jpeg';
import '../../styles/workspace.css';

const TEAM_MEMBERS = [
  { id: 'imani',     name: 'Imani Wafula',      role: 'Surveyor',            photo: imaniPhoto,     accent: '#10b981', emoji: '📐' },
  { id: 'alexander', name: 'Alexander Whitfield', role: 'Structural Engineer', photo: alexanderPhoto, accent: '#3b82f6', emoji: '🏗️' },
  { id: 'bekele',    name: 'Bekele Tesfaye',      role: 'Site Agent',          photo: bekelePhoto,    accent: '#d6a331', emoji: '⛏️' },
];

const TERRA_INVITE_RECOMMENDATION = {
  memberId: 'terra',
  content: `Based on the current Phase 1 (Civil Infrastructure & Site Setting-out) stage of **The Grove at Highlands of Limuru**, here is Terra AI's recommended invite list:

**1. Geotechnical & Soil Engineer** *(Priority: Critical)*
• Required to conduct plot-level soil shear testing on the sloped parcels before foundation details are locked by Alexander.

**2. Civil & Stormwater Specialist** *(Priority: High)*
• Essential for designing retention ponds and interceptor swales to manage Tigoni's 1,450mm annual rainfall before earthworks begin.

**3. Environmental Compliance Officer (NEMA Specialist)** *(Priority: High)*
• Needed to verify riparian buffers and clear County Environmental Screening permits.

**4. Landscape Architect** *(Priority: Medium)*
• Coordinates native planting selection for natural slope stabilization and shared green corridors.

**Active Workspace Collaborators:**
• 📐 Imani Wafula — Surveyor
• 🏗️ Alexander Whitfield — Structural Engineer
• ⛏️ Bekele Tesfaye — Site Agent`,
  createdAt: new Date().toISOString(),
};

const TERRA_AI_SUMMARY = {
  memberId: 'terra',
  content: `Here is Terra AI's structured summary for **The Grove at Highlands of Limuru**:

**🗺️ Survey — Imani Wafula**
Identified the upper open parcel as Phase 1 cluster zone. Flagged entrance geometry and drainage corridors.

**⛏️ Site Operations — Bekele Tesfaye**
Prioritized temporary culverts, site perimeter fencing, and access track stabilization before heavy machine mobilization.

**🏗️ Structural Engineering — Alexander Whitfield**
Requested geotech test pits on sloped pads to customize stepped foundations for hillside stability.

**📌 Recommended Actions:**
1. Approve Phase 1 upper parcel setting-out
2. Invite Geotechnical Engineer & NEMA Specialist
3. Schedule show-home peg-out date`,
  createdAt: new Date().toISOString(),
};

function fmtTime(v) {
  return new Date(v).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function MemberCard({ member }) {
  return (
    <motion.div
      className="tc-member-card"
      style={{ '--accent': member.accent }}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="tc-member-photo-wrap">
        <img src={member.photo} alt={member.name} className="tc-member-photo" />
        <div className="tc-member-status-dot" />
      </div>
      <div className="tc-member-info">
        <span className="tc-member-emoji">{member.emoji}</span>
        <strong className="tc-member-name">{member.name}</strong>
        <span className="tc-member-role">{member.role}</span>
      </div>
    </motion.div>
  );
}

function Bubble({ msg, member }) {
  const isOwn   = msg.memberId === 'you';
  const isTerra = msg.memberId === 'terra';

  if (isTerra) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="tc-terra-bubble"
      >
        <div className="tc-terra-header">
          <div className="tc-terra-icon"><Sparkles size={15} /></div>
          <div>
            <strong>Terra AI</strong>
            <span>Workspace Intelligence</span>
          </div>
        </div>
        <div className="tc-terra-body">
          {msg.content.split('\n').map((line, i) => {
            if (line.startsWith('**') && line.endsWith('**')) {
              return <p key={i} style={{ fontWeight: 800, color: '#0f172a', margin: '10px 0 4px', fontSize: 13 }}>{line.replace(/\*\*/g, '')}</p>;
            }
            if (line.startsWith('**') && line.includes('**')) {
              return <p key={i} style={{ fontWeight: 700, color: '#1e293b', margin: '6px 0 2px', fontSize: 13 }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
            }
            if (line.startsWith('•')) {
              return <p key={i} style={{ fontSize: 12.5, color: '#334155', margin: '2px 0 2px 8px', lineHeight: 1.5 }}>{line}</p>;
            }
            if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) {
              return <p key={i} style={{ fontSize: 12.5, color: '#334155', margin: '2px 0 2px 10px', lineHeight: 1.5 }}>{line}</p>;
            }
            return line ? <p key={i} style={{ fontSize: 13, color: '#334155', margin: '4px 0', lineHeight: 1.55 }}>{line}</p> : null;
          })}
        </div>
        <time className="tc-time">{fmtTime(msg.createdAt)}</time>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className={`tc-message ${isOwn ? 'own' : ''}`}
    >
      {!isOwn && member && (
        <img src={member.photo} alt="" className="tc-avatar" />
      )}
      <div className={`tc-bubble ${isOwn ? 'own' : ''}`} style={!isOwn && member ? { '--accent': member.accent } : {}}>
        {!isOwn && member && (
          <div className="tc-bubble-meta">
            <strong>{member.name}</strong>
            <span>{member.role}</span>
          </div>
        )}
        <p>{msg.content}</p>
        <time>{fmtTime(msg.createdAt)}</time>
      </div>
    </motion.div>
  );
}

export default function TeamChannel({ projectName }) {
  const [messages, setMessages]       = useState([]);
  const [draft, setDraft]             = useState('');
  const [showMention, setShowMention]   = useState(false);
  const messagesEndRef                = useRef(null);
  const textareaRef                   = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleDraftChange(e) {
    const val = e.target.value;
    setDraft(val);
    const lower = val.toLowerCase();
    setShowMention(lower.includes('@terra') || lower.includes('@terra_ai') || lower.includes('@terra ai'));
  }

  function sendMessage() {
    const content = draft.trim();
    if (!content) return;
    setDraft('');
    setShowMention(false);

    const lower = content.toLowerCase();
    const isAIRequest = lower.includes('@terra') || lower.includes('@terra_ai') || lower.includes('@terra ai');
    const isInviteQuery = lower.includes('invite') || lower.includes('who should') || lower.includes('stage');

    setMessages((cur) => [
      ...cur,
      { id: `you-${Date.now()}`, memberId: 'you', content, createdAt: new Date().toISOString() },
    ]);

    if (isAIRequest) {
      setTimeout(() => {
        const responseTemplate = isInviteQuery ? TERRA_INVITE_RECOMMENDATION : TERRA_AI_SUMMARY;
        setMessages((cur) => [
          ...cur,
          { ...responseTemplate, id: `terra-${Date.now()}`, createdAt: new Date().toISOString() },
        ]);
      }, 1000);
    }
  }

  return (
    <div className="tc-root">
      {/* ── Left: member cards ── */}
      <aside className="tc-sidebar">
        <div className="tc-sidebar-head">
          <span className="tc-sidebar-label">Invited Team</span>
          <span className="tc-sidebar-count">{TEAM_MEMBERS.length} active</span>
        </div>
        <div className="tc-members-grid">
          {TEAM_MEMBERS.map((m) => <MemberCard key={m.id} member={m} />)}
        </div>
        <div className="tc-ai-hint">
          <Sparkles size={13} />
          <span>Type <code>@Terra AI</code> to get AI recommendations for invitations & site strategy.</span>
        </div>
      </aside>

      {/* ── Right: chat ── */}
      <main className="tc-chat">
        <header className="tc-chat-head">
          <div>
            <span className="tc-chat-super">Terra Workspace</span>
            <h2 className="tc-chat-title">{projectName || 'The Grove at Highlands of Limuru'}</h2>
          </div>
          <p className="tc-chat-sub">Survey · Structure · Site Execution</p>
        </header>

        <div className="tc-messages">
          {messages.length === 0 && (
            <div className="tc-empty-state">
              <div className="tc-empty-icon">
                <MessageSquare size={24} />
              </div>
              <h3>Workspace Conversation</h3>
              <p>
                No messages yet. Send a message to your team or ask <strong>@Terra AI</strong> who to invite at this stage of construction.
              </p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const member = TEAM_MEMBERS.find((m) => m.id === msg.memberId);
              return <Bubble key={msg.id} msg={msg} member={member} />;
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* @Terra AI suggestion chip */}
        <AnimatePresence>
          {showMention && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="tc-mention-chip"
              onClick={() => {
                setDraft('@Terra AI Who should we invite to this workspace at this stage of construction?');
                textareaRef.current?.focus();
              }}
            >
              <UserPlus size={14} />
              <span><strong>@Terra AI</strong> — "Who should we invite to this workspace at this stage of construction?"</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form
          className="tc-composer"
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
        >
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            rows={1}
            placeholder='Ask @Terra AI who to invite or message your team...'
          />
          <button type="submit" disabled={!draft.trim()} aria-label="Send">
            <Send size={16} />
          </button>
        </form>
      </main>
    </div>
  );
}
