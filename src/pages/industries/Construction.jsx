import SolutionPage from '../solutions/SolutionPage';
import constructionImg from '../../assets/construction.jpeg';
export default function Construction() {
  return <SolutionPage
    badge="Industry — Construction"
    badgeBg="bg-orange-100 text-orange-700"
    headline={'Construction'}
    accentWord="intelligence from day one."
    accentColor="from-orange-500 to-amber-500"
    subtext="Contractors and project managers use Terra AI to front-load site risk assessment, reduce change orders, and keep projects compliant from groundbreaking to handover."
    benefits={[
      'Slope & terrain data for earthworks planning',
      'Foundation type recommendation & cost estimate',
      'Power, water & road access proximity analysis',
      'Construction progress monitoring via satellite',
      'Compliance documentation for NCA & NEMA',
    ]}
    ctaLabel="Analyse a Construction Site"
    ctaColor="bg-orange-500 hover:bg-orange-600"
    chatDemo="sim"
    heroImage={constructionImg}
    stats={[
      { value: '60s', label: 'Site risk assessment' },
      { value: 'NCA', label: 'Compliance alignment' },
      { value: 'KES', label: 'Cost estimates included' },
      { value: 'PDF', label: 'Export ready' },
    ]}
    useCases={[
      { title: 'Pre-mobilisation site assessment', desc: 'Before mobilising equipment, verify slope, drainage, access roads, and soil type to size your earthworks budget accurately.' },
      { title: 'Change order reduction', desc: 'Unexpected black cotton clay and drainage issues are the leading causes of construction change orders. Terra AI surfaces these before breaking ground.' },
      { title: 'Progress vs plan monitoring', desc: 'Terra Flow compares satellite imagery of the construction site against the approved plan on a monthly basis — flagging deviations early.' },
      { title: 'NCA & NEMA compliance packs', desc: 'Automatically compile the geospatial evidence required for NCA site safety plans and NEMA EIA screening submissions.' },
    ]}
  />;
}
