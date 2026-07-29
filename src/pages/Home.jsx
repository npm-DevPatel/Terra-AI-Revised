import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Shield, Zap, FileText, ScanLine, LayoutTemplate,
  CheckCircle2, Globe, Cpu, Leaf, ChevronRight, Bot, Layers,
} from 'lucide-react';
import MarketingLayout from '../components/layout/MarketingLayout';
import AnimatedChat from '../components/ui/AnimatedChat';
import useTerraStore from '../store/useTerraStore';
import heroSectionImg from '../assets/hero_section.png';
import scanPhoto from '../assets/analysis_page/scan_photo.jpeg';
import deepScan from '../assets/analysis_page/deep_scan.jpeg';
import '../styles/home.css';

const STATS = [
  { value: '98%', label: 'Risk Detection Accuracy' },
  { value: '<60s', label: 'Full Analysis Time' },
  { value: '15+', label: 'Risk Vectors Checked' },
  { value: '100%', label: 'Kenya Coverage' },
];

const PRODUCTS = [
  {
    label: 'Terra Lens',
    tagline: 'See. Understand. Assess.',
    desc: 'AI-powered site scanning that detects vegetation, terrain features, water bodies, and legal risks from a single photo or satellite view.',
    href: '/products/terra-lens',
    icon: ScanLine,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    demo: 'lens',
    badge: 'Vision AI',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    label: 'Terra Planner',
    tagline: 'Plan. Optimise. Build Smart.',
    desc: 'AI planning assistant for architects. Recommend building placement, setbacks, solar orientation, and site layouts before design begins.',
    href: '/products/terra-planner',
    icon: LayoutTemplate,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    demo: 'sim',
    badge: 'AI Planner',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  {
    label: 'Terra Flow',
    tagline: 'Decide. Report. Monitor.',
    desc: 'Generate professional-grade land intelligence reports, monitor construction progress, and deliver client dashboards with one click.',
    href: '/products/terra-flow',
    icon: FileText,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    demo: 'flow',
    badge: 'Reporting',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
];

const PRODUCT_PICKS = [
  {
    key: 'lens',
    label: 'Terra Lens',
    icon: ScanLine,
    desc: 'Photo → instant land risk score',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.25)',
  },
  {
    key: 'sim',
    label: 'Terra Planner',
    icon: LayoutTemplate,
    desc: 'AI layout & scenario planning',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.25)',
  },
  {
    key: 'flow',
    label: 'Terra Flow',
    icon: FileText,
    desc: 'Professional reports in one click',
    color: '#c084fc',
    bg: 'rgba(192,132,252,0.08)',
    border: 'rgba(192,132,252,0.25)',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useTerraStore();
  const [hoveredProduct, setHoveredProduct] = useState(null);

  const handleProductPick = () => {
    if (user) {
      navigate('/workspace?create=true');
    } else {
      openAuthModal({ tab: 'signup', redirectTo: '/workspace?create=true' });
    }
  };

  const handleCreateProject = () => {
    if (user) {
      navigate('/workspace');
    } else {
      openAuthModal({ tab: 'signup', redirectTo: '/workspace' });
    }
  };

  return (
    <MarketingLayout>
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] hero-gradient flex flex-col items-center justify-center overflow-hidden px-4 pb-[38vh]">
        {/* background blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight mb-6">
            Know the land.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
              Own the decision.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
            Terra AI fuses computer vision, satellite data, and geospatial intelligence to surface hidden land risks in under 60 seconds — before you sign anything.
          </p>

          {/* Product picker */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              Pick a product to try free
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
              {PRODUCT_PICKS.map(({ key, label, icon: Icon, desc, color, bg, border }) => (
                <motion.button
                  key={key}
                  onClick={() => handleProductPick(key)}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: hoveredProduct === key ? bg : '#fff',
                    border: `1.5px solid ${hoveredProduct === key ? border : '#e2e8f0'}`,
                    borderRadius: 14, padding: '12px 18px',
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.18s', minWidth: 180, textAlign: 'left',
                    boxShadow: hoveredProduct === key ? `0 4px 20px ${color}20` : '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                  onMouseEnter={() => setHoveredProduct(key)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 16, height: 16, color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{desc}</div>
                  </div>
                  <ArrowRight style={{ width: 14, height: 14, color, marginLeft: 'auto', flexShrink: 0 }} />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Results in 60 seconds</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Full Kenya coverage</span>
          </div>
        </motion.div>

        {/* Hero image — full-bleed, blends into page */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, delay: 0.4 }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '38vh',
            pointerEvents: 'none',
          }}
        >
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50% 50% 0 0 / 50px 50px 0 0',
            overflow: 'hidden',
          }}>
            <img
              src={heroSectionImg}
              alt="Terra AI land analysis"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 60%',
                display: 'block',
              }}
            />
          </div>
          {/* Fade top edge into hero bg */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, #f0fdf4 0%, rgba(240,253,244,0.6) 18%, transparent 55%, rgba(15,23,42,0.25) 100%)',
          }} />
          {/* Fade left & right edges */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, #f0fdf4 0%, transparent 12%, transparent 88%, #f0fdf4 100%)',
          }} />
        </motion.div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────── */}
      <section className="trust-strip py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-6 text-center">
          {STATS.map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <p className="text-4xl font-black stat-value">{value}</p>
              <p className="text-sm text-slate-500 font-medium mt-1">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PRODUCTS TRIO ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">The Platform</p>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Three products. One decision.</h2>
          <p className="text-slate-500 max-w-xl mx-auto">From raw site photo to actionable development plan — Terra AI covers the entire pre-construction journey.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PRODUCTS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className={`product-card bg-white border ${p.border} rounded-3xl p-7 flex flex-col`}
              >
                <div className={`w-12 h-12 ${p.bg} rounded-2xl flex items-center justify-center mb-5`}>
                  <Icon className={`w-5 h-5 ${p.color}`} />
                </div>
                <span className={`self-start text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${p.badgeColor} mb-3`}>{p.badge}</span>
                <h3 className="text-xl font-black text-slate-900 mb-1">{p.label}</h3>
                <p className="text-sm font-semibold text-slate-500 mb-3">{p.tagline}</p>
                <p className="text-sm text-slate-500 leading-relaxed flex-1">{p.desc}</p>
                <button
                  onClick={() => handleProductPick(p.demo)}
                  className={`mt-6 flex items-center gap-2 text-sm font-bold ${p.color} hover:gap-3 transition-all bg-transparent border-none cursor-pointer p-0 font-inherit`}
                >
                  Try {p.label} <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── TERRA LENS SECTION ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="feature-pill bg-emerald-100 text-emerald-700 mb-5">
              <ScanLine className="w-3 h-3" /> Terra Lens
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-5">
              One photo.<br />
              <span className="text-emerald-500">Infinite insight.</span>
            </h2>
            <p className="text-slate-500 leading-relaxed mb-6">
              Drop a site photo or satellite image and Terra Lens instantly detects vegetation cover, drainage patterns, terrain features, and potential legal flag zones. No GIS expertise needed.
            </p>
            <ul className="space-y-3 mb-8">
              {['Google Vision AI — labels, objects, text, colors', 'JRC flood history + CHIRPS rainfall overlay', 'NEMA riparian buffer enforcement (30m)', 'Slope & sinkhole risk from SRTM data'].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={() => handleProductPick('lens')} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-full transition-all shadow-sm shadow-emerald-200">
              Try Terra Lens <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <AnimatedChat demo="lens" className="w-full" />
          </motion.div>
        </div>
      </section>

      {/* ── TERRA SIM SECTION ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16 bg-slate-50 rounded-3xl my-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <AnimatedChat demo="sim" className="w-full" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <span className="feature-pill bg-indigo-100 text-indigo-700 mb-5">
              <LayoutTemplate className="w-3 h-3" /> Terra Sim
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-5">
              The planning tool<br />
              <span className="text-indigo-500">architects trust.</span>
            </h2>
            <p className="text-slate-500 leading-relaxed mb-6">
              Terra Sim is the AI planning assistant that recommends optimal building placement, setbacks, sun orientation, and layout before your architect picks up a pencil.
            </p>
            <ul className="space-y-3 mb-8">
              {['Building placement & orientation optimisation', 'FAR estimates & setback recommendations', 'Parking, circulation & green space planning', 'Constraint maps & heatmap exports'].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={() => handleProductPick('sim')} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm rounded-full transition-all shadow-sm shadow-indigo-200">
              Try Terra Sim <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── TERRA FLOW SECTION ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="feature-pill bg-amber-100 text-amber-700 mb-5">
              <FileText className="w-3 h-3" /> Terra Flow
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-5">
              Reports lenders<br />
              <span className="text-amber-500">actually trust.</span>
            </h2>
            <p className="text-slate-500 leading-relaxed mb-6">
              Terra Flow generates professional land intelligence reports, monitors construction milestones, and delivers client dashboards — all from a single analysis.
            </p>
            <ul className="space-y-3 mb-8">
              {['AI-generated PDF & DOCX risk reports', 'Construction progress monitoring', 'Timeline comparisons & compliance docs', 'Client dashboards with live updates'].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={() => handleProductPick('flow')} className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-full transition-all shadow-sm shadow-amber-200">
              Try Terra Flow <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <AnimatedChat demo="flow" className="w-full" />
          </motion.div>
        </div>
      </section>

      {/* ── AI AGENTS SECTION ─────────────────────────────────── */}
      <section className="mx-6 lg:mx-auto max-w-7xl my-8 rounded-3xl agents-bg overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-0">
          <div className="px-10 py-16 flex flex-col justify-center">
            <span className="feature-pill bg-white/10 text-emerald-300 mb-6">
              <Bot className="w-3 h-3" /> AI Agents
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
              Building a sustainable<br />
              future with AI agents.
            </h2>
            <p className="text-slate-300 leading-relaxed mb-8">
              Terra AI deploys autonomous agents that continuously monitor land use changes, detect encroachments, track construction compliance, and surface environmental risks — without human prompting. We're making sustainable building the path of least resistance.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: Leaf, label: 'Environmental Monitoring', desc: 'Continuous satellite surveillance' },
                { icon: Shield, label: 'Compliance Tracking', desc: 'Automated regulatory checks' },
                { icon: Globe, label: 'Climate Risk Alerts', desc: 'Real-time hazard updates' },
                { icon: Layers, label: 'Multi-site Intelligence', desc: 'Portfolio-scale oversight' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <Icon className="w-4 h-4 text-emerald-400 mb-2" />
                  <p className="text-sm font-bold text-white mb-0.5">{label}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => handleProductPick('lens')}
              className="self-start flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm rounded-full transition-all"
            >
              See It In Action <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="relative lg:block hidden">
            <img
              src={deepScan}
              alt="AI agent monitoring land from satellite"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 to-transparent" />
            {/* Floating agent status */}
            <div className="absolute top-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold">3 Agents Active</span>
              </div>
              <p className="text-xs text-slate-300">Monitoring 847 parcels</p>
              <p className="text-xs text-slate-300">Last scan: 4 min ago</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl px-8 py-16"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-4">Ready to start?</p>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
            Your next land decision<br />starts here.
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto mb-8">
            Join thousands of developers, architects, and investors who use Terra AI to make smarter, faster land decisions.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => handleProductPick('lens')}
              className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-full transition-all shadow-lg shadow-emerald-200 text-sm"
            >
              Start Free Analysis <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/pricing"
              className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-700 hover:border-slate-300 font-semibold rounded-full transition-all text-sm"
            >
              View Pricing
            </Link>
          </div>
        </motion.div>
      </section>
    </MarketingLayout>
  );
}
