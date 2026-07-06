import SolutionPage from './SolutionPage';
export default function ResidentialDevelopment() {
  return <SolutionPage
    badge="Solution — Residential Development"
    badgeBg="bg-blue-100 text-blue-700"
    headline={'Residential'}
    accentWord="built on solid ground."
    accentColor="from-blue-500 to-indigo-500"
    subtext="From single plots to large-scale housing estates, Terra AI gives residential developers the site intelligence they need to de-risk acquisitions and accelerate planning approval."
    benefits={[
      'Site feasibility in 60 seconds — before costly surveys',
      'Slope & foundation cost estimates per plot',
      'Zoning verification & change-of-user guidance',
      'Grid, water & road connection proximity',
      'AI site layout suggestions via Terra Sim',
    ]}
    ctaLabel="Analyse Your Site"
    ctaColor="bg-blue-500 hover:bg-blue-600"
    chatDemo="sim"
    stats={[
      { value: '3x', label: 'Faster site screening' },
      { value: '60s', label: 'Per-plot analysis' },
      { value: 'KES 0', label: 'Upfront commitment' },
      { value: '15+', label: 'Data sources' },
    ]}
    useCases={[
      { title: 'Portfolio site screening', desc: 'Rapidly screen 10, 50, or 500 candidate plots for flood risk, demolition hazards, and infrastructure gaps before spending on formal surveys.' },
      { title: 'Foundation cost budgeting', desc: 'ISRIC clay data and slope analysis give early-stage foundation cost estimates by plot — enabling accurate project budgeting before land acquisition.' },
      { title: 'Planning submission prep', desc: 'Terra Sim generates constraint maps, setback recommendations, and FAR estimates that front-load the planning submission process.' },
      { title: 'Investor-ready reports', desc: 'Terra Flow generates lender-grade PDF reports for each site, including risk scores, legal flags, and hidden cost estimates — ready for bank or fund review.' },
    ]}
  />;
}
