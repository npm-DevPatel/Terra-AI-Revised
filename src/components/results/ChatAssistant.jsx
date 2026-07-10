import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, UserRound } from 'lucide-react';
import { clsx } from 'clsx';
import useTerraStore from '../../store/useTerraStore';
import terraLogo from '../../assets/front_page/terra_logo.png';
import sendIcon from '../../assets/ai_chat/send.png';
import micIcon from '../../assets/ai_chat/mic.png';
import voiceLoadingGif from '../../assets/ai_chat/voice_loading.gif';
import sendAudio from '../../assets/ai_chat/send.mp3';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const OPENING_TEXT =
  'Hi, I am Terra AI. Ask me anything about this report, from land prices and family-use decisions to legal risk, access roads, drainage, and what you should verify before paying.';

function getUserName(user) {
  const raw =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')?.[0] ||
    'You';
  return raw
    .split(/[._\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function inferHeading(text, question = '') {
  const source = `${question} ${text}`.toLowerCase();
  if (source.includes('price') || source.includes('cost') || source.includes('value') || source.includes('budget')) return 'Land Prices';
  if (source.includes('family') || source.includes('home') || source.includes('children')) return 'Family Land';
  if (source.includes('road') || source.includes('access')) return 'Road Access';
  if (source.includes('water') || source.includes('flood') || source.includes('drain')) return 'Water Risk';
  if (source.includes('legal') || source.includes('title') || source.includes('ownership')) return 'Legal Safety';
  if (source.includes('build') || source.includes('foundation') || source.includes('slope')) return 'Build Readiness';
  return 'Terra Insight';
}

function cleanReply(text) {
  return String(text || '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/(^|\n)\s*#{1,6}\s*/g, '$1')
    .replace(/(^|\n)\s*[-*•]\s+/g, '$1')
    .replace(/[–—]/g, ', ')
    .replace(/\s+\n/g, '\n')
    .trim();
}

function MessageText({ text, typed = false }) {
  const cleaned = cleanReply(text);
  if (typed) {
    return (
      <p className="text-sm leading-6 text-slate-700">
        {cleaned.split(/\s+/).map((word, index) => (
          <span
            key={`${word}-${index}`}
            className="terra-chat-typed-word"
            style={{ animationDelay: `${index * 0.055}s` }}
          >
            {word}{' '}
          </span>
        ))}
      </p>
    );
  }

  const blocks = cleaned.split(/\n{2,}|\n/).filter(Boolean);
  return (
    <div className="space-y-2">
      {blocks.map((block, index) => (
        <p key={index} className="text-sm leading-6 text-slate-700">{block}</p>
      ))}
    </div>
  );
}

export default function ChatAssistant({ open: controlledOpen, onOpenChange, hideFloatingTrigger = false }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      heading: 'Terra AI',
      text: OPENING_TEXT,
      typed: true,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);
  const audioRef = useRef(null);
  const { engineState, user } = useTerraStore();
  const userName = useMemo(() => getUserName(user), [user]);
  const initials = userName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';

  useEffect(() => {
    audioRef.current = new Audio(sendAudio);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [open, messages.length, loading]);

  const playSendSound = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    playSendSound();
    setInput('');
    setMessages((current) => [...current, { role: 'user', text }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/spatial/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          payload: engineState.payload,
          report: engineState.report,
        }),
      });

      if (!res.ok) throw new Error(`Chat API error ${res.status}`);
      const data = await res.json();
      const reply = cleanReply(
        data.answer ?? data.reply ?? data.response ?? data.message ??
        'I could not find a clear answer from the report yet.'
      );
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          heading: inferHeading(reply, text),
          text: reply,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          heading: 'Connection Check',
          text: 'I cannot reach Terra AI right now. The report is still here, but the chat engine may be waking up on Render. Please try again in a moment.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoice = () => {
    setListening(true);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTimeout(() => setListening(false), 1800);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-KE';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) setInput((current) => [current, transcript].filter(Boolean).join(' '));
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  return (
    <>
      {!hideFloatingTrigger && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setOpen(!open)}
          className="fixed bottom-6 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#c8a8ff] shadow-2xl shadow-purple-300/50"
          aria-label="Talk to Terra AI"
        >
          <img src={terraLogo} alt="" className="h-9 w-9 rounded-full object-cover" />
        </motion.button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/45 px-3 py-4 backdrop-blur-sm sm:px-6"
          >
            <motion.div
              initial={{ opacity: 0, x: 48, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 48, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="ml-auto flex h-[min(92vh,820px)] w-full max-w-[34rem] flex-col overflow-hidden rounded-[2rem] border border-purple-100 bg-[#f8f1e8] shadow-[0_30px_110px_rgba(76,29,149,0.32)]"
            >
              <div className="flex items-center justify-between gap-4 border-b border-purple-100 bg-white px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={terraLogo} alt="Terra AI" className="h-11 w-11 rounded-full object-cover ring-4 ring-purple-100" />
                  <div className="min-w-0">
                    <p className="text-base font-black text-slate-950">Terra AI</p>
                    <p className="truncate text-xs font-semibold text-purple-500">Talking with {userName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden items-center gap-2 rounded-full bg-purple-50 px-3 py-2 sm:flex">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-200 text-[10px] font-black text-purple-800">
                      {initials}
                    </div>
                    <span className="max-w-24 truncate text-xs font-bold text-slate-700">{userName}</span>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                    aria-label="Close Terra AI chat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="relative flex-1 overflow-y-auto px-4 py-5 sm:px-5">
                <AnimatePresence>
                  {listening && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      className="absolute inset-0 z-20 flex items-center justify-center bg-[#f8f1e8]/82 backdrop-blur-sm"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <img src={voiceLoadingGif} alt="Listening" className="h-36 w-36 rounded-full object-cover" />
                        <p className="text-sm font-bold text-purple-700">Listening...</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  {messages.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div key={index} className={clsx('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
                        {!isUser && (
                          <img src={terraLogo} alt="Terra AI" className="mt-1 h-8 w-8 rounded-full object-cover ring-2 ring-white" />
                        )}
                        <div className={clsx('max-w-[82%] rounded-[1.6rem] px-4 py-3 shadow-sm',
                          isUser
                            ? 'rounded-tr-md bg-[#ead8bd] text-slate-900'
                            : 'rounded-tl-md bg-white text-slate-800'
                        )}>
                          {!isUser && (
                            <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-purple-500">
                              {msg.heading || 'Terra Insight'}
                            </p>
                          )}
                          <MessageText text={msg.text} typed={msg.typed && open} />
                        </div>
                        {isUser && (
                          <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-purple-200 text-purple-800">
                            <UserRound className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {loading && (
                    <div className="flex items-center gap-3">
                      <img src={terraLogo} alt="Terra AI" className="h-8 w-8 rounded-full object-cover ring-2 ring-white" />
                      <div className="rounded-[1.6rem] rounded-tl-md bg-white px-4 py-3 shadow-sm">
                        <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              </div>

              <div className="border-t border-purple-100 bg-white px-4 py-4">
                <div className="flex items-center gap-2 rounded-full border border-purple-100 bg-[#fbf7f1] p-2 shadow-inner">
                  <button
                    type="button"
                    onClick={handleVoice}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition-transform active:scale-95"
                    aria-label="Voice input"
                  >
                    <img src={micIcon} alt="" className="h-5 w-5 object-contain" />
                  </button>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask Terra about this land..."
                    className="min-w-0 flex-1 bg-transparent px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-purple-300 shadow-sm transition-transform active:scale-95 disabled:opacity-45"
                    aria-label="Send message"
                  >
                    <img src={sendIcon} alt="" className="h-5 w-5 object-contain" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
