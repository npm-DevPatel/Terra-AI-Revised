import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, FileText, Star, LogIn, LogOut, User } from 'lucide-react';
import Button from '../components/ui/Button';
import useTerraStore from '../store/useTerraStore';
import { supabase } from '../lib/supabaseClient';
import heroBackground from '../assets/hero_section.png';
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
    </div>
  );
}
