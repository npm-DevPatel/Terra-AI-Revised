import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check, X, ArrowRight, Zap, Shield, FileText, ScanLine, LayoutTemplate,
} from 'lucide-react';
import MarketingLayout from '../components/layout/MarketingLayout';

/* ─── Feature rows organised by product ─────────────────────────────── */
const SECTIONS = [
  {
    label: 'Terra Lens',
    icon: ScanLine,
    color: 'text-emerald-500',
    rows: [
      { feat: 'Scans per month',             free: '3', starter: '25', pro: '150', ent: 'Unlimited' },
      { feat: 'AI vision object detection',  free: 'Basic', starter: 'Full', pro: 'Full', ent: 'Custom models' },
      { feat: 'Flood & water risk overlay',  free: false, starter: true, pro: true, ent: true },
      { feat: 'Slope & terrain analysis',    free: 'Basic', starter: 'Full', pro: 'Full', ent: true },
      { feat: 'Legal buffer checks (NEMA)',  free: false, starter: true, pro: true, ent: true },
      { feat: 'NDVI vegetation mapping',     free: false, starter: false, pro: true, ent: true },
      { feat: 'Groundwater depth estimate',  free: false, starter: true, pro: true, ent: true },
      { feat: 'Output resolution',           free: 'Low', starter: 'HD', pro: 'HD', ent: 'Ultra + GIS' },
    ],
  },
  {
    label: 'Terra Sim',
    icon: LayoutTemplate,
    color: 'text-indigo-500',
    rows: [
      { feat: 'Building placement AI',       free: false, starter: false, pro: true, ent: true },
      { feat: 'Solar orientation analysis',  free: false, starter: false, pro: true, ent: true },
      { feat: 'Parking & circulation plans', free: false, starter: false, pro: true, ent: true },
      { feat: 'Constraint heatmaps',         free: false, starter: 'Basic', pro: 'Full', ent: true },
      { feat: 'FAR & setback estimates',     free: false, starter: true, pro: true, ent: true },
      { feat: 'City-scale simulation',       free: false, starter: false, pro: false, ent: true },
    ],
  },
  {
    label: 'Terra Flow',
    icon: FileText,
    color: 'text-amber-500',
    rows: [
      { feat: 'AI-generated PDF reports',    free: 'Watermarked', starter: 'Full', pro: 'Full', ent: 'White-label' },
      { feat: 'Report downloads',            free: false, starter: true, pro: true, ent: true },
      { feat: 'Proposal & pitch decks',      free: false, starter: false, pro: true, ent: true },
      { feat: 'Client dashboards',           free: false, starter: false, pro: true, ent: true },
      { feat: 'Site history & versioning',   free: false, starter: false, pro: true, ent: true },
      { feat: 'Team collaboration',          free: false, starter: false, pro: true, ent: true },
      { feat: 'Compliance workflows',        free: false, starter: false, pro: false, ent: true },
      { feat: 'API access',                  free: false, starter: false, pro: 'Limited', ent: 'Full' },
    ],
  },
  {
    label: 'Support & Infrastructure',
    icon: Shield,
    color: 'text-slate-400',
    rows: [
      { feat: 'Support',                     free: 'Community', starter: 'Email', pro: 'Priority', ent: 'Dedicated' },
      { feat: 'Processing speed',            free: 'Standard', starter: 'Standard', pro: 'Priority', ent: 'Dedicated infra' },
      { feat: 'Custom AI model training',    free: false, starter: false, pro: false, ent: true },
      { feat: 'White-label platform',        free: false, starter: false, pro: false, ent: true },
    ],
  },
];

const PLANS = [
  {
    id: 'free',
    key: 'free',
    name: 'Explore',
    price: 'KES 0',
    period: '/ month',
    desc: 'Feel the platform before you commit.',
    cta: 'Start Free',
    featured: false,
    ctaStyle: 'bg-slate-100 hover:bg-slate-200 text-slate-800',
  },
  {
    id: 'starter',
    key: 'starter',
    name: 'Can I Build Here?',
    price: 'KES 2,500',
    period: '/ report',
    altPrice: 'or KES 4,999 / month',
    desc: 'A clear go / no-go signal for buyers.',
    cta: 'Get Started',
    featured: false,
    ctaStyle: 'bg-slate-900 hover:bg-slate-700 text-white',
  },
  {
    id: 'pro',
    key: 'pro',
    name: 'Construction Workflow',
    price: 'KES 7,500',
    period: '/ month',
    desc: 'Repeat scans, full site planning, and team outputs.',
    cta: 'Start Free Trial',
    featured: true,
    ctaStyle: 'bg-emerald-500 hover:bg-emerald-400 text-white',
    badge: 'Most Popular',
  },
  {
    id: 'ent',
    key: 'ent',
    name: 'Intelligence OS',
    price: 'Custom',
    period: 'pricing',
    desc: 'Unlimited scale, custom models, white-label delivery.',
    cta: 'Contact Sales',
    featured: false,
    ctaStyle: 'bg-indigo-600 hover:bg-indigo-500 text-white',
  },
];

function CellValue({ val }) {
  if (val === true)  return <Check className="w-4 h-4 text-emerald-500 mx-auto" />;
  if (val === false) return <X className="w-3.5 h-3.5 text-slate-200 mx-auto" />;
  return <span className="text-xs font-semibold text-slate-600 leading-tight">{val}</span>;
}

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <MarketingLayout>
      {/* ── Dark hero ──────────────────────────────────────────── */}
      <section className="relative bg-slate-950 overflow-hidden px-6 pt-20 pb-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-8 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-4 py-1.5 rounded-full mb-7">
            <Zap className="w-3.5 h-3.5" /> Transparent Pricing
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-5">
            The right plan for<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              every project.
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            From first-time buyers to enterprise developers — one platform, three products, every tier.
          </p>
        </motion.div>
      </section>

      {/* ── Pricing cards ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-14 pb-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.09 }}
              className={`relative flex flex-col rounded-3xl p-6 ${
                plan.featured
                  ? 'bg-emerald-500 text-white shadow-2xl shadow-emerald-500/30 ring-2 ring-emerald-400'
                  : 'bg-white border border-slate-200 shadow-sm'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full whitespace-nowrap shadow-lg border border-emerald-500/30">
                  {plan.badge}
                </div>
              )}

              <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${plan.featured ? 'text-emerald-100' : 'text-slate-400'}`}>
                {plan.name}
              </p>
              <div className="mb-1 leading-none">
                <span className={`text-4xl font-black ${plan.featured ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                <span className={`text-sm ml-1.5 ${plan.featured ? 'text-emerald-100' : 'text-slate-400'}`}>{plan.period}</span>
              </div>
              {plan.altPrice && (
                <p className={`text-xs mt-1 mb-3 ${plan.featured ? 'text-emerald-100' : 'text-slate-400'}`}>{plan.altPrice}</p>
              )}
              <p className={`text-sm leading-relaxed mt-3 mb-6 flex-1 ${plan.featured ? 'text-emerald-50' : 'text-slate-500'}`}>
                {plan.desc}
              </p>
              <button
                onClick={() => plan.id === 'ent' ? null : navigate('/analyze')}
                className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${plan.ctaStyle}`}
              >
                {plan.cta} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Feature comparison table ───────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        {/* Sticky column headers */}
        <div className="grid grid-cols-5 gap-3 mb-5 px-4">
          <div />
          {PLANS.map((plan) => (
            <div key={plan.id} className={`text-center text-[10px] font-black uppercase tracking-widest ${plan.featured ? 'text-emerald-600' : 'text-slate-400'}`}>
              {plan.name}
            </div>
          ))}
        </div>

        <div className="space-y-10">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.label}>
                <div className="flex items-center gap-2.5 mb-3 px-4">
                  <Icon className={`w-4 h-4 ${section.color}`} />
                  <span className="text-sm font-black text-slate-800 uppercase tracking-wider">{section.label}</span>
                </div>
                <div className="rounded-2xl overflow-hidden border border-slate-100 bg-white shadow-sm">
                  {section.rows.map((row, ri) => (
                    <motion.div
                      key={row.feat}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: ri * 0.02 }}
                      className={`grid grid-cols-5 gap-3 items-center px-4 py-3.5 ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}`}
                    >
                      <p className="text-sm text-slate-700 font-medium">{row.feat}</p>
                      {(['free', 'starter', 'pro', 'ent']).map((key, ci) => (
                        <div key={key} className={`text-center ${ci === 2 ? 'bg-emerald-50 rounded-xl py-1' : ''}`}>
                          <CellValue val={row[key]} />
                        </div>
                      ))}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-slate-900 mb-2">Common questions</h2>
          <p className="text-slate-500 text-sm">Still unsure? We're happy to help.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            { q: 'Can I cancel anytime?',            a: 'Yes. All paid plans are monthly. Cancel from your account with no penalties or notice period.' },
            { q: 'What counts as a scan?',           a: 'One scan = one full geospatial analysis run for a single coordinate or site photo across all 15 risk vectors.' },
            { q: 'Can I upgrade mid-month?',         a: "Absolutely. You'll be charged the prorated difference and gain access to the new tier instantly." },
            { q: 'Do you offer team accounts?',      a: 'Yes. Construction Workflow and above include team seats with role-based access controls.' },
            { q: 'Is there an annual discount?',     a: 'Annual billing saves 20% on all paid plans. Select annual at checkout or contact us.' },
            { q: 'How do I access the API?',         a: 'API keys are available on Construction Workflow (limited) and full REST + webhook access on Intelligence OS.' },
          ].map(({ q, a }) => (
            <div key={q} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <p className="font-bold text-slate-900 text-sm mb-2">{q}</p>
              <p className="text-sm text-slate-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative text-center bg-slate-950 rounded-3xl px-8 py-16 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_60%)] pointer-events-none" />
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4 relative z-10">Ready to start?</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 relative z-10">
            Your first analysis is free.
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed relative z-10">
            No credit card. No setup. Drop a pin anywhere in Kenya and see results in 60 seconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
            <button
              onClick={() => navigate('/analyze')}
              className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-full transition-all shadow-lg shadow-emerald-500/30 text-sm"
            >
              Start Free Analysis <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/solutions/land-due-diligence"
              className="flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-full transition-all border border-white/15 text-sm"
            >
              See Use Cases
            </Link>
          </div>
        </motion.div>
      </section>
    </MarketingLayout>
  );
}
