/**
 * LensWorkspace.jsx — Terra Lens
 *
 * Phases: upload → analyzing → result
 * Features:
 *   • Fullscreen annotated viewer (Vision API bboxes, no YOLO)
 *   • Terra Tap: glassy cursor, click → ask AI about that spot
 *   • Right-side Terra Copilot chat panel
 *   • Navigate to Planner and Report from toolbar
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Camera, Upload, X, AlertTriangle, CheckCircle,
  Maximize2, Minimize2, Crosshair, MessageSquare,
  LayoutDashboard, FileText, Sparkles, Send, Loader2, MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import useTerraStore from '../../store/useTerraStore';
import '../../styles/workspace.css';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

/* ── Google Places Autocomplete input ─────────────────────────── */
function PlacesInput({ onPlaceSelected }) {
  const inputRef = useRef(null);
  const [value, setValue] = useState('');
  const [ready, setReady] = useState(false);
  const acRef = useRef(null);

  // Load the Places library once
  useEffect(() => {
    if (!MAPS_KEY) return;
    const loadPlaces = () => {
      if (!window.google?.maps?.places) return;
      acRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['geocode'],
        componentRestrictions: { country: 'ke' }, // Kenya-first (user can override)
        fields: ['formatted_address', 'geometry', 'name', 'address_components'],
      });
      acRef.current.addListener('place_changed', () => {
        const place = acRef.current.getPlace();
        if (!place.geometry?.location) return;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const label = place.formatted_address || place.name || '';
        setValue(label);
        onPlaceSelected({ lat, lng, label });
      });
      setReady(true);
    };

    if (window.google?.maps?.places) {
      loadPlaces();
    } else {
      const scriptId = 'google-maps-places';
      if (!document.getElementById(scriptId)) {
        const s = document.createElement('script');
        s.id = scriptId;
        s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places&loading=async`;
        s.async = true;
        s.onload = loadPlaces;
        document.head.appendChild(s);
      } else {
        // Script already loading — poll until ready
        const iv = setInterval(() => {
          if (window.google?.maps?.places) { clearInterval(iv); loadPlaces(); }
        }, 200);
        return () => clearInterval(iv);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = e => {
    setValue(e.target.value);
    // If user clears the field, reset coords
    if (!e.target.value) onPlaceSelected(null);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }}>
        <MapPin size={14} color="#94a3b8" />
      </div>
      <input
        ref={inputRef}
        className="sim-input"
        placeholder="Search location — e.g. Mutitu, Kilgoris, Narok County"
        value={value}
        onChange={handleChange}
        style={{ paddingLeft: 34 }}
      />
    </div>
  );
}

const OBJ_COLORS = {
  tree:'#34d399', grass:'#4ade80', vegetation:'#86efac', water:'#60a5fa',
  river:'#3b82f6', flood:'#1d4ed8', building:'#f59e0b', house:'#f97316',
  road:'#94a3b8', vehicle:'#a78bfa', soil:'#d97706', rock:'#78716c',
};
function objColor(name) {
  for (const [k,v] of Object.entries(OBJ_COLORS)) { if (name.includes(k)) return v; }
  return '#c084fc';
}

function ScoreRing({ score }) {
  const r = 54, circ = 2 * Math.PI * r, fill = (score / 100) * circ;
  const color = score >= 80 ? '#34d399' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease-out' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 900, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Score</div>
      </div>
    </div>
  );
}

function TapModal({ pos, onAsk, onClose, loading, answer }) {
  const [q, setQ] = useState('');
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      style={{
        position: 'fixed', left: Math.min(pos.sx + 20, window.innerWidth - 320),
        top: Math.max(pos.sy - 40, 8), width: 300,
        background: 'rgba(10,10,20,0.93)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(16,185,129,0.3)', borderRadius: 16, padding: 16, zIndex: 60,
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>Terra Tap</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><X size={14} /></button>
      </div>
      {answer ? (
        <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6, margin: 0 }}>{answer}</p>
      ) : loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: 13 }}>
          <Loader2 size={14} className="spin" /> Terra is reading this spot…
        </div>
      ) : (
        <>
          <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>Ask about this point on the site</p>
          <textarea value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); q.trim() && onAsk(q); } }}
            placeholder="What is the soil here? Is this a drainage area?" rows={2} autoFocus
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '8px 10px', color: '#e2e8f0', fontSize: 13,
              fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
          <button onClick={() => q.trim() && onAsk(q)} disabled={!q.trim()}
            style={{ marginTop: 8, width: '100%', background: q.trim() ? '#10b981' : '#374151',
              border: 'none', borderRadius: 8, padding: 8, color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: q.trim() ? 'pointer' : 'default', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Sparkles size={13} /> Ask Terra
          </button>
        </>
      )}
    </motion.div>
  );
}

function AnnotatedViewer({ image, result, geminiReport, projectName, projectId, analysisId, onClose }) {
  const navigate = useNavigate();
  const { session } = useTerraStore();
  const imgRef = useRef(null);
  const [imgDims, setImgDims] = useState(null);
  const [tapMode, setTapMode] = useState(false);
  const [tapPos, setTapPos] = useState(null);
  const [tapLoading, setTapLoading] = useState(false);
  const [tapAnswer, setTapAnswer] = useState('');
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMsgs, setChatMsgs] = useState([{ role: 'ai', text: 'Hi! Ask me anything about this site. I have the full analysis context.' }]);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMsgs, chatLoading]);

  const objects = result?.vision?.objects || [];
  const score = result?.score || 0;
  const scoreColor = score >= 80 ? '#34d399' : score >= 50 ? '#f59e0b' : '#ef4444';
  const createdAt = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleImgLoad = () => {
    if (!imgRef.current) return;
    const { width, height } = imgRef.current;
    setImgDims({ width, height });
  };

  const handleImgClick = e => {
    if (!tapMode) return;
    const rect = imgRef.current.getBoundingClientRect();
    setTapPos({ sx: e.clientX, sy: e.clientY, xPct: (e.clientX - rect.left) / rect.width, yPct: (e.clientY - rect.top) / rect.height });
    setTapAnswer('');
  };

  const handleTapAsk = async q => {
    setTapLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/lens/tap`, { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ project_id: projectId, analysis_id: analysisId, tap_x_pct: tapPos.xPct, tap_y_pct: tapPos.yPct, question: q }) });
      const data = await res.json();
      setTapAnswer(data.answer || 'No answer available.');
    } catch { setTapAnswer('Terra Tap is temporarily unavailable.'); }
    setTapLoading(false);
  };

  const handleCopilotSend = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput('');
    setChatMsgs(p => [...p, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/copilot/chat`, { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ message: msg, resolved_refs: [{ type: 'project', id: projectId }] }) });
      const data = await res.json();
      setChatMsgs(p => [...p, { role: 'ai', text: data.answer || 'No response.' }]);
    } catch { setChatMsgs(p => [...p, { role: 'ai', text: 'Copilot temporarily unavailable.' }]); }
    setChatLoading(false);
  };

  const toolbarBtns = [
    { label: tapMode ? 'Tap ON' : 'Terra Tap', icon: Crosshair, onClick: () => { setTapMode(m => !m); setTapPos(null); }, active: tapMode, color: '#34d399' },
    null,
    { label: 'Copilot', icon: MessageSquare, onClick: () => setCopilotOpen(o => !o), active: copilotOpen, color: '#c084fc' },
    null,
    { label: 'Planner', icon: LayoutDashboard, onClick: () => navigate(`/workspace/${projectId}/planner`), active: false, color: '#60a5fa' },
    { label: 'Report', icon: FileText, onClick: () => navigate(`/workspace/${projectId}/flow`), active: false, color: '#c084fc' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0f', zIndex: 50, display: 'flex', fontFamily: "'Gabarito','Inter',system-ui" }}>
      {/* Image area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: tapMode ? 'crosshair' : 'default' }}>
        {/* Info cards */}
        <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, zIndex: 10, flexWrap: 'wrap' }}>
          {[['Project', projectName], ['Date', createdAt]].map(([k, v]) => (
            <div key={k} style={{ background: '#fff', borderRadius: 10, padding: '7px 13px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{v}</div>
            </div>
          ))}
          <div style={{ background: scoreColor + '18', border: `1px solid ${scoreColor}40`, borderRadius: 10, padding: '7px 13px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: scoreColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: scoreColor }}>{score}/100 — {result?.label}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, zIndex: 20, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
          <Minimize2 size={16} />
        </button>
        <img ref={imgRef} src={image.url} alt="Site" onLoad={handleImgLoad} onClick={handleImgClick}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
        {imgDims && objects.length > 0 && (
          <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width="100%" height="100%"
            viewBox={`0 0 ${imgDims.width} ${imgDims.height}`} preserveAspectRatio="xMidYMid meet">
            {objects.map((obj, i) => {
              if (!obj.bbox || obj.bbox.length < 4) return null;
              const pts = obj.bbox.map(v => `${v.x * imgDims.width},${v.y * imgDims.height}`).join(' ');
              const col = objColor(obj.name);
              const lx = obj.bbox[0].x * imgDims.width, ly = obj.bbox[0].y * imgDims.height;
              const lbl = `${obj.name} ${Math.round(obj.confidence * 100)}%`;
              return (
                <g key={i}>
                  <polygon points={pts} fill={col + '22'} stroke={col} strokeWidth="2" strokeDasharray="4 2" />
                  <rect x={lx} y={Math.max(ly - 20, 0)} width={lbl.length * 7 + 12} height={18} rx={4} fill={col + 'cc'} />
                  <text x={lx + 6} y={Math.max(ly - 6, 12)} fontSize="11" fontWeight="700" fill="#fff" fontFamily="system-ui">{lbl}</text>
                </g>
              );
            })}
          </svg>
        )}
        {tapMode && tapPos && (
          <div style={{ position: 'fixed', left: tapPos.sx - 20, top: tapPos.sy - 20, width: 40, height: 40,
            borderRadius: '50%', border: '2px solid #10b981', background: 'rgba(16,185,129,0.15)',
            backdropFilter: 'blur(4px)', pointerEvents: 'none', zIndex: 55,
            boxShadow: '0 0 20px rgba(16,185,129,0.4)' }} />
        )}
        <AnimatePresence>
          {tapPos && <TapModal pos={tapPos} loading={tapLoading} answer={tapAnswer} onAsk={handleTapAsk}
            onClose={() => { setTapPos(null); setTapAnswer(''); }} />}
        </AnimatePresence>
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 8, background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, padding: '8px 16px', zIndex: 10 }}>
          {toolbarBtns.map((btn, i) => btn === null ? (
            <div key={i} style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
          ) : (
            <button key={i} onClick={btn.onClick}
              style={{ display: 'flex', alignItems: 'center', gap: 6,
                background: btn.active ? btn.color + '20' : 'transparent',
                border: btn.active ? `1px solid ${btn.color}50` : '1px solid transparent',
                borderRadius: 100, padding: '6px 14px', color: btn.active ? btn.color : '#9ca3af',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              <btn.icon size={13} />{btn.label}
            </button>
          ))}
        </div>
      </div>
      {/* Copilot panel */}
      <AnimatePresence>
        {copilotOpen && (
          <motion.div key="copilot" initial={{ width: 0, opacity: 0 }} animate={{ width: 340, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            style={{ background: '#111118', borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={13} color="#c084fc" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f8' }}>Terra Copilot</div>
                    <div style={{ fontSize: 11, color: '#4b5563' }}>Site-aware AI assistant</div>
                  </div>
                </div>
                <button onClick={() => setCopilotOpen(false)} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer' }}><X size={15} /></button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {chatMsgs.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '85%', padding: '9px 12px', borderRadius: 12,
                    background: m.role === 'user' ? '#10b981' : 'rgba(255,255,255,0.06)',
                    color: m.role === 'user' ? '#fff' : '#d1d5db', fontSize: 13, lineHeight: 1.5,
                    borderBottomRightRadius: m.role === 'user' ? 4 : 12,
                    borderBottomLeftRadius: m.role === 'ai' ? 4 : 12 }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', gap: 4, padding: '4px 2px' }}>
                  {[0,1,2].map(i => (
                    <motion.div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#4b5563' }}
                      animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCopilotSend()}
                  placeholder="Ask about this site…"
                  style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                <button onClick={handleCopilotSend} disabled={!chatInput.trim() || chatLoading}
                  style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: chatInput.trim() ? '#10b981' : '#1f2937', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: chatInput.trim() ? 'pointer' : 'default' }}>
                  <Send size={14} color={chatInput.trim() ? '#fff' : '#374151'} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   LensWorkspace — main component
══════════════════════════════════════════════════════════════════ */
export default function LensWorkspace() {
  const { projectId } = useParams();
  const { session } = useTerraStore();

  const [phase, setPhase] = useState('upload');
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);  // { lat, lng, label } — set by PlacesInput
  const [title, setTitle] = useState('');
  const [result, setResult] = useState(null);
  const [geminiReport, setGeminiReport] = useState(null);
  const [analysisId, setAnalysisId] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    supabase.from('projects').select('name').eq('id', projectId).single()
      .then(({ data }) => { if (data) setProjectName(data.name); });
  }, [projectId]);

  const subscribeToGemini = useCallback((aid) => {
    const sub = supabase.channel(`analysis:${aid}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'analyses', filter: `id=eq.${aid}` },
        payload => {
          if (payload.new.gemini_done && payload.new.raw_result?.gemini_report) {
            setGeminiReport(payload.new.raw_result.gemini_report);
            supabase.removeChannel(sub);
          }
        }).subscribe();
  }, []);

  const processFile = file => {
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      setImage({ url: dataUrl, base64: dataUrl.split(',')[1] });
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!image) return;
    setPhase('analyzing'); setError('');
    try {
      const res = await fetch(`${API_BASE}/api/lens/analyze`, { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          photo_base64: image.base64,
          lat: location?.lat,
          lng: location?.lng,
          project_id: projectId,
          // Use the place name as title if the user hasn't typed one
          title: title || location?.label || undefined,
        }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed.');
      data.vision.objects = data.vision_objects_full || data.vision?.objects || [];
      setResult(data); setAnalysisId(data.analysis_id);
      setPhase('result'); subscribeToGemini(data.analysis_id);
    } catch (err) { setError(err.message); setPhase('upload'); }
  };

  const reset = () => {
    setPhase('upload'); setImage(null); setResult(null); setGeminiReport(null);
    setError(''); setLocation(null); setTitle(''); setAnalysisId(null); setFullscreen(false);
  };

  if (fullscreen && image && result) {
    return <AnnotatedViewer image={image} result={result} geminiReport={geminiReport}
      projectName={projectName} projectId={projectId} analysisId={analysisId}
      onClose={() => setFullscreen(false)} />;
  }

  return (
    <div className="lens-screen">
      <AnimatePresence mode="wait">
        {phase === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Terra Lens</h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 0' }}>Photograph a site. Terra AI reads the land.</p>
            </div>
            <div className={`lens-upload-zone ${dragOver ? 'drag-over' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files?.[0]); }}>
              {image ? (
                <>
                  <img src={image.url} className="preview" alt="Site" />
                  <button onClick={e => { e.stopPropagation(); setImage(null); }}
                    style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <div className="lens-upload-icon"><Upload size={22} /></div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', margin: 0 }}>Drop a site photo or click to upload</p>
                  <p style={{ fontSize: 12, color: '#374151', margin: 0 }}>JPG, PNG, HEIC — any angle of the land</p>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => processFile(e.target.files?.[0])} />
            <button onClick={() => cameraInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, padding: 11, color: '#34d399', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Camera size={16} /> Take a photo
            </button>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => processFile(e.target.files?.[0])} />
            {/* Location search — replaces lat/lng fields */}
            <PlacesInput onPlaceSelected={setLocation} />
            {location && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#10b981', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '7px 12px' }}>
                <MapPin size={12} />
                <span>{location.label}</span>
                <span style={{ color: '#4b5563', marginLeft: 'auto' }}>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
              </motion.div>
            )}
            <input className="sim-input" placeholder="Name this analysis — e.g. Ruiru plot 3 (optional)" value={title} onChange={e => setTitle(e.target.value)} />
            {error && <div style={{ fontSize: 13, color: '#ef4444', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px' }}>{error}</div>}
            <button className="btn-primary" onClick={analyze} disabled={!image} style={{ fontSize: 14, padding: 13, borderRadius: 12 }}>Analyse Site</button>
          </motion.div>
        )}
        {phase === 'analyzing' && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: 60 }}>
            <div className="terra-spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f8', marginBottom: 6 }}>Analysing your site</div>
              <div style={{ fontSize: 13, color: '#4b5563' }}>Vision scan → Soil → Hydrology → Legal zones…</div>
            </div>
          </motion.div>
        )}
        {phase === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ width: '100%', maxWidth: 620, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {image && (
              <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', cursor: 'pointer' }}
                onClick={() => setFullscreen(true)}>
                <img src={image.url} alt="Site" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '5px 11px', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 12, fontWeight: 600 }}>
                  <Maximize2 size={12} /> Open annotated view + Terra Tap
                </div>
                {result.vision?.labels?.length > 0 && (
                  <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {result.vision.labels.slice(0, 4).map(l => (
                      <span key={l} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#e2e8f0' }}>{l}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="lens-score-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
                <ScoreRing score={result.score} />
                <div>
                  <div className={`lens-score-label ${result.score >= 80 ? 'safe' : result.score >= 50 ? 'moderate' : 'critical'}`}>{result.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f8', marginTop: 6 }}>{result.address || title || 'Site Analysis'}</div>
                  {result.geospatial_available && <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>Geospatial data included</div>}
                </div>
              </div>
              {result.vision?.labels?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {result.vision.labels.map(l => <span key={l} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: '#f1f5f9', color: '#64748b' }}>{l}</span>)}
                  {result.vision.water_signals && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>Water signals</span>}
                  {result.vision.construction_detected && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>Construction activity</span>}
                </div>
              )}
              {result.key_risks?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.key_risks.map((r, i) => <div key={i} className="risk-flag caution"><AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} /><span style={{ fontSize: 13, color: '#d1d5db' }}>{r}</span></div>)}
                </div>
              ) : (
                <div className="risk-flag" style={{ borderColor: 'rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.05)' }}>
                  <CheckCircle size={14} color="#34d399" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: '#d1d5db' }}>No major geospatial risk flags detected.</span>
                </div>
              )}
            </div>
            <AnimatePresence>
              {!geminiReport && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #f1f5f9', borderRadius: 12, padding: '14px 16px' }}>
                  <div className="terra-spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: '#8b5cf6', borderColor: 'rgba(139,92,246,0.15)' }} />
                  <span style={{ fontSize: 13, color: '#64748b' }}>AI narrative generating… arrives via Supabase Realtime</span>
                </motion.div>
              )}
              {geminiReport && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 14, padding: '20px 22px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>AI Analysis</div>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0 }}>{geminiReport.executive_summary}</p>
                  {geminiReport.visual_site_summary && (
                    <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                      <strong style={{ color: '#374151' }}>Visual: </strong>{geminiReport.visual_site_summary}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setFullscreen(true)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '10px 14px', color: '#34d399', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Maximize2 size={13} /> Annotated View
              </button>
              <button onClick={reset}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                New Analysis
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
