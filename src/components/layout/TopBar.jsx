import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, AlertCircle, CheckCircle2, Loader2, LogIn, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import useTerraStore from '../../store/useTerraStore';
import AuthModal from '../auth/AuthModal';
import { supabase } from '../../lib/supabaseClient';

const ROUTE_LABELS = {
  '/':        { label: 'Home',         sub: 'Terra AI Land Intelligence' },
  '/analyze': { label: 'Analyze Land', sub: 'Vision & Spatial Engine' },
  '/pricing': { label: 'Pricing',      sub: 'Choose your plan' },
  '/report':  { label: 'Report',       sub: 'Your risk assessment' },
};

const STATUS_CONFIG = {
  idle:    { icon: Zap,          color: 'text-terra-muted',   bg: 'bg-slate-100', label: 'Engine Ready' },
  loading: { icon: Loader2,      color: 'text-indigo-600',    bg: 'bg-indigo-50', label: 'Analyzing...' },
  done:    { icon: CheckCircle2, color: 'text-emerald-600',   bg: 'bg-emerald-50',label: 'Analysis Complete' },
  error:   { icon: AlertCircle,  color: 'text-red-600',       bg: 'bg-red-50',    label: 'Engine Error' },
};

export default function TopBar() {
  const location = useLocation();
  const { engineState, user, logout } = useTerraStore();
  const [authOpen, setAuthOpen] = useState(false);

  const route = ROUTE_LABELS[location.pathname] ?? { label: 'Terra AI', sub: '' };
  const statusCfg = STATUS_CONFIG[engineState.status] ?? STATUS_CONFIG.idle;
  const StatusIcon = statusCfg.icon;

  // Derive initials from email
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    logout();
  };

  return (
    <>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      <header className="flex items-center justify-between px-6 h-16 bg-white border-b border-terra-border flex-shrink-0">
        {/* ── Breadcrumb ── */}
        <div>
          <AnimatePresence mode="wait">
            <motion.h1
              key={location.pathname}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="text-base font-bold text-terra-heading leading-tight"
            >
              {route.label}
            </motion.h1>
          </AnimatePresence>
          {route.sub && (
            <p className="text-xs text-terra-muted font-medium">{route.sub}</p>
          )}
        </div>

        {/* ── Right Controls ── */}
        <div className="flex items-center gap-3">
          {/* Engine status pill */}
          <div className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold',
            statusCfg.bg, statusCfg.color
          )}>
            <StatusIcon
              className={clsx('w-3.5 h-3.5', engineState.status === 'loading' && 'animate-spin')}
            />
            <span>{statusCfg.label}</span>
          </div>

          {/* Auth controls */}
          {user ? (
            /* ── Logged-in: avatar + email + sign out ── */
            <div className="flex items-center gap-2">
              <div
                title={user.email}
                className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-2.5 py-1.5 max-w-[160px] cursor-default"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  {initials}
                </div>
                <span className="text-emerald-700 text-xs font-semibold truncate">{user.email}</span>
              </div>
              <button
                id="topbar-signout-btn"
                onClick={handleSignOut}
                title="Sign out"
                className="flex items-center gap-1 text-xs font-semibold text-terra-muted hover:text-red-500 hover:bg-red-50 transition-all px-2 py-1.5 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            /* ── Logged-out: sign-in button ── */
            <button
              id="topbar-signin-btn"
              onClick={() => setAuthOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-terra-body hover:text-terra-heading hover:bg-slate-50 border border-terra-border rounded-xl px-3 py-1.5 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>
      </header>
    </>
  );
}
