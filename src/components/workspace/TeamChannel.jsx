/**
 * TeamChannel.jsx — Terra Workspace demo room
 *
 * Beautiful team cards (photo + role only), preloaded conversation,
 * @Terra_AI mention that summarises the chat when triggered.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import imaniPhoto from '../../assets/invite/Imani_Wafula(surveyor).jpeg';
import alexanderPhoto from '../../assets/invite/Alexander_Whitfield(structural-engineer).jpeg';
import bekelePhoto from '../../assets/invite/Bekele_Tesfaye(site-agent).jpeg';
import '../../styles/workspace.css';

const TEAM_MEMBERS = [
  { id: 'imani',     name: 'Imani Wafula',      role: 'Surveyor',            photo: imaniPhoto,     accent: '#10b981', emoji: '📐' },
  { id: 'alexander', name: 'Alexander Whitfield', role: 'Structural Engineer', photo: alexanderPhoto, accent: '#3b82f6', emoji: '🏗️' },
  { id: 'bekele',    name: 'Bekele Tesfaye',      role: 'Site Agent',          photo: bekelePhoto,    accent: '#d6a331', emoji: '⛏️' },
];

const INITIAL_MESSAGES = [
  {
    id: 'm1', memberId: 'imani',
    content: 'I have reviewed the upper boundary. The first residential cluster should stay clear of the wetter lower edge — the open parcel gives us cleaner setting-out and better view control toward the hills.',
    createdAt: '2026-07-29T08:42:00.000Z',
  },
  {
    id: 'm2', memberId: 'bekele',
    content: 'Agreed. From a site operations angle, I would start access from the existing track, fence the working zone, then bring drainage protection in before any heavy plant movement. Temporary culverts first.',
    createdAt: '2026-07-29T08:47:00.000Z',
  },
  {
    id: 'm3', memberId: 'alexander',
    content: 'Before we lock foundations, I need plot-level soil checks on the sloped parcels. The homes can step beautifully into the hillside — but we cannot copy one foundation detail across every pad without geotech confirmation.',
    createdAt: '2026-07-29T08:53:00.000Z',
  },
  {
    id: 'm4', memberId: 'imani',
    content: 'Survey priority zones flagged: entrance geometry, main drainage corridor, proposed show-home pads (4 units), and the steep edge parcels that should remain as landscape buffer.',
    createdAt: '2026-07-29T09:02:00.000Z',
  },
  {
    id: 'm5', memberId: 'bekele',
    content: 'Once those stakes are in I can sequence the first two weeks — temp drainage, storage compound, safe machine route with turning bay, and daily photo logs for the site diary.',
    createdAt: '2026-07-29T09:08:00.000Z',
  },
];

const TERRA_AI_SUMMARY = {
  id: 'terra-summary',
  memberId: 'terra',
  content: `Here is a structured summary of the conversation so far:\n\n**🗺️ Survey — Imani Wafula**\nImani has identified the upper, open parcel as the optimal starting zone for the first residential cluster, keeping away from the moisture-heavy lower edge. Priority survey zones have been flagged: entrance geometry, drainage corridor, 4 show-home pads, and landscape buffer parcels.\n\n**⛏️ Site Operations — Bekele Tesfaye**\nBekele recommends beginning with the existing track for access, installing perimeter fencing and temporary culverts before any heavy plant mobilises. He is ready to sequence the first two weeks once survey stakes are confirmed — covering temp drainage, a storage compound, safe machine routing, and daily photo documentation.\n\n**🏗️ Structural Engineering — Alexander Whitfield**\nAlexander has flagged that plot-level geotechnical testing is required before foundation details are locked. Stepped foundations on the sloped parcels are favoured aesthetically and technically, but each pad needs individual soil confirmation to avoid costly redesign.\n\n**📌 Key Decisions Outstanding:**\n1. Confirm open parcel as Phase 1 cluster zone\n2. Commission geotech test pits on sloped home pads\n3. Approve temp drainage and machine access route\n4. Set date for show-home peg-out`,
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
      whileHover={{ y: -4, scale: 1.02 }}
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
  const isOwn    = msg.memberId === 'you';
  const isTerra  = msg.memberId === 'terra';

  if (isTerra) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="tc-terra-bubble"
      >
        <div className="tc-terra-header">
          <div className="tc-terra-icon"><Sparkles size={14} /></div>
          <div>
            <strong>Terra AI</strong>
            <span>Chat Summary</span>
          </div>
        </div>
        <div className="tc-terra-body">
          {msg.content.split('\n').map((line, i) => {
            if (line.startsWith('**') && line.endsWith('**')) {
              return <p key={i} style={{ fontWeight: 800, color: '#0f172a', margin: '10px 0 4px' }}>{line.replace(/\*\*/g, '')}</p>;
            }
            if (line.startsWith('**') && line.includes('**')) {
              return <p key={i} style={{ fontWeight: 700, color: '#334155', margin: '6px 0 2px' }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
            }
            if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) {
              return <p key={i} style={{ fontSize: 12, color: '#475569', margin: '2px 0 2px 8px' }}>{line}</p>;
            }
            return line ? <p key={i} style={{ fontSize: 12, color: '#475569', margin: '2px 0' }}>{line}</p> : null;
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
  const [messages, setMessages]     = useState(INITIAL_MESSAGES);
  const [draft, setDraft]           = useState('');
  const [showMention, setShowMention] = useState(false);
  const messagesEndRef              = useRef(null);
  const textareaRef                 = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleDraftChange(e) {
    const val = e.target.value;
    setDraft(val);
    setShowMention(val.includes('@Terra_AI'));
  }

  function sendMessage() {
    const content = draft.trim();
    if (!content) return;
    setDraft('');
    setShowMention(false);

    const isAISummaryRequest =
      content.toLowerCase().includes('@terra_ai') &&
      content.toLowerCase().includes('summar');

    setMessages((cur) => [
      ...cur,
      { id: `you-${Date.now()}`, memberId: 'you', content, createdAt: new Date().toISOString() },
    ]);

    if (isAISummaryRequest) {
      setTimeout(() => {
        setMessages((cur) => [...cur, { ...TERRA_AI_SUMMARY, id: `terra-${Date.now()}`, createdAt: new Date().toISOString() }]);
      }, 1400);
    }
  }

  return (
    <div className="tc-root">
      {/* ── Left: member cards ── */}
      <aside className="tc-sidebar">
        <div className="tc-sidebar-head">
          <span className="tc-sidebar-label">Collaborators</span>
          <span className="tc-sidebar-count">{TEAM_MEMBERS.length} active</span>
        </div>
        <div className="tc-members-grid">
          {TEAM_MEMBERS.map((m) => <MemberCard key={m.id} member={m} />)}
        </div>
        <div className="tc-ai-hint">
          <Sparkles size={12} />
          <span>Type <code>@Terra_AI</code> and ask it to summarise the chat</span>
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
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const member = TEAM_MEMBERS.find((m) => m.id === msg.memberId);
              return <Bubble key={msg.id} msg={msg} member={member} />;
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* @Terra_AI suggestion chip */}
        <AnimatePresence>
          {showMention && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="tc-mention-chip"
              onClick={() => {
                setDraft((d) => {
                  const base = d.includes('@Terra_AI') ? d : d + '@Terra_AI';
                  return base.includes('summar') ? base : base + ' would you summarise messages in the chat so far?';
                });
                textareaRef.current?.focus();
              }}
            >
              <Sparkles size={13} />
              <span><strong>@Terra_AI</strong> — ask Terra to summarise the conversation</span>
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
            placeholder='Message the team, or type @Terra_AI to ask the AI…'
          />
          <button type="submit" disabled={!draft.trim()} aria-label="Send">
            <Send size={16} />
          </button>
        </form>
      </main>
    </div>
  );
}
