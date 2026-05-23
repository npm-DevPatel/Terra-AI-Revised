import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, FileText, Star, LogIn, LogOut, User } from 'lucide-react';
import Button from '../components/ui/Button';
import AuthModal from '../components/auth/AuthModal';
import useTerraStore from '../store/useTerraStore';
import { supabase } from '../lib/supabaseClient';

const FEATURES = [
  { icon: Zap,      title: 'Vision AI',         desc: 'YOLO-powered detection of vegetation, terrain, and water bodies from a single photo.' },
  { icon: Shield,   title: 'Spatial Risk Engine', desc: 'Riparian buffers, slope analysis, and zoning cross-reference via live Nairobi data.' },
  { icon: FileText, title: 'Enterprise PDF',      desc: 'A $5,000-quality geospatial risk report ready to share with lenders and surveyors.' },
];

const STATS = [
  { value: '98%', label: 'Risk Detection Accuracy' },
  { value: '<60s', label: 'Analysis Time' },
  { value: '12+', label: 'Risk Vectors Checked' },
  { value: '100%', label: 'Kenya Coverage' },
];

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useTerraStore();
  const [authOpen, setAuthOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    logout();
  };

  // Derive user initials for avatar
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'T';

  const [serverStatus, setServerStatus] = useState('idle');

  useEffect(() => {
    // Initial silent check
    fetch('/health', { method: 'GET', signal: AbortSignal.timeout(3000) })
      .then(res => {
        if (res.ok) setServerStatus('active');
      })
      .catch(() => {});
  }, []);

  const wakeBackend = () => {
    if (serverStatus === 'active' || serverStatus === 'waking') return;
    setServerStatus('waking');
    
    const checkHealth = async (retries = 8) => {
      try {
        const res = await fetch('/health', { method: 'GET', signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          setServerStatus('active');
          return;
        }
      } catch (err) {}
      
      if (retries > 0) {
        setTimeout(() => checkHealth(retries - 1), 5000);
      } else {
        setServerStatus('idle');
      }
    };
    
    checkHealth();
  };

  return (
    <div className="min-h-screen bg-terra-bg">
      {/* ── AuthModal ── */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b border-terra-border bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
            <span className="text-white text-xs font-black">T</span>
          </div>
          <span className="font-bold text-terra-heading text-base">
            Terra <span className="text-terra-emerald">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button 
            onClick={wakeBackend}
            disabled={serverStatus === 'waking' || serverStatus === 'active'}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-colors border ${
              serverStatus === 'active' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : serverStatus === 'waking'
                ? 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer'
            }`}
            title="Start backend server (takes ~30s if asleep)"
          >
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${
              serverStatus === 'active' ? 'bg-emerald-500' : serverStatus === 'waking' ? 'bg-amber-500' : 'bg-slate-300'
            }`} />
            <span className="hidden xs:inline">
              {serverStatus === 'active' ? 'Backend Ready' : serverStatus === 'waking' ? 'Waking...' : 'Wake Backend'}
            </span>
            <span className="inline xs:hidden">
              {serverStatus === 'active' ? 'Ready' : serverStatus === 'waking' ? 'Waking' : 'Wake'}
            </span>
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/pricing')} className="hidden xs:inline-flex">Pricing</Button>

          {user ? (
            /* ── Logged-in state ── */
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-2 sm:px-3 py-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {initials}
                </div>
                <span className="text-emerald-700 text-xs font-semibold max-w-[100px] sm:max-w-[140px] truncate hidden sm:block">
                  {user.email}
                </span>
              </div>
              <button
                id="home-signout-btn"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-xs font-semibold text-terra-muted hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          ) : (
            /* ── Logged-out state ── */
            <>
              <button
                id="home-signin-btn"
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-1.5 text-sm font-semibold text-terra-body hover:text-terra-heading transition-colors px-3 py-2 rounded-xl hover:bg-slate-50"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
              <Button variant="primary" size="sm" onClick={() => navigate('/analyze')}>
                Start Analysis
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 sm:px-8 py-14 sm:py-24 md:py-36 max-w-6xl mx-auto">
        {/* Background orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100 rounded-full blur-3xl opacity-30 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Copy */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Star className="w-3 h-3 fill-current" /> Kenya's #1 Land Intelligence Platform
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-terra-heading leading-[1.1] tracking-tight mb-4 sm:mb-6">
              Know the land
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-700">
                before you buy it.
              </span>
            </h1>
            <p className="text-lg text-terra-body leading-relaxed mb-8 max-w-lg">
              Understand land constraints and sustainable building before you buy. Terra AI fuses computer vision with geospatial intelligence to surface hidden risks in seconds.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary" size="lg" iconRight={ArrowRight} onClick={() => navigate('/analyze')}>
                Analyze Your Land
              </Button>
              {!user && (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="flex items-center gap-2 text-sm font-semibold text-terra-body hover:text-terra-heading border border-terra-border hover:border-slate-300 px-5 py-3 rounded-xl transition-all hover:shadow-sm"
                >
                  <User className="w-4 h-4" />
                  Create Free Account
                </button>
              )}
            </div>
          </motion.div>

          {/* Visual: Isometric land concept */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-900 via-slate-900 to-indigo-900 p-8 shadow-2xl aspect-square md:aspect-[4/3]">
              {/* Isometric grid illustration */}
              <svg viewBox="0 0 400 320" className="w-full h-full" fill="none">
                {/* Ground plane */}
                <polygon points="200,280 20,180 200,80 380,180" fill="#064e3b" opacity="0.6" />
                {/* Main plot */}
                <polygon points="200,240 80,170 200,100 320,170" fill="#065f46" />
                {/* Vegetation blocks */}
                <polygon points="140,140 110,125 140,110 170,125" fill="#10b981" />
                <polygon points="140,125 110,125 140,110" fill="#059669" />
                <polygon points="200,150 170,135 200,120 230,135" fill="#34d399" />
                <polygon points="200,135 170,135 200,120" fill="#10b981" />
                <polygon points="260,140 230,125 260,110 290,125" fill="#10b981" />
                <polygon points="260,125 230,125 260,110" fill="#059669" />
                {/* Building */}
                <polygon points="200,190 160,168 200,146 240,168" fill="#6ee7b7" opacity="0.8" />
                <polygon points="200,146 160,168 160,185 200,163" fill="#34d399" opacity="0.7" />
                <polygon points="200,146 240,168 240,185 200,163" fill="#059669" opacity="0.7" />
                {/* Scanning line */}
                <motion.line
                  x1="20" y1="180" x2="380" y2="180"
                  stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4"
                  animate={{ opacity: [0.2, 0.8, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                {/* Risk pin */}
                <motion.circle
                  cx="200" cy="168" r="8" fill="#ef4444"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <circle cx="200" cy="168" r="4" fill="white" />
              </svg>

              {/* Floating data badges */}
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2"
              >
                <p className="text-white text-xs font-semibold">Risk Score</p>
                <p className="text-emerald-400 text-2xl font-black">32</p>
                <p className="text-emerald-400 text-xs">LOW</p>
              </motion.div>
              <motion.div
                animate={{ y: [4, -4, 4] }}
                transition={{ duration: 3.5, repeat: Infinity }}
                className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2"
              >
                <p className="text-slate-300 text-xs">Elevation</p>
                <p className="text-white text-base font-bold">1,680m</p>
              </motion.div>

              {/* Auth badge — shown to logged-out users */}
              {!user && (
                <motion.button
                  onClick={() => setAuthOpen(true)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-emerald-500/90 hover:bg-emerald-400 backdrop-blur-sm border border-emerald-400/50 rounded-xl px-3 py-2 transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-xs font-bold">Free Sign Up</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-white border-y border-terra-border py-8">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 px-4 sm:px-8">
          {STATS.map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl font-black text-terra-emerald">{value}</p>
              <p className="text-sm text-terra-muted font-medium mt-1">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-14 sm:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-terra-heading mb-4">
            Enterprise-grade intelligence
          </h2>
          <p className="text-terra-body max-w-xl mx-auto">
            Three powerful engines working in concert to give you the clearest picture of any plot in Kenya.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="bg-white rounded-2xl border border-terra-border p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 mb-4">
                <Icon className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-terra-heading mb-2">{title}</h3>
              <p className="text-sm text-terra-body leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pb-14 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl px-6 sm:px-10 py-10 sm:py-16 text-center shadow-2xl"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to analyze your plot?
          </h2>
          <p className="text-emerald-100 mb-8 max-w-md mx-auto">
            Start with a photo or drop a pin on the map. Get a professional risk report in under 60 seconds.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button
              variant="secondary"
              size="lg"
              iconRight={ArrowRight}
              onClick={() => navigate('/analyze')}
            >
              Start Free Analysis
            </Button>
            {!user && (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-2 text-sm font-semibold text-emerald-100 hover:text-white border border-emerald-400/40 hover:border-emerald-300/60 px-5 py-3 rounded-xl transition-all"
              >
                <LogIn className="w-4 h-4" />
                Create Account
              </button>
            )}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
