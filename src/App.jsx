import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Analyze from './pages/Analyze';
import Pricing from './pages/Pricing';
import Report from './pages/Report';
import UpdatePassword from './pages/UpdatePassword';
// Products
import TerraLens from './pages/products/TerraLens';
import TerraSim from './pages/products/TerraSim';
import TerraFlow from './pages/products/TerraFlow';
// Solutions
import LandDueDiligence from './pages/solutions/LandDueDiligence';
import ResidentialDevelopment from './pages/solutions/ResidentialDevelopment';
import FloodDrainage from './pages/solutions/FloodDrainage';
import EnvironmentalImpact from './pages/solutions/EnvironmentalImpact';
// Industries
import RealEstate from './pages/industries/RealEstate';
import Construction from './pages/industries/Construction';
import Government from './pages/industries/Government';
import EngineeringConsultants from './pages/industries/EngineeringConsultants';
import { supabase } from './lib/supabaseClient';
import useTerraStore from './store/useTerraStore';
import AuthModal from './components/auth/AuthModal';

/**
 * AuthSubscription handles global authentication lifecycle, hydrates/subscribes
 * to the session, performs redirection for password recovery, and catches URL errors.
 */
function AuthSubscription() {
  const navigate = useNavigate();
  const { setUser, setSession, setReportHistory, logout, openAuthModal } = useTerraStore();

  async function fetchHistory(userId) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('id, location_name, feasibility_score, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setReportHistory(data);
      }
    } catch (err) {
      console.warn('[Terra AI] Failed to fetch report history:', err);
    }
  }

  useEffect(() => {
    // ── 1. Hydrate from existing session on mount ──────────────
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        fetchHistory(session.user.id);
      }
    });

    // ── 2. Subscribe to future auth events ────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setSession(session);
          setUser(session.user);
          if (event === 'SIGNED_IN') {
            fetchHistory(session.user.id);
          } else if (event === 'PASSWORD_RECOVERY') {
            navigate('/reset-password');
          }
        } else {
          logout();
        }
      }
    );

    // ── 3. Check for auth errors in the URL hash ──────────────
    const hash = window.location.hash;
    if (hash && hash.startsWith('#error=')) {
      const params = new URLSearchParams(hash.substring(1));
      const error = params.get('error');
      const errorCode = params.get('error_code');

      if (errorCode === 'otp_expired' || error === 'access_denied') {
        const friendlyMessage = 
          'The password reset link is invalid or has expired. ' +
          'This can happen if the link was clicked more than once or previewed by your email provider. ' +
          'Please try requesting a new password reset link.';
          
        openAuthModal({
          tab: 'forgot',
          error: friendlyMessage,
        });

        // Clear hash from URL so it doesn't pop up again on refresh
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }

    // ── 4. Cleanup subscription on unmount ────────────────────
    return () => subscription.unsubscribe();
  }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

/**
 * App.jsx — Router Configuration + Global Providers
 * Route map mirrors the blueprint user flow.
 */
export default function App() {
  const { authModal } = useTerraStore();

  useEffect(() => {
    // ── 0. Pre-warm Render backend (fire-and-forget) ───────────
    fetch('/health', { method: 'GET', signal: AbortSignal.timeout(30000) })
      .catch(() => { /* Non-fatal — backend may already be awake */ });
  }, []);

  return (
    <BrowserRouter>
      <AuthSubscription />
      <AuthModal key={authModal.isOpen} />
      <Routes>
        <Route path="/"                   element={<Home />} />
        <Route path="/analyze"             element={<Analyze />} />
        <Route path="/pricing"             element={<Pricing />} />
        <Route path="/report"              element={<Report />} />
        <Route path="/reset-password"      element={<UpdatePassword />} />
        {/* Products */}
        <Route path="/products/terra-lens" element={<TerraLens />} />
        <Route path="/products/terra-sim"  element={<TerraSim />} />
        <Route path="/products/terra-flow" element={<TerraFlow />} />
        {/* Solutions */}
        <Route path="/solutions/land-due-diligence"     element={<LandDueDiligence />} />
        <Route path="/solutions/residential-development" element={<ResidentialDevelopment />} />
        <Route path="/solutions/flood-drainage"         element={<FloodDrainage />} />
        <Route path="/solutions/environmental-impact"   element={<EnvironmentalImpact />} />
        {/* Industries */}
        <Route path="/industries/real-estate"              element={<RealEstate />} />
        <Route path="/industries/construction"             element={<Construction />} />
        <Route path="/industries/government"               element={<Government />} />
        <Route path="/industries/engineering-consultants"  element={<EngineeringConsultants />} />
        {/* Catch-all → home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
