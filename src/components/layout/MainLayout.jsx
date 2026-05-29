import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

/**
 * MainLayout — persistent shell for all authenticated/app pages.
 *
 * Desktop (≥ md):  Sidebar is always visible as a fixed left panel.
 * Mobile  (< md):  Sidebar is hidden; a hamburger in TopBar toggles an
 *                  overlay drawer with a dimming backdrop.
 *
 * mobileOpen state lives here so TopBar and Sidebar stay in sync.
 */
export default function MainLayout({ children, hideTopBar = false }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const openMobile  = useCallback(() => setMobileOpen(true),  []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-terra-bg font-gabarito">

      {/* ── Mobile backdrop — shown behind the drawer on small screens ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <Sidebar mobileOpen={mobileOpen} onMobileClose={closeMobile} />

      {/* ── Right Column ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {!hideTopBar && <TopBar onMenuToggle={openMobile} />}

        {/* ── Main Stage ── */}
        <main className={`flex-1 h-full ${hideTopBar ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
