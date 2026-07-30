/**
 * AnimatedChat.jsx — Real-time typing demo card
 * Shows "Savannah" asking Terra AI a question with animated typewriter response.
 * Pass `demo` prop: 'lens' | 'sim' | 'flow' | 'home'
 *
 * Mic interaction (Terra Lens demo):
 *   Press mic once  → "listening" state — voice_listening.gif appears in input bar
 *   Press mic again → release — question types itself out, then AI thinks, then responds
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

/* ─── sub-components ────────────────────────────────────────────────────── */
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

/* ─── main component ────────────────────────────────────────────────────── */
/**
 * phases:
 *   idle        — blank slate, mic shown, sparkle send visible
 *   listening   — mic is "held": voice_listening.gif inside input bar, pulse ring on mic
 *   question    — question bubble appearing / typing into input bar
 *   thinking    — AI dot indicator
 *   typing      — typewriter on AI response
 *   done        — full response displayed
 */
export default function AnimatedChat({ demo = 'home', autoPlay = true, className = '' }) {
  const data = DEMOS[demo] || DEMOS.home;

  // phases: idle | listening | question | thinking | typing | done
  const [phase, setPhase]                   = useState('idle');
  const [inputText, setInputText]           = useState('');   // text appearing in the input bar
  const [inputCharIdx, setInputCharIdx]     = useState(0);
  const [displayedResponse, setDisplayedResponse] = useState('');
  const [charIndex, setCharIndex]           = useState(0);
  const [isListening, setIsListening]       = useState(false); // mic toggle state
  const timerRef = useRef(null);

  /* ── helpers ── */
  const clearTimer = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  const startFromListeningRelease = () => {
    // After mic released: type the question into the input bar, then transition
    setPhase('question');
    setInputText('');
    setInputCharIdx(0);
    setDisplayedResponse('');
    setCharIndex(0);
  };

  const fullReset = () => {
    setPhase('idle');
    setIsListening(false);
    setInputText('');
    setInputCharIdx(0);
    setDisplayedResponse('');
    setCharIndex(0);
  };

  /* ── mic button handler ── */
  const handleMicPress = () => {
    if (phase === 'listening') {
      // Second press — release: start typing the question
      setIsListening(false);
      startFromListeningRelease();
    } else if (phase === 'idle' || phase === 'done') {
      // First press — start listening
      fullReset();
      setPhase('listening');
      setIsListening(true);
    }
    // ignore presses mid-flow
  };

  /* ── autoPlay: auto-trigger a demo cycle on mount ── */
  useEffect(() => {
    if (!autoPlay) return;
    const t = setTimeout(() => {
      setPhase('listening');
      setIsListening(true);
      // auto-release after 2s to simulate holding
      timerRef.current = setTimeout(() => {
        setIsListening(false);
        startFromListeningRelease();
      }, 2000);
    }, 900);
    return () => { clearTimeout(t); clearTimer(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── phase: question — type text into input bar ── */
  useEffect(() => {
    if (phase !== 'question') return;
    if (inputCharIdx >= data.question.length) {
      // question fully typed — move on after short pause
      timerRef.current = setTimeout(() => setPhase('thinking'), 700);
      return () => clearTimer();
    }
    timerRef.current = setTimeout(() => {
      setInputText(data.question.slice(0, inputCharIdx + 1));
      setInputCharIdx((c) => c + 1);
    }, 40);
    return () => clearTimer();
  }, [phase, inputCharIdx, data.question]);

  /* ── phase: question → thinking ── */
  // (handled inside the question effect above when fully typed)

  /* ── phase: thinking → typing ── */
  useEffect(() => {
    if (phase !== 'thinking') return;
    timerRef.current = setTimeout(() => {
      setPhase('typing');
      setCharIndex(0);
    }, 1400);
    return () => clearTimer();
  }, [phase]);

  /* ── phase: typing — typewriter on AI response ── */
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

  /* ── phase: done — replay loop (autoPlay only) ── */
  useEffect(() => {
    if (phase !== 'done' || !autoPlay) return;
    timerRef.current = setTimeout(() => {
      fullReset();
      // restart listening after brief pause
      setTimeout(() => {
        setPhase('listening');
        setIsListening(true);
        timerRef.current = setTimeout(() => {
          setIsListening(false);
          startFromListeningRelease();
        }, 2000);
      }, 800);
    }, 6000);
    return () => clearTimer();
  }, [phase, autoPlay]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── helpers for rendering ── */
  const formatResponse = (text) =>
    text.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));

  const showQuestion  = phase !== 'idle' && phase !== 'listening';
  const showAiBlock   = phase === 'thinking' || phase === 'typing' || phase === 'done';

  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden font-gabarito ${className}`}
    >
      {/* ── window chrome ── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="text-xs font-semibold text-slate-400 ml-1">Terra AI Chat</span>
      </div>

      {/* ── chat body ── */}
      <div className="p-4 space-y-4 min-h-[260px]">

        {/* user question bubble */}
        <AnimatePresence>
          {showQuestion && (
            <motion.div
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
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 relative">

          {/* listening state: gif replaces placeholder */}
          <AnimatePresence mode="wait">
            {phase === 'listening' ? (
              <motion.div
                key="listening"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex items-center gap-2"
              >
                <img
                  src={voiceListening}
                  alt="Listening…"
                  className="h-6 object-contain"
                  style={{ filter: 'hue-rotate(120deg) saturate(1.4)' }}
                />
                <span className="text-xs text-emerald-600 font-semibold animate-pulse">
                  Listening… press mic to send
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-hidden"
              >
                {/* typed question or placeholder */}
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
                    Ask Terra AI about any site…
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* mic button */}
          <motion.button
            onClick={handleMicPress}
            aria-label={isListening ? 'Stop recording' : 'Start voice input'}
            className="relative w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-full transition-colors"
            style={{
              background: isListening
                ? 'rgba(16, 185, 129, 0.12)'   // subtle emerald tint while active
                : 'transparent',
            }}
            whileTap={{ scale: 0.88 }}
          >
            {/* pulse ring while listening */}
            {isListening && (
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-emerald-400"
                animate={{ scale: [1, 1.55], opacity: [0.7, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
            <img
              src={micIcon}
              alt="Mic"
              className="w-5 h-5 object-contain"
              style={{
                filter: isListening
                  ? 'invert(47%) sepia(90%) saturate(400%) hue-rotate(115deg)'  // emerald tint
                  : 'invert(40%) sepia(5%) saturate(400%) hue-rotate(190deg)',  // slate tint
              }}
            />
          </motion.button>

          {/* sparkle send — replay trigger */}
          <button
            onClick={() => { if (phase === 'idle' || phase === 'done') { fullReset(); setTimeout(() => { setPhase('listening'); setIsListening(true); timerRef.current = setTimeout(() => { setIsListening(false); startFromListeningRelease(); }, 2000); }, 50); } }}
            className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0 hover:bg-emerald-600 transition-colors"
            aria-label="Send / replay"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
