import { useState, useRef, useEffect } from 'react';
import { X, Sparkles, SendHorizonal, AtSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useTerraStore from '../../store/useTerraStore';
import { supabase } from '../../lib/supabaseClient';
import '../../../src/styles/workspace.css';

export default function TerraCopilot({ projectId, projectName }) {
  const { workspace, toggleCopilot, addCopilotMessage, clearCopilotMessages } = useTerraStore();
  const { copilotOpen, copilotMessages } = workspace;

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionResults, setMentionResults] = useState([]);
  const [showMention, setShowMention] = useState(false);
  const [resolvedRefs, setResolvedRefs] = useState([]);

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const session = useTerraStore((s) => s.session);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [copilotMessages]);

  // Handle @mention trigger
  const handleInputChange = async (e) => {
    const val = e.target.value;
    setInput(val);

    const atIdx = val.lastIndexOf('@');
    if (atIdx !== -1) {
      const query = val.slice(atIdx + 1).split(' ')[0];
      if (query.length >= 1) {
        setMentionSearch(query);
        setShowMention(true);
        // Search projects the user has access to
        const { data } = await supabase
          .from('projects')
          .select('id, name')
          .ilike('name', `%${query}%`)
          .limit(5);
        setMentionResults(data || []);
        return;
      }
    }
    setShowMention(false);
  };

  const insertMention = (project) => {
    const atIdx = input.lastIndexOf('@');
    const before = input.slice(0, atIdx);
    setInput(before); // clear the @query
    setResolvedRefs((prev) => [...prev, { type: 'project', id: project.id, name: project.name }]);
    setShowMention(false);
    textareaRef.current?.focus();
  };

  const removeRef = (id) => {
    setResolvedRefs((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg && resolvedRefs.length === 0) return;
    if (loading) return;

    const fullMessage = [
      ...resolvedRefs.map((r) => `@${r.name}`),
      msg,
    ].filter(Boolean).join(' ');

    addCopilotMessage('user', fullMessage);
    setInput('');
    setResolvedRefs([]);
    setLoading(true);

    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          message: fullMessage,
          resolved_refs: resolvedRefs,
        }),
      });
      const data = await res.json();
      addCopilotMessage('assistant', data.answer || 'No response.');
    } catch {
      addCopilotMessage('assistant', 'Terra Copilot is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const starterPrompts = [
    'Summarise the risks for this project',
    'What foundation type is needed?',
    'Generate a cost breakdown',
    'What infrastructure budget should I expect?',
  ];

  return (
    <div className={`copilot-panel ${copilotOpen ? 'open' : ''}`}>
      {/* Header */}
      <div className="copilot-header">
        <div className="copilot-title">
          <div className="copilot-dot" />
          <Sparkles size={14} />
          Terra Copilot
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={clearCopilotMessages}
            style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 12 }}
          >
            Clear
          </button>
          <button
            onClick={toggleCopilot}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="copilot-messages">
        {copilotMessages.length === 0 ? (
          <div className="copilot-empty">
            <div className="copilot-empty-icon">
              <Sparkles size={20} color="#34d399" />
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>
              Ask Terra Copilot anything
            </p>
            <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
              Reference a project with @ to bring in its full data.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginTop: 8 }}>
              {starterPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: '#6b7280',
                    fontSize: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    transition: 'color 0.15s',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {copilotMessages.map((m) => (
                <motion.div
                  key={m.id}
                  className={`copilot-message ${m.role}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="msg-bubble">{m.content}</div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="copilot-message assistant">
                <div className="msg-bubble" style={{ display: 'flex', gap: 6 }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#4b5563',
                      animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                      display: 'inline-block',
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="copilot-input-area">
        {/* Resolved @refs */}
        {resolvedRefs.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {resolvedRefs.map((r) => (
              <span key={r.id} className="mention-chip">
                <AtSign size={10} />
                {r.name}
                <button
                  onClick={() => removeRef(r.id)}
                  style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0, lineHeight: 1, marginLeft: 2 }}
                >×</button>
              </span>
            ))}
          </div>
        )}

        {/* @mention dropdown */}
        <AnimatePresence>
          {showMention && mentionResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              style={{
                background: '#1a1a24',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                marginBottom: 8,
                overflow: 'hidden',
              }}
            >
              {mentionResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => insertMention(p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '9px 12px',
                    background: 'none', border: 'none',
                    color: '#d1d5db', fontSize: 13, cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'left',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <AtSign size={12} color="#60a5fa" />
                  {p.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="copilot-input-row">
          <textarea
            ref={textareaRef}
            className="copilot-textarea"
            placeholder="Ask anything… type @ to reference a project"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="copilot-send-btn"
            onClick={handleSend}
            disabled={loading || (!input.trim() && resolvedRefs.length === 0)}
          >
            <SendHorizonal size={14} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
