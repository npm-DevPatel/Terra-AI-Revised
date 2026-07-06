/**
 * TerraLens.jsx — Terra Lens Product Page
 * See. Understand. Assess.
 */
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScanLine, ArrowRight, CheckCircle2, Zap, Shield, Droplets, TreePine, Eye, Layers } from 'lucide-react';
import MarketingLayout from '../../components/layout/MarketingLayout';
import AnimatedChat from '../../components/ui/AnimatedChat';
import terraLensPhone from '../../assets/terra_lens_phone.jpeg';
import terraLens from '../../assets/terra_lens.jpeg';
import terraLens1 from '../../assets/terra_lens_1.jpeg';
import '../../styles/product.css';

const CAPABILITIES = [
  { icon: Eye,      title: 'Visual Site Analysis',     desc: 'YOLO-v8 object detection identifies vegetation, water bodies, structures, and terrain features from any photo or satellite image.' },
  { icon: Droplets, title: 'Flood & Water Risk',        desc: 'JRC Global Surface Water + CHIRPS 40-year rainfall history reveals flood occurrence, seasonality, and drainage patterns.' },
  { icon: Shield,   title: 'Legal Risk Detection',      desc: 'Automatic riparian buffer checks (EMCA Cap 387), road reserve encroachments, aviation zones, and protected land overlaps.' },
  { icon: Layers,   title: 'Soil & Terrain Analysis',   desc: 'SRTM slope data, ISRIC clay content, and sinkhole detection give you foundation risk in seconds.' },
  { icon: TreePine, title: 'Vegetation & NDVI',         desc: 'MODIS NDVI and ESA WorldCover identify forest reserve proximity, shrubland, and land cover classification.' },
  { icon: Zap,      title: 'Instant Risk Score',        desc: 'A deterministic 0–100 Land Feasibility Score computed from 15+ geospatial data sources, not AI guesswork.' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Drop a pin or photo', desc: 'Pin a coordinate on the interactive map or upload a site photo. Terra Lens accepts both.' },
  { step: '02', title: 'AI scans all data layers', desc: '11 parallel data fetches run in seconds — GEE, ISRIC, HydroSHEDS, OSM, and more.' },
  { step: '03', title: 'Risk flags are surfaced', desc: 'Every legal hazard, flood risk, and infrastructure gap is flagged with KES cost implications.' },
  { step: '04', title: 'Report ready to share', desc: 'Export a professional PDF report instantly — ready for lenders, lawyers, and clients.' },
];

export default function TerraLens() {
  const navigate = useNavigate();
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="product-hero-bg px-6 pt-20 pb-16">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
              <ScanLine className="w-3.5 h-3.5" /> Terra Lens
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-5">
              See. Understand.<br />
              <span className="text-emerald-500">Assess.</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
              The world's first AI land screener that fuses computer vision with geospatial intelligence to surface hidden site risks before you sign a single document.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/analyze')}
                className="flex items-center gap-2 px-7 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-full transition-all shadow-md shadow-emerald-200"
              >
                Try Terra Lens Free <ArrowRight className="w-4 h-4" />
              </button>
              <Link to="/pricing" className="flex items-center gap-2 px-7 py-3.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-full hover:border-slate-300 transition-all">
                View Pricing
              </Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}>
            <AnimatedChat demo="lens" autoPlay className="w-full" />
          </motion.div>
        </div>
      </section>

      {/* Product Showcase — dark gallery */}
      <section className="bg-slate-950 overflow-hidden py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">Terra Lens — In the field</p>
            <h2 className="text-4xl font-black text-white mb-3">See land like never before.</h2>
            <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">Every photo becomes a full geospatial analysis. On any device. Anywhere in Kenya.</p>
          </div>
          <div className="flex items-end justify-center gap-5 md:gap-8">
            {/* Left screenshot — slightly rotated */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="w-36 md:w-44 rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-10 flex-shrink-0"
              style={{ transform: 'rotate(-3deg)' }}
            >
              <img src={terraLens1} alt="Terra Lens live viewfinder" className="w-full h-auto" />
            </motion.div>
            {/* Center phone mockup — prominent */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="w-52 md:w-64 rounded-3xl overflow-hidden border border-white/20 flex-shrink-0"
              style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)' }}
            >
              <img src={terraLensPhone} alt="Terra Lens on iPhone" className="w-full h-auto" />
            </motion.div>
            {/* Right screenshot — slightly rotated other way */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="w-36 md:w-44 rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-10 flex-shrink-0"
              style={{ transform: 'rotate(3deg)' }}
            >
              <img src={terraLens} alt="Terra Lens camera scan" className="w-full h-auto" />
            </motion.div>
          </div>
          {/* Bottom caption */}
          <div className="flex items-center justify-center gap-8 mt-8">
            <div className="text-center">
              <p className="text-2xl font-black text-white">15</p>
              <p className="text-xs text-slate-400 font-medium">Risk vectors</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-black text-white">47s</p>
              <p className="text-xs text-slate-400 font-medium">Avg scan time</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-black text-white">98%</p>
              <p className="text-xs text-slate-400 font-medium">Detection accuracy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black text-slate-900 mb-3">What Terra Lens detects</h2>
          <p className="text-slate-500 max-w-lg mx-auto">Every analysis is powered by satellite datasets, open geodata, and trained vision models working in parallel.</p>
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
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-4.5 h-4.5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 rounded-3xl mx-6 max-w-7xl lg:mx-auto py-16 px-10 my-8">
        <h2 className="text-4xl font-black text-slate-900 mb-12 text-center">How Terra Lens works</h2>
        <div className="max-w-2xl mx-auto space-y-6">
          {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-5 step-connector"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-black flex-shrink-0">{step}</div>
              <div className="pb-4">
                <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-black text-slate-900 mb-4">Ready to see your land differently?</h2>
        <p className="text-slate-500 mb-8">Drop a pin anywhere in Kenya. Get results in 60 seconds.</p>
        <button onClick={() => navigate('/analyze')} className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-full transition-all shadow-lg shadow-emerald-200">
          Start Free Analysis <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </MarketingLayout>
  );
}
