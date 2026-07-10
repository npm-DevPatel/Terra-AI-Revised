/**
 * TerraSim.jsx — Terra Sim Product Page
 * Plan. Optimise. Build Smart.
 */
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutTemplate, ArrowRight, CheckCircle2, Sun, Wind, Car, Trees, Building2, Map } from 'lucide-react';
import MarketingLayout from '../../components/layout/MarketingLayout';
import AnimatedChat from '../../components/ui/AnimatedChat';
import terraPlanner from '../../assets/terra_planner.jpeg';
import constructionImg from '../../assets/construction.jpeg';
import useTerraStore from '../../store/useTerraStore';
import '../../styles/product.css';

const CAPABILITIES = [
  { icon: Building2, title: 'Building Placement AI',   desc: 'Recommends optimal footprint placement based on setbacks, slope, drainage, and orientation.' },
  { icon: Sun,        title: 'Solar Orientation',       desc: 'Maximise daylight hours on habitable units. Minimise overheating on west-facing facades.' },
  { icon: Car,        title: 'Parking & Circulation',   desc: 'AI allocates parking bays, service roads, and pedestrian paths to satisfy county requirements.' },
  { icon: Trees,      title: 'Green Space Planning',    desc: 'Identifies where to preserve or create green space while maximising buildable area.' },
  { icon: Map,        title: 'Constraint Mapping',      desc: 'Automated heatmaps show where you can build, where you can\'t, and why.' },
  { icon: Wind,       title: 'Environmental Analysis',  desc: 'Wind, noise, and drainage recommendations inform sustainable development decisions.' },
];

const OUTPUTS = [
  'Annotated site plan with building footprints',
  'Constraint & hazard heatmaps',
  'FAR, setback & coverage estimates',
  'Parking allocation diagram',
  'Infrastructure access recommendations',
  'Planning report ready for submission',
];

export default function TerraSim() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useTerraStore();
  const DEST = '/workspace/87d674dd-9e52-45aa-8d97-c92085fc7975/planner';
  const handleTry = () => user ? navigate(DEST) : openAuthModal({ tab: 'signup', redirectTo: DEST });
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="product-hero-bg-indigo px-6 pt-20 pb-16">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
              <LayoutTemplate className="w-3.5 h-3.5" /> Terra Sim
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-5">
              Figma for<br />
              <span className="text-indigo-500">construction planning.</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
              Terra Sim is the AI planning assistant that helps architects and developers make smarter decisions before a single line is drawn. Plan, optimise, and validate your site in minutes.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleTry}
                className="flex items-center gap-2 px-7 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm rounded-full transition-all shadow-md shadow-indigo-200"
              >
                Try Terra Sim <ArrowRight className="w-4 h-4" />
              </button>
              <Link to="/pricing" className="flex items-center gap-2 px-7 py-3.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-full hover:border-slate-300 transition-all">
                View Pricing
              </Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}>
            <AnimatedChat demo="sim" autoPlay className="w-full" />
          </motion.div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black text-slate-900 mb-3">Everything before design begins</h2>
          <p className="text-slate-500 max-w-lg mx-auto">Terra Sim handles the hard site planning questions so your architect can focus on the building, not the constraints.</p>
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
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-4.5 h-4.5 text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Outputs */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="bg-indigo-950 rounded-3xl overflow-hidden grid lg:grid-cols-2">
          <div className="p-10 lg:p-14 flex flex-col justify-center">
            <h2 className="text-3xl font-black text-white mb-6">What you get out of Terra Sim</h2>
            <ul className="space-y-4">
              {OUTPUTS.map((o) => (
                <li key={o} className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  {o}
                </li>
              ))}
            </ul>
            <button onClick={handleTry} className="self-start mt-8 flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm rounded-full transition-all">
              Start Planning <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="relative hidden lg:block">
            <img src={terraPlanner} alt="Site planning" className="w-full h-full object-cover opacity-60" />
          </div>
        </div>
      </section>

      {/* Planning visual section — sketch + construction */}
      <section className="max-w-7xl mx-auto px-6 py-8 mb-4">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">The complete pipeline</p>
          <h2 className="text-3xl font-black text-slate-900">From first sketch to final build.</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-xl group"
            style={{ minHeight: 340 }}
          >
            <img
              src={terraPlanner}
              alt="Architectural sketch"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ minHeight: 340 }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-indigo-300 bg-indigo-500/30 backdrop-blur-sm px-2.5 py-1 rounded-full mb-2">Concept</span>
              <p className="text-xl font-black text-white leading-tight">Every building starts<br />as a sketch.</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-xl group"
            style={{ minHeight: 340 }}
          >
            <img
              src={constructionImg}
              alt="Construction in progress"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ minHeight: 340 }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-500/30 backdrop-blur-sm px-2.5 py-1 rounded-full mb-2">Reality</span>
              <p className="text-xl font-black text-white leading-tight">Terra Sim bridges<br />both worlds.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl font-black text-slate-900 mb-4">Stop guessing. Start planning with AI.</h2>
        <p className="text-slate-500 mb-8">Terra Sim is free to try on any Kenyan plot.</p>
        <button onClick={handleTry} className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-full transition-all shadow-lg shadow-indigo-200">
          Try Terra Sim Free <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </MarketingLayout>
  );
}
