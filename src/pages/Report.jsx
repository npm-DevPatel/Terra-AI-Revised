import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, XCircle, Download, ArrowLeft,
  MapPin, Zap, Droplets, Shield, Building2,
  Activity, DollarSign, ChevronRight, ChevronDown, ChevronUp, Printer
} from 'lucide-react';
import { clsx } from 'clsx';
import { pdf } from '@react-pdf/renderer';
import MainLayout from '../components/layout/MainLayout';
import Button from '../components/ui/Button';
import ChatAssistant from '../components/results/ChatAssistant';
import useTerraStore from '../store/useTerraStore';
import { TerraReportDocument } from '../components/pdf/TerraReportDocument';
import { getPriceEstimate, PLOT_SIZE_TO_ACRES, OVERCHARGE_THRESHOLD_PERCENT } from '../utils/pricingMatrix';

/**
 * Report.jsx — Terra AI Pre-Purchase Land Screener
 * ─────────────────────────────────────────────────────────────
 * Pivoted from "Geospatial Data Platform" to "Pre-Purchase Screener & Fraud Detector".
 * Answers three buyer questions instantly:
 *   1. Is this land legally safe? (Red/Yellow/Green VerdictBanner)
 *   2. Is the broker overcharging me? (PricingCalculator)
 *   3. What exact steps must I take next? (DueDiligenceChecklist)
 */

// ─── Utility formatters ────────────────────────────────────────
function fmt(val, suffix = '') {
  if (val == null) return '—';
  return `${val}${suffix}`;
}

function fmtKes(val) {
  if (val == null || val === 0) return '—';
  return `KES ${Number(val).toLocaleString()}`;
}

// ─── Inline Markdown Renderer ─────────────────────────────────
function renderBody(text) {
  if (!text) return null;
  function parseBold(str) {
    // Handle **bold** and *italic* — both should render as strong/em, not show *
    const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-terra-heading">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <em key={i} className="text-terra-body">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  }
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trimStart();
        // Numbered list: "1. text" or "1) text"
        const numbered = trimmed.match(/^(\d+)[.)\s]\s*(.*)$/);
        if (numbered) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-xs font-bold text-terra-muted mt-0.5 shrink-0 w-4">{numbered[1]}.</span>
              <p className="text-sm text-terra-body leading-relaxed">{parseBold(numbered[2])}</p>
            </div>
          );
        }
        // Bullet: "* text" or "- text" or "• text"
        const bullet = trimmed.match(/^[*\-•]\s+(.*)$/);
        if (bullet) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-terra-muted mt-0.5 shrink-0">–</span>
              <p className="text-sm text-terra-body leading-relaxed">{parseBold(bullet[1])}</p>
            </div>
          );
        }
        return <p key={i} className="text-sm text-terra-body leading-relaxed">{parseBold(trimmed)}</p>;
      })}
    </div>
  );
}

// ─── Section Card (for AI sections) ───────────────────────────
const SECTION_ICONS = {
  legal_risks:      Shield,
  foundation_costs: Building2,
  infrastructure:   Zap,
  legal:            Shield,
  topography:       Activity,
  environmental:    Droplets,
  zoning:           Building2,
  solar:            Activity,
  fraud_checklist:  Shield,
  recommendation:   ChevronRight,
  soil_geotech:     Building2,
  drainage_flood:   Droplets,
};

const RISK_BADGE = {
  high:     'bg-red-50 border-red-200 text-red-700',
  critical: 'bg-red-100 border-red-300 text-red-800',
  medium:   'bg-amber-50 border-amber-200 text-amber-700',
  low:      'bg-emerald-50 border-emerald-200 text-emerald-700',
  info:     'bg-blue-50 border-blue-200 text-blue-700',
};

function SectionCard({ section, index }) {
  const Icon = SECTION_ICONS[section.id] ?? Activity;
  const badgeClass = RISK_BADGE[section.risk_level] ?? RISK_BADGE.info;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      className="bg-white rounded-2xl border border-terra-border p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-terra-body" />
          </div>
          <h3 className="font-bold text-terra-heading text-sm">{section.title}</h3>
        </div>
        <span className={clsx('text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border', badgeClass)}>
          {section.risk_level}
        </span>
      </div>
      {renderBody(section.body)}
      {section.estimated_grid_connection_cost_kes > 0 && (
        <p className="mt-2 text-xs font-semibold text-terra-heading">
          Est. Grid Connection: {fmtKes(section.estimated_grid_connection_cost_kes)}
        </p>
      )}
    </motion.div>
  );
}

// ─── AI Engine Status Bar REMOVED ─────────────────────────────
// Replaced per user request — "remove the Gemini 2.5 AI synthesis engine section"

// ─── Stat Block (for filtered geo stats) ──────────────────────
function StatBlock({ icon: Icon, label, value, highlight }) {
  return (
    <div className={clsx('bg-white rounded-2xl border p-4 flex flex-col gap-1', highlight ? 'border-amber-200' : 'border-terra-border')}>
      <div className="flex items-center gap-2 text-terra-muted mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-black text-terra-heading">{value}</p>
    </div>
  );
}

// ─── VERDICT BANNER COMPONENT ─────────────────────────────────
function VerdictBanner({ payload }) {
  const isFatal   = payload.demolition_risk || payload.riparian_breach;
  const isCaution = !isFatal && (payload.aviation_risk || (payload.cost_summary?.estimated_foundation_premium_kes > 0));

  if (isFatal) return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="verdict-banner verdict-red"
    >
      <XCircle className="verdict-icon-svg" />
      <div>
        <h2>DO NOT PROCEED</h2>
        <p>High risk of government demolition or forced repossession detected. <strong>Do not pay any deposit until these flags are legally resolved.</strong></p>
        <p className="verdict-subtext">Trigger: {payload.demolition_risk ? 'Demolition / Road Reserve Risk' : 'Riparian Zone Breach'}</p>
      </div>
    </motion.div>
  );

  if (isCaution) return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="verdict-banner verdict-yellow"
    >
      <AlertTriangle className="verdict-icon-svg" />
      <div>
        <h2>PROCEED WITH CAUTION</h2>
        <p>Legal height restrictions or expensive soil conditions detected. <strong>Adjust your budget before committing.</strong></p>
        <p className="verdict-subtext">Trigger: {payload.aviation_risk ? 'Aviation height cap' : 'Foundation cost premium'}</p>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="verdict-banner verdict-green"
    >
      <CheckCircle2 className="verdict-icon-svg" />
      <div>
        <h2>CLEAR FOR DUE DILIGENCE</h2>
        <p>No major geospatial red flags detected by our satellite analysis. <strong>Proceed to the legal checks below before paying anything.</strong></p>
      </div>
    </motion.div>
  );
}

// ─── PRICING CALCULATOR COMPONENT ────────────────────────────
/**
 * Calculates whether the broker's asking price is fair for this area.
 * Lifts result up to parent via onResultChange so it can be passed into the PDF.
 */
function PricingCalculator({ payload, onResultChange }) {
  const [askingPrice, setAskingPrice] = useState('');
  const [plotSizeKey, setPlotSizeKey] = useState('50x100 ft (0.115 acres)');

  const acreage = PLOT_SIZE_TO_ACRES[plotSizeKey];

  // Location lookup: try progressively broader tokens.
  // Pass county separately so getPriceEstimate uses it as fallback.
  // Order: ward → place_name → subcounty → neighborhood → county fallback.
  const county = payload.county || '';
  const locationTokens = [
    payload.ward,
    payload.place_name,
    payload.subcounty,
    payload.neighborhood,
  ].filter(Boolean);

  let priceEstimate = null;
  for (const token of locationTokens) {
    const result = getPriceEstimate(token, county);
    // Prefer a match that isn\'t a generic DEFAULT_* fallback
    if (!result.matchedKey.startsWith('DEFAULT_')) {
      priceEstimate = result;
      break;
    }
    // Keep the first fallback as backup
    if (!priceEstimate) priceEstimate = result;
  }
  // If nothing matched at all, run county-only lookup
  if (!priceEstimate) {
    priceEstimate = getPriceEstimate('', county);
  }

  const { pricePerAcre, matchedKey, confidence } = priceEstimate;

  const userPricePerAcre = askingPrice && acreage ? parseFloat(askingPrice) / acreage : null;
  const overchargePercent = userPricePerAcre
    ? Math.round(((userPricePerAcre - pricePerAcre) / pricePerAcre) * 100)
    : null;

  const isOvercharged  = overchargePercent !== null && overchargePercent > OVERCHARGE_THRESHOLD_PERCENT;
  const isUnderpriced  = overchargePercent !== null && overchargePercent < -25;

  // Lift result to parent whenever calculation changes
  const handlePriceChange = useCallback((newPrice) => {
    setAskingPrice(newPrice);
    const price = parseFloat(newPrice);
    if (newPrice && acreage && !isNaN(price)) {
      const calcPricePerAcre = price / acreage;
      const calcOvercharge   = Math.round(((calcPricePerAcre - pricePerAcre) / pricePerAcre) * 100);
      onResultChange({
        askingPrice:      price,
        plotSizeKey,
        acreage,
        pricePerAcre,
        matchedKey,
        confidence,
        overchargePercent: calcOvercharge,
        isOvercharged:    calcOvercharge > OVERCHARGE_THRESHOLD_PERCENT,
        isUnderpriced:    calcOvercharge < -25,
      });
    } else {
      onResultChange(null);
    }
  }, [acreage, pricePerAcre, matchedKey, confidence, plotSizeKey, onResultChange]);

  const handleSizeChange = useCallback((newKey) => {
    setPlotSizeKey(newKey);
    if (askingPrice) {
      const price = parseFloat(askingPrice);
      const newAcreage = PLOT_SIZE_TO_ACRES[newKey];
      if (newAcreage && !isNaN(price)) {
        const calcPricePerAcre = price / newAcreage;
        const calcOvercharge   = Math.round(((calcPricePerAcre - pricePerAcre) / pricePerAcre) * 100);
        onResultChange({
          askingPrice:      price,
          plotSizeKey:      newKey,
          acreage:          newAcreage,
          pricePerAcre,
          matchedKey,
          confidence,
          overchargePercent: calcOvercharge,
          isOvercharged:    calcOvercharge > OVERCHARGE_THRESHOLD_PERCENT,
          isUnderpriced:    calcOvercharge < -25,
        });
      }
    }
  }, [askingPrice, pricePerAcre, matchedKey, confidence, onResultChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="calculator-card"
    >
      <h3 className="text-base font-black text-terra-heading mb-1 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-emerald-500" /> Broker Price Check
      </h3>
      <p className="calculator-subtitle">
        Area benchmark: <strong>{matchedKey}</strong> —{' '}
        <strong>KES {pricePerAcre.toLocaleString()}/acre</strong>{' '}
        <span className={`confidence-badge confidence-${confidence.toLowerCase()}`}>{confidence} confidence</span>
      </p>

      <div className="calc-inputs">
        <label>
          Broker's Asking Price (KES)
          <input
            id="asking-price-input"
            type="number"
            placeholder="e.g. 3500000"
            value={askingPrice}
            onChange={(e) => handlePriceChange(e.target.value)}
          />
        </label>
        <label>
          Plot Size
          <select
            id="plot-size-select"
            value={plotSizeKey}
            onChange={(e) => handleSizeChange(e.target.value)}
          >
            {Object.keys(PLOT_SIZE_TO_ACRES).map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </label>
      </div>

      {userPricePerAcre && (
        <div className={`calc-result ${isOvercharged ? 'result-red' : isUnderpriced ? 'result-blue' : 'result-green'}`}>
          {isOvercharged && (
            <>
              <span>OVERCHARGE DETECTED</span>
              <p>
                The broker is asking <strong>KES {parseFloat(askingPrice).toLocaleString()}</strong> for this plot
                (KES {Math.round(userPricePerAcre).toLocaleString()}/acre).
                This area averages <strong>KES {pricePerAcre.toLocaleString()}/acre</strong>.
                You are being asked to pay <strong>{overchargePercent}% above market rate</strong>.
                Negotiate hard or walk away.
              </p>
            </>
          )}
          {isUnderpriced && (
            <>
              <span>SUSPICIOUSLY LOW PRICE</span>
              <p>
                This price is <strong>{Math.abs(overchargePercent)}% below</strong> the area average.
                A deal that seems too good to be true is a major fraud red flag.
                Proceed with extreme caution and do NOT pay anything before completing every step in the checklist below.
              </p>
            </>
          )}
          {!isOvercharged && !isUnderpriced && (
            <>
              <span>FAIR MARKET RANGE</span>
              <p>
                The asking price of <strong>KES {parseFloat(askingPrice).toLocaleString()}</strong> is within the fair market range for <strong>{matchedKey}</strong>.
                This does not mean the land is legally safe — complete all due diligence steps below.
              </p>
            </>
          )}
        </div>
      )}

      {confidence === 'LOW' && (
        <p className="confidence-warning">
          Price data for this specific location is limited. The benchmark shown is a regional estimate.
          Verify prices locally before using this as your sole reference.
        </p>
      )}
    </motion.div>
  );
}

// ─── DUE DILIGENCE CHECKLIST DATA ─────────────────────────────
const DUE_DILIGENCE_STEPS = [
  {
    id: 1,
    title: 'Official Title Search (Ardhisasa / eCitizen)',
    cost: 'KES 500',
    time: '24 hours – 3 working days',
    urgency: 'DO THIS FIRST — before any viewing, before any deposit',
    why: 'Land fraud is Kenya\'s most devastating financial scam. Thousands of buyers every year pay for land that has multiple owners, is repossessed by a bank, or whose title is an outright forgery. This single search, costing KES 500, will confirm the legal owner\'s name, the exact registered size of the land, the tenure type (freehold or leasehold), and most critically — any encumbrances such as bank charges, court caveats, or cautions registered by a third party claiming interest. If the name on the title deed does not match the person selling you the land, stop immediately.',
    how: 'For Nairobi: visit ardhisasa.lands.go.ke, register with your National ID and KRA PIN, navigate to Land Search, enter the exact L.R. number from the title deed, upload a copy of the title deed and your ID, and pay KES 500 via M-Pesa. Results arrive in 24–72 hours. For all other counties: use ecitizen.go.ke → Ministry of Lands → Land Search.',
    redFlags: [
      'Registered owner name does not match the seller — stop the transaction immediately',
      'Any \'charge\' listed means a bank has the land as loan collateral — you can lose it even after buying',
      'A \'caution\' or \'caveat\' means someone has filed a legal claim — do not proceed until it is removed',
      'The seller refuses to give you the L.R. number — this is a massive red flag',
    ],
    link: 'https://ardhisasa.lands.go.ke',
    linkText: 'ardhisasa.lands.go.ke',
  },
  {
    id: 2,
    title: 'Manual \'Green Card\' Search at Land Registry',
    cost: 'KES 500–1,000 + lawyer time',
    time: '1–3 working days',
    urgency: 'Strongly recommended for any title older than 5 years',
    why: 'Ardhisasa is powerful but covers mainly Nairobi and selected counties. The physical Green Card at the land registry is the master ownership record and shows every historical owner and transaction since the land was first registered.',
    how: 'Visit the relevant county Land Registry with the title deed number and your ID. Ask the registry clerk for a historical Green Card search. Your conveyancing lawyer can do this on your behalf.',
    redFlags: [
      'Multiple transfers in a short period (could indicate a title being \'laundered\')',
      'Gaps in ownership history',
      'Previous owner was a company that no longer exists',
    ],
    link: 'https://lands.go.ke',
    linkText: 'Ministry of Lands',
  },
  {
    id: 3,
    title: 'Physical Site Visit & Boundary Confirmation',
    cost: 'Your time + transport',
    time: 'Half day',
    urgency: 'Before any payment',
    why: 'Documents describe land. Your eyes confirm it exists. Fraudsters have sold land that is underwater, under a power line, or does not exist at the coordinates described. You must physically visit the parcel to confirm it is accessible, the topography matches what you were told, there are no squatters, and no high-voltage power lines run through it.',
    how: 'Go with the seller or agent. Bring a printed copy of the survey map. Walk the perimeter. Look for the corner beacons. Talk to at least two neighbours to confirm who owns the land.',
    redFlags: [
      'Agent refuses to take you to the actual plot, only shows you \'nearby\' land',
      'Neighbours say the land is disputed or already sold to someone else',
      'There is an active seasonal stream or swamp',
      'High-voltage power lines cross the plot',
    ],
    link: null,
    linkText: null,
  },
  {
    id: 4,
    title: 'Licensed Surveyor — Beacon Verification & RIM Check',
    cost: 'KES 15,000–40,000 depending on location and plot size',
    time: '1–3 days',
    urgency: 'Required before signing any sale agreement',
    why: 'A licensed surveyor physically confirms that the beacons (corner markers) are in the correct positions and match the Registry Index Map (RIM). This prevents \'beacon shifting\' fraud — where a seller moves beacons to make a plot look bigger, or to sell you a plot that belongs to someone else.',
    how: 'Hire only an ISK-registered surveyor (Institution of Surveyors of Kenya). You can verify registration at isk.or.ke. Provide them with the L.R. number and RIM number from the title deed.',
    redFlags: [
      'Beacons are missing, obviously new, or made of informal material (stones, sticks)',
      'The physical area measured by the surveyor differs from the title deed size',
      'The surveyor finds the plot is partly on a road reserve or public utility space',
    ],
    link: 'https://isk.or.ke',
    linkText: 'ISK Surveyor Registry',
  },
  {
    id: 5,
    title: 'Land Rates Clearance Certificate (County Government)',
    cost: 'Free to check; seller pays arrears if any',
    time: '1–3 working days',
    urgency: 'Before paying anything — you inherit any unpaid rates',
    why: 'Under Kenyan law, unpaid land rates follow the land — not the seller. If you buy land with KES 500,000 in unpaid land rates, you now owe that money to the county government. This debt will block you from registering the transfer and from obtaining a building permit.',
    how: 'Visit the County Government revenue offices (e.g., Nairobi City County Hall, Kiambu County Revenue Office). Provide the L.R. number. The seller must pay all arrears and obtain a Rates Clearance Certificate before the transaction can be completed.',
    redFlags: [
      'Seller refuses or delays providing rates clearance certificate',
      'Rates outstanding for more than 3 years (major red flag — this compounds with penalties)',
    ],
    link: null,
    linkText: null,
  },
  {
    id: 6,
    title: 'Land Rent Clearance (Leasehold Land Only — NLC/Ministry of Lands)',
    cost: 'Free to check; seller pays arrears',
    time: '2–5 working days',
    urgency: 'Critical for leasehold parcels — check tenure on your Ardhisasa results',
    why: 'If the land is leasehold, the seller owes annual land rent to the National Land Commission or Ministry of Lands. Like county rates, this debt follows the land. Unpaid land rent will block your title transfer and, in extreme cases, can lead to forfeiture of the lease to the government.',
    how: 'For leasehold: Contact the National Land Commission (NLC) or the relevant Ministry of Lands regional office with the title deed number. Your conveyancing lawyer handles this routinely.',
    redFlags: [
      'Lease period is expiring soon (e.g. less than 30 years left) — renewal is expensive and not guaranteed',
      'Land rent is in arrears — government can repossess in extreme cases',
    ],
    link: 'https://www.nlc.go.ke',
    linkText: 'National Land Commission',
  },
  {
    id: 7,
    title: 'Zoning & Change of User Verification (County Physical Planning)',
    cost: 'Free to verify; Change of User can cost KES 50,000–300,000+',
    time: '1–2 days to verify; months if change required',
    urgency: 'Before signing — especially for any agricultural land you plan to build on',
    why: 'Building a house on agricultural land, or opening a business on residential land, without a formal Change of User approval is illegal and can result in the structure being demolished.',
    how: 'Visit the County Government\'s Physical Planning Department with the L.R. number and approximate GPS coordinates. They will confirm the land\'s designated use in the county spatial plan.',
    redFlags: [
      'Land is in an agricultural zone and the seller says \'you can just build\' — this is illegal without change of user',
      'County plan shows the land is earmarked for a public road, school, or green space',
    ],
    link: null,
    linkText: null,
  },
  {
    id: 8,
    title: 'Land Control Board (LCB) Consent (Agricultural Land)',
    cost: 'Minimal official fee (~KES 1,000); lawyer\'s time',
    time: 'LCB meets monthly — plan for 4–6 weeks',
    urgency: 'Legally mandatory for any land classified as agricultural',
    why: 'Under the Land Control Act (Cap 302), any transaction involving agricultural land requires prior consent from the local Land Control Board. Without LCB consent, the sale is null and void under Kenyan law — even if you have paid, even if the title is transferred.',
    how: 'Your conveyancing lawyer applies for consent at the local Sub-County Land Control Board offices. The board meets monthly. The seller (and all co-owners, including spouse) must appear.',
    redFlags: [
      'Seller says LCB consent is \'not needed\' for agricultural land — this is legally false',
      'Spousal consent is missing — required under the Matrimonial Property Act 2013',
    ],
    link: null,
    linkText: null,
  },
  {
    id: 9,
    title: 'Conveyancing Lawyer — Sale Agreement & Escrow',
    cost: '~1% of land value (minimum ~KES 30,000–50,000)',
    time: 'Ongoing from offer to title transfer',
    urgency: 'Do NOT sign anything or pay anything without a lawyer',
    why: 'A conveyancing lawyer conducts court searches, drafts the legally binding Sale Agreement, handles all encumbrance clearances, submits for stamp duty, files the transfer at the Land Registry, and ensures the new title deed comes out in your name.',
    how: 'Find a lawyer registered with the Law Society of Kenya (LSK). Verify their LSK number at lsk.or.ke. Do not use the seller\'s lawyer for your protection — always hire your own.',
    redFlags: [
      'Seller insists you use their lawyer — a major conflict of interest',
      'Anyone asking you to pay directly in cash or to a personal M-Pesa number',
      'Being pressured to sign documents quickly \'before someone else buys it\'',
    ],
    link: 'https://lsk.or.ke',
    linkText: 'Verify Lawyers at LSK',
  },
  {
    id: 10,
    title: 'Stamp Duty Payment (KRA)',
    cost: '2% for agricultural land; 4% for other land',
    time: 'Processing: 1–2 days via iTax',
    urgency: 'Required to complete the title transfer at the Land Registry',
    why: 'Without paying stamp duty, the Ministry of Lands will not process the transfer of the title deed into your name.',
    how: 'Your lawyer files the stamp duty assessment on KRA\'s iTax portal. Once assessed, you pay via the generated payment slip.',
    redFlags: [
      'Being asked to under-declare the purchase price to reduce stamp duty — this is tax fraud and can void the transaction',
    ],
    link: 'https://itax.kra.go.ke',
    linkText: 'KRA iTax Portal',
  },
  {
    id: 11,
    title: 'Community & Neighbour Inquiry',
    cost: 'Free',
    time: '1 hour on site',
    urgency: 'Do this during your physical site visit',
    why: 'No official document will tell you that the seller\'s family disputes the land, that the plot was informally sold to someone else 10 years ago, or that the ground floods every April. Your neighbours know all of this.',
    how: 'On your physical visit, walk up to at least two neighbouring properties. Ask: who is the owner, how long have they owned it, have there been any problems. Also visit the local chief\'s office.',
    redFlags: [
      'Neighbours are evasive or say \'talk to the seller\' about ownership',
      'Multiple neighbours independently mention a dispute',
      'Chief is unaware of the seller or says ownership is contested',
    ],
    link: null,
    linkText: null,
  },
  {
    id: 12,
    title: 'Mutation & Subdivision Verification (for subdivided plots)',
    cost: 'Included in surveyor\'s fee',
    time: 'Surveyor will check during beacon verification',
    urgency: 'Critical if the plot was carved out of a larger parcel',
    why: 'The majority of plots sold in Nairobi\'s satellite towns were created by subdividing a larger agricultural parcel. If your plot was informally subdivided, your title deed may not legally correspond to any registered parcel.',
    how: 'Ask the seller to produce the Mutation Form showing the subdivision was legally registered. Your surveyor will verify this against the RIM.',
    redFlags: [
      'No mutation form can be produced',
      'The title deed number matches the original large farm title, not a sub-plot title',
      'The subdivision appears on no county plan',
    ],
    link: null,
    linkText: null,
  },
];

// ─── DUE DILIGENCE CHECKLIST COMPONENT ────────────────────────
function DueDiligenceChecklist() {
  const [checkedSteps, setCheckedSteps] = useState({});
  const [expandedStep, setExpandedStep] = useState(null);

  const toggleCheck = (id) => {
    setCheckedSteps(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(checkedSteps).filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="checklist-container"
    >
      <div className="checklist-header">
        <h2>Your Full Due Diligence Checklist</h2>
        <p className="checklist-subtitle">
          Complete every step before transferring any money. Kenya loses billions of shillings to land fraud every year.
          This checklist is your protection.
        </p>
        <div className="checklist-progress">
          <span>{completedCount} / {DUE_DILIGENCE_STEPS.length} steps completed</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(completedCount / DUE_DILIGENCE_STEPS.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {DUE_DILIGENCE_STEPS.map((step) => (
        <div key={step.id} className={`checklist-step ${checkedSteps[step.id] ? 'step-done' : ''}`}>
          <div className="step-header" onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}>
            <input
              type="checkbox"
              id={`step-check-${step.id}`}
              checked={!!checkedSteps[step.id]}
              onChange={() => toggleCheck(step.id)}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="step-title-group">
              <span className="step-number">Step {step.id}</span>
              <h3 className="step-title">{step.title}</h3>
              <div className="step-meta">
                <span className="step-cost">{step.cost}</span>
                <span className="step-time">{step.time}</span>
              </div>
            </div>
            <span className="step-expand">
              {expandedStep === step.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </div>

          {expandedStep === step.id && (
            <div className="step-body">
              <div className="step-urgency">{step.urgency}</div>
              <div className="step-why">
                <strong>Why this matters:</strong>
                <p>{step.why}</p>
              </div>
              <div className="step-how">
                <strong>How to do it:</strong>
                <p>{step.how}</p>
              </div>
              {step.redFlags && (
                <div className="step-redflags">
                  <strong>Red flags to watch for:</strong>
                  <ul>
                    {step.redFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                  </ul>
                </div>
              )}
              {step.link && (
                <a href={step.link} target="_blank" rel="noopener noreferrer" className="step-link">
                  {step.linkText}
                </a>
              )}
            </div>
          )}
        </div>
      ))}

      <button id="print-checklist-btn" className="download-checklist-btn" onClick={() => window.print()}>
        <Printer className="w-4 h-4" /> Download / Print This Checklist
      </button>
    </motion.div>
  );
}

// ─── COST BREAKDOWN COMPONENT ─────────────────────────────────
function CostBreakdown({ costSum, report }) {
  const foundation  = costSum?.estimated_foundation_premium_kes || 0;
  const legalRisk   = costSum?.estimated_legal_risk_kes || 0;
  const totalHidden = costSum?.total_hidden_cost_estimate_kes || 0;
  // Grid cost: Gemini doesn\'t output this field, but the fallback report does.
  // Also check inside report.sections[] for the infrastructure section.
  const gridCost    = costSum?.estimated_grid_connection_kes || (
    (Array.isArray(report?.sections)
      ? report.sections.find(s => s.id === 'infrastructure')?.estimated_grid_connection_cost_kes
      : null) || 0
  );
  // Due diligence costs (from fallback report)
  const titleSearch   = costSum?.title_search_cost_kes || 0;
  const surveyorCost  = costSum?.recommended_survey_cost_kes || 0;
  const totalDueDil   = costSum?.total_pre_purchase_due_diligence_kes || 0;

  // Show the section if ANY cost is non-zero
  const hasAnyCost = foundation || legalRisk || totalHidden || gridCost || titleSearch || surveyorCost;
  if (!hasAnyCost) return null;

  // Compute display total: prefer Gemini\'s total_hidden_cost_estimate_kes,
  // otherwise sum the individual items we have.
  const computedTotal = totalHidden || (foundation + gridCost +
    (typeof legalRisk === 'number' ? legalRisk : 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white border border-terra-border rounded-2xl p-4 sm:p-6 mb-6"
    >
      <h2 className="text-base font-black text-terra-heading mb-4 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-emerald-500" /> Hidden Cost Estimate
      </h2>
      <div className="space-y-3">
        {foundation > 0 && (
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-terra-body">Foundation Premium</span>
            <span className="text-sm font-bold text-terra-heading">{fmtKes(foundation)}</span>
          </div>
        )}
        {gridCost > 0 && (
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-terra-body">KPLC Grid Connection</span>
            <span className="text-sm font-bold text-terra-heading">{fmtKes(gridCost)}</span>
          </div>
        )}
        {(typeof legalRisk === 'number' ? legalRisk > 0 : !!legalRisk) && (
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-terra-body">Legal / Repossession Risk</span>
            <span className="text-sm font-bold text-red-600">{typeof legalRisk === 'number' ? fmtKes(legalRisk) : legalRisk}</span>
          </div>
        )}
        {titleSearch > 0 && (
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-terra-body">Title Search (Ardhisasa)</span>
            <span className="text-sm font-bold text-terra-heading">{fmtKes(titleSearch)}</span>
          </div>
        )}
        {surveyorCost > 0 && (
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-terra-body">Surveyor / Soil Investigation</span>
            <span className="text-sm font-bold text-terra-heading">{fmtKes(surveyorCost)}</span>
          </div>
        )}
        {computedTotal > 0 && (
          <div className="flex justify-between items-center pt-3 border-t-2 border-terra-heading">
            <span className="text-sm font-black text-terra-heading">Total Hidden Cost Estimate</span>
            <span className="text-sm font-black text-terra-heading">
              {fmtKes(computedTotal)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── GEOSPATIAL RISK FLAGS FALLBACK ────────────────────────────
// When Gemini risk_flags[] is empty (old DB reports or fallback),
// build synthetic flags directly from hard geospatial booleans.
function buildFallbackRiskFlags(payload) {
  const flags = [];
  if (payload.demolition_risk) {
    flags.push({
      flag_name: 'Demolition / Road Reserve Risk',
      severity: 'FATAL',
      explanation: 'This plot is within a KeNHA or Kenya Railways buffer zone. Government demolition is possible with zero compensation under the Kenya Roads Act.',
      estimated_kes_impact: 'Full land value — zero compensation',
    });
  }
  if (payload.riparian_breach) {
    flags.push({
      flag_name: 'Riparian Zone Breach',
      severity: 'FATAL',
      explanation: `Plot is within the 30m riparian buffer (nearest waterway: ${payload.nearest_waterway_m != null ? payload.nearest_waterway_m + 'm' : 'nearby'}). The Water Act 2016 mandates this land be kept open — any structure can be demolished.`,
      estimated_kes_impact: 'Full repossession, zero compensation',
    });
  }
  if (payload.aviation_risk) {
    flags.push({
      flag_name: 'KCAA Aviation Height Restriction',
      severity: 'CAUTION',
      explanation: `This plot is within ${payload.nearest_airport_km != null ? payload.nearest_airport_km + 'km' : 'range'} of a civil aviation zone. KCAA caps building height. High-rise development is not permitted without a clearance certificate.`,
      estimated_kes_impact: 'Loss of high-rise development potential',
    });
  }
  if (payload.road_reserve_risk) {
    flags.push({
      flag_name: 'Road Reserve Encroachment',
      severity: 'CAUTION',
      explanation: 'Plot boundary falls within the road reserve. Structures within the reserve can be demolished by KeNHA or county government without compensation.',
      estimated_kes_impact: 'Partial or full plot unusability',
    });
  }
  if (payload.flood_history) {
    flags.push({
      flag_name: 'Flood History Detected',
      severity: 'CAUTION',
      explanation: 'JRC satellite data shows historical surface water at this coordinate. Perimeter drainage is mandatory. This significantly raises foundation and drainage costs.',
      estimated_kes_impact: 'KES 150,000 — 400,000 drainage infrastructure',
    });
  }
  return flags;
}

// ─── RISK FLAGS (from new Gemini schema or geo fallback) ───────
function RiskFlagsList({ riskFlags, payload }) {
  // Use AI flags if available, otherwise fall back to geo-derived flags
  const effectiveFlags = (Array.isArray(riskFlags) && riskFlags.length > 0)
    ? riskFlags
    : buildFallbackRiskFlags(payload ?? {});

  if (effectiveFlags.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 }}
      className="mb-6"
    >
      <h2 className="text-base font-black text-terra-heading mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" /> Risk Flags Identified
      </h2>
      <div className="space-y-3">
        {effectiveFlags.map((flag, i) => {
          const isFatal   = flag.severity === 'FATAL';
          const isCaution = flag.severity === 'CAUTION';
          return (
            <div key={i} className={clsx(
              'rounded-2xl border p-4',
              isFatal   ? 'bg-red-50 border-red-200' :
              isCaution ? 'bg-amber-50 border-amber-200' :
                          'bg-slate-50 border-slate-200'
            )}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className={clsx('text-sm font-black',
                  isFatal   ? 'text-red-800' :
                  isCaution ? 'text-amber-800' : 'text-slate-700'
                )}>{flag.flag_name}</h3>
                <span className={clsx('text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border',
                  isFatal   ? 'bg-red-100 border-red-300 text-red-700' :
                  isCaution ? 'bg-amber-100 border-amber-300 text-amber-700' :
                              'bg-slate-100 border-slate-300 text-slate-600'
                )}>{flag.severity}</span>
              </div>
              <p className="text-sm text-terra-body mb-1">{flag.explanation}</p>
              {flag.estimated_kes_impact && (
                <p className={clsx('text-xs font-bold mt-1',
                  isFatal ? 'text-red-700' : isCaution ? 'text-amber-700' : 'text-slate-600'
                )}>
                  KES Impact: {typeof flag.estimated_kes_impact === 'number'
                    ? `KES ${flag.estimated_kes_impact.toLocaleString()}`
                    : flag.estimated_kes_impact}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── MAIN REPORT COMPONENT ────────────────────────────────────
export default function Report() {
  const navigate = useNavigate();
  const { engineState } = useTerraStore();

  // State for the lifted PricingCalculator result (passed into PDF)
  const [askingPriceResult, setAskingPriceResult] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // No data yet guard
  if (engineState.status !== 'done' || !engineState.payload) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 font-gabarito">
          <MapPin className="w-16 h-16 text-slate-200" />
          <div className="text-center">
            <h2 className="text-2xl font-black text-terra-heading mb-2">No Analysis Yet</h2>
            <p className="text-terra-body mb-6">Run a spatial analysis first to generate your report.</p>
            <Button variant="primary" onClick={() => navigate('/analyze')}>Go to Analysis</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const payload      = engineState.payload;
  const reportSource = engineState.reportSource ?? 'gemini';
  const modelUsed    = engineState.modelUsed ?? null;
  const report   = engineState.report ?? {};
  const coords   = payload.coordinates ?? {};

  // Gemini report fields (new schema)
  const rawSummary  = String(report.executive_summary ?? '');
  const isFallback  = rawSummary.startsWith('Basic report only');
  const summary     = isFallback
    ? 'Gemini AI synthesis is temporarily unavailable. The risk flags and geospatial data below are computed directly from satellite and mapping APIs and remain fully accurate.'
    : rawSummary || 'Analysis complete.';
  const sections    = Array.isArray(report.sections) ? report.sections : [];
  const costSum     = report.cost_summary ?? {};
  const riskFlags   = Array.isArray(report.risk_flags) ? report.risk_flags : [];
  const disclaimer  = report.disclaimer ? String(report.disclaimer) : null;

  // Merge payload + report for verdict and cost access
  const mergedPayload = {
    ...payload,
    ...report,
    // Ensure hard geospatial booleans from payload always win
    demolition_risk:  payload.demolition_risk  ?? report.demolition_risk  ?? false,
    riparian_breach:  payload.riparian_breach  ?? report.riparian_breach  ?? false,
    aviation_risk:    payload.aviation_risk    ?? report.aviation_risk    ?? false,
    cost_summary:     costSum,
  };

  const place = [payload.place_name, payload.ward, payload.county].filter(Boolean).join(', ') || '—';

  // Only show buyer-relevant geo stats — remove NDVI, Vegetation, Sunshine, Solar, Soil Moisture
  const floodStr  = payload.flood_history ? 'Yes — Detected' : payload.flood_history === false ? 'Clear' : '—';
  const waterDist = payload.nearest_waterway_m != null ? `${payload.nearest_waterway_m}m` : '—';
  const gridDist  = payload.distance_to_grid_m != null ? `${payload.distance_to_grid_m}m` : '—';
  const airportKm = payload.nearest_airport_km != null ? `${payload.nearest_airport_km}km` : '—';

  // ─── PDF download handler (programmatic blob approach) ────────
  const handleDownloadPDF = useCallback(async () => {
    setIsDownloading(true);
    try {
      const blob = await pdf(
        <TerraReportDocument
          payload={mergedPayload}
          askingPriceResult={askingPriceResult}
        />
      ).toBlob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `TerraAI_Report_${payload.place_name || payload.ward || 'land'}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[Terra AI] PDF generation failed:', err);
      alert('PDF generation failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }, [mergedPayload, askingPriceResult, payload.place_name, payload.ward]);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 font-gabarito">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/analyze')} className="text-terra-muted hover:text-terra-heading transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-terra-heading">Land Pre-Purchase Report</h1>
              {place !== '—' && (
                <div className="flex items-center gap-1.5 text-terra-muted text-sm mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{place}</span>
                  {coords.lat && <span className="font-mono text-xs ml-1">({coords.lat?.toFixed(5)}, {coords.lng?.toFixed(5)})</span>}
                </div>
              )}
            </div>
          </div>
          {/* Programmatic PDF download — no PDFDownloadLink wrapper */}
          <Button
            id="download-pdf-btn"
            variant="primary"
            size="md"
            icon={Download}
            loading={isDownloading}
            onClick={handleDownloadPDF}
          >
            {isDownloading ? 'Generating PDF…' : 'Download Full PDF'}
          </Button>
        </div>

        {/* ── Traffic Light Verdict Banner ── */}
        <div className="mb-6">
          <VerdictBanner payload={mergedPayload} />
        </div>

        {/* ── Executive Summary ── */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white rounded-2xl border border-terra-border p-5 mb-6 shadow-sm"
          >
            <p className="text-xs font-semibold text-terra-muted uppercase tracking-widest mb-2">Executive Summary</p>
            {isFallback && (
              <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold mb-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Gemini synthesis unavailable — data-only report</span>
              </div>
            )}
            <p className="text-terra-body text-sm leading-relaxed">{summary}</p>
          </motion.div>
        )}

        {/* ── Risk Flags (AI-generated or geo-derived fallback) ── */}
        <RiskFlagsList riskFlags={riskFlags} payload={payload} />

        {/* ── Interactive Pricing Calculator ── */}
        <div className="mb-6">
          <PricingCalculator payload={mergedPayload} onResultChange={setAskingPriceResult} />
        </div>

        {/* ── Filtered Geo Stats (buyer-relevant only) ── */}
        <div className="mb-6">
          <h2 className="text-base font-black text-terra-heading mb-4">Satellite Risk Indicators</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {payload.flood_history != null && (
              <StatBlock icon={Droplets} label="Flood Risk Level" value={floodStr} highlight={payload.flood_history} />
            )}
            {payload.nearest_waterway_m != null && (
              <StatBlock icon={Droplets} label="Dist. to River/Stream" value={waterDist} highlight={payload.riparian_breach} />
            )}
            {payload.demolition_risk != null && (
              <StatBlock icon={Shield} label="Demolition Risk" value={payload.demolition_risk ? 'RISK' : 'Clear'} highlight={payload.demolition_risk} />
            )}
            {payload.road_reserve_risk != null && (
              <StatBlock icon={Shield} label="Road Reserve" value={payload.road_reserve_risk ? 'Encroachment' : 'Clear'} highlight={payload.road_reserve_risk} />
            )}
            {payload.riparian_breach != null && (
              <StatBlock icon={Droplets} label="Riparian Violation" value={payload.riparian_breach ? 'RISK' : 'Clear'} highlight={payload.riparian_breach} />
            )}
            {payload.aviation_risk != null && (
              <StatBlock icon={Shield} label="Aviation Height Cap" value={payload.aviation_risk ? 'RISK' : 'Clear'} highlight={payload.aviation_risk} />
            )}
            {payload.distance_to_grid_m != null && (
              <StatBlock icon={Zap} label="Distance to Grid" value={gridDist} />
            )}
            {payload.nearest_airport_km != null && (
              <StatBlock icon={Activity} label="Nearest Airport" value={airportKm} highlight={payload.aviation_risk} />
            )}
          </div>
        </div>

        {/* ── AI Analysis Sections (legal_risks, foundation_costs, infrastructure) ── */}
        {sections.length > 0 && (
          <div className="mb-6">
            <h2 className="text-base font-black text-terra-heading mb-4">Detailed Analysis</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sections
                .filter(s => typeof s.body === 'string' && s.body.length > 0)
                .map((section, i) => (
                  <SectionCard key={section.id ?? i} section={section} index={i} />
                ))}
            </div>
          </div>
        )}

        {/* ── Hidden Cost Estimate ── */}
        <CostBreakdown costSum={costSum} report={report} />

        {/* ── Full Due Diligence Checklist ── */}
        <DueDiligenceChecklist />

        {/* ── Disclaimer ── */}
        {disclaimer && (
          <p className="text-xs text-terra-muted italic leading-relaxed border-t border-terra-border pt-4 mt-4">
            {disclaimer}
          </p>
        )}
        {!disclaimer && (
          <p className="text-xs text-terra-muted italic leading-relaxed border-t border-terra-border pt-4 mt-4">
            Geospatial data derived from ISRIC SoilGrids, HydroSHEDS, Google Earth Engine, BGS Africa Groundwater Atlas, and Sentinel-5P Copernicus.
            This exploratory report does not replace an official Ministry of Lands physical survey or NEMA assessment.
            Always engage a licensed conveyancing lawyer and ISK-registered surveyor before completing any land transaction in Kenya.
          </p>
        )}
      </div>

      <ChatAssistant />
    </MainLayout>
  );
}
