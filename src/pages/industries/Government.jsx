import SolutionPage from '../solutions/SolutionPage';
import governmentImg from '../../assets/government.jpeg';
export default function Government() {
  return <SolutionPage
    badge="Industry — Government"
    badgeBg="bg-sky-100 text-sky-700"
    headline={'Public Sector'}
    accentWord="planning powered by AI."
    accentColor="from-sky-500 to-blue-500"
    subtext="County governments and national agencies use Terra AI to accelerate land use planning, enforce environmental compliance, and deliver better infrastructure decisions for citizens."
    benefits={[
      'County-wide land use mapping & analysis',
      'Environmental compliance enforcement tools',
      'Infrastructure gap identification',
      'Public land encroachment detection',
      'Smart city planning intelligence',
    ]}
    ctaLabel="Explore Government Solutions"
    ctaColor="bg-sky-500 hover:bg-sky-600"
    chatDemo="flow"
    heroImage={governmentImg}
    stats={[
      { value: '47', label: 'Counties covered' },
      { value: '100%', label: 'Kenya satellite coverage' },
      { value: 'NEMA', label: 'Regulatory alignment' },
      { value: 'API', label: 'Integrates with GIS systems' },
    ]}
    useCases={[
      { title: 'Development permit screening', desc: 'Screen permit applications against riparian buffers, protected land boundaries, and demolition zones before approving any development.' },
      { title: 'Public land encroachment monitoring', desc: 'AI agents continuously monitor public land, road reserves, and forest buffer zones for encroachment — alerting county officers in real time.' },
      { title: 'Infrastructure planning', desc: 'Identify optimal routing for roads, water mains, and power lines based on terrain, drainage, and existing infrastructure data.' },
      { title: 'Environmental compliance reporting', desc: 'Generate county-level environmental compliance reports aligned with NEMA requirements and the Environmental Management and Coordination Act.' },
    ]}
  />;
}
