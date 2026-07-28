import { useEffect, useMemo, useState } from 'react';
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
  { id: 'workspace', label: 'Workspace', icon: collaborateIcon, question: 'How do people work together?' },
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
  workspace: {
    cards: [
      ['Team Rhythm', 'The team should work in weekly decision cycles. Architects, engineers, QS, sales, and ownership should review the same priorities. Each meeting should end with clear decisions, blockers, and owners. Site intelligence should remain visible as design changes. The workspace should reduce scattered WhatsApp decisions. Good collaboration makes the project feel smaller and more controllable.'],
      ['Decision Log', 'Every major decision should be logged with its reason, cost impact, and design impact. This matters when the team later asks why a road moved or why a cluster was phased differently. Decisions around drainage, access, view orientation, and approvals should be especially clear. A decision log protects continuity when consultants change. It also helps investors understand discipline. Terra Workspace should become the project memory.'],
      ['Communication', 'Communication should be tailored by audience. Owners need risk and money. Architects need design direction. Engineers need constraints. Buyers need confidence and timelines. County or approval stakeholders need compliance clarity. The workspace should turn one project truth into different useful outputs.'],
      ['Reviews', 'Reviews should happen at concept, schematic design, civil coordination, tender, construction start, and handover. Each review should ask whether the estate still fits the Limuru land story. If a design change harms drainage or landscape identity, it should be challenged. If it improves buildability without weakening the product, it should be welcomed. The review rhythm keeps quality intentional. This is how the project avoids drifting.'],
      ['Collaboration Tools', 'The workspace should support messages, comments, uploaded drawings, reports, calls, and approvals. Files should be organized by phase and discipline. Important messages should become tasks, not disappear in chat. Visual updates should include annotated images and site notes. The team should always know the latest source of truth. Collaboration is only useful when it reduces ambiguity.'],
      ['Governance', 'Governance should define who approves budget changes, design changes, supplier substitutions, and buyer-facing promises. Without this, the estate can lose control as pressure rises. A small steering group can review big decisions. The project manager should enforce documentation. The owner should see concise dashboards rather than every operational detail. Terra Planner should make governance feel natural.'],
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
  useEffect(() => {
    let typer;
    const wait = window.setTimeout(() => {
      let index = 0;
      const step = Math.max(8, Math.floor(3500 / Math.max(text.length, 1)));
      typer = window.setInterval(() => {
        index += Math.max(1, Math.ceil(text.length / 220));
        setVisible(text.slice(0, index));
        if (index >= text.length) window.clearInterval(typer);
      }, step);
    }, 3000);
    return () => {
      window.clearTimeout(wait);
      if (typer) window.clearInterval(typer);
    };
  }, [text, activeKey]);
  return <p>{visible}</p>;
}

function ThinkingState() {
  return (
    <div className="planner-thinking">
      <img src={loadingGif} alt="" />
      <span className="lens-faded-word thinking-word" aria-label="thinking"><strong>th</strong><span>inki</span><strong>ng</strong></span>
      <div className="planner-sentence-holder" />
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
      {thinking ? <ThinkingState /> : <TypeText text={body} activeKey={activeKey} />}
    </article>
  );
}

function PlannerView({ active }) {
  const content = TAB_CONTENT[active];
  const tones = ['mint', 'sky', 'amber', 'rose', 'violet', 'slate'];
  return (
    <div className="planner-content-grid">
      <div className="planner-image-strip">
        {content.image && <img src={content.image} alt="" />}
        <div>
          <div className="planner-ai-label"><Sparkles size={14} /> Presentation Mode</div>
          <h3>{NAV_ITEMS.find((item) => item.id === active)?.question}</h3>
          <p>Preloaded Terra Planner intelligence for a residential estate at the Highlands of Limuru.</p>
        </div>
        {content.image2 && <img src={content.image2} alt="" />}
      </div>
      <div className="planner-card-grid">
        {content.cards.map(([title, body], index) => (
          <InsightCard key={`${active}-${title}`} title={title} body={body} activeKey={active} tone={tones[index % tones.length]} />
        ))}
      </div>
    </div>
  );
}

export default function PlannerWorkspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');
  const activeItem = useMemo(() => NAV_ITEMS.find((item) => item.id === active), [active]);

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
      <aside className="planner-vertical-menu">
        <div className="planner-brand">
          <div className="planner-brand-mark">T</div>
          <div>
            <span>Terra Planner</span>
            <strong>{PROJECT_NAME}</strong>
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
