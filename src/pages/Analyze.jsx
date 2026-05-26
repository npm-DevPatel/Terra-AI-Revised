import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, Map, ArrowRight, ChevronRight, AlertCircle } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import Uploader from '../components/vision/Uploader';
import CinematicScanner from '../components/vision/CinematicScanner';
import PinDrop from '../components/map/PinDrop';
import ProgressiveLoader from '../components/results/ProgressiveLoader';
import RiskSummaryCard from '../components/results/RiskSummaryCard';
import Button from '../components/ui/Button';
import AuthModal from '../components/auth/AuthModal';
import useTerraStore from '../store/useTerraStore';
import { getOrderedInstances } from '../utils/analyzeUtils';
import { supabase } from '../lib/supabaseClient';

// ─── Error Toast ──────────────────────────────────────────────
function ErrorToast({ message, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium max-w-md"
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-red-400 hover:text-red-600 font-bold ml-2">✕</button>
    </motion.div>
  );
}

// ─── Mode cards ───────────────────────────────────────────────
const MODE_CARDS = [
  {
    id: 'vision',
    icon: ScanLine,
    title: 'Scan via Photo',
    subtitle: 'Vision AI Flow',
    desc: 'Upload a land photo. Our YOLO model detects vegetation, terrain, water bodies, and structures instantly.',
    gradient: 'from-emerald-500 to-emerald-600',
    lightBg: 'bg-emerald-50',
    border: 'border-emerald-200',
    textColor: 'text-emerald-700',
    linkColor: '#10b981',
  },
  {
    id: 'map',
    icon: Map,
    title: 'Deep Map Analysis',
    subtitle: 'Spatial Engine Flow',
    desc: 'Drop a pin on the satellite map. The engine queries live infrastructure, zoning, and terrain data for that exact coordinate.',
    gradient: 'from-indigo-500 to-indigo-600',
    lightBg: 'bg-indigo-50',
    border: 'border-indigo-200',
    textColor: 'text-indigo-700',
    linkColor: '#4f46e5',
  },
];

// ─── Gate message shown in AuthModal ─────────────────────────
const GATE_MESSAGE =
  'Please sign in or create a free account to run a deep-scan analysis. ' +
  'Your reports are saved and accessible from any device.';

export default function Analyze() {
  const navigate = useNavigate();
  const {
    user, session,
    visionState, mapState, engineState,
    setScanStatus, setAnnotations,
    setEngineStatus, setEngineResult, setEngineError, resetEngineState,
    setReportHistory, setApprovedLocationData,
  } = useTerraStore();

  // ─── Refresh history sidebar after a successful analysis ──
  const refreshHistory = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('id, location_name, feasibility_score, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) setReportHistory(data);
    } catch (_) {
      // non-fatal — sidebar will just not update until next login
    }
  };

  const [mode, setMode]         = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  // ─── Vision: send FormData to /api/vision/analyze ────────
  // CRITICAL: The engine expects multipart/form-data with `image` field.
  // NOT JSON. NOT base64. A real File object in FormData.
  const handleScan = async () => {
    const file = visionState.uploadedFile;
    if (!file) {
      setErrorMsg('No image file found. Please re-upload the image.');
      return;
    }

    setScanStatus('scanning');
    setErrorMsg(null);

    const MAX_RETRIES = 6;
    const RETRY_DELAYS = [8000, 12000, 15000, 15000, 20000, 20000];

    // Fire an immediate wake-up ping
    try {
      fetch('/health', { method: 'GET', signal: AbortSignal.timeout(5000) }).catch(() => {});
    } catch (_) {}

    let lastError = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt - 1]));
        fetch('/health', { method: 'GET', signal: AbortSignal.timeout(5000) }).catch(() => {});
      }

      try {
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch('/api/vision/analyze', {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(120000), // longer timeout for heavy YOLO inference
        });

        if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < MAX_RETRIES) {
          lastError = new Error(`Server starting up (${res.status}) — retrying…`);
          continue;
        }

        if (res.status === 429) {
          throw new Error('Too many requests. Please wait a moment before trying again.');
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error ?? `Vision API error ${res.status}`);
        }

        const data = await res.json();
        // Engine returns instances array — getOrderedInstances sorts by confidence
        const orderedInstances = getOrderedInstances(data);
        setAnnotations(orderedInstances, data);
        return; // Success! Exit function.

      } catch (err) {
        lastError = err;
        const isRetryable = err instanceof TypeError || err.name === 'TimeoutError' || err.name === 'AbortError';
        if (!isRetryable || attempt >= MAX_RETRIES) {
          break;
        }
      }
    }

    // If we exhausted retries or hit a non-retryable error
    setScanStatus('idle');
    setErrorMsg(lastError?.message ?? 'Vision analysis failed. The server may still be waking up — please try again.');
  };

  // ─── Map: trigger spatial engine (with auth gate) ─────────
  const handleSpatialAnalyze = async () => {
    // ── AUTH GATE ─────────────────────────────────────────────
    // If the user is not logged in, intercept here.
    // Do NOT hit the backend. Show the AuthModal instead.
    if (!user) {
      setAuthOpen(true);
      return;
    }

    const { lat, lng } = mapState.pinnedCoordinates;
    if (!lat || !lng) {
      setErrorMsg('Please drop a pin on the map first.');
      return;
    }

    setEngineStatus('loading', 'Connecting to analysis engine…');
    setErrorMsg(null);

    const MAX_RETRIES = 6;
    const RETRY_DELAYS = [8000, 12000, 15000, 15000, 20000, 20000];
    const RETRY_MESSAGES = [
      'Server waking up from sleep — this takes 20-45s on first load…',
      'Still warming up — hang tight…',
      'Initializing AI models — almost there…',
      'Loading geospatial engine…',
      'Final boot sequence — nearly ready…',
      'Last attempt — running your analysis now…',
    ];

    const headers = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const body = JSON.stringify({
      lat,
      lng,
      clientContext: mapState.approvedLocationData ?? null,
      visionContext: visionState.rawVisionPayload ?? null,
    });

    // Fire an immediate wake-up ping before the main request
    try {
      fetch('/health', { method: 'GET', signal: AbortSignal.timeout(5000) }).catch(() => {});
    } catch (_) {}

    let lastError = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        setEngineStatus('loading', RETRY_MESSAGES[attempt - 1]);
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt - 1]));
        fetch('/health', { method: 'GET', signal: AbortSignal.timeout(5000) }).catch(() => {});
      }

      try {
        const res = await fetch('/api/spatial/scan', {
          method: 'POST',
          headers,
          body,
          signal: AbortSignal.timeout(120000),
        });

        if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < MAX_RETRIES) {
          lastError = new Error(`Server starting up (${res.status}) — retrying…`);
          continue;
        }

        if (res.status === 401) {
          setEngineError('Session expired. Please sign in again.');
          setErrorMsg('Session expired. Please sign in again.');
          setAuthOpen(true);
          return;
        }

        if (res.status === 429) {
          const msg = 'Too many analyses in the past hour. Please wait a few minutes.';
          setEngineError(msg);
          setErrorMsg(msg);
          return;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error ?? `Spatial API error ${res.status}`);
        }

        const data = await res.json();
        const payload    = data.payload ?? data;
        const report     = data.report ?? null;
        const reportSrc  = data.report_source ?? 'gemini';
        const modelUsed  = data.model_used ?? null;

        setEngineResult(payload, report, reportSrc, modelUsed);

        // Sync location data from backend into mapState so the
        // LocationSearch input and the report header both show the
        // same authoritative place name (backend reverse-geocode wins).
        if (payload) {
          const backendPlace = payload.place_name || payload.ward || payload.neighborhood || null;
          if (backendPlace) {
            setApprovedLocationData({
              address:   [payload.ward, payload.subcounty, payload.county].filter(Boolean).join(', '),
              placeName: backendPlace,
              country:   'Kenya',
              latitude:  mapState.pinnedCoordinates.lat,
              longitude: mapState.pinnedCoordinates.lng,
            });
          }
        }

        if (user?.id) {
          refreshHistory(user.id);
        }
        return;

      } catch (err) {
        lastError = err;
        const isRetryable = err instanceof TypeError || err.name === 'TimeoutError' || err.name === 'AbortError';
        if (!isRetryable || attempt >= MAX_RETRIES) {
          break;
        }
        fetch('/health', { method: 'GET', signal: AbortSignal.timeout(5000) }).catch(() => {});
      }
    }

    const msg = lastError?.message ?? 'Analysis failed. The server may still be waking up — please try again in 30 seconds.';
    setEngineError(msg);
    setErrorMsg(msg);
  };

  const pinSet    = !!mapState.pinnedCoordinates.lat;
  const scanDone  = visionState.scanStatus === 'complete';
  const engineDone = engineState.status === 'done';

  return (
    <MainLayout>
      <ProgressiveLoader />

      {/* Auth modal — gated for analyze click */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        message={GATE_MESSAGE}
      />

      <AnimatePresence>
        {errorMsg && (
          <ErrorToast message={errorMsg} onClose={() => setErrorMsg(null)} />
        )}
      </AnimatePresence>

      {/* ── Map Flow — padded to avoid border-to-border ── */}
      {mode === 'map' && (
        <motion.div
          key="map-flow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col h-full max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 gap-3 sm:gap-4"
        >
          {/* Compact header bar */}
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3 flex-shrink-0 bg-white rounded-xl shadow-sm border border-terra-border">
            <button
              onClick={() => { setMode(null); resetEngineState(); }}
              className="text-terra-muted hover:text-terra-heading text-sm font-medium transition-colors flex-shrink-0"
            >
              ← Back
            </button>
            <h2 className="text-lg sm:text-xl font-black text-terra-heading truncate">Spatial Risk Engine</h2>
          </div>

          {/* Map — grows to fill all available space */}
          <div className="relative flex-1 min-h-0 rounded-2xl overflow-hidden shadow-sm border border-terra-border bg-slate-50">
            <PinDrop />
            {engineDone && <RiskSummaryCard />}
          </div>

          {/* Button strip — always anchored at the bottom, never requires scrolling */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-4 bg-white rounded-xl shadow-sm border border-terra-border flex flex-col items-center gap-1.5">
            {!engineDone && (
              <>
                <Button
                  id="analyze-run-btn"
                  variant="primary"
                  size="lg"
                  icon={Map}
                  loading={engineState.status === 'loading'}
                  disabled={!pinSet || engineState.status === 'loading'}
                  onClick={handleSpatialAnalyze}
                >
                  {pinSet ? 'Run Spatial Analysis' : 'Drop a Pin First'}
                </Button>
                {!user && pinSet && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-terra-muted"
                  >
                    You'll be asked to sign in before the analysis runs.
                  </motion.p>
                )}
              </>
            )}
            {engineDone && (
              <Button variant="secondary" size="md" onClick={() => navigate('/report')}>
                View Full Report →
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Non-map flows — padded scrollable container ── */}
      {mode !== 'map' && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <AnimatePresence mode="wait">

            {/* ── Mode Selection ── */}
            {!mode && (
              <motion.div key="mode-select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-10 text-center">
                  <h2 className="text-3xl font-black text-terra-heading mb-3">Choose your analysis method</h2>
                  <p className="text-terra-body">Both pathways converge to the same risk report — pick what you have.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
                  {MODE_CARDS.map(({ id, icon: Icon, title, subtitle, desc, gradient, lightBg, border, textColor, linkColor }) => (
                    <motion.button
                      key={id}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setMode(id)}
                      className={`text-left bg-white/70 backdrop-blur-md border ${border} rounded-3xl p-5 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer w-full`}
                    >
                      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg mb-6`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className={`inline-block text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-full ${lightBg} ${textColor} mb-3`}>
                        {subtitle}
                      </div>
                      <h3 className="text-xl font-black text-terra-heading mb-3">{title}</h3>
                      <p className="text-sm text-terra-body leading-relaxed mb-6">{desc}</p>
                      <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: linkColor }}>
                        Get Started <ChevronRight className="w-4 h-4" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Vision Flow ── */}
            {mode === 'vision' && (
              <motion.div key="vision-flow" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-4 mb-8">
                  <button
                    onClick={() => setMode(null)}
                    className="text-terra-muted hover:text-terra-heading text-sm font-medium transition-colors"
                  >
                    ← Back
                  </button>
                  <h2 className="text-2xl font-black text-terra-heading">Vision AI Scanner</h2>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Left: Uploader + CTA */}
                  <div className="space-y-4">
                    <Uploader />
                    {visionState.uploadedFile && visionState.scanStatus === 'idle' && (
                      <Button fullWidth variant="primary" size="lg" icon={ScanLine} onClick={handleScan}>
                        Start YOLO Scan
                      </Button>
                    )}
                    {visionState.scanStatus === 'scanning' && (
                      <Button fullWidth variant="secondary" size="lg" loading disabled>
                        Scanning…
                      </Button>
                    )}
                  </div>

                  {/* Right: CinematicScanner + upsell */}
                  <div className="space-y-4">
                    <CinematicScanner />

                    {/* Upsell banner after scan completes */}
                    {scanDone && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="text-indigo-800 font-semibold text-sm">
                            Want deeper legal and zoning analysis for this plot?
                          </p>
                          <p className="text-indigo-600 text-xs mt-0.5">
                            Drop a pin to run the full spatial engine with this vision context.
                          </p>
                        </div>
                        <Button variant="indigo" size="sm" iconRight={ArrowRight} onClick={() => setMode('map')}>
                          Drop a Pin
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      )}

    </MainLayout>
  );
}
