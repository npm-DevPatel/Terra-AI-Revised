import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, LogOut, Menu } from 'lucide-react';
import useTerraStore from '../../store/useTerraStore';
import AuthModal from '../auth/AuthModal';
import { supabase } from '../../lib/supabaseClient';
import terraLogo from '../../assets/front_page/terra_logo.png';

const ROUTE_LABELS = {
  '/':        { label: 'Home',         sub: 'Terra AI Land Intelligence' },
  '/analyze': { label: 'Analyze Land', sub: 'Vision & Spatial Engine' },
  '/pricing': { label: 'Pricing',      sub: 'Choose your plan' },
  '/report':  { label: 'Report',       sub: 'Your risk assessment' },
};

export default function TopBar({ onMenuToggle, hideAccountControls = false, className = '' }) {
  const location = useLocation();
  const { user, logout } = useTerraStore();
  const [authOpen, setAuthOpen] = useState(false);

  const route = ROUTE_LABELS[location.pathname] ?? { label: 'Terra AI', sub: '' };

  // Derive initials from email
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    logout();
  };

  return (
    <>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      <header className={`flex items-center justify-between px-3 sm:px-6 h-16 bg-white border-b border-terra-border flex-shrink-0 gap-2 ${className}`}>
        {/* ── Hamburger (mobile only) ── */}
        <div className="md:hidden flex items-center gap-2 flex-shrink-0">
          <button
            id="topbar-menu-btn"
            onClick={onMenuToggle}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-terra-muted hover:text-terra-heading hover:bg-slate-50 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-terra-border overflow-hidden">
            <img
              src={terraLogo}
              alt="Terra"
              className="w-7 h-7 object-contain"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>

        {/* ── Breadcrumb ── */}
        <div className="flex-1 min-w-0">
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
        {!hideAccountControls && (
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Auth controls */}
            {user ? (
              /* ── Logged-in: avatar + email + sign out ── */
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div
                  title={user.email}
                  className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-2 sm:px-2.5 py-1.5 max-w-[120px] sm:max-w-[160px] cursor-default"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <span className="text-emerald-700 text-xs font-semibold truncate hidden xs:block sm:block">{user.email}</span>
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
        )}
      </header>
    </>
  );
}
