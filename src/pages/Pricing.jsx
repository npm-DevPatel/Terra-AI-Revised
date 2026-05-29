import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Zap, Shield, FileText } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import Button from '../components/ui/Button';

const PLANS = [
  {
    id: 'free',
    name: 'Explore',
    price: 'KES 0',
    period: 'month',
    desc: 'Try Terra AI and get a feel for the vision workflow before you commit.',
    idealFor: 'Students, curious first-time buyers, and anyone exploring land options.',
    icon: Zap,
    color: 'border-terra-border',
    badge: null,
    features: [
      '3 scans / month',
      'Basic terrain detection',
      'Low-resolution overlays',
      'Basic feasibility score',
      'Watermarked exports',
      'No report downloads',
      'Community support',
    ],
  },
  {
    id: 'starter',
    name: 'Can I Build Here?',
    price: 'KES 2,500',
    period: 'report',
    secondaryPrice: 'KES 4,999',
    secondaryPeriod: 'month',
    desc: 'For early due diligence when you need a clear go/no-go signal.',
    idealFor: 'Individual land buyers (including busy parents) and small home builders doing due diligence.',
    icon: Zap,
    color: 'border-terra-border',
    badge: null,
    features: [
      '25 scans / month',
      'Flood + terrain analysis',
      'AI feasibility reports',
      'HD overlays',
      'PDF exports',
      'Basic build recommendations',
    ],
  },
  {
    id: 'professional',
    name: 'Construction Workflow',
    price: 'KES 7,500',
    period: 'month',
    desc: 'Built for active projects with repeat scans, collaboration, and outputs.',
    idealFor: 'Real estate agents, architects, contractors, and small development teams running many sites.',
    icon: Shield,
    color: 'border-emerald-400',
    badge: 'Most Popular',
    note: 'Extra scans billed separately.',
    features: [
      '150 scans / month',
      'Advanced risk heatmaps',
      'Team collaboration',
      'Site history tracking',
      'Material recommendations',
      'Proposal generation',
      'Priority processing',
      'API access (limited)',
    ],
  },
  {
    id: 'enterprise',
    name: 'Construction Intelligence OS',
    price: 'Custom',
    period: 'pricing',
    desc: 'For teams that need deep integrations, custom models, and scale.',
    idealFor: 'Real estate companies, large developers, lenders, and GIS-heavy organizations.',
    icon: FileText,
    color: 'border-indigo-400',
    badge: null,
    features: [
      'Unlimited scans',
      'Custom AI models',
      'GIS + satellite integrations',
      'City-scale simulation',
      'Dedicated infrastructure',
      'Compliance workflows',
      'White-label platform',
      'Full API access',
      'Dedicated support',
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 font-gabarito">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-terra-heading mb-4">
            Invest in certainty
          </h1>
          <p className="text-terra-body max-w-xl mx-auto text-lg">
            One Terra AI report costs less than a single hour of a traditional surveyor's time — and delivers more data.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PLANS.map(({ id, name, price, period, secondaryPrice, secondaryPeriod, desc, idealFor, icon: Icon, color, badge, note, features }, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-white rounded-3xl border-2 ${color} p-5 sm:p-8 flex flex-col shadow-sm hover:shadow-xl transition-all duration-300`}
            >
              {badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                  {badge}
                </div>
              )}

              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${id === 'professional' ? 'bg-emerald-500' : id === 'enterprise' ? 'bg-indigo-500' : 'bg-slate-100'}`}>
                  <Icon className={`w-5 h-5 ${id === 'starter' ? 'text-slate-500' : 'text-white'}`} />
                </div>
                <h2 className="text-lg font-bold text-terra-heading">{name}</h2>
              </div>

              <div className="mb-2">
                <span className="text-4xl font-black text-terra-heading">{price}</span>
                <span className="text-terra-muted text-sm ml-2">/ {period}</span>
              </div>

              {secondaryPrice && secondaryPeriod && (
                <div className="-mt-1 mb-2">
                  <span className="text-terra-muted text-sm font-semibold">or </span>
                  <span className="text-terra-heading text-sm font-bold ml-2">{secondaryPrice}</span>
                  <span className="text-terra-muted text-sm ml-2">/ {secondaryPeriod}</span>
                </div>
              )}
              <p className="text-terra-body text-sm mb-8">{desc}</p>

              {idealFor && (
                <p className="text-xs text-terra-muted -mt-6 mb-7">
                  <span className="font-semibold text-terra-heading">Ideal for:</span> {idealFor}
                </p>
              )}

              <ul className="space-y-3 flex-1 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-terra-body">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                fullWidth
                variant={id === 'professional' ? 'primary' : id === 'enterprise' ? 'indigo' : id === 'free' ? 'secondary' : 'secondary'}
                iconRight={ArrowRight}
                onClick={() => navigate('/analyze')}
              >
                {id === 'enterprise' ? 'Contact Sales' : 'Get Started'}
              </Button>

              {note && (
                <p className="text-xs text-terra-muted mt-3 text-center">{note}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-center text-terra-muted text-sm mt-12"
        >
          All reports include the legal disclaimer required for exploratory due diligence. Payments simulated — no real charges.
        </motion.p>
      </div>
    </MainLayout>
  );
}
