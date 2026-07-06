/**
 * Navbar.jsx — Terra AI Marketing Navbar
 * Capsule-pill nav with animated dropdowns for Products, Solutions, Industries.
 * Logo left · Pill nav center · Auth right
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, ArrowRight, ScanLine, LayoutTemplate, FileText, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';
import useTerraStore from '../../store/useTerraStore';
import { supabase } from '../../lib/supabaseClient';
import terraLogo from '../../assets/front_page/terra_logo.png';

const NAV_ITEMS = {
  Products: {
    items: [
      {
        label: 'Terra Lens',
        desc: 'AI-powered site scanning & risk detection',
        href: '/products/terra-lens',
        icon: ScanLine,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
      },
      {
        label: 'Terra Sim',
        desc: 'AI planning assistant for architects',
        href: '/products/terra-sim',
        icon: LayoutTemplate,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
      },
      {
        label: 'Terra Flow',
        desc: 'Decide, report & monitor developments',
        href: '/products/terra-flow',
        icon: FileText,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
      },
    ],
  },
  Solutions: {
    items: [
      { label: 'Land Due Diligence',       href: '/solutions/land-due-diligence',       desc: 'Pre-purchase legal & risk checks' },
      { label: 'Residential Development',  href: '/solutions/residential-development',  desc: 'Site feasibility for housing projects' },
      { label: 'Flood & Drainage Risk',    href: '/solutions/flood-drainage',           desc: 'Hydrological risk assessment' },
      { label: 'Environmental Impact',     href: '/solutions/environmental-impact',     desc: 'NEMA-aligned screening' },
    ],
  },
  Industries: {
    items: [
      { label: 'Real Estate',              href: '/industries/real-estate',             desc: 'For developers & investors' },
      { label: 'Construction',             href: '/industries/construction',            desc: 'For contractors & project managers' },
      { label: 'Government',              href: '/industries/government',              desc: 'For planning & public works' },
      { label: 'Engineering Consultants', href: '/industries/engineering-consultants', desc: 'For geotechnical & civil firms' },
    ],
  },
};

function DropdownMenu({ label, data }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const isProducts = label === 'Products';

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        className={clsx(
          'flex items-center gap-1 px-3.5 py-1.5 text-sm font-semibold rounded-full transition-all duration-150',
          open ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        )}
        aria-expanded={open}
      >
        {label}
        <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50"
          >
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden">
              {isProducts ? (
                <div className="p-2 w-72">
                  {data.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', item.bg)}>
                          <Icon className={clsx('w-4 h-4', item.color)} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">{item.label}</p>
                          <p className="text-xs text-slate-500 leading-snug">{item.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="p-2 w-64">
                  {data.items.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setOpen(false)}
                      className="flex flex-col gap-0.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <span className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">{item.label}</span>
                      <span className="text-xs text-slate-500">{item.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, openAuthModal, logout } = useTerraStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    logout();
  };

  return (
    <>
      <header
        className={clsx(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm' : 'bg-transparent'
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src={terraLogo} alt="Terra AI" className="h-8 w-auto" />
          </Link>

          {/* Center capsule nav — desktop */}
          <div className="hidden md:flex items-center gap-0.5 bg-white/80 border border-slate-200 rounded-full px-2 py-1.5 shadow-sm backdrop-blur-sm">
            {Object.entries(NAV_ITEMS).map(([label, data]) => (
              <DropdownMenu key={label} label={label} data={data} />
            ))}
            <Link
              to="/pricing"
              className={clsx(
                'px-3.5 py-1.5 text-sm font-semibold rounded-full transition-all duration-150',
                location.pathname === '/pricing'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              Pricing
            </Link>
          </div>

          {/* Right auth */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {user ? (
              <>
                <button
                  onClick={() => navigate('/analyze')}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal({ tab: 'signin' })}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal({ tab: 'signup' })}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-full transition-all duration-150 shadow-sm shadow-emerald-200"
                >
                  Get Started <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 bg-white border-b border-slate-200 shadow-xl md:hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {Object.entries(NAV_ITEMS).map(([group, data]) => (
                <div key={group}>
                  <p className="px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-400">{group}</p>
                  {data.items.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100">
                <Link to="/pricing" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  Pricing
                </Link>
                {user ? (
                  <button onClick={() => navigate('/analyze')} className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                    Dashboard
                  </button>
                ) : (
                  <button
                    onClick={() => openAuthModal({ tab: 'signup' })}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-full transition-colors"
                  >
                    Get Started <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
