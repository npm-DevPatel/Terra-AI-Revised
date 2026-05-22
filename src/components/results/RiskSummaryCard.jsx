import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, XCircle, Download, ChevronRight,
  Flame, Droplets, Mountain, Building2, ShieldAlert, Shovel,
  Landmark, Leaf, ExternalLink, Wind, Droplet
} from 'lucide-react';
import { clsx } from 'clsx';
import useTerraStore from '../../store/useTerraStore';

/**
 * RiskSummaryCard — Step 3.1 redesign
 *
 * Three-section layout per blueprint:
 *   TOP    — "Data-Verified Risks" (binary flag chips)
 *   MIDDLE — "What This Means For Your Build" (financial impact)
 *   BOTTOM — "Recommended Before Purchase" (upsell CTA)
 */

function riskConfig(score) {
  if (score >= 80) return {
    color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500',
    icon: CheckCircle2, badge: 'bg-emerald-50 border-emerald-300 text-emerald-700',
    glow: 'shadow-emerald-100'
  };
  if (score >= 50) return {
    color: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-500',
    icon: AlertTriangle, badge: 'bg-amber-50 border-amber-300 text-amber-700',
    glow: 'shadow-amber-100'
  };
  return {
    color: 'text-red-600', bg: 'bg-red-50', bar: 'bg-red-500',
    icon: XCircle, badge: 'bg-red-50 border-red-300 text-red-700',
    glow: 'shadow-red-100'
  };
}

/** Single binary flag chip */
function FlagChip({ label, triggered, icon: Icon }) {
  const isTriggered = Boolean(triggered);
  return (
    <div className={clsx(
      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wide transition-all',
      isTriggered
        ? 'bg-red-50 border-red-300 text-red-700'
        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
    )}>
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span>{label}</span>
      <span className="ml-0.5">{isTriggered ? '⚠' : '✓'}</span>
    </div>
  );
}

/** Financial premium row */
function PremiumRow({ label, amount, isRisk }) {
  if (amount == null || amount === 0) return null;
  const formatted = typeof amount === 'number'
    ? `KES ${amount.toLocaleString('en-KE')}`
    : String(amount);
  return (
    <div className={clsx(
      'flex items-center justify-between py-2 border-b border-slate-100 last:border-0',
      isRisk ? 'text-red-700' : 'text-slate-700'
    )}>
      <span className="text-[11px] font-medium">{label}</span>
      <span className={clsx('text-[11px] font-black', isRisk ? 'text-red-600' : 'text-slate-900')}>
        {formatted}
      </span>
    </div>
  );
}

export default function RiskSummaryCard() {
  const navigate = useNavigate();
  const { engineState } = useTerraStore();

  if (engineState.status !== 'done') return null;

  const report  = engineState.report  ?? {};
  const payload = engineState.payload ?? {};

  const score   = typeof report.land_feasibility_score === 'number' ? report.land_feasibility_score : 0;
  const label   = String(report.land_feasibility_label ?? 'UNKNOWN');
  const verdict = report.investment_verdict ? String(report.investment_verdict) : null;
  const flags   = Array.isArray(report.key_flags) ? report.key_flags : [];

  // Verified risk flags from payload
  const riparianBreach        = Boolean(payload.riparian_breach);
  const demolitionRisk        = Boolean(payload.demolition_risk);
  const aviationHeightCap     = Boolean(payload.aviation_height_restriction);
  const isTopographicalSink   = Boolean(payload.is_topographical_sinkhole);

  // New: Groundwater and Air Quality flags
  const groundwaterData       = payload.groundwater ?? {};
  const environmentData       = payload.environment ?? {};
  const waterScarcityRisk     = Boolean(groundwaterData.water_scarcity_risk);
  const severeAirPollution    = Boolean(environmentData.severe_air_pollution);
  const boreholeDepth         = groundwaterData.depth_to_groundwater_m ?? null;

  // Financial premiums from ISRIC & Gemini
  const costSummary      = report.cost_summary ?? {};
  const verifiedData     = report.verified_data ?? {};
  const foundationPremium = costSummary.estimated_foundation_premium_kes
    ?? verifiedData.foundation_premium_kes
    ?? payload.soil_foundation_premium_kes
    ?? 0;
  const drainagePremium   = costSummary.estimated_drainage_premium_kes
    ?? verifiedData.drainage_premium_kes
    ?? 0;
  const gridCost          = costSummary.estimated_grid_connection_kes ?? 0;
  const totalDueDiligence = costSummary.total_pre_purchase_due_diligence_kes ?? 0;

  // Soil info
  const soilType   = payload.soil_type ?? verifiedData.soil_classification ?? null;
  const clayPct    = payload.soil_clay_pct ?? verifiedData.clay_pct ?? null;
  const chirps     = payload.chirps_rainfall_index ?? verifiedData.chirps_rainfall_index ?? null;
  const floodRisk  = verifiedData.flash_flood_susceptibility ?? null;

  const { color, bar, badge, icon: RiskIcon, glow } = riskConfig(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26, delay: 0.1 }}
      className="absolute bottom-3 left-3 right-3 z-20 md:left-auto md:right-3 md:w-[360px]"
      style={{ maxHeight: 'calc(100% - 24px)' }}
    >
      <div className={[
        'bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-y-auto',
        'scrollbar-thin scrollbar-thumb-slate-200',
        glow,
      ].join(' ')}
        style={{ maxHeight: 'calc(100% - 0px)' }}
      >

        {/* ── Score header ── */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                Land Feasibility Score
              </p>
              <div className="flex items-end gap-2">
                <span className={clsx('text-5xl font-black leading-none', color)}>{score}</span>
                <span className="text-slate-400 text-lg mb-1 font-medium">/100</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-medium italic">
                (100 = Ideal, 0 = Unbuildable)
              </p>
              {verdict && (
                <p className="text-[11px] font-semibold text-slate-600 mt-1.5">{verdict}</p>
              )}
            </div>
            <span className={clsx(
              'flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full border',
              badge
            )}>
              <RiskIcon className="w-3 h-3" />
              {label}
            </span>
          </div>
          {/* Score bar */}
          <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className={clsx('h-full rounded-full', bar)}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
            />
          </div>
        </div>

        {/* ── SECTION 1: Data-Verified Risks ── */}
        <div className="px-5 pt-3 pb-3 border-b border-slate-100">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-2.5">
            📡 Data-Verified Risks
          </p>
          <div className="flex flex-wrap gap-1.5">
            <FlagChip label="Riparian" triggered={riparianBreach} icon={Droplets} />
            <FlagChip label="Demolition" triggered={demolitionRisk} icon={Shovel} />
            <FlagChip label="Aviation Cap" triggered={aviationHeightCap} icon={Building2} />
            <FlagChip label="Sinkhole" triggered={isTopographicalSink} icon={Mountain} />
            <FlagChip label="Air Quality" triggered={severeAirPollution} icon={Wind} />
            <FlagChip label="Groundwater" triggered={waterScarcityRisk} icon={Droplet} />
          </div>

          {/* Soil + Rainfall quick stats */}
          {(soilType || chirps) && (
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {soilType && (
                <div className="bg-slate-50 rounded-lg px-2.5 py-2">
                  <p className="text-[8.5px] text-slate-400 font-medium uppercase tracking-wider">ISRIC Soil</p>
                  <p className="text-[10px] font-bold text-slate-800 mt-0.5 leading-snug">
                    {soilType}
                    {clayPct != null && <span className="text-slate-500 font-normal"> ({clayPct.toFixed(1)}%)</span>}
                  </p>
                </div>
              )}
              {chirps && (
                <div className="bg-slate-50 rounded-lg px-2.5 py-2">
                  <p className="text-[8.5px] text-slate-400 font-medium uppercase tracking-wider">Rainfall</p>
                  <p className={clsx(
                    'text-[10px] font-bold mt-0.5',
                    chirps === 'High' ? 'text-red-600' : chirps === 'Moderate' ? 'text-amber-600' : 'text-emerald-600'
                  )}>
                    {chirps}
                    {floodRisk && <span className="text-[9px] text-slate-500 font-normal"> · {floodRisk} flood risk</span>}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── SECTION 2 REMOVED: Financial Impact (Moved to full report) ── */}

        {/* ── Key flags (capped at 3) ── */}
        {flags.length > 0 && (
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">
              🚩 Key Risk Flags
            </p>
            {flags.slice(0, 3).map((flag, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}
                className="flex items-start gap-2 py-1.5 border-b border-slate-100 last:border-0"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-slate-700 leading-snug">{flag}</p>
              </motion.div>
            ))}
            {flags.length > 3 && (
              <p className="text-[10px] text-slate-400 mt-1">+{flags.length - 3} more in full report</p>
            )}
          </div>
        )}

        {/* ── SECTION 3: Recommended Before Purchase (CTA) ── */}
        <div className="px-5 py-4 bg-slate-50">
          {/* Upsell CTA */}
          <div className="mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <Landmark className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-amber-800">Official Title Search (Ardhisasa)</p>
              <p className="text-[10px] text-amber-700 mt-0.5 leading-snug">
                Pending Verification.{' '}
                <span className="underline cursor-pointer">Contact us to initiate.</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/report')}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-bold px-4 py-3 rounded-xl transition-all"
          >
            <Download className="w-4 h-4" />
            Download Full PDF Report
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </motion.div>
  );
}
