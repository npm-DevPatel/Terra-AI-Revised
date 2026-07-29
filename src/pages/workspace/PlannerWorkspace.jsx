import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CircleDollarSign, FileText, MapPinned, Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import overviewIcon from '../../assets/planner/overview.png';
import siteIcon from '../../assets/planner/site.png';
import projectIcon from '../../assets/planner/project.png';
import buildIcon from '../../assets/planner/build.png';
import resourcesIcon from '../../assets/planner/resources.png';
import collaborateIcon from '../../assets/planner/collaborate.png';
import reportIcon from '../../assets/planner/report.png';
import loadingGif from '../../assets/made_projects/4_word_loading.gif';
import overviewImage from '../../../presentation_mode/planner_images/overview.jpeg';
import overviewImage2 from '../../../presentation_mode/planner_images/overview_2.jpeg';
import siteImage from '../../../presentation_mode/planner_images/site.jpeg';
import siteImage2 from '../../../presentation_mode/planner_images/site_2.jpeg';
import planImage from '../../../presentation_mode/planner_images/plan.jpeg';
import buildImage from '../../../presentation_mode/planner_images/build_2.jpeg';
import resourcesImage from '../../../presentation_mode/planner_images/resources.jpeg';
import resourcesImage2 from '../../../presentation_mode/planner_images/resources_2.jpeg';
import budgetImage from '../../../presentation_mode/planner_images/budget.jpeg';
import budgetImage2 from '../../../presentation_mode/planner_images/budget_2.jpeg';

import { supabase } from '../../lib/supabaseClient';
import '../../styles/workspace.css';

const PROJECT_NAME = 'Highlands of Limuru';
const PROJECT_TYPE = 'Residential estate in the Highlands of Limuru';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: overviewIcon, question: 'Can this project succeed?' },
  { id: 'site', label: 'Site', icon: siteIcon, question: 'What have we learned about the land?' },
  { id: 'plan', label: 'Plan', icon: projectIcon, question: 'How should we design the community?' },
  { id: 'build', label: 'Build', icon: buildIcon, question: 'How do we turn the plan into reality?' },
  { id: 'resources', label: 'Resources', icon: resourcesIcon, question: 'Who and what do we need?' },
  { id: 'budget', label: 'Budget', Icon: CircleDollarSign, question: 'Can we afford it and optimize it?' },
  { id: 'reports', label: 'Reports', icon: reportIcon, question: 'How do we communicate progress and decisions?' },
];

const TAB_CONTENT = {
  overview: {
    image: overviewImage,
    image2: overviewImage2,
    cards: [
      ['Project Verdict', 'Yes, this project can succeed if it treats the Limuru highland character as the central design driver. The estate should not fight the terrain; it should step with it, frame views, and protect natural drainage. The cool climate is an advantage for comfort, but it also makes moisture control important. Terra would prioritize a compact first phase, strong stormwater design, and careful road geometry. The site should feel quiet, green, and premium rather than dense and hard-paved. Success comes from turning landscape constraints into a residential identity.'],
      ['Development Thesis', 'Highlands of Limuru works best as a residential estate with generous landscape buffers, pitched roofs, and homes oriented toward hills and morning light. The product should feel like a calm retreat close to Nairobi, not a city apartment transplanted into countryside. Plot clustering can preserve shared green corridors while still giving families privacy. The strongest value will come from views, clean air, lower noise, and a well-managed estate structure. Buyers will expect reliable access, water, drainage, and security. Terra Planner would sell the project as nature-led living with disciplined infrastructure underneath.'],
      ['Main Opportunity', 'The strongest opportunity is to create a community that feels anchored in Tigoni and Limuru rather than generic suburbia. The hills can shape arrival roads, walking loops, shared gardens, and clubhouse placement. Rain and cool weather can support lush planting, water harvesting, and a strong wellness narrative. The estate can target families, remote workers, and hospitality-minded buyers who want space without losing Nairobi access. A phased plan lets the developer prove demand before building everything. The land story is good; the execution has to be equally careful.'],
      ['Main Risk', 'The biggest risk is underestimating drainage and slope before design decisions are locked. Highland sites can look gentle in photos but still move water quickly during heavy rain. Roads, retaining edges, and foundations must be planned as one system. If drainage is handled late, the estate can become expensive and visually compromised. Terra would bring civil engineering into the concept phase, not after architecture. The design should make water visible, controlled, and beautiful rather than hidden and problematic.'],
      ['First Decision', 'The first decision is where the first residential cluster should sit. Terra would start with the cleaner, more open parcel and reserve steeper or more exposed areas for landscape, amenity, or later expansion. That keeps early capital efficient and reduces foundation surprises. It also gives the sales story a strong first impression. The first homes should face the landscape while maintaining privacy from internal roads. A great first phase becomes proof of concept for the rest of the estate.'],
      ['Go / No-Go', 'This is a proceed-with-discipline project, not a blind go. The demo score should be treated as a green light for deeper due diligence, not a construction permit. Title, survey, county planning, water strategy, and geotechnical checks still matter. If those checks confirm the assumptions, the estate can become a premium residential destination. If drainage or access costs spike, the density and phasing should adapt. Terra Planner keeps those decisions visible instead of burying them in separate reports.'],
    ],
  },
  site: {
    image: siteImage,
    image2: siteImage2,
    cards: [
      ['Land Reading', 'The land reads as a highland residential site with strong scenic value and real water-management responsibilities. Vegetation and cloud cover suggest a cool, moisture-rich environment. That is good for landscape quality but requires disciplined drainage. Roads should follow contours where possible instead of cutting aggressively across the slope. Build zones should be selected for stability, visibility, and access. Terra would use the site as a design partner rather than an empty platform.'],
      ['Rain And Cold', 'Tigoni and Limuru can feel cold and damp, especially during cloudy seasons. Homes need warmth, daylight, dry circulation, and good roof performance. Large overhangs, covered entries, and protected walkways should be part of the language. Interiors should capture light without becoming exposed to wind-driven rain. Materials should resist moisture and age well in a green setting. The weather is not a problem if the architecture is honest about it.'],
      ['Slope Logic', 'Slope should guide both layout and cost control. The estate should avoid forcing every home onto a flat pad because excessive cut-and-fill can become expensive and visually harsh. Split-level homes, stepped terraces, and contour roads can make the development feel native to the land. Retaining walls should be limited, planted, and integrated. Drainage channels should be planned before plot boundaries are frozen. The goal is a community that looks settled into the hillside.'],
      ['Access And Roads', 'Access roads need to be comfortable, durable, and legible in wet conditions. The entrance should make the estate feel secure and calm while allowing service vehicles to move easily. Internal roads should avoid steep, slippery runs and should include drainage edges from the beginning. Pedestrian paths can connect clusters without forcing every movement into cars. Road lighting should be low, warm, and landscape-sensitive. A good access plan protects both daily life and resale value.'],
      ['Buildability Zones', 'The best buildability zones are the parcels that combine views, manageable slope, and simple access. More exposed or complicated pieces should become landscape buffers, amenities, or later phases. This prevents the project from spending too much money solving the hardest land first. Terra would map each zone by foundation complexity, drainage exposure, view quality, and infrastructure reach. The first phase should be technically easy and commercially beautiful. That gives the development momentum.'],
      ['Backend Variables', 'Backend-style variables for the demo include terrain, drainage sensitivity, vegetation, road access, buildability score, and site constraints. These variables should appear as decisions, not just metrics. A medium drainage risk means swales, culverts, roof harvesting, and construction sequencing. Good road access means the first cluster can be delivered faster. Vegetation impact should shape buffers and privacy. Terra Planner turns variables into action.'],
    ],
  },
  plan: {
    image: planImage,
    cards: [
      ['Community Concept', 'Design the estate as a sequence of small residential clusters rather than one large block of houses. Each cluster should have a shared green edge, clear vehicle access, and protected pedestrian movement. Homes should face views where possible while avoiding direct overlooking. The plan should feel private without becoming isolated. Amenities should sit where they can borrow the landscape. This creates a community that is premium, calm, and practical.'],
      ['Home Orientation', 'Homes should face the hills where views are strongest, but orientation should also consider warmth, privacy, wind, and rain. Living rooms, terraces, and primary bedrooms can capture the landscape. Service spaces can buffer colder or wetter sides. Roof forms should handle heavy rainfall elegantly. Window placement should bring light into interiors without making them cold. Orientation is both an aesthetic decision and a comfort strategy.'],
      ['Estate Structure', 'The estate should include an arrival gate, internal loop road, visitor parking, walking paths, drainage corridors, and at least one shared amenity. Plot sizes can vary to create price diversity while maintaining a common design language. The first phase should contain the strongest show homes and easiest infrastructure. Later phases can extend into more complex land after demand is proven. Management rules should protect landscape quality. The masterplan should make the estate easier to operate, not just easier to sell.'],
      ['Landscape Strategy', 'Landscape should be infrastructure, identity, and sales value at the same time. Use native and moisture-tolerant planting to stabilize slopes and soften roads. Preserve meaningful green corridors instead of scattering leftover lawns. Drainage swales can become planted features. Shared gardens can make the estate feel lived-in before every plot is complete. The landscape should make people feel the Highlands of Limuru from the moment they enter.'],
      ['Phasing', 'Phase one should deliver the entrance, the cleanest buildable cluster, core drainage, and a small amenity. Phase two can extend roads and add homes once the first sales validate demand. Phase three can address more complex parcels or premium view lots. This limits risk and protects cash flow. Each phase should feel complete on its own. Buyers should never feel like they are living inside unfinished infrastructure.'],
      ['Design Rules', 'The estate needs a design code covering roof pitch, materials, fence heights, landscape edges, lighting, and water management. Without a code, individual houses can weaken the whole estate identity. The code should allow variety but protect harmony. Materials should feel warm, durable, and suitable for a cool highland climate. Hard boundaries should be softened with planting. A strong code turns separate homes into one recognizable community.'],
    ],
  },
  build: {
    image: buildImage,
    cards: [
      ['Execution Sequence', 'Start with survey confirmation, site clearance limits, geotechnical testing, and drainage setting-out. Do not begin visible construction before water movement is understood. The entrance road and first drainage infrastructure should be delivered early. Show homes should follow once access and utilities are dependable. Each contractor package should have clear inspection gates. The build should feel calm because the plan is doing the hard thinking upfront.'],
      ['Civil Works', 'Civil works are the backbone of this project. Roads, stormwater channels, culverts, retaining edges, and service trenches must be coordinated before houses begin. Highland rain can punish weak sequencing. Temporary drainage during construction is as important as permanent drainage after handover. Heavy machinery routes should avoid damaging future landscape areas. Terra would track civil completion as the first major project health signal.'],
      ['Foundation Approach', 'Foundations should follow geotechnical findings and slope position. Some homes may need stepped foundations or additional drainage protection. The team should avoid copying one foundation detail across every plot without checking ground conditions. Early test pits and lab results can prevent expensive redesign. Foundation decisions also affect floor levels, access steps, and retaining walls. The right foundation strategy makes the estate safer and visually cleaner.'],
      ['Quality Control', 'Quality control should focus on moisture, roof drainage, road falls, wall finishes, and landscape establishment. These are the things buyers will experience every day in Limuru weather. Inspection checklists should be tied to each phase. Site photos should be logged weekly. Any design deviation should be reviewed against drainage and estate identity. A beautiful estate can fail if quality control ignores water.'],
      ['Timeline Reality', 'The project should allow weather buffers instead of pretending every week is buildable. Rain can slow earthworks, road formation, and external finishes. Procurement should bring long-lead materials early, especially roofing, drainage products, and utility components. Show homes can be prioritized to support sales while infrastructure continues. The schedule should be honest but confident. Terra Planner should make delay risks visible before they become excuses.'],
      ['Handover', 'Handover should include as-built drainage drawings, maintenance guides, estate rules, utility maps, and homeowner care instructions. Buyers should understand how the highland environment works. The management company should inherit a clear maintenance calendar. Landscaping should be handed over with establishment responsibilities, not just planted and forgotten. Roads and drains should be inspected after the first heavy rain. The estate should improve after occupation, not decline.'],
    ],
  },
  resources: {
    image: resourcesImage,
    image2: resourcesImage2,
    cards: [
      ['Core Team', 'The project needs a surveyor, geotechnical engineer, civil engineer, architect, quantity surveyor, environmental consultant, and project manager. The civil engineer should join early because drainage is central to the concept. The architect should translate terrain into livable homes. The QS should test phasing and infrastructure cost. The project manager should keep decisions moving across disciplines. The right team prevents the estate from becoming a collection of disconnected opinions.'],
      ['Approvals', 'Approvals should include county planning confirmation, building approvals, NCA registration, environmental screening where required, and utility connection processes. Title and survey verification should happen before design commitments deepen. Any riparian, road reserve, or public easement concern must be resolved early. The approval calendar should be visible to the whole team. Missing approvals can damage financing and buyer confidence. Terra Planner treats approvals as project infrastructure.'],
      ['Materials', 'Materials should be durable in a cool, wet highland climate. Roofing, gutters, external wall finishes, paving, and timber details need careful specification. Drainage products should be sized for heavy rainfall rather than average days. Road materials should handle wet-season use. Landscape materials should support slope stability and low maintenance. Good material choices make the estate age gracefully.'],
      ['Suppliers', 'Supplier selection should prioritize reliability, delivery access, and after-sales support. Cement, steel, drainage pipes, roofing, stone, electrical, plumbing, and road materials should be mapped by lead time. Local availability can reduce cost and delay. Specialized finishes can be reserved for show homes and premium lots. The procurement plan should protect the first phase from stock surprises. Terra would compare supplier distance, price, and dependability.'],
      ['Services', 'The estate needs security, waste management, landscaping, road maintenance, water operations, and eventual residents management. These are not afterthoughts. A premium estate experience depends on operations as much as architecture. Service access should be designed into roads and back-of-house zones. Maintenance teams need storage and clear movement paths. Long-term service planning protects property values.'],
      ['Buyer Support', 'Buyers will need design guidelines, construction rules, financing information, and timelines they can trust. If plots are sold before all homes are built, the estate rules must be clear. Communication should explain why drainage, landscape, and design control matter. A buyer portal or report pack can make the project feel transparent. Sales should not overpromise completion dates. Trust becomes a resource too.'],
    ],
  },
  budget: {
    image: budgetImage,
    image2: budgetImage2,
    cards: [
      ['Budget Verdict', 'The project can be affordable if infrastructure is phased and the first cluster avoids the most complex terrain. The main budget risks are drainage, roads, retaining works, utilities, and foundation variation. These costs should be carried as named allowances rather than hidden contingencies. The estate should not chase maximum density if it damages infrastructure efficiency. A premium product can justify disciplined spending. Budget control starts with choosing the right first phase.'],
      ['Cost Drivers', 'Roads and drainage will drive a large share of early spend. Foundations can vary by plot depending on slope and soil results. Utility connections, water storage, security, and landscaping also matter. Show homes may cost more because they carry brand value. Professional fees should be protected because design coordination saves money later. Terra Planner would keep these drivers visible in every decision meeting.'],
      ['Optimization', 'Optimize by clustering homes, sharing infrastructure corridors, and avoiding hard-to-build parcels in phase one. Use landscape buffers instead of expensive retaining everywhere. Standardize key house components while allowing facade variety. Procure drainage and road materials early. Stage amenities so buyers see value without overloading first-phase capital. Optimization should protect quality, not strip it out.'],
      ['Revenue Logic', 'Revenue should be tied to view quality, plot privacy, access convenience, and amenity proximity. Premium lots can face the strongest landscape moments. More standard lots can sit closer to internal roads and shared greens. Pricing should reward the estate story, not just square metres. Early sales should validate demand before expanding. The budget works best when product tiers are clear.'],
      ['Contingency', 'A realistic contingency should sit around civil works, drainage, and foundations. These are the areas most likely to shift after survey and geotechnical confirmation. Contingency should be governed, not casually spent. Every drawdown should have a reason linked to risk reduction or value creation. If contingency starts disappearing into avoidable changes, the design process needs correction. Budget discipline is a culture, not a spreadsheet.'],
      ['Financial Controls', 'Use monthly cost reports, procurement trackers, variation approval rules, and phase-gate budgets. The QS should compare planned versus committed cost. The project manager should flag decisions that affect roads, drainage, or foundations. Sales assumptions should be updated as buyer feedback arrives. Reports should translate numbers into clear choices. Terra Planner should help the team know what to do next, not just what was spent.'],
    ],
  },

  reports: {
    cards: [
      ['Report Purpose', 'Reports should communicate progress, risk, and decisions clearly. Different audiences need different levels of detail. Investors want confidence and cost control. Buyers want timeline and product clarity. Consultants want technical instructions. A good report turns project complexity into shared understanding.'],
      ['Executive Report', 'The executive report should summarize project health, budget status, approvals, risks, and next decisions. It should be short enough to read quickly but specific enough to guide action. Every metric should connect to a decision. Photos and annotated site views should support the story. The report should show whether the project is moving or stuck. Leadership needs clarity, not noise.'],
      ['Site Report', 'The site report should document terrain, drainage, access, active works, weather effects, and quality observations. It should use images wherever possible. Issues should be logged with owners and deadlines. Repeated issues should trigger design or contractor review. Site reporting protects the estate from slow hidden problems. It also builds trust with stakeholders.'],
      ['Budget Report', 'The budget report should compare estimate, committed cost, actual spend, contingency, and forecast. It should call out cost movement early. Civil works, drainage, foundations, and utilities deserve special attention. Variations should include reasons and approval status. The report should help the owner choose, not panic. Money needs narrative and numbers together.'],
      ['Buyer Report', 'The buyer-facing report should be beautiful, calm, and honest. It can show progress photos, completed milestones, upcoming works, and estate vision. It should avoid technical clutter but not hide reality. Buyers should feel the project is managed professionally. Clear communication reduces anxiety during construction. The Highlands of Limuru story should remain visible throughout.'],
      ['Open Report Page', 'This tab is a presentation preview, but the action should move to the Terra Report page. That is where a fake report can be loaded later. Planner should prepare the story and Report should package it. The handoff should feel natural. Users should understand that planning decisions become reportable evidence. Click the Reports action to continue the demo.'],
    ],
  },
};

function PlannerIcon({ item, active }) {
  if (item.icon) return <img src={item.icon} alt="" className="planner-nav-icon" />;
  const Icon = item.Icon;
  return <Icon size={22} color={active ? '#0f766e' : '#64748b'} />;
}

function TypeText({ text, activeKey }) {
  const [visible, setVisible] = useState('');
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    let typer;
    let pauseTimer;
    const wait = window.setTimeout(() => {
      let index = 0;
      const step = Math.max(14, Math.floor(3300 / Math.max(text.length, 1)));
      const pauseAt = Math.floor(text.length * 0.52);
      typer = window.setInterval(() => {
        if (index >= pauseAt && index < pauseAt + 4) {
          window.clearInterval(typer);
          setPaused(true);
          pauseTimer = window.setTimeout(() => {
            setPaused(false);
            typer = window.setInterval(() => {
              index += Math.max(2, Math.ceil(text.length / 180));
              setVisible(text.slice(0, index));
              if (index >= text.length) window.clearInterval(typer);
            }, step);
          }, 420);
          return;
        }
        index += Math.max(1, Math.ceil(text.length / 220));
        setVisible(text.slice(0, index));
        if (index >= text.length) window.clearInterval(typer);
      }, step);
    }, 3000);
    return () => {
      window.clearTimeout(wait);
      if (pauseTimer) window.clearTimeout(pauseTimer);
      if (typer) window.clearInterval(typer);
    };
  }, [text, activeKey]);
  return <p>{visible}<span className={`planner-type-cursor ${paused ? 'paused' : ''}`} /></p>;
}

function ThinkingState({ lines = 4 }) {
  return (
    <div className="planner-thinking">
      <img src={loadingGif} alt="" />
      <span className="lens-faded-word thinking-word" aria-label="thinking"><strong>th</strong><span>inki</span><strong>ng</strong></span>
      <div className="planner-line-loader" style={{ '--line-count': lines }}>
        {Array.from({ length: lines }).map((_, index) => <span key={index} />)}
      </div>
    </div>
  );
}

function InsightCard({ title, body, activeKey, tone = 'mint' }) {
  const [thinking, setThinking] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setThinking(false), 3000);
    return () => window.clearTimeout(timer);
  }, [activeKey]);
  return (
    <article className={`planner-insight-card ${tone}`}>
      <h3>{title}</h3>
      {thinking ? <ThinkingState lines={Math.min(6, Math.max(4, Math.ceil(body.length / 150)))} /> : <TypeText text={body} activeKey={activeKey} />}
    </article>
  );
}

function ReadingBridge({ previousTitle, nextTitle, index }) {
  if (index === 0) {
    return (
      <div className="planner-reading-bridge first">
        <span>AI Brief</span>
        <h4>Start with the question, then move through the evidence.</h4>
        <p>Terra Planner reads this like a project book: each section builds on the last decision.</p>
      </div>
    );
  }
  return (
    <div className="planner-reading-bridge">
      <span>AI Brief</span>
      <h4>{previousTitle} sets up {nextTitle}</h4>
      <p>The previous note frames the risk or opportunity; the next note turns it into a clearer planning move.</p>
    </div>
  );
}

// ── Budget data ────────────────────────────────────────────────────────────
const BUDGET_PHASES = [
  {
    phase: 'Phase 1 — Infrastructure',
    color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0',
    items: [
      { label: 'Survey & geotechnical testing', qty: 1, unit: 380000, note: 'Full topographic + soil pits' },
      { label: 'Entrance road (600 m tarmac)', qty: 600, unit: 8500, note: 'Sub-base, base, AC wearing' },
      { label: 'Internal gravel roads', qty: 1200, unit: 3200, note: 'Compacted murram' },
      { label: 'Stormwater drainage system', qty: 1, unit: 2800000, note: 'Culverts, channels, outfalls' },
      { label: 'Perimeter security fence', qty: 900, unit: 4500, note: 'Chain link + concrete posts' },
      { label: 'Borehole + water storage (50,000 L)', qty: 1, unit: 1200000, note: 'Pump, tank, distribution' },
      { label: 'Electrical reticulation', qty: 1, unit: 950000, note: 'Poles, cabling, metering' },
    ],
  },
  {
    phase: 'Phase 2 — Show Homes (4 units)',
    color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe',
    items: [
      { label: 'Foundations (strip + raft)', qty: 4, unit: 320000, note: 'Avg per unit — slope adjusted' },
      { label: 'Superstructure (walls, slab, roof)', qty: 4, unit: 2100000, note: 'Incl. pitched roof, tile' },
      { label: 'Internal finishes & MEP', qty: 4, unit: 1450000, note: 'Plumbing, elec, tiles, joinery' },
      { label: 'External works (paving, planting)', qty: 4, unit: 280000, note: 'Per unit landscaping' },
      { label: 'Sales office / show unit fit-out', qty: 1, unit: 850000, note: 'Branded interior fit-out' },
    ],
  },
  {
    phase: 'Phase 3 — Amenities & Common Areas',
    color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe',
    items: [
      { label: 'Clubhouse (200 m²)', qty: 200, unit: 45000, note: 'Lounge, gym, boardroom' },
      { label: 'Shared gardens & landscaping', qty: 1, unit: 1600000, note: 'Incl. specimen trees, turf' },
      { label: "Children's play area", qty: 1, unit: 420000, note: 'Equipment + safety surfacing' },
      { label: 'Gatehouse & guardroom', qty: 1, unit: 380000, note: 'Block construction, CCTV' },
      { label: 'Waste management infrastructure', qty: 1, unit: 180000, note: 'Skip bays, signage' },
    ],
  },
];

function fmtKES(n) {
  if (n == null) return '—';
  return 'KES ' + Math.round(n).toLocaleString('en-KE');
}

function BudgetView() {
  const constructionBase = BUDGET_PHASES.reduce((s, ph) =>
    s + ph.items.reduce((ps, it) => ps + it.unit * it.qty, 0), 0);
  const archFee = constructionBase * 0.05;
  const engFees = 680000 + 420000 + 240000 + 85000 * 8;
  const contingency = constructionBase * 0.10;
  const grandTotal = constructionBase + archFee + engFees + contingency;

  const phaseTotals = BUDGET_PHASES.map(ph =>
    ph.items.reduce((s, it) => s + it.unit * it.qty, 0));
  const feesTotal = archFee + engFees + contingency;

  const SUMMARY = [
    { label: 'Infrastructure', value: phaseTotals[0], color: '#10b981' },
    { label: 'Show Homes', value: phaseTotals[1], color: '#3b82f6' },
    { label: 'Amenities', value: phaseTotals[2], color: '#8b5cf6' },
    { label: 'Fees & Contingency', value: feesTotal, color: '#f59e0b' },
  ];

  const FEES = [
    { label: 'Architect fees (5% of construction cost)', amount: archFee, note: 'BORAQS regulated scale' },
    { label: 'Civil / structural engineer', amount: 680000, note: 'Design + site supervision' },
    { label: 'Quantity surveyor', amount: 420000, note: 'Bills of quantities + monitoring' },
    { label: 'Environmental consultant (NEMA)', amount: 240000, note: 'EIA screening report' },
    { label: 'Project management (8 months)', amount: 85000 * 8, note: 'Resident PM @ KES 85k/mo' },
    { label: 'Contingency (10% of construction)', amount: contingency, note: 'Applied to all build costs' },
  ];

  return (
    <div style={{ paddingBottom: 48, maxWidth: 900 }}>
      {/* Grand total hero */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 20, padding: '28px 32px', marginBottom: 28, color: '#fff' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 6 }}>TOTAL PROJECT ESTIMATE — ALL PHASES</div>
        <div style={{ fontSize: 38, fontWeight: 900, color: '#10b981' }}>{fmtKES(grandTotal)}</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Highlands of Limuru Residential Estate · Tigoni, Kiambu County</div>
        <div style={{ display: 'flex', gap: 3, marginTop: 20, height: 10, borderRadius: 6, overflow: 'hidden' }}>
          {SUMMARY.map(s => (
            <div key={s.label} style={{ flex: s.value, background: s.color }} title={`${s.label}: ${fmtKES(s.value)}`} />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 24px', marginTop: 12 }}>
          {SUMMARY.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
              {s.label} · <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{fmtKES(s.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Phase tables */}
      {BUDGET_PHASES.map((ph, idx) => {
        const total = phaseTotals[idx];
        return (
          <div key={ph.phase} style={{ background: ph.bg, border: `1px solid ${ph.border}`, borderRadius: 16, marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderBottom: `1px solid ${ph.border}` }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{ph.phase}</div>
              <div style={{ fontWeight: 900, fontSize: 18, color: ph.color }}>{fmtKES(total)}</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 22px', fontWeight: 700, color: '#64748b' }}>Line Item</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 700, color: '#64748b' }}>Qty × Rate</th>
                  <th style={{ textAlign: 'right', padding: '10px 22px', fontWeight: 700, color: '#64748b' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {ph.items.map((it, i) => (
                  <tr key={it.label} style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
                    <td style={{ padding: '11px 22px', color: '#0f172a', fontWeight: 600 }}>
                      {it.label}
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginTop: 2 }}>{it.note}</div>
                    </td>
                    <td style={{ padding: '11px 16px', textAlign: 'right', color: '#475569', whiteSpace: 'nowrap' }}>
                      {it.qty.toLocaleString()} × {fmtKES(it.unit)}
                    </td>
                    <td style={{ padding: '11px 22px', textAlign: 'right', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>
                      {fmtKES(it.unit * it.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `2px solid ${ph.border}` }}>
                  <td colSpan={2} style={{ padding: '12px 22px', fontWeight: 700, color: '#475569' }}>Phase Total</td>
                  <td style={{ padding: '12px 22px', textAlign: 'right', fontWeight: 900, fontSize: 15, color: ph.color }}>{fmtKES(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        );
      })}

      {/* Fees & contingency */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 16, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderBottom: '1px solid #fde68a' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>Professional Fees &amp; Contingency</div>
          <div style={{ fontWeight: 900, fontSize: 18, color: '#f59e0b' }}>{fmtKES(feesTotal)}</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {FEES.map((f, i) => (
              <tr key={f.label} style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
                <td style={{ padding: '11px 22px', color: '#0f172a', fontWeight: 600 }}>
                  {f.label}
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginTop: 2 }}>{f.note}</div>
                </td>
                <td style={{ padding: '11px 22px', textAlign: 'right', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{fmtKES(f.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #fde68a' }}>
              <td style={{ padding: '12px 22px', fontWeight: 700, color: '#475569' }}>Fees Total</td>
              <td style={{ padding: '12px 22px', textAlign: 'right', fontWeight: 900, fontSize: 15, color: '#f59e0b' }}>{fmtKES(feesTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Grand total row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', borderRadius: 14, padding: '18px 24px', marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>Grand Total (All Phases)</div>
        <div style={{ fontWeight: 900, fontSize: 22, color: '#10b981' }}>{fmtKES(grandTotal)}</div>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 20px', fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
        <strong style={{ color: '#0f172a' }}>Disclaimer:</strong> Order-of-magnitude estimates based on 2025 Kenyan construction cost benchmarks for Kiambu County highland terrain. Final figures must be verified by a registered Quantity Surveyor after geotechnical investigation and detailed design.
      </div>
    </div>
  );
}

// ── Resources data ─────────────────────────────────────────────────────────
const RESOURCE_CATEGORIES = [
  {
    key: 'hardware',
    label: 'Hardware & Materials',
    color: '#10b981',
    query: 'hardware store building materials Limuru Kenya',
    contacts: [
      { name: 'Timber Mart Limuru', phone: '+254 722 123 456', address: 'Limuru Town Centre', type: 'Timber & Steel' },
      { name: 'Bamburi Cement Dealer — Tigoni', phone: '+254 733 456 789', address: 'Tigoni Road, Limuru', type: 'Cement & Aggregates' },
      { name: 'Kiambu Hardware Hub', phone: '+254 700 987 654', address: 'Kiambu Road, Kiambu', type: 'General Hardware' },
    ],
  },
  {
    key: 'contractors',
    label: 'Civil Contractors',
    color: '#3b82f6',
    query: 'civil construction contractor Limuru Kiambu Kenya',
    contacts: [
      { name: 'Highlands Civil Works Ltd', phone: '+254 722 334 455', address: 'Limuru Road, Nairobi', type: 'Roads & Drainage' },
      { name: 'Rift Earthmovers Kenya', phone: '+254 711 223 344', address: 'Tigoni, Limuru', type: 'Excavation & Compaction' },
      { name: 'Kiambu Graders & Plant Hire', phone: '+254 733 667 788', address: 'Kiambu Town', type: 'Plant & Equipment' },
    ],
  },
  {
    key: 'water',
    label: 'Water & Boreholes',
    color: '#0ea5e9',
    query: 'borehole drilling water supply Limuru Kenya',
    contacts: [
      { name: 'Aquatek Borehole Drillers', phone: '+254 722 556 677', address: 'Limuru, Kiambu', type: 'Borehole Drilling' },
      { name: 'Limuru Water & Sewerage Co.', phone: '+254 20 204 4000', address: 'Limuru Town', type: 'Municipal Water' },
      { name: 'Hydroflow Kenya Ltd', phone: '+254 733 445 566', address: 'Tigoni Road', type: 'Tanks & Pumps' },
    ],
  },
  {
    key: 'roofing',
    label: 'Stone, Timber & Roofing',
    color: '#f59e0b',
    query: 'roofing materials stone quarry timber yard Limuru',
    contacts: [
      { name: 'Tigoni Stone Quarry', phone: '+254 722 778 899', address: 'Tigoni, Limuru', type: 'Cut Stone & Ballast' },
      { name: 'Limuru Timber Yard', phone: '+254 711 889 900', address: 'Limuru Town Road', type: 'Hardwood & Softwood' },
      { name: 'IronShield Roofing — Kiambu', phone: '+254 700 112 233', address: 'Kiambu Road', type: 'Mabati & IBR Sheets' },
    ],
  },
];

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const LIMURU_CENTER = { lat: -1.1167, lng: 36.6500 };

function ResourcesView() {
  const [activeCategory, setActiveCategory] = useState(RESOURCE_CATEGORIES[0]);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  function clearMarkers() {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
  }

  function searchCategory(map, cat) {
    if (!map || !window.google) return;
    clearMarkers();
    const service = new window.google.maps.places.PlacesService(map);
    service.textSearch({ query: cat.query, location: LIMURU_CENTER, radius: 25000 }, (results, status) => {
      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results) return;
      results.slice(0, 8).forEach(place => {
        const marker = new window.google.maps.Marker({
          map,
          position: place.geometry.location,
          title: place.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: cat.color,
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
        });
        const iw = new window.google.maps.InfoWindow({
          content: `<div style="font-family:system-ui;padding:4px 2px;max-width:200px"><strong style="font-size:13px">${place.name}</strong><br/><span style="font-size:11px;color:#64748b">${place.formatted_address || ''}</span>${place.rating ? `<br/><span style="font-size:11px;color:#f59e0b">★ ${place.rating}</span>` : ''}</div>`,
        });
        marker.addListener('click', () => iw.open(map, marker));
        markersRef.current.push(marker);
      });
    });
  }

  function initMap() {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: LIMURU_CENTER,
      zoom: 12,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
        { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e8f7' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      ],
    });
    mapInstanceRef.current = map;
    searchCategory(map, RESOURCE_CATEGORIES[0]);
  }

  useEffect(() => {
    if (window.google?.maps) { initMap(); return; }
    const existing = document.getElementById('gmaps-places-script');
    if (existing) { existing.addEventListener('load', initMap); return; }
    const script = document.createElement('script');
    script.id = 'gmaps-places-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);
  }, []);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    if (mapInstanceRef.current) searchCategory(mapInstanceRef.current, cat);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>
      {/* Category pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {RESOURCE_CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => handleCategoryChange(cat)}
            style={{
              padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 700,
              border: `1.5px solid ${activeCategory.key === cat.key ? cat.color : '#e2e8f0'}`,
              background: activeCategory.key === cat.key ? `${cat.color}18` : '#fff',
              color: activeCategory.key === cat.key ? cat.color : '#64748b',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', height: 380 }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Contact cards */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12 }}>
          Recommended contacts — {activeCategory.label}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {activeCategory.contacts.map(c => (
            <div key={c.name} style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 14, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>{c.name}</div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: `${activeCategory.color}18`, color: activeCategory.color, whiteSpace: 'nowrap', marginLeft: 8, flexShrink: 0 }}>{c.type}</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>📍 {c.address}</div>
              <a
                href={`tel:${c.phone.replace(/\s/g, '')}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 13, fontWeight: 700, color: activeCategory.color, textDecoration: 'none', background: `${activeCategory.color}12`, padding: '6px 12px', borderRadius: 8 }}
              >
                📞 {c.phone}
              </a>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
        Map shows live Places API results near Limuru/Tigoni. Contact details for the curated supplier cards are representative — always verify before engaging.
      </div>
    </div>
  );
}

// ── Generic PlannerView ─────────────────────────────────────────────────────
function PlannerView({ active }) {
  if (active === 'budget') return <BudgetView />;
  if (active === 'resources') return <ResourcesView />;

  const content = TAB_CONTENT[active];
  const tones = ['mint', 'sky', 'amber', 'rose', 'violet', 'slate'];
  return (
    <div className="planner-content-grid">
      <div className="planner-image-strip">
        <div className="planner-image-copy">
          <div className="planner-ai-label"><Sparkles size={14} /> Presentation Mode</div>
          <h3>{NAV_ITEMS.find((item) => item.id === active)?.question}</h3>
          <p>Preloaded Terra Planner intelligence for a residential estate at the Highlands of Limuru.</p>
        </div>
        <div className="planner-image-row">
          {content.image && <img src={content.image} alt="" />}
          {content.image2 && <img src={content.image2} alt="" />}
        </div>
      </div>
      <div className="planner-reading-flow">
        {content.cards.map(([title, body], index) => (
          <div key={`${active}-${title}`} className="planner-reading-section">
            <ReadingBridge
              index={index}
              previousTitle={content.cards[index - 1]?.[0]}
              nextTitle={title}
            />
            <InsightCard title={title} body={body} activeKey={active} tone={tones[index % tones.length]} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PlannerWorkspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');
  const [selectionMenu, setSelectionMenu] = useState(null);
  const activeItem = useMemo(() => NAV_ITEMS.find((item) => item.id === active), [active]);
  const [projectName, setProjectName] = useState(PROJECT_NAME);

  // Fetch project name
  useEffect(() => {
    if (!projectId) return;
    supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single()
      .then(({ data }) => {
        if (data?.name) setProjectName(data.name);
      });
  }, [projectId]);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (!text) {
        setSelectionMenu(null);
        return;
      }
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) return;
      setSelectionMenu({
        text,
        x: Math.min(rect.left + rect.width / 2, window.innerWidth - 110),
        y: Math.max(rect.top - 44, 72),
      });
    };
    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  const handleNav = (item) => {
    if (item.id === 'reports') {
      setActive(item.id);
      window.setTimeout(() => navigate(`/workspace/${projectId}/flow`), 650);
      return;
    }
    setActive(item.id);
  };



  return (
    <div className="planner-screen">
      {selectionMenu && (
        <button
          className="planner-selection-capsule"
          style={{ left: selectionMenu.x, top: selectionMenu.y }}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setSelectionMenu({ ...selectionMenu, opened: true })}
        >
          <Sparkles size={13} />
          AI context
        </button>
      )}
      {selectionMenu?.opened && (
        <div className="planner-context-popover" style={{ left: selectionMenu.x, top: selectionMenu.y + 38 }}>
          <strong>Preloaded context</strong>
          <p>This highlighted phrase will open a Terra explanation in presentation mode. For now, Terra marks it as a decision point for design, cost, risk, or coordination.</p>
        </div>
      )}
      <aside className="planner-vertical-menu">
        <div className="planner-brand">
          <div className="planner-brand-mark">T</div>
          <div>
            <span>Terra Planner</span>
            <strong>{projectName}</strong>
          </div>
        </div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className={`planner-nav-button ${active === item.id ? 'active' : ''}`}
              title={item.label}
            >
              <PlannerIcon item={item} active={active === item.id} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="planner-main">
        {active !== 'workspace' && (
          <header className="planner-top">
            <div className="planner-section-header">
              <span>{PROJECT_TYPE}</span>
              <h2>{activeItem?.label || 'Overview'}</h2>
              <p>{activeItem?.question}</p>
            </div>
            <div className="planner-top-actions">
              <button onClick={() => navigate(`/workspace/${projectId}/lens`)}><MapPinned size={14} /> Lens</button>
              <button onClick={() => navigate(`/workspace/${projectId}/flow`)}><FileText size={14} /> Reports</button>
            </div>
          </header>
        )}

        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="planner-view"
        >
          <PlannerView active={active} />
        </motion.div>
      </main>
    </div>
  );
}
