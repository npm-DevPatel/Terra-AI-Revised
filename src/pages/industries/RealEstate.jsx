import SolutionPage from '../solutions/SolutionPage';
export default function RealEstate() {
  return <SolutionPage
    badge="Industry — Real Estate"
    badgeBg="bg-violet-100 text-violet-700"
    headline={'Real Estate'}
    accentWord="decisions backed by data."
    accentColor="from-violet-500 to-purple-500"
    subtext="Terra AI gives real estate developers and investors the site intelligence to move faster, bid smarter, and eliminate the due diligence surprises that kill deals."
    benefits={[
      'Portfolio site screening — analyse 50+ plots at once',
      'Pre-bid risk reports in 60 seconds per plot',
      'Foundation cost & infrastructure budget by site',
      'Investor-ready PDF reports for fund review',
      'Market price benchmarking by location tier',
    ]}
    ctaLabel="Start a Free Analysis"
    ctaColor="bg-violet-500 hover:bg-violet-600"
    chatDemo="home"
    stats={[
      { value: '3x', label: 'Faster site screening' },
      { value: '98%', label: 'Risk detection accuracy' },
      { value: 'KES 0', label: 'First analysis cost' },
      { value: '100%', label: 'Kenya coverage' },
    ]}
    useCases={[
      { title: 'Pre-bid due diligence', desc: 'Screen a target acquisition against 15+ risk vectors in 60 seconds — before spending KES 200,000 on a formal geotechnical survey.' },
      { title: 'Investor portfolio reporting', desc: 'Generate lender-grade site reports for every parcel in a portfolio with consistent formatting, risk scoring, and cost estimates.' },
      { title: 'Title fraud pre-screening', desc: 'Cross-reference seller claims against satellite data, riparian buffers, and demolition zones before engaging a conveyancing lawyer.' },
      { title: 'Price benchmarking', desc: 'Terra AI benchmarks asking prices against area-specific land value matrices across 200+ Kenyan locations — flagging overpriced and suspiciously cheap listings.' },
    ]}
  />;
}
