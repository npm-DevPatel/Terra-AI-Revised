import { useState, useRef, useEffect } from 'react';
import { X, AtSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useTerraStore from '../../store/useTerraStore';
import { supabase } from '../../lib/supabaseClient';
import { API_BASE_URL as API_BASE } from '../../lib/apiBase';
import aiIcon from '../../assets/ai_chat/ai_icon.png';
import attachmentIcon from '../../assets/ai_chat/attachment_icon.png';
import micIcon from '../../assets/ai_chat/mic.png';
import sendIcon from '../../assets/ai_chat/send.png';
import thinkingGif from '../../assets/made_projects/4_word_loading.gif';
import '../../../src/styles/workspace.css';

export default function TerraCopilot({ projectId, projectName }) {
  const { workspace, toggleCopilot, addCopilotMessage, clearCopilotMessages } = useTerraStore();
  const { copilotOpen, copilotMessages } = workspace;

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mentionResults, setMentionResults] = useState([]);
  const [showMention, setShowMention] = useState(false);
  const [resolvedRefs, setResolvedRefs] = useState([]);
  const [profileName, setProfileName] = useState('');
  const [listening, setListening] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const session = useTerraStore((s) => s.session);
  const user = useTerraStore((s) => s.user);
  const displayName = profileName
    || user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')?.[0]
    || 'there';

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [copilotMessages, loading]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        const nextName = data?.display_name || data?.username;
        if (nextName) setProfileName(nextName);
      });
  }, [user?.id]);

  // Handle @mention trigger
  const handleInputChange = async (e) => {
    const val = e.target.value;
    setInput(val);

    const atIdx = val.lastIndexOf('@');
    if (atIdx !== -1) {
      const query = val.slice(atIdx + 1).split(' ')[0];
      if (query.length >= 1) {
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
      await new Promise((resolve) => window.setTimeout(resolve, 2000));
      const res = await fetch(`${API_BASE}/api/copilot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          message: fullMessage,
          project_id: projectId,
          project_name: projectName,
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

  const handleMicClick = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setInput((value) => value || 'Voice input is not supported in this browser.');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) setInput((value) => `${value}${value ? ' ' : ''}${transcript}`);
    };
    recognition.start();
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
          <img src={aiIcon} alt="" className="copilot-ai-icon" />
          <div>
            <span>Terra Copilot</span>
            <p>Hello {displayName}, What do you want to dive in today</p>
          </div>
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
              <img src={aiIcon} alt="" />
            </div>
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
                <div className="msg-bubble copilot-thinking-bubble">
                  <img src={thinkingGif} alt="" />
                  <span className="lens-faded-word thinking-word" aria-label="thinking">
                    <strong>th</strong><span>inki</span><strong>ng</strong>
                  </span>
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
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={(event) => {
              const files = Array.from(event.target.files || []).map((file) => file.name);
              if (files.length) setInput((value) => `${value}${value ? ' ' : ''}${files.map((name) => `Attached ${name}`).join(', ')}`);
              event.target.value = '';
            }}
          />
          <button className="copilot-tool-btn" type="button" onClick={() => fileInputRef.current?.click()} aria-label="Attach file">
            <img src={attachmentIcon} alt="" />
          </button>
          <button className={`copilot-tool-btn ${listening ? 'active' : ''}`} type="button" onClick={handleMicClick} aria-label="Use voice">
            <img src={micIcon} alt="" />
          </button>
          <textarea
            ref={textareaRef}
            className="copilot-textarea"
            placeholder="Message Terra..."
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
            <img src={sendIcon} alt="" />
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
