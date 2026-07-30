/**
 * AnimatedChat.jsx — Real-time typing demo card
 * Shows "Savannah" asking Terra AI a question with animated typewriter response.
 * Pass `demo` prop: 'lens' | 'sim' | 'flow' | 'home'
 *
 * Mic interaction — push-to-talk (walkie-talkie style):
 *   mousedown / touchstart  → listening: voice_listening.gif appears, pulse ring fires
 *   mouseup   / touchend    → release: question types itself into the input bar,
 *                             then Terra AI thinks, then streams the answer
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import aiIcon         from '../../assets/ai_chat/ai_icon.png';
import micIcon        from '../../assets/ai_chat/mic_icon.png';
import voiceListening from '../../assets/ai_chat/voice_listening.gif';

/* ─── demo data ─────────────────────────────────────────────────────────── */
const DEMOS = {
  home: {
    user: 'Savannah',
    initials: 'SW',
    avatarColor: 'bg-violet-500',
    question: 'What are the key risks for a plot in Kilimani near a seasonal stream?',
    response:
      "Analysing coordinates... Three critical flags detected:\n\n① Riparian breach — the plot sits 18m from a seasonal stream. NEMA's 30m buffer applies under EMCA Cap 387. Risk of repossession with zero compensation.\n\n② Slope 11% — moderate terrain gradient. Budget KES 350,000–600,000 for strip foundation reinforcement.\n\n③ Title search required — Ardhisasa search (KES 500) before any deposit. Your Land Feasibility Score: 68 / 100 — MODERATE WARNINGS.",
  },
  lens: {
    user: 'Savannah',
    initials: 'SW',
    avatarColor: 'bg-violet-500',
    question: 'Can you scan this site photo for flood and vegetation risks?',
    response:
      'Photo analysed. Detected: dense canopy cover (NDVI 0.72 — possible forest reserve boundary nearby). Terrain shows a natural depression consistent with seasonal water pooling.\n\nJRC Global Surface Water confirms flood occurrence at this coordinate in 3 of the last 12 years.\n\nRecommendation: commission elevation survey + NEMA consultation before any purchase. Flash Flood Susceptibility: HIGH.',
  },
  sim: {
    user: 'Savannah',
    initials: 'SW',
    avatarColor: 'bg-violet-500',
    question: 'Where should I place a 4-storey apartment on this 0.5-acre Kasarani plot?',
    response:
      'Site analysis complete. Recommended placement: north-eastern quadrant, set back 6m from road reserve.\n\nThis maximises daylight on south-facing units, preserves a 12m service road on the western edge, and clears the drainage channel identified in the south-eastern corner.\n\nEstimated buildable footprint: 420 m² · Max FAR: 2.4 · Parking allocation: 18 bays. Constraint map and annotated plan ready to export.',
  },
  flow: {
    user: 'Savannah',
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
export default function AnimatedChat({ demo = 'home', autoPlay = true, className = '' }) {
  const data = DEMOS[demo] || DEMOS.home;

  /**
   * phases:
   *   idle      — waiting, mic available
   *   listening — user is holding the mic (or autoPlay is simulating a hold)
   *   question  — mic released; question types itself into the input bar
   *   thinking  — question sent; AI shows dot indicator
   *   typing    — AI response streams character by character
   *   done      — full response visible
   */
  const [phase, setPhase]                         = useState('idle');
  const [inputText, setInputText]                 = useState('');
  const [inputCharIdx, setInputCharIdx]           = useState(0);
  const [displayedResponse, setDisplayedResponse] = useState('');
  const [charIndex, setCharIndex]                 = useState(0);

  // Separate flag so the mic button can read the listening state synchronously
  const [isListening, setIsListening]             = useState(false);

  // We need to know if the mic is still being held when mouseup fires
  const holdingRef  = useRef(false);
  const timerRef    = useRef(null);

  /* ── clear any pending timer ── */
  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  /* ── hard reset to idle ── */
  const fullReset = useCallback(() => {
    clearTimer();
    holdingRef.current = false;
    setPhase('idle');
    setIsListening(false);
    setInputText('');
    setInputCharIdx(0);
    setDisplayedResponse('');
    setCharIndex(0);
  }, [clearTimer]);

  /* ── called the moment the mic is released ── */
  const onRelease = useCallback(() => {
    if (!holdingRef.current) return;   // already released
    holdingRef.current = false;
    setIsListening(false);
    // start typing the question into the input bar
    setPhase('question');
    setInputText('');
    setInputCharIdx(0);
  }, []);

  /* ── called when the mic is pressed down ── */
  const onHold = useCallback(() => {
    // Ignore if mid-flow
    if (!['idle', 'done'].includes(phase) && phase !== 'idle') {
      if (phase !== 'done') return;
    }
    clearTimer();
    fullReset();
    // tiny defer so state settles before we set listening
    requestAnimationFrame(() => {
      holdingRef.current = true;
      setPhase('listening');
      setIsListening(true);
    });
  }, [phase, clearTimer, fullReset]);

  /* ── mouse / touch event handlers ── */
  const handleMouseDown = (e) => {
    e.preventDefault();   // prevent focus steal
    onHold();
  };
  const handleMouseUp   = () => onRelease();
  const handleMouseLeave = () => {
    // If pointer leaves the button while held, treat as a release
    if (holdingRef.current) onRelease();
  };
  const handleTouchStart = (e) => {
    e.preventDefault();
    onHold();
  };
  const handleTouchEnd = (e) => {
    e.preventDefault();
    onRelease();
  };

  /* ──────────────────────────────────────────────────────────────────────
   * autoPlay — simulates a full "hold → release" cycle on mount
   * ────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!autoPlay) return;

    // Start the demo after a short grace period
    timerRef.current = setTimeout(() => {
      holdingRef.current = true;
      setPhase('listening');
      setIsListening(true);

      // Simulate holding for ~2 s, then "release"
      timerRef.current = setTimeout(() => {
        holdingRef.current = false;
        setIsListening(false);
        setPhase('question');
        setInputText('');
        setInputCharIdx(0);
      }, 2000);
    }, 900);

    return () => clearTimer();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ──────────────────────────────────────────────────────────────────────
   * phase: question — type the question into the input bar character by character
   * ────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'question') return;

    if (inputCharIdx >= data.question.length) {
      // Fully typed — brief pause then hand off to the AI
      timerRef.current = setTimeout(() => setPhase('thinking'), 600);
      return () => clearTimer();
    }

    timerRef.current = setTimeout(() => {
      setInputText(data.question.slice(0, inputCharIdx + 1));
      setInputCharIdx((c) => c + 1);
    }, 38);

    return () => clearTimer();
  }, [phase, inputCharIdx, data.question, clearTimer]);

  /* ──────────────────────────────────────────────────────────────────────
   * phase: thinking — AI "..." dots for ~1.4 s
   * ────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'thinking') return;
    timerRef.current = setTimeout(() => {
      setPhase('typing');
      setCharIndex(0);
    }, 2200);   // 2.2 s thinking pause before streaming the answer
    return () => clearTimer();
  }, [phase, clearTimer]);

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
  }, [phase, charIndex, data.response, clearTimer]);

  /* ──────────────────────────────────────────────────────────────────────
   * phase: done — wait 6 s then replay (autoPlay only)
   * ────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'done' || !autoPlay) return;

    timerRef.current = setTimeout(() => {
      // Reset to idle, then re-simulate a hold
      setPhase('idle');
      setIsListening(false);
      setInputText('');
      setInputCharIdx(0);
      setDisplayedResponse('');
      setCharIndex(0);

      setTimeout(() => {
        holdingRef.current = true;
        setPhase('listening');
        setIsListening(true);

        timerRef.current = setTimeout(() => {
          holdingRef.current = false;
          setIsListening(false);
          setPhase('question');
          setInputText('');
          setInputCharIdx(0);
        }, 2000);
      }, 700);
    }, 6000);

    return () => clearTimer();
  }, [phase, autoPlay, clearTimer]);

  /* ── format multi-line response ── */
  const formatResponse = (text) =>
    text.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));

  const showQuestion = phase !== 'idle' && phase !== 'listening';
  const showAiBlock  = phase === 'thinking' || phase === 'typing' || phase === 'done';

  /* ── render ── */
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
              <div
                className={`w-8 h-8 rounded-full ${data.avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
              >
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

      {/* input bar */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">

          {/* input area — gif while listening, typed text otherwise */}
          <AnimatePresence mode="wait">
            {phase === 'listening' ? (
              <motion.div
                key="listening-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex items-center gap-2 min-w-0"
              >
                <img
                  src={voiceListening}
                  alt="Listening…"
                  className="h-6 object-contain flex-shrink-0"
                  style={{ filter: 'hue-rotate(120deg) saturate(1.4)' }}
                />
                <span className="text-xs text-emerald-600 font-semibold animate-pulse truncate">
                  Listening… release to send
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="text-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
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
                    Hold mic to ask Terra AI…
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── mic button — push-to-talk ── */}
          <motion.button
            aria-label={isListening ? 'Release to send' : 'Hold to speak'}
            className="relative w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-full select-none"
            style={{
              background: isListening ? 'rgba(16, 185, 129, 0.14)' : 'transparent',
              cursor: 'pointer',
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            whileTap={{ scale: 0.84 }}
          >
            {/* animated pulse ring while held */}
            {isListening && (
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-emerald-400"
                animate={{ scale: [1, 1.6], opacity: [0.8, 0] }}
                transition={{ duration: 1.0, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
            <img
              src={micIcon}
              alt="Mic"
              className="w-5 h-5 object-contain pointer-events-none"
              draggable={false}
              style={{
                filter: isListening
                  ? 'invert(55%) sepia(80%) saturate(500%) hue-rotate(115deg)'
                  : 'invert(40%) sepia(5%) saturate(400%) hue-rotate(190deg)',
                transition: 'filter 0.2s ease',
              }}
            />
          </motion.button>

          {/* sparkle — replay shortcut */}
          <button
            onClick={() => {
              if (phase === 'idle' || phase === 'done') {
                fullReset();
                // Simulate a 2 s hold then auto-release
                setTimeout(() => {
                  holdingRef.current = true;
                  setPhase('listening');
                  setIsListening(true);
                  timerRef.current = setTimeout(() => {
                    holdingRef.current = false;
                    setIsListening(false);
                    setPhase('question');
                    setInputText('');
                    setInputCharIdx(0);
                  }, 2000);
                }, 80);
              }
            }}
            className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0 hover:bg-emerald-600 transition-colors"
            aria-label="Replay demo"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        {/* push-to-talk hint */}
        <p className="text-center text-[10px] text-slate-400 mt-1.5 select-none">
          {isListening ? '🔴 Recording — release to send' : 'Hold mic icon to speak'}
        </p>
      </div>
    </div>
  );
}
