import { useEffect, useRef, useState, useCallback } from 'react';
import { PageFlip } from 'page-flip';
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

import '../../styles/groveReport.css';

const LOADING_MESSAGES = [
  'Building Physical Reality',
  'Building Becomes Intelligent',
  'Capturing The Journey',
  'Great Projects Begin With Understanding',
];

const BUDGET_DATA = [
  { label: 'Infrastructure', amount: 14780000, color: '#10b981', pct: 35 },
  { label: 'Show Homes', amount: 17450000, color: '#3b82f6', pct: 41 },
  { label: 'Amenities', amount: 11580000, color: '#8b5cf6', pct: 15 },
  { label: 'Fees & Contingency', amount: 5120000, color: '#f59e0b', pct: 9 },
];

function fmtKES(n) {
  return 'KES ' + Math.round(n).toLocaleString('en-KE');
}

export default function GroveReport({ onClose }) {
  const bookRef = useRef(null);
  const flipRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [msgIndex, setMsgIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [satPhase, setSatPhase] = useState(0);
  const totalPages = 12;

  // Rotate loading messages
  useEffect(() => {
    if (!loading) return;
    const iv = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1200);
    return () => clearInterval(iv);
  }, [loading]);

  // Loading timer
  useEffect(() => {
    const t = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setLoading(false), 800);
    }, 4500);
    return () => clearTimeout(t);
  }, []);

  // Satellite timelapse animation loop
  useEffect(() => {
    if (loading) return;
    const iv = setInterval(() => {
      setSatPhase((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(iv);
  }, [loading]);

  // Init page-flip
  useEffect(() => {
    if (loading || !bookRef.current || flipRef.current) return;

    const pf = new PageFlip(bookRef.current, {
      width: 480,
      height: 640,
      size: 'stretch',
      minWidth: 300,
      maxWidth: 600,
      minHeight: 420,
      maxHeight: 800,
      showCover: true,
      maxShadowOpacity: 0.35,
      mobileScrollSupport: false,
      flippingTime: 800,
      useMouseEvents: true,
    });

    const pages = bookRef.current.querySelectorAll('.grove-page');
    pf.loadFromHTML(pages);

    pf.on('flip', (e) => {
      setCurrentPage(e.data);
      try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ac.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
        osc.connect(gain).connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + 0.12);
      } catch (_) {}
    });

    flipRef.current = pf;

    return () => {
      if (flipRef.current) {
        pf.destroy();
        flipRef.current = null;
      }
    };
  }, [loading]);

  const handleKeyDown = useCallback(
    (e) => {
      if (!flipRef.current) return;
      if (e.key === 'ArrowRight') flipRef.current.flipNext();
      if (e.key === 'ArrowLeft') flipRef.current.flipPrev();
      if (e.key === 'Escape' && onClose) onClose();
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return (
      <div className={`grove-loading-overlay ${fadeOut ? 'fade-out' : ''}`}>
        <img src={loadingGif} alt="" className="grove-loading-gif" />
        <div className="grove-loading-message" key={msgIndex}>
          {LOADING_MESSAGES[msgIndex]}
        </div>
        <div className="grove-loading-bar-track">
          <div
            className="grove-loading-bar-fill"
            style={{
              width: `${Math.min(100, ((msgIndex + 1) / LOADING_MESSAGES.length) * 100)}%`,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grove-report-container">
      <button className="grove-close-btn" onClick={onClose} title="Close report">
        ✕
      </button>

      <div ref={bookRef} style={{ width: '90vw', maxWidth: 960, height: '80vh' }}>
        {/* ── PAGE 1: Cover ── */}
        <div className="grove-page" data-density="hard">
          <div className="grove-page-inner grove-cover">
            <div className="grove-cover-badge">✦ Terra AI Executive Report</div>
            <h1>The Grove at Highlands of Limuru</h1>
            <h2>Residential Estate Masterplan & Feasibility Intelligence</h2>
            <div className="grove-cover-meta">
              <span>📍 Tigoni, Kiambu County</span>
              <span>📅 July 2026</span>
              <span>🏗️ Terra Planner v2.4</span>
            </div>
            <div className="grove-cover-line" />
          </div>
        </div>

        {/* ── PAGE 2: Executive Summary ── */}
        <div className="grove-page">
          <div className="grove-page-inner">
            <div className="grove-section-tag">01 — Executive Summary</div>
            <div className="grove-page-title">Project Overview & Verdict</div>
            <div className="grove-page-subtitle">
              Highlands of Limuru works best as a residential estate with generous landscape buffers, pitched roofs, and homes oriented toward hills.
            </div>

            <div className="grove-stats-row">
              <div className="grove-stat-chip">
                <span className="val">91%</span>
                <span className="lbl">Health Score</span>
              </div>
              <div className="grove-stat-chip">
                <span className="val">84/100</span>
                <span className="lbl">Buildability</span>
              </div>
              <div className="grove-stat-chip">
                <span className="val">Medium</span>
                <span className="lbl">Drainage Risk</span>
              </div>
              <div className="grove-stat-chip">
                <span className="val">High</span>
                <span className="lbl">Road Access</span>
              </div>
            </div>

            <div className="grove-card">
              <h4>🎯 Development Thesis</h4>
              <p>
                The product should feel like a calm retreat close to Nairobi, not a city apartment transplanted into countryside. Plot clustering preserves shared green corridors while giving families privacy. Strongest value will come from views, clean air, lower noise, and disciplined infrastructure.
              </p>
            </div>

            <div className="grove-card">
              <h4>⚡ First Phase Decision</h4>
              <p>
                Start with the cleaner, more open parcel and reserve steeper or more exposed areas for landscape, amenity, or later expansion. That keeps early capital efficient and reduces foundation surprises.
              </p>
            </div>

            <img src={overviewImg} alt="" className="grove-page-img" />
            <div className="grove-page-num">2 / 12</div>
          </div>
        </div>

        {/* ── PAGE 3: Site Intelligence ── */}
        <div className="grove-page">
          <div className="grove-page-inner">
            <div className="grove-section-tag">02 — Site Intelligence</div>
            <div className="grove-page-title">Land Reading & Backend Variables</div>
            <div className="grove-page-subtitle">
              Annotated spatial assessment integrating terrain movement, soil stability, and weather patterns.
            </div>

            <div className="grove-var-grid">
              <div className="grove-var-item">
                <div className="grove-var-label">Terrain Elevation</div>
                <div className="grove-var-value">2,140m ASL</div>
              </div>
              <div className="grove-var-item warn">
                <div className="grove-var-label">Slope Gradient</div>
                <div className="grove-var-value">12.4% Avg</div>
              </div>
              <div className="grove-var-item info">
                <div className="grove-var-label">Soil Type</div>
                <div className="grove-var-value">Red Volcanic</div>
              </div>
              <div className="grove-var-item">
                <div className="grove-var-label">Annual Rainfall</div>
                <div className="grove-var-value">1,450 mm</div>
              </div>
            </div>

            <div className="grove-card">
              <h4>🌧️ Climate & Moisture Logic</h4>
              <p>
                Tigoni can feel cold and damp. Homes need warmth, daylight, dry circulation, and good roof performance. Large overhangs, covered entries, and protected walkways should be part of the architectural language.
              </p>
            </div>

            <img src={siteImg} alt="" className="grove-page-img" />
            <div className="grove-page-num">3 / 12</div>
          </div>
        </div>

        {/* ── PAGE 4: Land Timelapse ── */}
        <div className="grove-page">
          <div className="grove-page-inner">
            <div className="grove-section-tag">03 — Satellite Timelapse</div>
            <div className="grove-page-title">Historical & Projected Transformation</div>
            <div className="grove-page-subtitle">
              Animated satellite spectrum tracking vegetation density, earthworks, and structural footprint growth over time.
            </div>

            <div className="grove-sat-container">
              <div className={`grove-sat-layer l1 ${satPhase === 0 ? 'active' : ''}`} />
              <div className={`grove-sat-layer l2 ${satPhase === 1 ? 'active' : ''}`} />
              <div className={`grove-sat-layer l3 ${satPhase === 2 ? 'active' : ''}`} />
              <div className={`grove-sat-layer l4 ${satPhase === 3 ? 'active' : ''}`} />
              <div className="grove-sat-grid" />
              <div className="grove-sat-scanline" />

              <div className="grove-sat-overlay">
                <div className="grove-sat-timeline">
                  <div className={`grove-sat-pill ${satPhase === 0 ? 'active' : ''}`}>2024 Raw Parcel</div>
                  <div className={`grove-sat-pill ${satPhase === 1 ? 'active' : ''}`}>2025 Earthworks</div>
                  <div className={`grove-sat-pill ${satPhase === 2 ? 'active' : ''}`}>2026 Phase 1</div>
                  <div className={`grove-sat-pill ${satPhase === 3 ? 'active' : ''}`}>2027 Full Estate</div>
                </div>
              </div>
            </div>

            <div className="grove-timeline-row">
              <div className="grove-timeline-step">
                <div className="step-num">1</div>
                <div className="step-label">Survey</div>
              </div>
              <div className="grove-timeline-step">
                <div className="step-num">2</div>
                <div className="step-label">Civil</div>
              </div>
              <div className="grove-timeline-step">
                <div className="step-num">3</div>
                <div className="step-label">Foundations</div>
              </div>
              <div className="grove-timeline-step">
                <div className="step-num">4</div>
                <div className="step-label">Superstructure</div>
              </div>
              <div className="grove-timeline-step">
                <div className="step-num">5</div>
                <div className="step-label">Handover</div>
              </div>
            </div>

            <div className="grove-card">
              <h4>🛰️ Satellite Engine Insights</h4>
              <p>
                Preserves 42% natural vegetation buffer while establishing contour access roads. Earthworks scheduled strictly within dry window (Jan-Mar).
              </p>
            </div>

            <div className="grove-page-num">4 / 12</div>
          </div>
        </div>

        {/* ── PAGE 5: Terrain & Drainage ── */}
        <div className="grove-page">
          <div className="grove-page-inner">
            <div className="grove-section-tag">04 — Hydrology & Engineering</div>
            <div className="grove-page-title">Terrain & Drainage Strategy</div>
            <div className="grove-page-subtitle">
              Preventing runoff erosion through bio-swales, underground storage tanks, and stepped foundation channels.
            </div>

            <img src={overview2Img} alt="" className="grove-page-img" />

            <div className="grove-card-grid">
              <div className="grove-card">
                <h4>🌊 Runoff Control</h4>
                <p>Interceptor ditches direct stormwater toward planted retention ponds on the eastern boundary.</p>
              </div>
              <div className="grove-card">
                <h4>📐 Contour Alignments</h4>
                <p>Roads follow natural contours to minimize cut-and-fill work by 32% across the upper slope.</p>
              </div>
            </div>

            <div className="grove-card">
              <h4>🏗️ Retaining & Stabilization</h4>
              <p>Gabion basket retaining walls preferred over hard concrete walls to maintain natural aesthetic and allow subsoil water discharge.</p>
            </div>

            <div className="grove-page-num">5 / 12</div>
          </div>
        </div>

        {/* ── PAGE 6: Planning Concept ── */}
        <div className="grove-page">
          <div className="grove-page-inner">
            <div className="grove-section-tag">05 — Planning Concept</div>
            <div className="grove-page-title">Architectural & Masterplan Vision</div>
            <div className="grove-page-subtitle">
              Low-density luxury cluster living integrated with native Limuru flora and open sightlines.
            </div>

            <img src={planImg} alt="" className="grove-page-img" />

            <div className="grove-card">
              <h4>🏡 Cluster Organization</h4>
              <p>4 distinct residential pods arranged around private central green courtyards to foster community safety and quiet pedestrian zones.</p>
            </div>

            <div className="grove-card">
              <h4>☀️ Daylight & Solar Access</h4>
              <p>Living rooms faced 15° East of South to maximize morning warmth while shading western afternoon glare in Tigoni’s cool climate.</p>
            </div>

            <div className="grove-page-num">6 / 12</div>
          </div>
        </div>

        {/* ── PAGE 7: Build Strategy ── */}
        <div className="grove-page">
          <div className="grove-page-inner">
            <div className="grove-section-tag">06 — Build Strategy</div>
            <div className="grove-page-title">Construction Phasing & Milestone Roadmap</div>
            <div className="grove-page-subtitle">
              Disciplined delivery model prioritizing core access roads before structural mobilization.
            </div>

            <img src={buildImg} alt="" className="grove-page-img" />

            <ul className="grove-checklist">
              <li>
                <span className="grove-check">✓</span> Phase 1: Site Clearance, Perimeter Fencing & Borehole Drilling
              </li>
              <li>
                <span className="grove-check">✓</span> Phase 2: 600m Sub-base Tarmac Entry Road & Main Drainage Swales
              </li>
              <li>
                <span className="grove-check">✓</span> Phase 3: 4 Model Show Homes (Stepped Raft Foundations)
              </li>
              <li>
                <span className="grove-check">✓</span> Phase 4: Clubhouse, Swimming Pool & Solar Utility Reticulation
              </li>
            </ul>

            <div className="grove-page-num">7 / 12</div>
          </div>
        </div>

        {/* ── PAGE 8: Resources ── */}
        <div className="grove-page">
          <div className="grove-page-inner">
            <div className="grove-section-tag">07 — Resources & Procurement</div>
            <div className="grove-page-title">Supply Chain & Local Material Mapping</div>
            <div className="grove-page-subtitle">
              Sourcing high-durability highland building materials from verified regional suppliers.
            </div>

            <img src={resourcesImg} alt="" className="grove-page-img" />

            <div className="grove-card-grid">
              <div className="grove-card">
                <h4>⛏️ Tigoni Stone Quarries</h4>
                <p>Cut stone & high-density ballast sourced within 8km radius, reducing freight lead times.</p>
              </div>
              <div className="grove-card">
                <h4>🌲 Cypress & Pine Timber</h4>
                <p>Locally treated timber frames for pitched roof truss structures with high moisture resistance.</p>
              </div>
            </div>

            <div className="grove-card">
              <h4>👷 Certified Engineering Team</h4>
              <p>Retaining BORAQS registered architects and NEMA certified environmental specialists for swift compliance approvals.</p>
            </div>

            <div className="grove-page-num">8 / 12</div>
          </div>
        </div>

        {/* ── PAGE 9: Budget Scale ── */}
        <div className="grove-page">
          <div className="grove-page-inner">
            <div className="grove-section-tag">08 — Financial Model</div>
            <div className="grove-page-title">Visual Budget Scale & Balance</div>
            <div className="grove-page-subtitle">
              Capital expenditure vs anticipated gross revenue projection.
            </div>

            <div className="grove-scale-wrap">
              <div className="grove-scale-beam">
                <div className="grove-scale-fulcrum" />
                <div className="grove-scale-pan left">
                  <span className="grove-pan-value">KES 48.9M</span>
                  <span className="grove-pan-label">Total CAPEX</span>
                </div>
                <div className="grove-scale-pan right">
                  <span className="grove-pan-value">KES 78.5M</span>
                  <span className="grove-pan-label">Projected Sales</span>
                </div>
              </div>

              <div className="grove-budget-bars">
                {BUDGET_DATA.map((b) => (
                  <div className="grove-bar-row" key={b.label}>
                    <div className="grove-bar-label">{b.label}</div>
                    <div className="grove-bar-track">
                      <div
                        className="grove-bar-fill"
                        style={{ width: `${b.pct}%`, background: b.color }}
                      >
                        {b.pct}%
                      </div>
                    </div>
                    <div className="grove-bar-amount">{fmtKES(b.amount)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grove-page-num">9 / 12</div>
          </div>
        </div>

        {/* ── PAGE 10: Budget Breakdown ── */}
        <div className="grove-page">
          <div className="grove-page-inner">
            <div className="grove-section-tag">09 — Budget Breakdown</div>
            <div className="grove-page-title">Itemized Line-Item Financials</div>
            <div className="grove-page-subtitle">
              Detailed construction, professional fees, and contingency allocations.
            </div>

            <table className="grove-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Scope / Item</th>
                  <th>Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr className="grove-phase-header">
                  <td colSpan={3}>Phase 1: Civil Infrastructure</td>
                </tr>
                <tr>
                  <td>Civil</td>
                  <td>Roads, Drainage & Borehole</td>
                  <td>KES 14,780,000</td>
                </tr>
                <tr className="grove-phase-header">
                  <td colSpan={3}>Phase 2: Residential Structures</td>
                </tr>
                <tr>
                  <td>Build</td>
                  <td>4 Show Homes Superstructure</td>
                  <td>KES 17,450,000</td>
                </tr>
                <tr className="grove-phase-header">
                  <td colSpan={3}>Phase 3: Amenities & Security</td>
                </tr>
                <tr>
                  <td>Amenities</td>
                  <td>Clubhouse, Perimeter & Gate</td>
                  <td>KES 11,580,000</td>
                </tr>
                <tr className="grove-phase-header">
                  <td colSpan={3}>Phase 4: Fees & Risk Buffer</td>
                </tr>
                <tr>
                  <td>Fees</td>
                  <td>BORAQS Fees + 10% Contingency</td>
                  <td>KES 5,120,000</td>
                </tr>
                <tr className="grove-table-total">
                  <td colSpan={2}>Grand Total CAPEX</td>
                  <td>KES 48,930,000</td>
                </tr>
              </tbody>
            </table>

            <div className="grove-page-num">10 / 12</div>
          </div>
        </div>

        {/* ── PAGE 11: Risk & AI Recommendations ── */}
        <div className="grove-page">
          <div className="grove-page-inner">
            <div className="grove-section-tag">10 — Intelligence Safeguards</div>
            <div className="grove-page-title">Risk Matrix & Terra AI Mitigations</div>
            <div className="grove-page-subtitle">
              Continuous monitoring parameters to keep the project on time and within budget.
            </div>

            <div className="grove-risk-item">
              <div className="grove-risk-icon warn">⚠️</div>
              <div className="grove-risk-text">
                <h5>Rain Season Earthwork Delay</h5>
                <p>Heavy Limuru rainfall between April-May can halt excavation. Complete earthworks by March 15th.</p>
              </div>
            </div>

            <div className="grove-risk-item">
              <div className="grove-risk-icon warn">⚠️</div>
              <div className="grove-risk-text">
                <h5>Soil Moisture Volatility</h5>
                <p>Conduct triaxial shear testing on lower slope before pouring foundation footings.</p>
              </div>
            </div>

            <div className="grove-risk-item">
              <div className="grove-risk-icon good">✅</div>
              <div className="grove-risk-text">
                <h5>Optimal Phased Cash Flow</h5>
                <p>Release Phase 2 funding only after 50% presales achieved on Phase 1 units.</p>
              </div>
            </div>

            <div className="grove-page-num">11 / 12</div>
          </div>
        </div>

        {/* ── PAGE 12: Back Cover ── */}
        <div className="grove-page" data-density="hard">
          <div className="grove-page-inner grove-back-cover">
            <div className="grove-back-logo">T</div>
            <h2>Terra AI Engine</h2>
            <p>
              Transforming raw land data into intelligent, actionable physical reality.
            </p>
            <div style={{ marginTop: 32, fontSize: 10, color: '#475569' }}>
              Highlands of Limuru Project Report · Confidential
            </div>
          </div>
        </div>
      </div>

      <div className="grove-page-indicator">
        {Array.from({ length: totalPages }).map((_, i) => (
          <div key={i} className={`grove-page-dot ${currentPage === i ? 'active' : ''}`} />
        ))}
      </div>

      <div className="grove-nav-hint">← → arrows or drag to flip pages</div>
    </div>
  );
}
