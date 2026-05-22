/**
 * Sidebar.jsx
 * ──────────────────────────────────────────────────────────────
 * Terra AI — Collapsible Navigation + ChatGPT-style History Sidebar
 *
 * Phase 4: Shows authenticated user's past reports from Supabase.
 * Phase 5: Clicking a report loads its full payload into Zustand
 *           state so the Report page re-renders without hitting Flask.
 * ──────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ScanLine, Map, FileText, CreditCard,
  ChevronLeft, ChevronRight, Leaf, Plus, History,
  LogIn, Loader2, AlertCircle, MapPin, Pencil, Trash2, Check, X, Menu,
} from 'lucide-react';
import { clsx } from 'clsx';
import useTerraStore from '../../store/useTerraStore';
import { supabase } from '../../lib/supabaseClient';

const NAV_ITEMS = [
  { to: '/',        icon: LayoutDashboard, label: 'Home' },
  { to: '/analyze', icon: ScanLine,        label: 'Analyze Land' },
  { to: '/pricing', icon: CreditCard,      label: 'Pricing' },
  { to: '/report',  icon: FileText,        label: 'My Report' },
];


// ─── Date formatter ──────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: '2-digit' });
}


export default function Sidebar({ mobileOpen = false, onMobileClose = () => {} }) {
  const [collapsed, setCollapsed] = useState(false);
  const [loadingId, setLoadingId] = useState(null); // UUID being loaded
  const [loadError, setLoadError] = useState(null);

  const navigate = useNavigate();
  const { user, reportHistory, setActiveReport, setReportHistory, resetAll } = useTerraStore();

  // ─── Rename state ──────────────────────────────────────────
  const [renamingId, setRenamingId]     = useState(null);
  const [renameValue, setRenameValue]   = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // id pending confirmation
  const renameInputRef = useRef(null);

  const handleNewAnalysis = () => {
    resetAll();
    navigate('/analyze');
  };

  // ─── Load a historical report ──────────────────────────────
  const handleHistoryClick = useCallback(async (item) => {
    if (loadingId || renamingId === item.id) return;
    setLoadingId(item.id);
    setLoadError(null);

    try {
      const { data, error } = await supabase
        .from('reports')
        .select('payload')
        .eq('id', item.id)
        .single();

      if (error) throw error;

      const stored = data.payload;
      const report       = stored._report       ?? null;
      const reportSource = stored._report_source ?? 'database';
      const { _report, _report_source, ...cleanPayload } = stored;

      setActiveReport(item.id, cleanPayload, report);
      navigate('/report');
    } catch (err) {
      setLoadError(`Could not load "${item.location_name}". Please try again.`);
    } finally {
      setLoadingId(null);
    }
  }, [loadingId, renamingId, setActiveReport, navigate]);

  // ─── Rename handlers ───────────────────────────────────────
  const startRename = (e, item) => {
    e.stopPropagation();
    setRenamingId(item.id);
    setRenameValue(item.location_name || '');
    setConfirmDelete(null);
    setTimeout(() => renameInputRef.current?.focus(), 50);
  };

  const commitRename = async (item) => {
    const newName = renameValue.trim();
    if (!newName || newName === item.location_name) {
      setRenamingId(null);
      return;
    }
    // Optimistic update
    setReportHistory(reportHistory.map(r =>
      r.id === item.id ? { ...r, location_name: newName } : r
    ));
    setRenamingId(null);
    // Persist to DB (non-fatal)
    supabase.from('reports').update({ location_name: newName }).eq('id', item.id).then();
  };

  const cancelRename = () => setRenamingId(null);

  // ─── Delete handlers ───────────────────────────────────────
  const handleDelete = async (e, item) => {
    e.stopPropagation();
    if (confirmDelete !== item.id) {
      // First click: arm the confirmation
      setConfirmDelete(item.id);
      return;
    }
    // Second click: execute delete
    setConfirmDelete(null);
    // Optimistic remove
    setReportHistory(reportHistory.filter(r => r.id !== item.id));
    // Persist to DB (non-fatal)
    supabase.from('reports').delete().eq('id', item.id).then();
  };

  return (
    <motion.aside
      /* ── Desktop: inline sidebar that animates its own width ── */
      /* ── Mobile: fixed overlay drawer that slides in from left ── */
      animate={{
        width: collapsed ? 72 : 268,
      }}
      initial={false}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={[
        'flex flex-col h-screen bg-white border-r border-terra-border flex-shrink-0 overflow-hidden',
        // Mobile: fixed overlay, show/hide via translate
        'fixed md:relative z-40 md:z-auto',
        // On mobile hide off-screen when closed, show when open
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        'transition-transform duration-300 md:transition-none',
      ].join(' ')}
      style={{ width: collapsed ? 72 : 268 }}
    >
      {/* ── Brand ── */}
      <div className="flex items-center gap-3 px-3 sm:px-4 h-16 border-b border-terra-border flex-shrink-0">
        
        {/* ── Mobile: close (Hamburger) button — placed perfectly over the TopBar's hamburger ── */}
        <button
          onClick={onMobileClose}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-terra-muted hover:text-terra-heading hover:bg-slate-50 transition-colors relative z-50 flex-shrink-0"
          aria-label="Close menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md flex-shrink-0">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <span className="text-base font-bold text-terra-heading tracking-tight whitespace-nowrap">
                  Terra <span className="text-terra-emerald">AI</span>
                </span>
                <p className="text-[10px] text-terra-muted font-medium tracking-wider uppercase whitespace-nowrap">
                  Land Intelligence
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── New Analysis CTA ── */}
      <div className="px-3 py-4 border-b border-terra-border">
        <button
          id="sidebar-new-analysis-btn"
          onClick={handleNewAnalysis}
          className={clsx(
            'flex items-center gap-2 w-full rounded-xl px-3 py-2.5',
            'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
            'hover:from-emerald-600 hover:to-emerald-700',
            'transition-all duration-200 shadow-lg shadow-emerald-500/25',
            'font-semibold text-sm',
            collapsed ? 'justify-center' : ''
          )}
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                New Analysis
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="px-3 pt-4 pb-2 space-y-1 border-b border-terra-border">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-terra-muted uppercase tracking-widest px-2 mb-3">
            Navigation
          </p>
        )}
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-terra-emerald-light text-emerald-700'
                  : 'text-terra-body hover:bg-slate-50 hover:text-terra-heading',
                collapsed ? 'justify-center' : ''
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={clsx('w-4 h-4 flex-shrink-0', isActive ? 'text-emerald-600' : '')} />
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── History Panel ── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-slate-200">
        {/* Section header */}
        {!collapsed && (
          <p className="text-[10px] font-semibold text-terra-muted uppercase tracking-widest px-2 mb-3 flex items-center gap-1.5">
            <History className="w-3 h-3" /> Analysis History
          </p>
        )}

        {/* Load error */}
        <AnimatePresence>
          {loadError && !collapsed && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-1.5 bg-red-50 border border-red-200 rounded-xl px-2.5 py-2 mb-3"
            >
              <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-600 leading-snug">{loadError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Not logged in */}
        {!user && !collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-1 mt-2 rounded-2xl bg-gradient-to-br from-emerald-50 to-slate-50 border border-terra-border p-4 text-center"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
              <LogIn className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xs font-semibold text-terra-heading mb-1">Sign in to see history</p>
            <p className="text-[11px] text-terra-muted leading-snug">
              Your past reports are saved and accessible from any device.
            </p>
          </motion.div>
        )}

        {/* Logged in: history list */}
        {user && !collapsed && (
          <>
            {reportHistory.length === 0 ? (
              <div className="px-2 py-3 text-center">
                <Map className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-terra-muted">No analyses yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Run your first scan to see it here.</p>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {reportHistory.map((item) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className="group relative"
                  >
                    {renamingId === item.id ? (
                      /* ── Inline rename input ── */
                      <div className="flex items-center gap-1.5 px-3 py-1.5">
                        <MapPin className="w-3 h-3 flex-shrink-0 text-emerald-500" />
                        <input
                          ref={renameInputRef}
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitRename(item);
                            if (e.key === 'Escape') cancelRename();
                          }}
                          onBlur={() => commitRename(item)}
                          className="flex-1 min-w-0 text-[12px] font-semibold text-terra-heading bg-transparent border-b border-emerald-400 outline-none py-0.5"
                        />
                        <button onClick={() => commitRename(item)} className="text-emerald-500 hover:text-emerald-700 p-0.5">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={cancelRename} className="text-slate-400 hover:text-slate-600 p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      /* ── Normal history row ── */
                      <div className={clsx(
                        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl',
                        'hover:bg-emerald-50 transition-all duration-150',
                        loadingId === item.id && 'bg-emerald-50'
                      )}>
                        {/* Main clickable area */}
                        <button
                          id={`history-item-${item.id}`}
                          onClick={() => handleHistoryClick(item)}
                          disabled={!!loadingId}
                          className="flex items-center gap-2.5 flex-1 min-w-0 text-left disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {loadingId === item.id ? (
                            <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin text-emerald-500" />
                          ) : (
                            <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate text-terra-heading text-[12px]">
                              {item.location_name || 'Unknown Location'}
                            </p>
                            <p className="text-terra-muted text-[10px]">
                              {fmtDate(item.created_at)}
                              {item.feasibility_score !== null && item.feasibility_score !== undefined && (
                                <span className="ml-1.5 font-medium">· Score {item.feasibility_score}</span>
                              )}
                            </p>
                          </div>
                        </button>

                        {/* ── Hover-revealed action icons ── */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
                          <button
                            onClick={(e) => startRename(e, item)}
                            title="Rename"
                            className="p-1 rounded-md text-slate-400 hover:text-terra-heading hover:bg-slate-100 transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, item)}
                            title={confirmDelete === item.id ? 'Click again to confirm delete' : 'Delete'}
                            className={clsx(
                              'p-1 rounded-md transition-colors',
                              confirmDelete === item.id
                                ? 'text-red-500 bg-red-50 hover:bg-red-100'
                                : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                            )}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* Collapsed + logged in: show dot indicators only */}
        {user && collapsed && reportHistory.slice(0, 8).map((item) => (
          <div
            key={item.id}
            title={item.location_name || 'Report'}
            className="flex justify-center py-1.5 cursor-pointer"
            onClick={() => handleHistoryClick(item)}
          >
            <MapPin className="w-3 h-3 text-slate-400" />
          </div>
        ))}
      </div>



      {/* ── Desktop: Collapse Toggle ── */}
      <button
        id="sidebar-collapse-btn"
        onClick={() => setCollapsed((c) => !c)}
        className="hidden md:flex absolute -right-3 top-[72px] z-10 items-center justify-center w-6 h-6 rounded-full bg-white border border-terra-border shadow-md text-terra-body hover:text-terra-heading transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}
