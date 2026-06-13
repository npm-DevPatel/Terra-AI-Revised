import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, Map, ArrowRight, ChevronRight, AlertCircle, X, Camera, Sparkles } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import Uploader from '../components/vision/Uploader';
import CinematicScanner from '../components/vision/CinematicScanner';
import PinDrop from '../components/map/PinDrop';
import ProgressiveLoader from '../components/results/ProgressiveLoader';
import RiskSummaryCard from '../components/results/RiskSummaryCard';
import Button from '../components/ui/Button';
import useTerraStore from '../store/useTerraStore';
import { getOrderedInstances } from '../utils/analyzeUtils';
import { supabase } from '../lib/supabaseClient';

import scanPhotoImg from '../assets/analysis_page/scan_photo.jpeg';
import deepScanImg from '../assets/analysis_page/deep_scan.jpeg';

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
// Single combined entry to avoid stretching the preview imagery.
const MODE_CARDS = [
  {
    id: 'map',
    icon: Map,
    title: 'Deep Map and Photo Analysis',
    subtitle: 'Vision + Spatial Engine',
    imageSrc: deepScanImg,
    imageAlt: 'Deep map and photo analysis preview',
    desc: 'Drop a pin, upload a current land photo, and get one unified risk report.',
    features: [
      'YOLO photo scan: vegetation, terrain, water bodies, structures',
      'Deep map scan: zoning, nearby infrastructure, terrain context',
      'One combined feasibility + risk summary report',
    ],
    gradient: 'from-indigo-500 to-indigo-600',
    lightBg: 'bg-indigo-50',
    border: 'border-indigo-200',
    textColor: 'text-indigo-700',
    linkColor: '#4f46e5',
    cardClassName: 'max-w-xl',
  },
];

// ─── Gate message shown in AuthModal ─────────────────────────
const GATE_MESSAGE =
  'Please sign in or create a free account to run a deep-scan analysis. ' +
  'Your reports are saved and accessible from any device.';

const TERRA_SCAN_WORDS = [
  'I', 'am', 'Terra', 'AI', 'and', 'I', 'analyze', 'your', 'piece', 'of',
  'land', 'by', 'scanning', 'for', 'roads,', 'nearby', 'vegetation,', 'terrain',
  'gradient,', 'water', 'patterns,', 'structures,', 'and', 'the', 'quiet',
  'spatial', 'signals', 'that', 'shape', 'what', 'can', 'be', 'built', 'there.',
];

function TypingWordLine({ words = TERRA_SCAN_WORDS }) {
  return (
    <p className="min-h-[6.5rem] text-sm sm:text-base leading-7 text-slate-300">
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="terra-typed-word is-glowing mr-1.5"
          style={{ animationDelay: `${index * 0.14}s` }}
        >
          {word}
        </span>
      ))}
    </p>
  );
}

function PhotoScanGate({
  isOpen,
  onClose,
  onAnalyze,
  onAnalyzeWithoutPhoto,
  isRunning,
  uploadedFileName,
  scanStatus,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/72 px-4 py-6 backdrop-blur-xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="terra-island-edge-glow relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-[0_30px_100px_rgba(0,0,0,0.54)]"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/75 backdrop-blur transition-colors hover:bg-white/15 hover:text-white"
              aria-label="Close photo scan"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="relative min-h-[22rem] overflow-hidden bg-slate-900">
                <img
                  src={scanPhotoImg}
                  alt="Scan via photo"
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/58 to-slate-900/20" />
                <div className="absolute inset-x-6 bottom-6">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-black/35 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-amber-100 backdrop-blur">
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    Photo context required
                  </div>
                  <h2 className="max-w-sm text-4xl font-black leading-none text-white sm:text-5xl">
                    To See What You See
                  </h2>
                </div>
              </div>

              <div className="space-y-6 p-5 sm:p-7">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <TypingWordLine />
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                  <Uploader />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-h-10 text-xs text-slate-400">
                    {uploadedFileName ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-emerald-100">
                        <Camera className="h-3.5 w-3.5" />
                        {uploadedFileName}
                      </span>
                    ) : (
                      'Upload a current land photo before Terra runs the spatial engine.'
                    )}
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <Button
                      variant="primary"
                      size="lg"
                      icon={ScanLine}
                      onClick={onAnalyze}
                      disabled={!uploadedFileName || isRunning || scanStatus === 'scanning'}
                      loading={isRunning || scanStatus === 'scanning'}
                    >
                      Scan Photo & Run Engine
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onAnalyzeWithoutPhoto}
                      disabled={isRunning || scanStatus === 'scanning'}
                    >
                      Run Engine Without Photo
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Analyze() {
  const {
    user, session,
    visionState, mapState, engineState,
    setScanStatus, setAnnotations,
    setEngineStatus, setEngineResult, setEngineError,
    setReportHistory, setApprovedLocationData,
    openAuthModal,
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
    } catch {
      // non-fatal — sidebar will just not update until next login
      void 0;
    }
  };

  const [mode, setMode]         = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [photoGateOpen, setPhotoGateOpen] = useState(false);
  const [preparingEngine, setPreparingEngine] = useState(false);

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
    } catch {
      void 0;
    }

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
        return data; // Success! Exit function.

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
    return null;
  };

  // ─── Map: trigger spatial engine (with auth gate) ─────────
  const handleSpatialAnalyze = async ({ visionContextOverride } = {}) => {
    // ── AUTH GATE ─────────────────────────────────────────────
    // If the user is not logged in, intercept here.
    // Do NOT hit the backend. Show the AuthModal instead.
    if (!user) {
      openAuthModal({ message: GATE_MESSAGE });
      return;
    }

    const { lat, lng } = mapState.pinnedCoordinates;
    if (!lat || !lng) {
      setErrorMsg('Please drop a pin on the map first.');
      return;
    }

    setEngineStatus('loading', 'I am now connecting to the analysis engine...');
    setErrorMsg(null);

    const MAX_RETRIES = 6;
    const RETRY_DELAYS = [8000, 12000, 15000, 15000, 20000, 20000];
    const RETRY_MESSAGES = [
      'I am waking up the server from sleep...',
      'I am still warming up the engine...',
      'I am initializing the AI models now...',
      'I am loading the geospatial engine...',
      'I am finishing the boot sequence...',
      'I am running your analysis now...',
    ];

    const headers = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const hasVisionOverride = Object.prototype.hasOwnProperty.call(
      arguments.length > 0 && arguments[0] ? arguments[0] : {},
      'visionContextOverride'
    );

    const body = JSON.stringify({
      lat,
      lng,
      clientContext: mapState.approvedLocationData ?? null,
      visionContext: hasVisionOverride ? (visionContextOverride ?? null) : (visionState.rawVisionPayload ?? null),
    });

    // Fire an immediate wake-up ping before the main request
    try {
      fetch('/health', { method: 'GET', signal: AbortSignal.timeout(5000) }).catch(() => {});
    } catch {
      void 0;
    }

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
          const msg = 'Session expired. Please sign in again.';
          setEngineError(msg);
          setErrorMsg(msg);
          openAuthModal({ error: msg });
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

  const requestSpatialAnalyze = () => {
    const { lat, lng } = mapState.pinnedCoordinates;
    if (!lat || !lng) {
      setErrorMsg('Please drop a pin on the map first.');
      return;
    }
    setPhotoGateOpen(true);
  };

  const handlePhotoGateAnalyze = async () => {
    if (!visionState.uploadedFile) {
      setErrorMsg('Please upload a land photo before running the spatial engine.');
      return;
    }

    setPreparingEngine(true);
    try {
      const visionPayload = visionState.rawVisionPayload ?? await handleScan();
      if (!visionPayload) return;
      setPhotoGateOpen(false);
      await handleSpatialAnalyze({ visionContextOverride: visionPayload });
    } finally {
      setPreparingEngine(false);
    }
  };

  const handlePhotoGateAnalyzeNoPhoto = async () => {
    setPreparingEngine(true);
    try {
      setPhotoGateOpen(false);
      await handleSpatialAnalyze({ visionContextOverride: null });
    } finally {
      setPreparingEngine(false);
    }
  };

  const scanDone  = visionState.scanStatus === 'complete';
  const engineDone = engineState.status === 'done';
  const isModeSelect = mode === null;

  return (
    <MainLayout hideTopBar={mode === 'map'} disableMainScroll={isModeSelect}>
      <div className="font-gabarito h-full">
        <ProgressiveLoader />

      <PhotoScanGate
        isOpen={photoGateOpen}
        onClose={() => {
          if (!preparingEngine && visionState.scanStatus !== 'scanning') setPhotoGateOpen(false);
        }}
        onAnalyze={handlePhotoGateAnalyze}
        onAnalyzeWithoutPhoto={handlePhotoGateAnalyzeNoPhoto}
        isRunning={preparingEngine}
        uploadedFileName={visionState.uploadedFileName}
        scanStatus={visionState.scanStatus}
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
          className="flex flex-col h-full w-full"
        >
          {/* Full-bleed map / GEE imagery (fills entire right side) */}
          <div className="relative flex-1 min-h-0">
            <PinDrop onRunSpatialEngine={requestSpatialAnalyze} />
            {engineDone && <RiskSummaryCard />}
          </div>
        </motion.div>
      )}

      {/* ── Non-map flows — padded scrollable container ── */}
      {mode !== 'map' && (
        <div
          className={
            `max-w-7xl mx-auto px-4 sm:px-6 ${isModeSelect ? 'h-full flex items-center' : 'py-6 sm:py-10'}`
          }
        >
          <AnimatePresence mode="wait">

            {/* ── Mode Selection ── */}
            {!mode && (
              <motion.div key="mode-select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-6 sm:mb-8 text-center">
                  <h2 className="text-2xl sm:text-3xl font-black text-terra-heading mb-2 leading-tight">Start your land analysis</h2>
                  <p className="text-sm sm:text-base text-terra-body">Deep map + photo context combine into one risk report.</p>
                </div>
                <div className="flex justify-center">
                  {MODE_CARDS.map(({ id, icon: Icon, title, subtitle, imageSrc, imageAlt, desc, features, gradient, lightBg, border, textColor, linkColor, cardClassName }) => (
                    <motion.button
                      key={id}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setMode(id)}
                      className={`text-left bg-white/70 backdrop-blur-md border ${border} rounded-3xl p-5 sm:p-7 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer w-full flex flex-col ${cardClassName ?? ''}`}
                    >
                      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg mb-4`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className={`inline-block text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-full ${lightBg} ${textColor} mb-3`}>
                        {subtitle}
                      </div>
                      <div className="mt-3 mb-4 rounded-3xl overflow-hidden">
                        <img
                          src={imageSrc}
                          alt={imageAlt}
                          className="w-full h-28 sm:h-32 object-cover"
                          loading="lazy"
                          draggable={false}
                        />
                      </div>
                      <h3 className="text-xl font-black text-terra-heading mb-3">{title}</h3>
                      <p className="text-sm text-terra-body leading-relaxed mb-4">{desc}</p>
                      {Array.isArray(features) && features.length > 0 && (
                        <ul className="mb-4 space-y-1 text-sm text-terra-body">
                          {features.map((feature) => (
                            <li key={feature} className="flex gap-2">
                              <span className="mt-[0.45rem] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
                              <span className="leading-relaxed">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex items-center gap-2 font-semibold text-sm mt-auto" style={{ color: linkColor }}>
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

      </div>
    </MainLayout>
  );
}
