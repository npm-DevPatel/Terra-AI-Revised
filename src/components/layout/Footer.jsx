/**
 * Footer.jsx — Terra AI Marketing Footer
 */

import { Link } from 'react-router-dom';
import { ArrowRight, Globe, ExternalLink, MessageCircle, Share2 } from 'lucide-react';
import terraLogo from '../../assets/front_page/terra_logo.png';

const FOOTER_LINKS = {
  Products: [
    { label: 'Terra Lens',  to: '/products/terra-lens' },
    { label: 'Terra Sim',   to: '/products/terra-sim' },
    { label: 'Terra Flow',  to: '/products/terra-flow' },
    { label: 'Pricing',     to: '/pricing' },
  ],
  Solutions: [
    { label: 'Land Due Diligence',      to: '/solutions/land-due-diligence' },
    { label: 'Residential Development', to: '/solutions/residential-development' },
    { label: 'Flood & Drainage Risk',   to: '/solutions/flood-drainage' },
    { label: 'Environmental Impact',    to: '/solutions/environmental-impact' },
  ],
  Industries: [
    { label: 'Real Estate',              to: '/industries/real-estate' },
    { label: 'Construction',             to: '/industries/construction' },
    { label: 'Government',              to: '/industries/government' },
    { label: 'Engineering Consultants', to: '/industries/engineering-consultants' },
  ],
  Company: [
    { label: 'Analyze Land',  to: '/analyze' },
    { label: 'Pricing',       to: '/pricing' },
    { label: 'Sign In',       to: null, action: 'signin' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 font-gabarito">
      {/* CTA band */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
              Know the land. Own the decision.
            </h2>
            <p className="text-slate-400 text-sm max-w-md">
              Start your first site analysis in under 60 seconds. No credit card required.
            </p>
          </div>
          <Link
            to="/analyze"
            className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm rounded-full transition-colors shadow-lg shadow-emerald-900/40"
          >
            Start Analysing <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Links grid */}
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <img src={terraLogo} alt="Terra AI" className="h-8 w-auto mb-4 brightness-200" />
          <p className="text-xs text-slate-500 leading-relaxed max-w-[180px]">
            AI-native construction intelligence for Kenya and beyond.
          </p>
          <div className="flex items-center gap-3 mt-5">
            <a href="#" aria-label="Twitter/X" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
            <a href="#" aria-label="LinkedIn" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a href="#" aria-label="GitHub" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
              <Share2 className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(FOOTER_LINKS).map(([group, links]) => (
          <div key={group}>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">{group}</h4>
            <ul className="space-y-2.5">
              {links.map((link) => (
                <li key={link.label}>
                  {link.to ? (
                    <Link
                      to={link.to}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <span className="text-sm text-slate-400 cursor-pointer hover:text-white transition-colors">
                      {link.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <span>© {new Date().getFullYear()} Terra AI. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Kenya</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
