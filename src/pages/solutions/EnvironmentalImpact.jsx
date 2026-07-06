import SolutionPage from './SolutionPage';
import heroImg from '../../assets/hero_section.png';
export default function EnvironmentalImpact() {
  return <SolutionPage
    badge="Solution — Environmental Impact"
    badgeBg="bg-green-100 text-green-700"
    headline={'Environmental'}
    accentWord="screening at satellite speed."
    accentColor="from-green-500 to-emerald-500"
    subtext="NEMA-aligned environmental risk screening powered by Sentinel-5P air quality data, ESA WorldCover land classification, and HydroSHEDS riparian analysis — all in one report."
    benefits={[
      'Sentinel-5P NO₂ air quality — severe pollution detection',
      'ESA WorldCover 10m land cover classification',
      'MODIS NDVI vegetation health index',
      'Protected land & forest reserve boundary checks',
      'Riparian buffer enforcement (EMCA Cap 387)',
    ]}
    ctaLabel="Run Environmental Screening"
    ctaColor="bg-green-500 hover:bg-green-600"
    chatDemo="lens"
    heroImage={heroImg}
    stats={[
      { value: '10m', label: 'ESA WorldCover resolution' },
      { value: 'NO₂', label: 'Sentinel-5P pollutant tracked' },
      { value: '30m', label: 'Riparian buffer enforced' },
      { value: 'NEMA', label: 'Regulatory alignment' },
    ]}
    useCases={[
      { title: 'NEMA riparian compliance', desc: 'Automatically check whether any development footprint breaches the NEMA 30m riparian buffer under EMCA Cap 387 — preventing costly legal action post-purchase.' },
      { title: 'Air quality assessment', desc: 'Sentinel-5P NO₂ column density data flags chronically polluted sites consistent with industrial zoning — a health and property value risk for residential projects.' },
      { title: 'Protected land boundary checks', desc: 'National parks, forest reserves, and conservation area boundaries are cross-referenced against the plot to surface protected-land encroachment risks.' },
      { title: 'EIA pre-screening', desc: 'Terra Flow compiles the environmental data layers required for an initial NEMA EIA screening — reducing the time and cost of formal environmental impact assessment.' },
    ]}
  />;
}
