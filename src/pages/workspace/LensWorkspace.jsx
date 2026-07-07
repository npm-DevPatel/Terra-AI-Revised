import { useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, Upload, ScanSearch, X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import useTerraStore from '../../store/useTerraStore';
import '../../styles/workspace.css';

const SEVERITY_ICON = {
  FATAL:    <AlertTriangle size={14} color="#ef4444" />,
  CAUTION:  <AlertTriangle size={14} color="#f59e0b" />,
  ADVISORY: <Info size={14} color="#60a5fa" />,
};

function ScoreRing({ score }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 80 ? '#34d399' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease-out' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 32, fontWeight: 900, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Score</div>
      </div>
    </div>
  );
}

export default function LensWorkspace() {
  const { projectId } = useParams();
  const { session } = useTerraStore();

  const [phase, setPhase] = useState('upload'); // upload | analyzing | result
  const [image, setImage] = useState(null);      // { url, base64 }
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [title, setTitle] = useState('');
  const [result, setResult] = useState(null);
  const [geminiReport, setGeminiReport] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Subscribe to Supabase Realtime for Gemini narrative
  const subscribeToGemini = useCallback((analysisId) => {
    const sub = supabase
      .channel(`analysis:${analysisId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'analyses',
        filter: `id=eq.${analysisId}`,
      }, (payload) => {
        if (payload.new.gemini_done && payload.new.raw_result?.gemini_report) {
          setGeminiReport(payload.new.raw_result.gemini_report);
          supabase.removeChannel(sub);
        }
      })
      .subscribe();
  }, []);

  const processFile = (file) => {
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const base64 = dataUrl.split(',')[1];
      setImage({ url: dataUrl, base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const analyze = async () => {
    if (!image) return;
    setPhase('analyzing');
    setError('');

    try {
      const res = await fetch('/api/lens/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          photo_base64: image.base64,
          lat: lat ? parseFloat(lat) : undefined,
          lng: lng ? parseFloat(lng) : undefined,
          project_id: projectId,
          title: title || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed.');

      setResult(data);
      setPhase('result');
      subscribeToGemini(data.analysis_id);
    } catch (err) {
      setError(err.message);
      setPhase('upload');
    }
  };

  const reset = () => {
    setPhase('upload');
    setImage(null);
    setResult(null);
    setGeminiReport(null);
    setError('');
    setLat(''); setLng(''); setTitle('');
  };

  const scoreColor = result
    ? result.score >= 80 ? '#34d399' : result.score >= 50 ? '#f59e0b' : '#ef4444'
    : '#34d399';

  return (
    <div className="lens-screen">
      <AnimatePresence mode="wait">
        {/* ── Upload phase ─────────────────────────────────────────────── */}
        {phase === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Terra Lens
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 0' }}>
                Photograph a site. Terra AI reads the land.
              </p>
            </div>

            {/* Drop zone */}
            <div
              className={`lens-upload-zone ${dragOver ? 'drag-over' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {image ? (
                <>
                  <img src={image.url} className="preview" alt="Site" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setImage(null); }}
                    style={{
                      position: 'absolute', top: 12, right: 12, zIndex: 2,
                      background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                      width: 28, height: 28, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', cursor: 'pointer', color: '#fff',
                    }}
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <div className="lens-upload-icon">
                    <Upload size={22} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', margin: 0 }}>
                    Drop a site photo or click to upload
                  </p>
                  <p style={{ fontSize: 12, color: '#374151', margin: 0 }}>
                    JPG, PNG, HEIC — any angle of the land
                  </p>
                </>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => processFile(e.target.files?.[0])} />

            {/* Camera button */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)',
                borderRadius: 10, padding: '11px', color: '#34d399',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Camera size={16} /> Take a photo
            </button>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => processFile(e.target.files?.[0])} />

            {/* Optional coordinates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input
                className="sim-input"
                placeholder="Latitude (optional)"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
              <input
                className="sim-input"
                placeholder="Longitude (optional)"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </div>
            <input
              className="sim-input"
              placeholder="Give this analysis a name — e.g. Ruiru plot 3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            {error && (
              <div style={{ fontSize: 13, color: '#ef4444', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                {error}
              </div>
            )}

            <button
              className="btn-primary"
              onClick={analyze}
              disabled={!image}
              style={{ fontSize: 14, padding: '13px', borderRadius: 12 }}
            >
              Analyse Site
            </button>
          </motion.div>
        )}

        {/* ── Analyzing phase ──────────────────────────────────────────── */}
        {phase === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: 60 }}
          >
            <div className="terra-spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f8', marginBottom: 6 }}>
                Analysing your site
              </div>
              <div style={{ fontSize: 13, color: '#4b5563' }}>
                Vision scan → Soil → Hydrology → Legal zones…
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Result phase ─────────────────────────────────────────────── */}
        {phase === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* Score card */}
            <div className="lens-score-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
                <ScoreRing score={result.score} />
                <div>
                  <div className={`lens-score-label ${result.score >= 80 ? 'safe' : result.score >= 50 ? 'moderate' : 'critical'}`}>
                    {result.label}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f8', marginTop: 6 }}>
                    {result.address || title || 'Site Analysis'}
                  </div>
                  {result.geospatial_available && (
                    <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>
                      Geospatial data included
                    </div>
                  )}
                </div>
              </div>

              {/* Vision detections */}
              {result.vision?.labels?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {result.vision.labels.map((l) => (
                    <span key={l} style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100,
                      background: '#f1f5f9', color: '#64748b',
                    }}>{l}</span>
                  ))}
                  {result.vision.water_signals && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>Water signals</span>
                  )}
                  {result.vision.construction_detected && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>Construction activity</span>
                  )}
                </div>
              )}

              {/* Risk flags */}
              {result.key_risks?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.key_risks.map((r, i) => (
                    <div key={i} className="risk-flag caution">
                      <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 13, color: '#d1d5db' }}>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.key_risks?.length === 0 && (
                <div className="risk-flag" style={{ borderColor: 'rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.05)' }}>
                  <CheckCircle size={14} color="#34d399" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: '#d1d5db' }}>No major geospatial risk flags detected.</span>
                </div>
              )}
            </div>

            {/* Gemini narrative */}
            <AnimatePresence>
              {!geminiReport && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#fff', border: '1px solid #f1f5f9',
                    borderRadius: 12, padding: '14px 16px',
                  }}
                >
                  <div className="terra-spinner" style={{ width: 18, height: 18, borderWidth: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#4b5563' }}>Terra AI is writing your full narrative report…</span>
                </motion.div>
              )}
              {geminiReport && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: '#f8fafc', border: '1px solid #f1f5f9',
                    borderRadius: 16, padding: '20px 22px',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#34d399', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                    Full Report
                  </div>
                  {geminiReport.executive_summary && (
                    <p style={{ fontSize: 14, color: '#d1d5db', lineHeight: 1.7, marginBottom: 16 }}>
                      {geminiReport.executive_summary}
                    </p>
                  )}
                  {(geminiReport.sections || []).map((s) => (
                    <div key={s.id} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e8f0', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {s.title}
                        <span style={{
                          fontSize: 10, padding: '2px 7px', borderRadius: 100, fontWeight: 700,
                          background: s.risk_level === 'critical' ? 'rgba(239,68,68,0.10)' : s.risk_level === 'high' ? 'rgba(245,158,11,0.10)' : '#f8fafc',
                          color: s.risk_level === 'critical' ? '#ef4444' : s.risk_level === 'high' ? '#f59e0b' : '#6b7280',
                        }}>{s.risk_level}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.65, margin: 0 }}>{s.body}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" onClick={reset} style={{ flex: 1 }}>
                New Analysis
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={() => {/* navigate to flow */}}
              >
                Generate Report →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
