import SolutionPage from './SolutionPage';
export default function LandDueDiligence() {
  return <SolutionPage
    badge="Solution — Land Due Diligence"
    badgeBg="bg-emerald-100 text-emerald-700"
    headline={'Due Diligence'}
    accentWord="that protects you."
    accentColor="from-emerald-500 to-teal-500"
    subtext="Kenya loses billions of shillings to land fraud every year. Terra AI surfaces legal hazards, encumbrances, and hidden costs before you transfer a single shilling."
    benefits={[
      'Title search & riparian buffer checks in 60 seconds',
      'Demolition risk detection (KeNHA, SGR, KCAA zones)',
      'Foundation cost estimates from ISRIC soil data',
      'BGS groundwater depth — borehole cost pre-estimated',
      'Fraud risk checklist with 12 actionable steps',
    ]}
    ctaLabel="Run a Due Diligence Check"
    ctaColor="bg-emerald-500 hover:bg-emerald-600"
    chatDemo="home"
    stats={[
      { value: 'KES 500', label: 'Title search cost' },
      { value: '15+', label: 'Risk vectors checked' },
      { value: '60s', label: 'Analysis time' },
      { value: '100%', label: 'Kenya coverage' },
    ]}
    useCases={[
      { title: 'Pre-purchase riparian screening', desc: 'Instantly check if any plot is within the 30m NEMA statutory riparian buffer under EMCA Cap 387 — the #1 cause of uncompensated land loss in Kenya.' },
      { title: 'Demolition buffer detection', desc: 'Cross-reference the plot against KeNHA highway corridors and SGR/MGR railway lines. A 60m buffer around major roads can void a purchase entirely.' },
      { title: 'Foundation cost estimation', desc: 'ISRIC SoilGrids data provides clay percentage and CEC at 30–60cm depth. Black cotton clay (>45% clay) requires a raft foundation: budget KES 800k–1.5M.' },
      { title: 'Fraud pre-screening checklist', desc: "Terra Flow generates a 12-step due diligence checklist — from Ardhisasa title search to surveyor beacon verification — tailored to the plot's risk profile." },
    ]}
  />;
}
