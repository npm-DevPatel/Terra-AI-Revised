/**
 * TerraFlow.jsx — Terra Flow Product Page
 * Decide. Report. Monitor.
 */
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, CheckCircle2, BarChart3, Clock, Users, Download, Shield, Bell } from 'lucide-react';
import MarketingLayout from '../../components/layout/MarketingLayout';
import AnimatedChat from '../../components/ui/AnimatedChat';
import landingPageImage from '../../assets/front_page/landing_page.jpeg';
import '../../styles/product.css';

const CAPABILITIES = [
  { icon: FileText,  title: 'AI-Generated Reports',     desc: 'Professional PDF and DOCX land intelligence reports with legal risk flags, cost breakdowns, and due diligence checklists.' },
  { icon: BarChart3, title: 'Progress Monitoring',      desc: 'Track construction milestones against the approved plan. Detect deviations before they become costly problems.' },
  { icon: Clock,     title: 'Timeline Comparisons',     desc: 'Compare planned vs actual construction timelines with satellite-verified progress updates.' },
  { icon: Shield,    title: 'Compliance Documentation', desc: 'Automatically compile NEMA, NCA, and county planning compliance evidence for regulatory submissions.' },
  { icon: Users,     title: 'Client Dashboards',        desc: 'Branded client portals with live project status, risk summaries, and milestone tracking.' },
  { icon: Bell,      title: 'Alert System',             desc: 'Automated alerts for encroachments, weather risks, and regulatory changes affecting your project.' },
];

export default function TerraFlow() {
  const navigate = useNavigate();
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="product-hero-bg-amber px-6 pt-20 pb-16">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
              <FileText className="w-3.5 h-3.5" /> Terra Flow
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-5">
              Decide. Report.<br />
              <span className="text-amber-500">Monitor.</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
              From pre-purchase due diligence report to post-construction compliance documentation — Terra Flow is your intelligence layer from start to finish.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/analyze')}
                className="flex items-center gap-2 px-7 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-full transition-all shadow-md shadow-amber-200"
              >
                Generate a Report <ArrowRight className="w-4 h-4" />
              </button>
              <Link to="/pricing" className="flex items-center gap-2 px-7 py-3.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-full hover:border-slate-300 transition-all">
                View Pricing
              </Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}>
            <AnimatedChat demo="flow" autoPlay className="w-full" />
          </motion.div>
        </div>
      </section>

      {/* Report preview */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="rounded-3xl overflow-hidden border border-amber-100 bg-amber-50 p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row gap-10 items-center">
            <div className="flex-1">
              <h2 className="text-3xl font-black text-slate-900 mb-4">Reports lenders actually trust</h2>
              <p className="text-slate-500 mb-6 leading-relaxed">Every Terra Flow report includes a deterministic risk score, section-by-section legal analysis, foundation cost estimates, and a 12-step due diligence checklist — formatted for lawyers, lenders, and planning authorities.</p>
              <div className="grid grid-cols-2 gap-3">
                {['PDF & DOCX export','Legal risk flags with KES costs','12-step due diligence checklist','Lender-ready format','Sharable client link','Unlimited revision history'].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-amber-200 shadow-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Download className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Land Report — Kilimani</p>
                    <p className="text-xs text-slate-500">Generated 2 min ago</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Score</span><span className="font-bold text-emerald-600">72 / 100</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Risk flags</span><span className="font-bold text-amber-600">3 CAUTION</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Est. hidden costs</span><span className="font-bold text-slate-900">KES 650,000</span></div>
                </div>
                <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-colors">
                  <Download className="w-4 h-4" /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black text-slate-900 mb-3">The full intelligence lifecycle</h2>
          <p className="text-slate-500 max-w-lg mx-auto">Terra Flow manages land intelligence from pre-purchase screening all the way through post-construction compliance.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CAPABILITIES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="capability-card bg-white border border-slate-100 rounded-2xl p-6"
            >
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl font-black text-slate-900 mb-4">Your first report is free.</h2>
        <p className="text-slate-500 mb-8">Analyse any plot in Kenya and download your land intelligence report in under 60 seconds.</p>
        <button onClick={() => navigate('/analyze')} className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full transition-all shadow-lg shadow-amber-200">
          Generate a Report <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </MarketingLayout>
  );
}
