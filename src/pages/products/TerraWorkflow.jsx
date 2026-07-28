/**
 * TerraWorkflow.jsx — Terra Workflow Product Page
 * Collaborate. Decide. Ship.
 */
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessagesSquare, ArrowRight, CheckCircle2, Users, Bot,
  UserPlus, Hash, AtSign, Headphones, ShieldCheck,
} from 'lucide-react';
import MarketingLayout from '../../components/layout/MarketingLayout';
import AnimatedChat from '../../components/ui/AnimatedChat';
import useTerraStore from '../../store/useTerraStore';
import '../../styles/product.css';

const CAPABILITIES = [
  { icon: Hash,        title: 'Real-time Channels',     desc: 'Organize project conversations by topic — site notes, budget discussions, design reviews — all in structured, searchable channels.' },
  { icon: Bot,         title: '@Terra AI Teammate',      desc: 'Mention @Terra AI in any channel and get instant, context-aware answers drawn from your project\'s analyses, plans, and reports.' },
  { icon: UserPlus,    title: 'Demo Team Members',       desc: 'Add fake team members for presentations and demos. Show clients how their project team will collaborate before anyone signs up.' },
  { icon: Users,       title: 'Team Profiles',           desc: 'Rich member profiles with roles, status, and direct messaging. Click any avatar to see who they are and what they\'re working on.' },
  { icon: AtSign,      title: '@Mention & Threads',      desc: 'Tag teammates and the AI bot in any message. Keep decisions visible and searchable across your entire project history.' },
  { icon: Headphones,  title: 'Project Huddles',         desc: 'One-click huddle button for quick voice check-ins with your team. No calendar invites, no meeting links — just talk.' },
];

export default function TerraWorkflow() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useTerraStore();
  const handleCreate = () =>
    user
      ? navigate('/workspace?create=true')
      : openAuthModal({ tab: 'signup', redirectTo: '/workspace?create=true' });

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="product-hero-bg-violet px-6 pt-20 pb-16">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
              <MessagesSquare className="w-3.5 h-3.5" /> Terra Workflow
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-5">
              Collaborate. Decide.<br />
              <span className="text-violet-500">Ship.</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
              A Slack-style workspace built into every Terra project. Channels, direct messages, @Terra AI as a teammate, and demo-ready fake members — all scoped to your land development project.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-7 py-3.5 bg-violet-500 hover:bg-violet-600 text-white font-bold text-sm rounded-full transition-all shadow-md shadow-violet-200"
              >
                Create a Project <ArrowRight className="w-4 h-4" />
              </button>
              <Link to="/pricing" className="flex items-center gap-2 px-7 py-3.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-full hover:border-slate-300 transition-all">
                View Pricing
              </Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}>
            {/* Workspace preview card */}
            <div className="bg-white rounded-3xl border border-violet-100 shadow-xl shadow-violet-100/40 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs text-slate-400 font-medium">Terra Workflow</span>
              </div>
              <div className="flex h-64">
                {/* Mini sidebar */}
                <div className="w-44 border-r border-slate-100 bg-slate-50/40 p-3 space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Channels</p>
                  {['# general', '# site-notes', '# budget'].map((ch, i) => (
                    <div key={ch} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${i === 0 ? 'bg-violet-50 text-violet-600' : 'text-slate-500'}`}>{ch}</div>
                  ))}
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-3 mb-2">Direct Messages</p>
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"><Bot className="w-3 h-3 text-white" /></div>
                    <span className="text-xs font-semibold text-emerald-700">Terra AI</span>
                  </div>
                </div>
                {/* Mini messages */}
                <div className="flex-1 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">JK</div>
                    <div>
                      <p className="text-[10px] text-slate-400"><span className="font-bold text-slate-700">James K.</span> 10:14 AM</p>
                      <p className="text-xs text-slate-600 mt-0.5">@Terra AI what's the drainage risk for the north parcel?</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"><Bot className="w-3 h-3 text-white" /></div>
                    <div>
                      <p className="text-[10px] text-slate-400"><span className="font-bold text-emerald-700">Terra AI</span> 10:14 AM</p>
                      <p className="text-xs text-slate-600 mt-0.5">The north parcel shows medium drainage sensitivity based on your Lens analysis…</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">AW</div>
                    <div>
                      <p className="text-[10px] text-slate-400"><span className="font-bold text-slate-700">Amina W.</span> 10:16 AM</p>
                      <p className="text-xs text-slate-600 mt-0.5">Good — let's prioritize the south cluster for phase one then 👍</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature preview */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="rounded-3xl overflow-hidden border border-violet-100 bg-violet-50 p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row gap-10 items-center">
            <div className="flex-1">
              <h2 className="text-3xl font-black text-slate-900 mb-4">Your AI is a teammate, not a widget</h2>
              <p className="text-slate-500 mb-6 leading-relaxed">
                Terra AI lives inside your channels as a real participant. Mention it in any conversation and it responds with context from your Lens analyses, Planner intelligence, and Flow reports — no context window to manage.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  '@mention in any channel',
                  'Context from all project data',
                  'Inline replies, not popups',
                  'Permanent DM thread',
                  'Works alongside fake members',
                  'Same AI as Terra Copilot',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-violet-500 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-violet-200 shadow-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Demo-Ready</p>
                    <p className="text-xs text-slate-500">Present to stakeholders</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Fake members</span><span className="font-bold text-violet-600">Unlimited</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Channels</span><span className="font-bold text-violet-600">Custom</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">AI context</span><span className="font-bold text-slate-900">Full project</span></div>
                </div>
                <button onClick={handleCreate} className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-500 text-white text-sm font-bold rounded-xl hover:bg-violet-600 transition-colors">
                  <MessagesSquare className="w-4 h-4" /> Start Collaborating
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black text-slate-900 mb-3">Everything your project team needs</h2>
          <p className="text-slate-500 max-w-lg mx-auto">Terra Workflow brings real-time collaboration into every land development project — from first analysis to final handover.</p>
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
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-4.5 h-4.5 text-violet-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl font-black text-slate-900 mb-4">Built into every project. Free to start.</h2>
        <p className="text-slate-500 mb-8">Create a project and your team workspace is ready instantly — channels, AI, and all.</p>
        <button onClick={handleCreate} className="inline-flex items-center gap-2 px-8 py-4 bg-violet-500 hover:bg-violet-600 text-white font-bold rounded-full transition-all shadow-lg shadow-violet-200">
          Create a Project <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </MarketingLayout>
  );
}
