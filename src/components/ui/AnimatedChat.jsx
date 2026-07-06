/**
 * AnimatedChat.jsx — Real-time typing demo card
 * Shows "Savannah" asking Terra AI a question with animated typewriter response.
 * Pass `demo` prop: 'lens' | 'sim' | 'flow' | 'home'
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, User } from 'lucide-react';
import aiIcon from '../../assets/ai_chat/ai_icon.png';

const DEMOS = {
  home: {
    user: 'Savannah',
    initials: 'SW',
    avatarColor: 'bg-violet-500',
    question: 'What are the key risks for a plot in Kilimani near a seasonal stream?',
    response: 'Analysing coordinates... Three critical flags detected:\n\n① Riparian breach — the plot sits 18m from a seasonal stream. NEMA\'s 30m buffer applies under EMCA Cap 387. Risk of repossession with zero compensation.\n\n② Slope 11% — moderate terrain gradient. Budget KES 350,000–600,000 for strip foundation reinforcement.\n\n③ Title search required — Ardhisasa search (KES 500) before any deposit. Your Land Feasibility Score: 68 / 100 — MODERATE WARNINGS.',
  },
  lens: {
    user: 'Savannah',
    initials: 'SW',
    avatarColor: 'bg-violet-500',
    question: 'Can you scan this site photo for flood and vegetation risks?',
    response: 'Photo analysed. Detected: dense canopy cover (NDVI 0.72 — possible forest reserve boundary nearby). Terrain shows a natural depression consistent with seasonal water pooling.\n\nJRC Global Surface Water confirms flood occurrence at this coordinate in 3 of the last 12 years.\n\nRecommendation: commission elevation survey + NEMA consultation before any purchase. Flash Flood Susceptibility: HIGH.',
  },
  sim: {
    user: 'Savannah',
    initials: 'SW',
    avatarColor: 'bg-violet-500',
    question: 'Where should I place a 4-storey apartment on this 0.5-acre Kasarani plot?',
    response: 'Site analysis complete. Recommended placement: north-eastern quadrant, set back 6m from road reserve.\n\nThis maximises daylight on south-facing units, preserves a 12m service road on the western edge, and clears the drainage channel identified in the south-eastern corner.\n\nEstimated buildable footprint: 420 m² · Max FAR: 2.4 · Parking allocation: 18 bays. Constraint map and annotated plan ready to export.',
  },
  flow: {
    user: 'Savannah',
    initials: 'SW',
    avatarColor: 'bg-violet-500',
    question: 'Generate a pre-purchase risk report for coordinates: -1.2921, 36.8219',
    response: 'Report generated. Land Feasibility Score: 72 / 100 — MODERATE WARNINGS.\n\nKey findings:\n① Slope 14% — raft foundation recommended, KES 650,000 premium.\n② Grid connection 380m — budget KES 342,000 KPLC extension.\n③ No riparian breach detected — clear of 30m buffer.\n④ Soil: Moderate Clay (32%) — strip foundation with investigation advised.\n\nFull PDF report ready. Estimated pre-purchase due diligence cost: KES 87,500.',
  },
};

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

export default function AnimatedChat({ demo = 'home', autoPlay = true, className = '' }) {
  const data = DEMOS[demo] || DEMOS.home;
  const [phase, setPhase] = useState('idle'); // idle → question → thinking → typing → done
  const [displayedResponse, setDisplayedResponse] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  const intervalRef = useRef(null);
  const hasStarted = useRef(false);

  const resetAndPlay = () => {
    setPhase('question');
    setDisplayedResponse('');
    setCharIndex(0);
    hasStarted.current = true;
  };

  // Auto-start on mount
  useEffect(() => {
    if (autoPlay) {
      const timeout = setTimeout(resetAndPlay, 800);
      return () => clearTimeout(timeout);
    }
  }, [autoPlay]); // eslint-disable-line react-hooks/exhaustive-deps

  // Phase transitions
  useEffect(() => {
    if (phase === 'question') {
      const t = setTimeout(() => setPhase('thinking'), 1400);
      return () => clearTimeout(t);
    }
    if (phase === 'thinking') {
      const t = setTimeout(() => { setPhase('typing'); setCharIndex(0); }, 1200);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Typewriter effect
  useEffect(() => {
    if (phase !== 'typing') return;
    if (charIndex >= data.response.length) {
      setPhase('done');
      return;
    }
    intervalRef.current = setTimeout(() => {
      setDisplayedResponse(data.response.slice(0, charIndex + 1));
      setCharIndex((c) => c + 1);
    }, 14);
    return () => clearTimeout(intervalRef.current);
  }, [phase, charIndex, data.response]);

  // Replay loop
  useEffect(() => {
    if (phase === 'done' && autoPlay) {
      const t = setTimeout(() => {
        setPhase('idle');
        setDisplayedResponse('');
        setCharIndex(0);
        setTimeout(resetAndPlay, 600);
      }, 6000);
      return () => clearTimeout(t);
    }
  }, [phase, autoPlay]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatResponse = (text) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden font-gabarito ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="text-xs font-semibold text-slate-400 ml-1">Terra AI Chat</span>
      </div>

      <div className="p-4 space-y-4 min-h-[260px]">
        {/* User question */}
        <AnimatePresence>
          {(phase !== 'idle') && (
            <motion.div
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

        {/* AI response */}
        <AnimatePresence>
          {(phase === 'thinking' || phase === 'typing' || phase === 'done') && (
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

        {/* Idle state prompt */}
        {phase === 'idle' && (
          <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
            <Sparkles className="w-4 h-4 mr-2 text-emerald-400" />
            Initialising Terra AI…
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
          <input
            type="text"
            placeholder="Ask Terra AI about any site…"
            className="flex-1 bg-transparent text-sm text-slate-600 placeholder:text-slate-400 outline-none"
            readOnly
          />
          <button
            onClick={() => { if (phase === 'idle' || phase === 'done') resetAndPlay(); }}
            className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0 hover:bg-emerald-600 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
