import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, FileText, Star, LogIn, LogOut, User } from 'lucide-react';
import Button from '../components/ui/Button';
import useTerraStore from '../store/useTerraStore';
import { supabase } from '../lib/supabaseClient';
import heroBackground from '../assets/hero_section.png';
import landingPageImage from '../assets/front_page/landing_page.jpeg';
import terraLogo from '../assets/front_page/terra_logo.png';

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

const FOOTER_LINKS = {
  Product: [
    { label: 'Analyze Land', to: '/analyze' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Generate Report', to: '/report' },
  ],
  Explore: [
    { label: 'Hero', href: '#hero' },
    { label: 'Stats', href: '#stats' },
    { label: 'Features', href: '#features' },
    { label: 'Landscape Intelligence', href: '#landscape-intelligence' },
  ],
  Account: [
    { label: 'Sign In', action: 'signin' },
    { label: 'Create Account', action: 'signup' },
    { label: 'Sign Out', action: 'signout' },
  ],
};

export default function Home() {
  const navigate = useNavigate();
  const { user, logout, openAuthModal } = useTerraStore();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    logout();
  };

  return (
    <div className="min-h-screen bg-terra-bg font-gabarito">

      {/* ── Hero (background covers header + hero) ── */}
      <section
        id="hero"
        className="relative overflow-hidden min-h-screen bg-white"
      >
        {/* Bottom image (occupies ~40% of hero height) */}
        <div
          className="absolute inset-x-0 bottom-0 h-[40vh] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBackground})` }}
        />

        {/* ── Navbar ── */}
        <nav className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 bg-transparent">
          <div className="flex items-center">
            <img
              src={terraLogo}
              alt="Terra"
              className="h-12 sm:h-14 w-auto object-contain"
              loading="eager"
              decoding="async"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/pricing')}
              className="inline-flex rounded-full bg-white text-terra-heading hover:bg-slate-50 border border-terra-border"
            >
              Pricing
            </Button>

            {user ? (
              /* ── Logged-in state ── */
              <button
                id="home-signout-btn"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-xs font-semibold bg-white text-terra-heading hover:bg-slate-50 transition-colors px-3 py-2 rounded-full border border-terra-border"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            ) : (
              /* ── Logged-out state ── */
              <button
                id="home-signin-btn"
                onClick={() => openAuthModal()}
                className="flex items-center gap-1.5 text-sm font-semibold bg-white text-terra-heading hover:bg-slate-50 transition-colors px-3 py-2 rounded-full border border-terra-border"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </nav>

        {/* Centered copy */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 min-h-screen text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto pt-28 sm:pt-32 pb-[40vh]"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Star className="w-3 h-3 fill-current" /> Kenya's #1 Land Intelligence Platform
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-terra-heading leading-[1.1] tracking-tight mb-4 sm:mb-6">
              Know the land
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500">
                before you buy it.
              </span>
            </h1>
            <p className="text-lg text-terra-body leading-relaxed">
              Understand land constraints and sustainable building before you buy. Terra AI fuses computer vision with geospatial intelligence to surface hidden risks in seconds.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                iconRight={ArrowRight}
                onClick={() => navigate('/analyze')}
                className="rounded-full"
              >
                Analyze Your Land
              </Button>
              {!user && (
                <button
                  onClick={() => openAuthModal({ tab: 'signup' })}
                  className="flex items-center gap-2 text-sm font-semibold bg-white text-terra-heading hover:bg-slate-50 border border-terra-border px-5 py-3 rounded-full transition-all"
                >
                  <User className="w-4 h-4" />
                  Create Free Account
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section id="stats" className="bg-white border-y border-terra-border py-8">
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
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-8 py-14 sm:py-24">
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

      {/* ── Landscape Story Section (3rd section) ── */}
      <section id="landscape-intelligence" className="max-w-6xl mx-auto px-4 sm:px-8 pb-14 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-lime-50"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.16),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(132,204,22,0.14),transparent_48%)]" />

          <div className="relative grid lg:grid-cols-2 gap-8 p-6 sm:p-10 lg:p-12 items-center">
            <div>
              <p className="inline-flex items-center rounded-full border border-emerald-300/60 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                Visual + Spatial Fusion
              </p>
              <h2 className="mt-4 text-3xl md:text-4xl font-black text-terra-heading leading-tight">
                See hidden risks before they become expensive surprises.
              </h2>
              <p className="mt-4 text-terra-body leading-relaxed max-w-xl">
                Terra combines on-ground visual cues with layered geospatial checks to reveal flood pathways, slope instability,
                zoning conflicts, and environmental constraints in one clean decision view.
              </p>

              <div className="mt-7 grid sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-emerald-200 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Hydrology</p>
                  <p className="mt-1 text-sm text-terra-body">River proximity, drainage direction, and riparian safety buffers.</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Terrain</p>
                  <p className="mt-1 text-sm text-terra-body">Slope and elevation signals that impact construction feasibility.</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-white/80 p-4 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Planning Confidence</p>
                  <p className="mt-1 text-sm text-terra-body">A single, lender-friendly summary built from multiple verified risk vectors.</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-emerald-500/25 to-lime-400/25 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/70 shadow-2xl">
                <img
                  src={landingPageImage}
                  alt="Landscape preview used for Terra AI analysis"
                  className="w-full h-[300px] sm:h-[380px] object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 bg-gradient-to-t from-black/55 to-transparent">
                  <p className="text-white text-sm sm:text-base font-semibold">
                    Live scene intelligence for faster land due diligence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
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
                onClick={() => openAuthModal({ tab: 'signup' })}
                className="flex items-center gap-2 text-sm font-semibold text-emerald-100 hover:text-white border border-emerald-400/40 hover:border-emerald-300/60 px-5 py-3 rounded-xl transition-all"
              >
                <LogIn className="w-4 h-4" />
                Create Account
              </button>
            )}
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 text-slate-200">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-14">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <img
                src={terraLogo}
                alt="Terra AI logo"
                className="h-12 w-auto object-contain"
                loading="lazy"
                decoding="async"
              />
              <p className="mt-4 text-sm text-slate-300 max-w-md leading-relaxed">
                Intelligent land assessment for confident decisions. From first photo to final report, Terra helps you move faster with fewer unknowns.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">Vision AI</span>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">Spatial Analysis</span>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">Risk Reports</span>
              </div>
            </div>

            {Object.entries(FOOTER_LINKS).map(([group, links]) => (
              <div key={group}>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">{group}</h3>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {links.map((link) => {
                    const isHiddenForAuthState =
                      (user && (link.action === 'signin' || link.action === 'signup')) ||
                      (!user && link.action === 'signout');

                    if (isHiddenForAuthState) return null;

                    if (link.to) {
                      return (
                        <li key={link.label}>
                          <button
                            onClick={() => navigate(link.to)}
                            className="text-slate-300 hover:text-emerald-300 transition-colors"
                          >
                            {link.label}
                          </button>
                        </li>
                      );
                    }

                    if (link.href) {
                      return (
                        <li key={link.label}>
                          <a href={link.href} className="text-slate-300 hover:text-emerald-300 transition-colors">
                            {link.label}
                          </a>
                        </li>
                      );
                    }

                    if (link.action === 'signin' || link.action === 'signup') {
                      return (
                        <li key={link.label}>
                          <button
                            onClick={() => setAuthOpen(true)}
                            className="text-slate-300 hover:text-emerald-300 transition-colors"
                          >
                            {link.label}
                          </button>
                        </li>
                      );
                    }

                    return (
                      <li key={link.label}>
                        <button
                          onClick={handleSignOut}
                          className="text-slate-300 hover:text-emerald-300 transition-colors"
                        >
                          {link.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between text-xs text-slate-400">
            <p>© {new Date().getFullYear()} Terra AI. All rights reserved.</p>
            <p>Built for modern land intelligence in Kenya.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
