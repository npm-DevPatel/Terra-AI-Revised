/**
 * AnimatedChat.jsx — Real-time typing demo card
 *
 * Mic interaction (click-toggle):
 *   Click 1 → mic glows green + voice_listening.gif appears (listening state)
 *   Click 2 → mic returns to normal, question types itself out → AI thinks → answer streams
 *
 * Pass `demo` prop: 'lens' | 'sim' | 'flow' | 'home'
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import aiIcon         from '../../assets/ai_chat/ai_icon.png';
import micIcon        from '../../assets/ai_chat/mic_icon.png';
import voiceListening from '../../assets/ai_chat/voice_listening.gif';

/* ─── demo data ─────────────────────────────────────────────────────────── */
const DEMOS = {
  home: {
    initials: 'SW',
    avatarColor: 'bg-violet-500',
    question: 'What are the key risks for a plot in Kilimani near a seasonal stream?',
    response:
      "Analysing coordinates... Three critical flags detected:\n\n① Riparian breach — the plot sits 18m from a seasonal stream. NEMA's 30m buffer applies under EMCA Cap 387. Risk of repossession with zero compensation.\n\n② Slope 11% — moderate terrain gradient. Budget KES 350,000–600,000 for strip foundation reinforcement.\n\n③ Title search required — Ardhisasa search (KES 500) before any deposit. Your Land Feasibility Score: 68 / 100 — MODERATE WARNINGS.",
  },
  lens: {
    initials: 'SW',
    avatarColor: 'bg-violet-500',
    question: 'Can you scan this site photo for flood and vegetation risks?',
    response:
      'Photo analysed. Detected: dense canopy cover (NDVI 0.72 — possible forest reserve boundary nearby). Terrain shows a natural depression consistent with seasonal water pooling.\n\nJRC Global Surface Water confirms flood occurrence at this coordinate in 3 of the last 12 years.\n\nRecommendation: commission elevation survey + NEMA consultation before any purchase. Flash Flood Susceptibility: HIGH.',
  },
  sim: {
    initials: 'SW',
    avatarColor: 'bg-violet-500',
    question: 'Where should I place a 4-storey apartment on this 0.5-acre Kasarani plot?',
    response:
      'Site analysis complete. Recommended placement: north-eastern quadrant, set back 6m from road reserve.\n\nThis maximises daylight on south-facing units, preserves a 12m service road on the western edge, and clears the drainage channel identified in the south-eastern corner.\n\nEstimated buildable footprint: 420 m² · Max FAR: 2.4 · Parking allocation: 18 bays. Constraint map and annotated plan ready to export.',
  },
  flow: {
    initials: 'SW',
    avatarColor: 'bg-violet-500',
    question: 'Generate a pre-purchase risk report for coordinates: -1.2921, 36.8219',
    response:
      'Report generated. Land Feasibility Score: 72 / 100 — MODERATE WARNINGS.\n\nKey findings:\n① Slope 14% — raft foundation recommended, KES 650,000 premium.\n② Grid connection 380m — budget KES 342,000 KPLC extension.\n③ No riparian breach detected — clear of 30m buffer.\n④ Soil: Moderate Clay (32%) — strip foundation with investigation advised.\n\nFull PDF report ready. Estimated pre-purchase due diligence cost: KES 87,500.',
  },
};

/* ─── typing dots ────────────────────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-400"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  );
}

/* ─── main ───────────────────────────────────────────────────────────────── */
/**
 * Phases:
 *   idle      — blank, mic available
 *   listening — mic is glowing green, GIF shows in input bar
 *   question  — mic released; question types itself into the input bar character by character
 *   thinking  — question sent to AI; typing dots show in AI bubble
 *   typing    — AI response streams character by character
 *   done      — full response visible; mic reactivates
 */
export default function AnimatedChat({ demo = 'home', autoPlay = true, className = '' }) {
  const data = DEMOS[demo] || DEMOS.home;

  const [phase, setPhase]                         = useState('idle');
  const [isListening, setIsListening]             = useState(false); // controls mic glow
  const [inputText, setInputText]                 = useState('');
  const [inputCharIdx, setInputCharIdx]           = useState(0);
  const [displayedResponse, setDisplayedResponse] = useState('');
  const [charIndex, setCharIndex]                 = useState(0);

  const timerRef = useRef(null);
  const clearTimer = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  /* ── full reset ── */
  const fullReset = () => {
    clearTimer();
    setPhase('idle');
    setIsListening(false);
    setInputText('');
    setInputCharIdx(0);
    setDisplayedResponse('');
    setCharIndex(0);
  };

  /* ── start synthesising after mic is toggled off ── */
  const startSynthesis = () => {
    setPhase('question');
    setInputText('');
    setInputCharIdx(0);
    setDisplayedResponse('');
    setCharIndex(0);
  };

  /* ── mic click toggle ── */
  const handleMicClick = () => {
    if (isListening) {
      // ── Second click: stop listening, start synthesising ──
      setIsListening(false);
      startSynthesis();
    } else if (phase === 'idle' || phase === 'done') {
      // ── First click: start listening ──
      fullReset();
      // Need a tiny tick so fullReset's setPhase('idle') settles before we set 'listening'
      setTimeout(() => {
        setPhase('listening');
        setIsListening(true);
      }, 0);
    }
    // Ignore clicks mid-flow (question / thinking / typing)
  };

  /* ──────────────────────────────────────────────────────────────────────
   * autoPlay — simulates the full cycle on mount
   * ────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!autoPlay) return;

    // Simulate "click 1": start listening
    timerRef.current = setTimeout(() => {
      setPhase('listening');
      setIsListening(true);

      // Simulate "click 2" after 2.2 s: stop listening, synthesise
      timerRef.current = setTimeout(() => {
        setIsListening(false);
        startSynthesis();
      }, 2200);
    }, 900);

    return () => clearTimer();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ──────────────────────────────────────────────────────────────────────
   * phase: question — type the question into the input bar
   * ────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'question') return;

    if (inputCharIdx >= data.question.length) {
      // Fully typed — brief pause then hand off to AI
      timerRef.current = setTimeout(() => setPhase('thinking'), 600);
      return () => clearTimer();
    }

    timerRef.current = setTimeout(() => {
      setInputText(data.question.slice(0, inputCharIdx + 1));
      setInputCharIdx((c) => c + 1);
    }, 38);

    return () => clearTimer();
  }, [phase, inputCharIdx, data.question]);

  /* ──────────────────────────────────────────────────────────────────────
   * phase: thinking → typing (2.2 s deliberate pause)
   * ────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'thinking') return;
    timerRef.current = setTimeout(() => {
      setPhase('typing');
      setCharIndex(0);
    }, 2200);
    return () => clearTimer();
  }, [phase]);

  /* ──────────────────────────────────────────────────────────────────────
   * phase: typing — stream AI response
   * ────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'typing') return;

    if (charIndex >= data.response.length) {
      setPhase('done');
      return;
    }

    timerRef.current = setTimeout(() => {
      setDisplayedResponse(data.response.slice(0, charIndex + 1));
      setCharIndex((c) => c + 1);
    }, 14);

    return () => clearTimer();
  }, [phase, charIndex, data.response]);

  /* ──────────────────────────────────────────────────────────────────────
   * phase: done — replay loop (autoPlay only), 6 s rest then restart
   * ────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'done' || !autoPlay) return;

    timerRef.current = setTimeout(() => {
      // Reset then re-simulate the full listen → synthesise cycle
      setPhase('idle');
      setIsListening(false);
      setInputText('');
      setInputCharIdx(0);
      setDisplayedResponse('');
      setCharIndex(0);

      setTimeout(() => {
        setPhase('listening');
        setIsListening(true);

        timerRef.current = setTimeout(() => {
          setIsListening(false);
          startSynthesis();
        }, 2200);
      }, 700);
    }, 6000);

    return () => clearTimer();
  }, [phase, autoPlay]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── helpers ── */
  const formatResponse = (text) =>
    text.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));

  const showQuestion = phase !== 'idle' && phase !== 'listening';
  const showAiBlock  = phase === 'thinking' || phase === 'typing' || phase === 'done';
  const midFlow      = phase === 'question' || phase === 'thinking' || phase === 'typing';

  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden font-gabarito ${className}`}
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="text-xs font-semibold text-slate-400 ml-1">Terra AI Chat</span>
      </div>

      {/* chat body */}
      <div className="p-4 space-y-4 min-h-[260px]">
        {/* user question bubble */}
        <AnimatePresence>
          {showQuestion && (
            <motion.div
              key="question-bubble"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 justify-end"
            >
              <div className="bg-slate-900 text-white text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] leading-relaxed">
                {data.question}
              </div>
              <div className={`w-8 h-8 rounded-full ${data.avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {data.initials}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI response bubble */}
        <AnimatePresence>
          {showAiBlock && (
            <motion.div
              key="ai-bubble"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <img src={aiIcon} alt="Terra AI" className="w-5 h-5 object-contain brightness-200" />
              </div>
              <div className="bg-emerald-50 border border-emerald-100 text-slate-800 text-sm rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] leading-relaxed">
                {phase === 'thinking' ? (
                  <TypingIndicator />
                ) : (
                  <span>
                    {formatResponse(displayedResponse)}
                    {phase === 'typing' && (
                      <motion.span
                        className="inline-block w-0.5 h-4 bg-emerald-500 ml-0.5 align-middle"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    )}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* idle placeholder */}
        {phase === 'idle' && (
          <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
            <Sparkles className="w-4 h-4 mr-2 text-emerald-400" />
            Initialising Terra AI…
          </div>
        )}
      </div>

      {/* ── input bar ── */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">

          {/* input area */}
          <AnimatePresence mode="wait">
            {phase === 'listening' ? (
              /* GIF while listening */
              <motion.div
                key="listening-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex-1 flex items-center gap-2 min-w-0"
              >
                <img
                  src={voiceListening}
                  alt="Listening…"
                  className="h-6 object-contain flex-shrink-0"
                  style={{ filter: 'hue-rotate(120deg) saturate(1.4)' }}
                />
                <span className="text-xs text-emerald-600 font-semibold animate-pulse truncate">
                  Listening… tap mic again to send
                </span>
              </motion.div>
            ) : (
              /* typed text or placeholder */
              <motion.div
                key="text-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                {inputText ? (
                  <span className="text-sm text-slate-700 leading-none">
                    {inputText}
                    {phase === 'question' && (
                      <motion.span
                        className="inline-block w-0.5 h-3.5 bg-slate-500 ml-0.5 align-middle"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.45, repeat: Infinity }}
                      />
                    )}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400 select-none">
                    {phase === 'idle' || phase === 'done'
                      ? 'Tap mic to speak…'
                      : 'Ask Terra AI about any site…'}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── mic button ── */}
          <motion.button
            onClick={handleMicClick}
            disabled={midFlow}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            className="relative w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-full select-none transition-all duration-300"
            style={{
              background: isListening
                ? 'rgba(16, 185, 129, 0.18)'
                : 'transparent',
              cursor: midFlow ? 'default' : 'pointer',
            }}
            whileTap={!midFlow ? { scale: 0.84 } : {}}
          >
            {/* expanding pulse ring — only while listening */}
            <AnimatePresence>
              {isListening && (
                <>
                  <motion.span
                    key="ring1"
                    className="absolute inset-0 rounded-full"
                    style={{ border: '2px solid #10b981' }}
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 1.7, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
                  />
                  <motion.span
                    key="ring2"
                    className="absolute inset-0 rounded-full"
                    style={{ border: '2px solid #10b981' }}
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut', delay: 0.35 }}
                  />
                </>
              )}
            </AnimatePresence>

            {/* mic icon — tinted green while listening */}
            <img
              src={micIcon}
              alt="Mic"
              className="w-5 h-5 object-contain pointer-events-none"
              draggable={false}
              style={{
                filter: isListening
                  ? 'invert(55%) sepia(80%) saturate(600%) hue-rotate(115deg) brightness(1.1)'
                  : midFlow
                  ? 'invert(70%) sepia(0%) saturate(0%) brightness(1.1)'
                  : 'invert(40%) sepia(5%) saturate(400%) hue-rotate(190deg)',
                transition: 'filter 0.25s ease',
              }}
            />
          </motion.button>

          {/* sparkle — replay / restart shortcut */}
          <button
            onClick={() => {
              if (!midFlow) {
                fullReset();
                setTimeout(() => {
                  setPhase('listening');
                  setIsListening(true);
                }, 50);
              }
            }}
            disabled={midFlow}
            className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0 hover:bg-emerald-600 transition-colors disabled:opacity-40"
            aria-label="Restart demo"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        {/* status hint */}
        <p className="text-center text-[10px] text-slate-400 mt-1.5 select-none">
          {isListening
            ? '🔴 Recording — tap mic to send'
            : phase === 'question'
            ? '✍️ Synthesising your question…'
            : phase === 'thinking'
            ? '🤔 Terra AI is thinking…'
            : phase === 'typing'
            ? '⚡ Generating answer…'
            : 'Tap the mic to ask Terra AI'}
        </p>
      </div>
    </div>
  );
}
