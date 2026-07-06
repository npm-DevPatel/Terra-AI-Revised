/**
 * SolutionPage.jsx — Reusable Solution / Industry page template
 */
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import MarketingLayout from '../../components/layout/MarketingLayout';
import AnimatedChat from '../../components/ui/AnimatedChat';
import '../../styles/solutions.css';

/**
 * @param {object} props
 * @param {string} props.badge
 * @param {string} props.badgeBg      e.g. 'bg-emerald-100 text-emerald-700'
 * @param {string} props.headline     e.g. 'Land Due\nDiligence'
 * @param {string} props.accentWord   e.g. 'that protects you.'
 * @param {string} props.accentColor  tailwind gradient class
 * @param {string} props.subtext
 * @param {string[]} props.benefits
 * @param {string} props.ctaLabel
 * @param {{ title:string, desc:string }[]} props.useCases
 * @param {{ value:string, label:string }[]} props.stats
 * @param {string} props.ctaColor     tailwind bg class e.g. 'bg-emerald-500 hover:bg-emerald-600'
 * @param {string} props.chatDemo
 */
export default function SolutionPage({
  badge, badgeBg, headline, accentWord, accentColor,
  subtext, benefits, ctaLabel, useCases, stats,
  ctaColor = 'bg-emerald-500 hover:bg-emerald-600',
  chatDemo = 'home',
}) {
  const navigate = useNavigate();
  const lines = headline.split('\n');

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="solution-hero px-6 pt-20 pb-16">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className={`inline-flex items-center gap-2 ${badgeBg} text-xs font-bold px-4 py-1.5 rounded-full mb-6`}>
              {badge}
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-4">
              {lines.map((l, i) => <span key={i} className="block">{l}</span>)}
              <span className={`block text-transparent bg-clip-text bg-gradient-to-r ${accentColor}`}>{accentWord}</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">{subtext}</p>
            <ul className="space-y-3 mb-8">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />{b}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/analyze')}
              className={`flex items-center gap-2 px-7 py-3.5 ${ctaColor} text-white font-bold text-sm rounded-full transition-all shadow-md`}
            >
              {ctaLabel} <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}>
            <AnimatedChat demo={chatDemo} autoPlay className="w-full" />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      {stats?.length > 0 && (
        <section className="border-y border-slate-100 py-12 bg-white">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6 text-center">
            {stats.map(({ value, label }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <p className="text-3xl font-black solution-stat">{value}</p>
                <p className="text-sm text-slate-500 mt-1">{label}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Use Cases */}
      {useCases?.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-4xl font-black text-slate-900 mb-12 text-center">How it works in practice</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {useCases.map(({ title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="industry-accent-card bg-white border border-slate-100 rounded-2xl p-6"
              >
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-black text-slate-900 mb-4">Ready to get started?</h2>
        <p className="text-slate-500 mb-8">Your first analysis is free. No credit card required.</p>
        <button
          onClick={() => navigate('/analyze')}
          className={`inline-flex items-center gap-2 px-8 py-4 ${ctaColor} text-white font-bold rounded-full transition-all shadow-lg`}
        >
          Start Free Analysis <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </MarketingLayout>
  );
}
