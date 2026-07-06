import SolutionPage from '../solutions/SolutionPage';
export default function EngineeringConsultants() {
  return <SolutionPage
    badge="Industry — Engineering Consultants"
    badgeBg="bg-slate-100 text-slate-700"
    headline={'Engineering'}
    accentWord="intelligence at your speed."
    accentColor="from-slate-600 to-slate-900"
    subtext="Geotechnical and civil engineering firms use Terra AI to front-load site reconnaissance, deliver faster feasibility studies, and produce lender-grade reporting at scale."
    benefits={[
      'ISRIC geotechnical soil data before site visit',
      'SRTM slope & HydroSHEDS drainage analysis',
      'Foundation type classification by soil profile',
      'Rapid feasibility reporting for multiple sites',
      'White-label PDF reports for clients',
    ]}
    ctaLabel="Start a Feasibility Study"
    ctaColor="bg-slate-800 hover:bg-slate-700"
    chatDemo="lens"
    stats={[
      { value: '5x', label: 'Faster feasibility reporting' },
      { value: 'ISRIC', label: 'Soil data source' },
      { value: 'HydroSHEDS', label: 'Drainage data source' },
      { value: 'PDF', label: 'Client-ready exports' },
    ]}
    useCases={[
      { title: 'Pre-site-visit reconnaissance', desc: 'Before mobilising a geotechnical team, Terra AI provides ISRIC clay content, slope, drainage, and flood data — narrowing the site visit scope and reducing cost.' },
      { title: 'Multi-site feasibility screening', desc: 'Screen 10+ candidate sites for a client in parallel, ranked by risk score and infrastructure cost — delivering value in hours, not weeks.' },
      { title: 'Foundation type classification', desc: 'Automatically classify each site as requiring standard strip, reinforced strip, raft, or piled foundation based on ISRIC clay data and slope analysis.' },
      { title: 'Client reporting at scale', desc: 'Terra Flow generates consistent, professional feasibility reports for every site — saving engineers hours of manual report writing per project.' },
    ]}
  />;
}
