import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Analyze from './pages/Analyze';
import Pricing from './pages/Pricing';
import Report from './pages/Report';
import UpdatePassword from './pages/UpdatePassword';
import { supabase } from './lib/supabaseClient';
import useTerraStore from './store/useTerraStore';

/**
 * App.jsx — Router Configuration + Supabase Auth Listener
 * Route map mirrors the blueprint user flow:
 *   /           → Home (landing)
 *   /analyze    → Analyze (Vision vs Map split)
 *   /pricing    → Pricing (SaaS tiers)
 *   /report     → Report (web view before PDF download)
 *
 * On mount, we check the active Supabase session and subscribe to
 * auth state changes so the entire app stays in sync reactively.
 */
export default function App() {
  const { setUser, setSession, setReportHistory, logout } = useTerraStore();

  useEffect(() => {
    // ── 0. Pre-warm Render backend (fire-and-forget) ───────────
    // Render free tier sleeps after 15 min inactivity. Pinging /health
    // immediately on page load gives it ~30s to wake before the user
    // triggers an analysis. This runs silently with no user impact.
    fetch('/health', { method: 'GET', signal: AbortSignal.timeout(30000) })
      .catch(() => { /* Non-fatal — backend may already be awake */ });

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
          }
        } else {
          logout();
        }
      }
    );

    // ── 3. Cleanup subscription on unmount ────────────────────
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch report history for the logged-in user ───────────
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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<Home />} />
        <Route path="/analyze"  element={<Analyze />} />
        <Route path="/pricing"  element={<Pricing />} />
        <Route path="/report"   element={<Report />} />
        <Route path="/reset-password" element={<UpdatePassword />} />
        {/* Catch-all → home */}
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
