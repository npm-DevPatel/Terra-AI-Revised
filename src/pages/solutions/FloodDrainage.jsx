import SolutionPage from './SolutionPage';
export default function FloodDrainage() {
  return <SolutionPage
    badge="Solution — Flood & Drainage Risk"
    badgeBg="bg-cyan-100 text-cyan-700"
    headline={'Flood Risk'}
    accentWord="mapped before it floods."
    accentColor="from-cyan-500 to-blue-500"
    subtext="JRC satellite data, CHIRPS 40-year rainfall records, and terrain analysis combine to give the most accurate flood risk picture available for any Kenyan plot — without a site visit."
    benefits={[
      'JRC Global Surface Water historical flood occurrence',
      'CHIRPS daily rainfall max 1981–present (40 years)',
      'Flash Flood Susceptibility: Low / Moderate / High / Critical',
      'Topographical sinkhole & drainage depression detection',
      'Seasonal surface water mapping',
    ]}
    ctaLabel="Check Flood Risk"
    ctaColor="bg-cyan-500 hover:bg-cyan-600"
    chatDemo="lens"
    stats={[
      { value: '40yrs', label: 'Rainfall history' },
      { value: '10m', label: 'ESA land cover resolution' },
      { value: '9-pt', label: 'Sinkhole detection grid' },
      { value: 'Free', label: 'API data sources' },
    ]}
    useCases={[
      { title: 'Historical flood occurrence', desc: 'JRC Global Surface Water reveals whether the plot has experienced permanent, seasonal, or occasional flooding at any point since 1984.' },
      { title: 'Flash flood susceptibility scoring', desc: 'CHIRPS long-term rainfall intensity combined with sinkhole and topographic depression detection produces a Critical / High / Moderate / Low susceptibility rating.' },
      { title: 'Drainage infrastructure planning', desc: 'Terra Sim uses drainage analysis to recommend perimeter drain placement, retention pond sizing, and slope grading to reduce runoff impact.' },
      { title: 'Insurance & lender reporting', desc: 'Terra Flow generates flood risk sections compatible with insurance risk assessments and bank project finance due diligence requirements.' },
    ]}
  />;
}
