import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageFlip } from 'page-flip';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Droplets,
  Layers3,
  MapPin,
  Mountain,
  ShieldAlert,
  Sparkles,
  Trees,
  X,
} from 'lucide-react';

import loadingGif from '../../assets/loading_state/loading.gif';
import overviewImg from '../../../presentation_mode/planner_images/overview.jpeg';
import overview2Img from '../../../presentation_mode/planner_images/overview_2.jpeg';
import siteImg from '../../../presentation_mode/planner_images/site.jpeg';
import site2Img from '../../../presentation_mode/planner_images/site_2.jpeg';
import planImg from '../../../presentation_mode/planner_images/plan.jpeg';
import buildImg from '../../../presentation_mode/planner_images/build_2.jpeg';
import resourcesImg from '../../../presentation_mode/planner_images/resources.jpeg';
import budgetImg from '../../../presentation_mode/planner_images/budget.jpeg';
import budget2Img from '../../../presentation_mode/planner_images/budget_2.jpeg';
import terraPlannerImg from '../../assets/terra_planner.jpeg';

import '../../styles/groveReport.css';

const LOADING_MESSAGES = [
  'Building Physical Reality',
  'Building Becomes Intelligent',
  'Capturing The Journey',
  'Great Projects Begin With Understanding',
];

const TOTAL_PAGES = 12;
const CAPEX_TOTAL = 48_930_000;
const PROJECTED_SALES = 78_500_000;

const metrics = [
  ['Project health', '91%', 'Proceed with discipline'],
  ['Buildability', '84/100', 'Best first phase on open parcel'],
  ['Drainage exposure', 'Medium', 'Needs early civil design'],
  ['Vegetation retained', '42%', 'Landscape as infrastructure'],
];

const budgetItems = [
  { label: 'Civil infrastructure', amount: 14_780_000, pct: 30, tone: 'green' },
  { label: 'Show homes', amount: 17_450_000, pct: 36, tone: 'blue' },
  { label: 'Amenities and security', amount: 11_580_000, pct: 24, tone: 'gold' },
  { label: 'Fees and contingency', amount: 5_120_000, pct: 10, tone: 'slate' },
];

const reportPages = [
  {
    eyebrow: '01 / Executive Summary',
    title: 'Proceed, but let the land lead.',
    subtitle:
      'The Grove works as a premium highland estate when terrain, drainage, architecture, and cash flow are managed as one system.',
    image: overviewImg,
    Icon: Sparkles,
    body: [
      ['Development thesis', 'A calm residential retreat close to Nairobi, positioned around views, cool air, landscape privacy, and disciplined infrastructure.'],
      ['First decision', 'Start with the cleaner parcel, prove demand with a beautiful first cluster, and reserve complex slopes for landscape or later phases.'],
    ],
  },
  {
    eyebrow: '02 / Site Intelligence',
    title: 'A highland parcel with real water logic.',
    subtitle:
      'Backend variables convert terrain, rainfall, soil, and access into build decisions the team can act on.',
    image: siteImg,
    Icon: Mountain,
    facts: [
      ['Elevation', '2,140m ASL'],
      ['Average slope', '12.4%'],
      ['Soil profile', 'Red volcanic'],
      ['Annual rain', '1,450mm'],
    ],
    body: [
      ['Climate cue', 'Design for warmth, dry thresholds, roof performance, covered entries, and daylight rather than generic suburbia.'],
    ],
  },
  {
    eyebrow: '04 / Terrain and Drainage',
    title: 'Make stormwater visible, controlled, and beautiful.',
    subtitle:
      'Contour roads, planted swales, retention gardens, and gabion edges reduce erosion while preserving the estate character.',
    image: overview2Img,
    Icon: Droplets,
    body: [
      ['Runoff control', 'Interceptor drains route heavy rain toward planted retention areas before it reaches residential clusters.'],
      ['Slope strategy', 'Roads follow contours to reduce cut-and-fill, retaining costs, and harsh visual edges.'],
    ],
  },
  {
    eyebrow: '05 / Planning Concept',
    title: 'Cluster homes around landscape, not asphalt.',
    subtitle:
      'The masterplan organizes four residential pods, protected pedestrian loops, shared gardens, and view-led orientation.',
    image: planImg,
    Icon: Trees,
    body: [
      ['Estate language', 'Pitched roofs, deep overhangs, planted boundaries, and quiet material choices should make the project unmistakably Limuru.'],
      ['Buyer promise', 'Privacy, green edges, clean air, and reliable infrastructure become the core product.'],
    ],
  },
  {
    eyebrow: '06 / Build Strategy',
    title: 'Sequence the work like a risk system.',
    subtitle:
      'Survey, geotechnical testing, drainage setting-out, access roads, utilities, then show homes. No heroic shortcuts.',
    image: buildImg,
    Icon: Layers3,
    body: [
      ['Phase gate', 'Do not pour foundations until wet-weather drainage paths and soil assumptions are confirmed.'],
      ['Quality focus', 'Track road falls, roof drainage, external finishes, retaining edges, and landscape establishment every week.'],
    ],
  },
  {
    eyebrow: '07 / Resources',
    title: 'Use local availability as a strategic advantage.',
    subtitle:
      'Procurement favors nearby stone, resilient timber, moisture-ready finishes, and consultants who understand highland sites.',
    image: resourcesImg,
    Icon: CheckCircle2,
    body: [
      ['Core team', 'Surveyor, geotechnical engineer, civil engineer, architect, QS, environmental consultant, and project manager.'],
      ['Material logic', 'Specify roads, gutters, roofing, paving, timber, and drainage products for wet-season durability.'],
    ],
  },
  {
    eyebrow: '09 / Budget Breakdown',
    title: 'A budget with named risks is a usable budget.',
    subtitle:
      'Civil works, show homes, amenities, professional fees, and contingency are separated so leadership can make clear tradeoffs.',
    image: budget2Img,
    Icon: BarChart3,
    table: true,
  },
  {
    eyebrow: '10 / Risk and AI Recommendations',
    title: 'The hidden danger is late coordination.',
    subtitle:
      'Terra AI flags the project conditions most likely to damage cost, schedule, or trust if they are ignored early.',
    image: site2Img,
    Icon: ShieldAlert,
    risks: [
      ['Rain-season earthworks', 'Complete major earthworks before the April-May rain window, with temporary drainage active during construction.'],
      ['Soil moisture variation', 'Run plot-level testing before foundation details are copied across the estate.'],
      ['Cash-flow discipline', 'Release Phase 2 funding only after Phase 1 infrastructure and presale signals are verified.'],
    ],
  },
];

function fmtKES(value) {
  if (value >= 1_000_000) return `KES ${(value / 1_000_000).toFixed(value % 1_000_000 ? 1 : 0)}M`;
  return `KES ${value.toLocaleString('en-KE')}`;
}

function playFlipSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.045, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
    window.setTimeout(() => ctx.close(), 220);
  } catch {
    // Browsers can block generated audio until the first user gesture.
  }
}

function StandardPage({ page, pageNumber }) {
  const Icon = page.Icon;
  return (
    <div className="grove-page">
      <div className="grove-page-inner">
        <header className="grove-page-header">
          <span>{page.eyebrow}</span>
          <Icon size={18} />
        </header>
        <h2>{page.title}</h2>
        <p className="grove-lede">{page.subtitle}</p>
        <div className="grove-media-frame">
          <img src={page.image} alt="" />
        </div>
        {page.facts && (
          <div className="grove-fact-grid">
            {page.facts.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        )}
        {page.body && (
          <div className="grove-insight-stack">
            {page.body.map(([title, text]) => (
              <article className="grove-insight" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        )}
        {page.table && <BudgetBreakdown />}
        {page.risks && (
          <div className="grove-risk-stack">
            {page.risks.map(([title, text], index) => (
              <article key={title} className="grove-risk-row">
                <strong>{String(index + 1).padStart(2, '0')}</strong>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        )}
        <PageNumber value={pageNumber} />
      </div>
    </div>
  );
}

function PageNumber({ value }) {
  return <div className="grove-page-number">{value} / {TOTAL_PAGES}</div>;
}

function BudgetBreakdown() {
  return (
    <div className="grove-budget-list">
      {budgetItems.map((item) => (
        <div className="grove-budget-row" key={item.label}>
          <div>
            <span>{item.label}</span>
            <strong>{fmtKES(item.amount)}</strong>
          </div>
          <div className="grove-budget-track">
            <span className={`grove-budget-fill ${item.tone}`} style={{ width: `${item.pct}%` }} />
          </div>
          <em>{item.pct}%</em>
        </div>
      ))}
      <div className="grove-budget-total">
        <span>Total CAPEX</span>
        <strong>{fmtKES(CAPEX_TOTAL)}</strong>
      </div>
    </div>
  );
}

function TimelapsePage({ phase }) {
  const phases = ['2024 Raw Parcel', '2025 Earthworks', '2026 Phase 1', '2027 Full Estate'];
  return (
    <div className="grove-page">
      <div className="grove-page-inner grove-timelapse-page">
        <header className="grove-page-header">
          <span>03 / Land Timelapse</span>
          <CalendarDays size={18} />
        </header>
        <h2>Four years of land becoming legible.</h2>
        <p className="grove-lede">A CSS-driven satellite sequence tracks vegetation, access, earthworks, foundations, and completed estate footprint.</p>
        <div className="grove-timelapse">
          <div className={`grove-sat-layer raw ${phase === 0 ? 'active' : ''}`} />
          <div className={`grove-sat-layer works ${phase === 1 ? 'active' : ''}`} />
          <div className={`grove-sat-layer phase-one ${phase === 2 ? 'active' : ''}`} />
          <div className={`grove-sat-layer estate ${phase === 3 ? 'active' : ''}`} />
          <div className="grove-contour-lines" />
          <div className="grove-scanline" />
          <div className="grove-timelapse-label">
            <strong>{phases[phase]}</strong>
            <span>AI spatial memory layer</span>
          </div>
        </div>
        <div className="grove-timeline">
          {['Survey', 'Civil', 'Foundations', 'Homes', 'Handover'].map((step, index) => (
            <div key={step} className={index <= phase + 1 ? 'active' : ''}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
        <article className="grove-insight">
          <h3>AI interpretation</h3>
          <p>Preserve the green corridors first, then let roads and utilities enter along contour-safe lines. The estate should appear to grow from the terrain, not overwrite it.</p>
        </article>
        <PageNumber value={4} />
      </div>
    </div>
  );
}

function BudgetScalePage() {
  const margin = PROJECTED_SALES - CAPEX_TOTAL;
  return (
    <div className="grove-page">
      <div className="grove-page-inner grove-budget-scale-page">
        <header className="grove-page-header">
          <span>08 / Budget Scale</span>
          <BarChart3 size={18} />
        </header>
        <h2>The balance favors value, if civil risk is contained.</h2>
        <p className="grove-lede">The visual scale compares early capital exposure against projected sales capacity, with the surplus treated as a discipline buffer.</p>
        <div className="grove-balance">
          <div className="grove-balance-beam" />
          <div className="grove-balance-pivot" />
          <div className="grove-pan capex">
            <span>Total CAPEX</span>
            <strong>{fmtKES(CAPEX_TOTAL)}</strong>
          </div>
          <div className="grove-pan revenue">
            <span>Projected sales</span>
            <strong>{fmtKES(PROJECTED_SALES)}</strong>
          </div>
        </div>
        <div className="grove-margin-card">
          <span>Decision margin</span>
          <strong>{fmtKES(margin)}</strong>
          <p>Protect this upside with phase gates, presale evidence, and strict variation approvals.</p>
        </div>
        <BudgetBreakdown />
        <PageNumber value={9} />
      </div>
    </div>
  );
}

export default function GroveReport({ onClose }) {
  const bookRef = useRef(null);
  const flipRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [msgIndex, setMsgIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [satPhase, setSatPhase] = useState(0);

  const pages = useMemo(() => {
    return [
      'cover',
      reportPages[0],
      reportPages[1],
      'timelapse',
      reportPages[2],
      reportPages[3],
      reportPages[4],
      reportPages[5],
      'budget-scale',
      reportPages[6],
      reportPages[7],
      'back',
    ];
  }, []);

  useEffect(() => {
    if (!loading) return undefined;
    const interval = window.setInterval(() => {
      setMsgIndex((index) => (index + 1) % LOADING_MESSAGES.length);
    }, 1150);
    return () => window.clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFadeOut(true);
      window.setTimeout(() => setLoading(false), 650);
    }, 4300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading) return undefined;
    const interval = window.setInterval(() => {
      setSatPhase((phase) => (phase + 1) % 4);
    }, 2400);
    return () => window.clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (loading || !bookRef.current || flipRef.current) return undefined;

    const flipBook = new PageFlip(bookRef.current, {
      width: 500,
      height: 660,
      size: 'stretch',
      minWidth: 315,
      maxWidth: 620,
      minHeight: 430,
      maxHeight: 780,
      drawShadow: true,
      maxShadowOpacity: 0.32,
      showCover: true,
      mobileScrollSupport: false,
      useMouseEvents: true,
      flippingTime: 820,
    });

    flipBook.loadFromHTML(bookRef.current.querySelectorAll('.grove-page'));
    flipBook.on('flip', (event) => {
      setCurrentPage(event.data);
      playFlipSound();
    });
    flipRef.current = flipBook;

    return () => {
      flipBook.destroy();
      flipRef.current = null;
    };
  }, [loading]);

  const flipNext = useCallback(() => flipRef.current?.flipNext(), []);
  const flipPrev = useCallback(() => flipRef.current?.flipPrev(), []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'ArrowRight') flipNext();
      if (event.key === 'ArrowLeft') flipPrev();
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flipNext, flipPrev, onClose]);

  if (loading) {
    return (
      <div className={`grove-loading-overlay ${fadeOut ? 'fade-out' : ''}`}>
        <div className="grove-loading-card">
          <img src={loadingGif} alt="" />
          <span>Terra Planner</span>
          <strong key={msgIndex}>{LOADING_MESSAGES[msgIndex]}</strong>
          <div className="grove-loading-progress">
            <i style={{ width: `${((msgIndex + 1) / LOADING_MESSAGES.length) * 100}%` }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grove-report-container">
      <div className="grove-report-chrome">
        <div>
          <span>Terra Planner Report</span>
          <strong>The Grove at Highlands of Limuru</strong>
        </div>
        <button type="button" onClick={onClose} aria-label="Close report">
          <X size={18} />
        </button>
      </div>

      <div className="grove-book-shell">
        <div ref={bookRef} className="grove-book">
          <div className="grove-page" data-density="hard">
            <div className="grove-page-inner grove-cover">
              <img src={terraPlannerImg} alt="" />
              <div className="grove-cover-content">
                <span>Terra AI Executive Report</span>
                <h1>The Grove at Highlands of Limuru</h1>
                <p>Residential Estate Masterplan and Feasibility Intelligence</p>
                <div className="grove-cover-meta">
                  <span><MapPin size={14} /> Tigoni, Kiambu County</span>
                  <span><CalendarDays size={14} /> July 2026</span>
                </div>
              </div>
            </div>
          </div>

          <StandardPage page={pages[1]} pageNumber={2} />
          <StandardPage page={pages[2]} pageNumber={3} />
          <TimelapsePage phase={satPhase} />
          <StandardPage page={pages[4]} pageNumber={5} />
          <StandardPage page={pages[5]} pageNumber={6} />
          <StandardPage page={pages[6]} pageNumber={7} />
          <StandardPage page={pages[7]} pageNumber={8} />
          <BudgetScalePage />
          <StandardPage page={pages[9]} pageNumber={10} />
          <StandardPage page={pages[10]} pageNumber={11} />

          <div className="grove-page" data-density="hard">
            <div className="grove-page-inner grove-back-cover">
              <div className="grove-back-mark">T</div>
              <span>Terra AI Engine</span>
              <h2>Great projects begin with understanding.</h2>
              <p>Raw land data becomes shared memory, defensible decisions, and a clearer path from concept to built reality.</p>
              <div className="grove-back-grid">
                {metrics.map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grove-report-controls">
        <button type="button" onClick={flipPrev} aria-label="Previous page"><ArrowLeft size={17} /></button>
        <div className="grove-page-dots" aria-label={`Page ${currentPage + 1} of ${TOTAL_PAGES}`}>
          {Array.from({ length: TOTAL_PAGES }).map((_, index) => (
            <span key={index} className={currentPage === index ? 'active' : ''} />
          ))}
        </div>
        <button type="button" onClick={flipNext} aria-label="Next page"><ArrowRight size={17} /></button>
      </div>
    </div>
  );
}
