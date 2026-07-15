/**
 * PlannerWorkspace.jsx — Terra Planner
 *
 * The magical AI project intelligence experience.
 * States: idle → thinking → ready
 *
 * Features:
 *   • AI "building your project…" sequence animation
 *   • 6 auto-generated phases (Site Validation → Completion)
 *   • "Why is this here?" explanation modal per task
 *   • Today's priorities panel
 *   • Dynamic update banner when new data arrives
 *   • Navigate back to Lens or forward to Report
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Sparkles, CheckCircle2, Circle, AlertCircle, ChevronRight,
  ScanSearch, FileText, Loader2, HelpCircle, RefreshCw, X, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useTerraStore from '../../store/useTerraStore';
import { supabase } from '../../lib/supabaseClient';
import { API_BASE_URL as API_BASE } from '../../lib/apiBase';
import '../../styles/workspace.css';

const THINKING_STEPS = [
  'Understanding project type',
  'Analyzing site characteristics',
  'Identifying construction phases',
  'Estimating dependencies',
  'Generating execution plan',
];

const PHASE_COLORS = {
  1: '#10b981', 2: '#3b82f6', 3: '#f59e0b',
  4: '#8b5cf6', 5: '#ef4444', 6: '#06b6d4',
};

const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#34d399' };

function ThinkingSequence({ onDone }) {
  const [step, setStep] = useState(-1);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      setStep(i);
      i++;
      if (i >= THINKING_STEPS.length) {
        clearInterval(iv);
        setTimeout(() => { setDone(true); setTimeout(onDone, 800); }, 400);
      }
    }, 600);
    return () => clearInterval(iv);
  }, [onDone]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, padding: '60px 32px', maxWidth: 420, margin: '0 auto' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Sparkles size={24} color="#10b981" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#f0f0f8', marginBottom: 6 }}>Building your project…</div>
        <div style={{ fontSize: 13, color: '#4b5563' }}>Terra AI is reasoning about your site</div>
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {THINKING_STEPS.map((s, i) => {
          const isActive = i === step;
          const isDone = i < step || done;
          return (
            <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: i <= step || done ? 1 : 0.3, x: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 22, height: 22, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isDone ? <CheckCircle2 size={18} color="#10b981" />
                  : isActive ? <Loader2 size={18} color="#10b981" className="spin" />
                  : <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1f2937' }} />}
              </div>
              <span style={{ fontSize: 14, color: isDone ? '#f0f0f8' : isActive ? '#10b981' : '#374151', fontWeight: isDone || isActive ? 600 : 400 }}>
                {s}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function ExplainModal({ taskName, phaseName, projectId, analysisId, onClose, session }) {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/planner/explain`, { method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({ project_id: projectId, task_name: taskName, phase_name: phaseName, analysis_id: analysisId }) })
      .then(r => r.json()).then(d => { setExplanation(d.explanation || 'No explanation available.'); setLoading(false); })
      .catch(() => { setExplanation('Explanation temporarily unavailable.'); setLoading(false); });
  }, [taskName, phaseName, projectId, analysisId, session]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 40px 80px rgba(0,0,0,0.2)', fontFamily: "'Gabarito','Inter',system-ui" }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Why is this here?</div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>{taskName}</h3>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{phaseName}</div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' }}><X size={15} color="#64748b" /></button>
        </div>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13, padding: '12px 0' }}>
            <Loader2 size={14} className="spin" /> Terra is reasoning…
          </div>
        ) : (
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>{explanation}</p>
        )}
      </motion.div>
    </div>
  );
}

function TaskRow({ task, phase, projectId, analysisId, session }) {
  const [showExplain, setShowExplain] = useState(false);
  const [checked, setChecked] = useState(task.status === 'done' || task.auto_completed);
  const col = PRIORITY_COLORS[task.priority] || '#94a3b8';

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <button onClick={() => setChecked(c => !c)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {checked ? <CheckCircle2 size={16} color="#10b981" /> : <Circle size={16} color="#374151" />}
        </button>
        <span style={{ flex: 1, fontSize: 13, color: checked ? '#4b5563' : '#d1d5db', textDecoration: checked ? 'line-through' : 'none', lineHeight: 1.4 }}>
          {task.name}
          {task.auto_completed && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: 100 }}>✓ Lens</span>}
        </span>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: col, flexShrink: 0 }} />
        <button onClick={() => setShowExplain(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: 4, display: 'flex', alignItems: 'center' }}
          title="Why is this here?">
          <HelpCircle size={13} />
        </button>
      </div>
      {showExplain && <ExplainModal taskName={task.name} phaseName={phase.name} projectId={projectId} analysisId={analysisId} onClose={() => setShowExplain(false)} session={session} />}
    </>
  );
}

function PhaseCard({ phase, projectId, analysisId, session }) {
  const [expanded, setExpanded] = useState(phase.number <= 2);
  const col = PHASE_COLORS[phase.number] || '#94a3b8';
  const doneCount = phase.tasks?.filter(t => t.status === 'done' || t.auto_completed).length || 0;
  const total = phase.tasks?.length || 0;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: phase.number * 0.06 }}
      style={{ background: '#111118', border: `1px solid ${col}28`, borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
      <button onClick={() => setExpanded(e => !e)} style={{ width: '100%', background: 'none', border: 'none', padding: '14px 18px', cursor: 'pointer', fontFamily: 'inherit' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: col + '20', border: `1px solid ${col}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: col }}>{phase.number}</span>
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f8' }}>Phase {phase.number} — {phase.name}</div>
            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{doneCount}/{total} tasks · {phase.estimated_weeks}w</div>
          </div>
          {/* Mini progress bar */}
          <div style={{ width: 60, height: 4, background: '#1f2937', borderRadius: 2, flexShrink: 0 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 2, transition: 'width 0.5s ease' }} />
          </div>
          <ChevronRight size={14} color="#374151" style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 18px 14px' }}>
              {phase.ai_note && (
                <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.5, marginBottom: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: `3px solid ${col}50` }}>
                  {phase.ai_note}
                </div>
              )}
              {phase.tasks?.map((task, i) => (
                <TaskRow key={i} task={task} phase={phase} projectId={projectId} analysisId={analysisId} session={session} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PlannerWorkspace — main component
══════════════════════════════════════════════════════════════════ */
export default function PlannerWorkspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { session } = useTerraStore();

  const [uiState, setUiState] = useState('idle'); // idle | thinking | ready | error
  const [plan, setPlan] = useState(null);
  const [priorities, setPriorities] = useState([]);
  const [error, setError] = useState('');
  const [loadingPriorities, setLoadingPriorities] = useState(false);
  const [updateBanner, setUpdateBanner] = useState(null);

  // On mount: check if a plan exists already
  useEffect(() => {
    loadExistingPlan();
  }, [projectId]);

  async function loadExistingPlan() {
    const { data } = await supabase.from('sim_plans')
      .select('id,result,created_at').eq('project_id', projectId)
      .eq('scenario', 'planner').order('created_at', { ascending: false }).limit(1).single();
    if (data?.result?.phases?.length) {
      setPlan(data.result);
      setUiState('ready');
      loadPriorities(data.result.phases);
    }
  }

  async function loadPriorities(phases) {
    setLoadingPriorities(true);
    try {
      const res = await fetch(`${API_BASE}/api/planner/priorities`, { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ project_id: projectId }) });
      const data = await res.json();
      setPriorities(data.priorities || []);
    } catch { /* non-fatal */ }
    setLoadingPriorities(false);
  }

  const generate = async () => {
    setUiState('thinking');
    setError('');
  };

  const onThinkingDone = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/planner/generate`, { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ project_id: projectId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed.');
      setPlan(data);
      setUiState('ready');
      loadPriorities(data.phases || []);
    } catch (err) {
      setError(err.message);
      setUiState('idle');
    }
  };

  return (
    <div className="lens-screen" style={{ alignItems: 'flex-start', padding: '0', overflow: 'hidden' }}>
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f0f8' }}>Terra Planner</div>
            <div style={{ fontSize: 12, color: '#4b5563' }}>AI-generated project intelligence</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate(`/workspace/${projectId}/lens`)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 100, padding: '6px 12px', color: '#34d399', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <ScanSearch size={11} /> Lens
            </button>
            <button onClick={() => navigate(`/workspace/${projectId}/flow`)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 100, padding: '6px 12px', color: '#c084fc', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <FileText size={11} /> Report
            </button>
            {uiState === 'ready' && (
              <button onClick={generate}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, padding: '6px 12px', color: '#6b7280', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                <RefreshCw size={11} /> Regenerate
              </button>
            )}
          </div>
        </div>

        {/* Update banner */}
        <AnimatePresence>
          {updateBanner && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ background: 'rgba(16,185,129,0.08)', borderBottom: '1px solid rgba(16,185,129,0.2)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={14} color="#10b981" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#34d399' }}>Project updated</span>
                <span style={{ fontSize: 13, color: '#6b7280' }}>{updateBanner}</span>
              </div>
              <button onClick={() => setUpdateBanner(null)} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer' }}><X size={14} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <AnimatePresence mode="wait">

            {/* Idle — no plan yet */}
            {uiState === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '60px 24px', textAlign: 'center', maxWidth: 440, margin: '0 auto' }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={28} color="#10b981" />
                </div>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f0f0f8', margin: '0 0 8px' }}>Your project plan is waiting</h2>
                  <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6, margin: 0 }}>
                    Terra AI will generate a complete 6-phase roadmap based on your site data, project type, and construction requirements.
                  </p>
                </div>
                {error && <div style={{ fontSize: 13, color: '#ef4444', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 16px', width: '100%' }}>{error}</div>}
                <button onClick={generate}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#10b981', color: '#fff', border: 'none', borderRadius: 100, padding: '14px 32px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(16,185,129,0.35)' }}>
                  <Sparkles size={15} /> Generate My Project Plan
                </button>
              </motion.div>
            )}

            {/* Thinking */}
            {uiState === 'thinking' && (
              <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ThinkingSequence onDone={onThinkingDone} />
              </motion.div>
            )}

            {/* Ready */}
            {uiState === 'ready' && plan && (
              <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                {/* AI intro */}
                {plan.ai_intro && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12 }}>
                    <Sparkles size={16} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Your project plan is ready</div>
                      <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{plan.ai_intro}</p>
                    </div>
                  </motion.div>
                )}

                {/* Priorities */}
                {(priorities.length > 0 || loadingPriorities) && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    style={{ background: '#111118', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Zap size={14} color="#f59e0b" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Today's priorities</span>
                    </div>
                    {loadingPriorities ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4b5563', fontSize: 13 }}><Loader2 size={13} className="spin" /> Loading…</div>
                    ) : (
                      priorities.map((p, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: i < priorities.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b' }}>{p.rank}</span>
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f8' }}>{p.task_name}</div>
                            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{p.phase} · {p.reason}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}

                {/* Phases */}
                {plan.phases?.map(phase => (
                  <PhaseCard key={phase.id || phase.number} phase={phase} projectId={projectId} analysisId={null} session={session} />
                ))}

                {/* Summary footer */}
                {plan.total_estimated_weeks && (
                  <div style={{ textAlign: 'center', padding: '20px 0 8px', color: '#4b5563', fontSize: 12 }}>
                    Total estimated timeline: <strong style={{ color: '#6b7280' }}>{plan.total_estimated_weeks} weeks</strong>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
