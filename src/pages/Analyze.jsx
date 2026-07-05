import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import PinDrop from '../components/map/PinDrop';
import ProgressiveLoader from '../components/results/ProgressiveLoader';
import RiskSummaryCard from '../components/results/RiskSummaryCard';
import useTerraStore from '../store/useTerraStore';
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

// ─── Gate message shown in AuthModal ─────────────────────────
const GATE_MESSAGE =
  'Please sign in or create a free account to run a deep-scan analysis. ' +
  'Your reports are saved and accessible from any device.';

export default function Analyze() {
  const navigate = useNavigate();
  const {
    user, session,
    mapState, engineState,
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

  const [errorMsg, setErrorMsg] = useState(null);
  const previousStatusRef = useRef(engineState.status);

  useEffect(() => {
    if (previousStatusRef.current === 'loading' && engineState.status === 'done') {
      navigate('/report');
    }
    previousStatusRef.current = engineState.status;
  }, [engineState.status, navigate]);

  const handleSpatialAnalyze = async () => {
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

    const body = JSON.stringify({
      lat,
      lng,
      clientContext: mapState.approvedLocationData ?? null,
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
    void handleSpatialAnalyze();
  };

  const engineDone = engineState.status === 'done';

  return (
    <MainLayout hideTopBar disableMainScroll>
      <div className="font-gabarito h-full">
        <ProgressiveLoader />
        <AnimatePresence>
          {errorMsg && (
            <ErrorToast message={errorMsg} onClose={() => setErrorMsg(null)} />
          )}
        </AnimatePresence>

        <motion.div
          key="map-flow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col h-full w-full"
        >
          <div className="relative flex-1 min-h-0">
            <PinDrop onRunSpatialEngine={requestSpatialAnalyze} />
            {engineDone && <RiskSummaryCard />}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
