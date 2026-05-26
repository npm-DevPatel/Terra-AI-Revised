import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, XCircle, Download, ChevronRight,
  Droplets, Mountain, Building2, Shovel, Wind, Droplet,
  Shield, AlertCircle, FileText,
} from 'lucide-react';
import { clsx } from 'clsx';
import useTerraStore from '../../store/useTerraStore';

/**
 * RiskSummaryCard — Pre-Purchase Screener Summary
 *
 * Matches the new pivot schema:
 *   TOP    — Verdict status (DO NOT BUY / PROCEED WITH CAUTION / CLEAR)
 *   MIDDLE — Data-Verified Risk flag chips from live geospatial payload
 *   BOTTOM — CTA to view full report
 *
 * Scoring system removed. Official Title Search CTA removed.
 * All emojis removed.
 */

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
      <span className="ml-0.5">{isTriggered ? '!' : 'OK'}</span>
    </div>
  );
}

/** Verdict config driven by geospatial booleans, not score */
function getVerdictConfig(payload, report) {
  const isFatal   = Boolean(payload.demolition_risk || payload.riparian_breach);
  const isCaution = !isFatal && Boolean(
    payload.aviation_risk ||
    (report?.cost_summary?.estimated_foundation_premium_kes > 0)
  );

  if (isFatal) return {
    label:    'DO NOT PROCEED',
    sub:      payload.demolition_risk ? 'Demolition / Road Reserve Risk' : 'Riparian Zone Breach',
    bg:       'bg-red-600 text-white',
    badgeBg:  'bg-red-100 border-red-300 text-red-700',
    icon:     XCircle,
    iconCls:  'text-red-100',
  };

  if (isCaution) return {
    label:    'PROCEED WITH CAUTION',
    sub:      payload.aviation_risk ? 'Aviation height cap detected' : 'Foundation cost premium applies',
    bg:       'bg-amber-500 text-white',
    badgeBg:  'bg-amber-100 border-amber-300 text-amber-700',
    icon:     AlertTriangle,
    iconCls:  'text-amber-100',
  };

  return {
    label:    'CLEAR FOR DUE DILIGENCE',
    sub:      'No major geospatial red flags detected',
    bg:       'bg-emerald-600 text-white',
    badgeBg:  'bg-emerald-100 border-emerald-300 text-emerald-700',
    icon:     CheckCircle2,
    iconCls:  'text-emerald-100',
  };
}

export default function RiskSummaryCard() {
  const navigate = useNavigate();
  const { engineState } = useTerraStore();

  if (engineState.status !== 'done') return null;

  const report  = engineState.report  ?? {};
  const payload = engineState.payload ?? {};

  // Verdict from report or deterministic geospatial override
  const verdict = report.investment_verdict ?? null;

  // Verified risk flags from payload booleans
  const riparianBreach      = Boolean(payload.riparian_breach);
  const demolitionRisk      = Boolean(payload.demolition_risk);
  const aviationHeightCap   = Boolean(payload.aviation_height_restriction ?? payload.aviation_risk);
  const isTopographicalSink = Boolean(payload.is_topographical_sinkhole);

  // Groundwater and Air Quality flags
  const groundwaterData    = payload.groundwater ?? {};
  const environmentData    = payload.environment ?? {};
  const waterScarcityRisk  = Boolean(groundwaterData.water_scarcity_risk);
  const severeAirPollution = Boolean(environmentData.severe_air_pollution);

  // Soil info
  const soilType = payload.soil_type ?? null;
  const clayPct  = payload.soil_clay_pct ?? null;
  const chirps   = payload.chirps_rainfall_index ?? null;
  const floodRisk = payload.verified_data?.flash_flood_susceptibility ?? null;

  const { label, sub, bg, icon: VerdictIcon, iconCls } = getVerdictConfig(payload, report);

  // Top risk flags from AI (capped at 3) — or nothing if empty
  const riskFlags = Array.isArray(report.risk_flags) ? report.risk_flags.slice(0, 3) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26, delay: 0.1 }}
      className="absolute bottom-3 left-3 right-3 z-20 md:left-auto md:right-3 md:w-[360px] flex flex-col"
      style={{ maxHeight: 'calc(100% - 24px)' }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-y-auto flex-1 min-h-0 scrollbar-thin scrollbar-thumb-slate-200">

        {/* ── Verdict Header ── */}
        <div className={clsx('px-5 pt-5 pb-4 rounded-t-2xl', bg)}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-75 mb-1">
                Geospatial Verdict
              </p>
              <h2 className="text-base font-black leading-tight mb-1">{label}</h2>
              {sub && (
                <p className="text-[11px] font-medium opacity-80">{sub}</p>
              )}
            </div>
            <VerdictIcon className={clsx('w-8 h-8 flex-shrink-0', iconCls)} />
          </div>
        </div>

        {/* ── SECTION 1: Data-Verified Risk Chips ── */}
        <div className="px-5 pt-3 pb-3 border-b border-slate-100">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-2.5">
            Data-Verified Risks
          </p>
          <div className="flex flex-wrap gap-1.5">
            <FlagChip label="Riparian"    triggered={riparianBreach}      icon={Droplets}  />
            <FlagChip label="Demolition"  triggered={demolitionRisk}      icon={Shovel}    />
            <FlagChip label="Aviation Cap" triggered={aviationHeightCap}  icon={Building2} />
            <FlagChip label="Sinkhole"    triggered={isTopographicalSink} icon={Mountain}  />
            <FlagChip label="Air Quality" triggered={severeAirPollution}  icon={Wind}      />
            <FlagChip label="Groundwater" triggered={waterScarcityRisk}   icon={Droplet}   />
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

        {/* ── AI Risk Flags Preview (capped at 3) ── */}
        {riskFlags.length > 0 && (
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">
              Key Risk Flags
            </p>
            {riskFlags.map((flag, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}
                className="flex items-start gap-2 py-1.5 border-b border-slate-100 last:border-0"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-slate-700 leading-snug">{flag.flag_name}</p>
              </motion.div>
            ))}
            {Array.isArray(report.risk_flags) && report.risk_flags.length > 3 && (
              <p className="text-[10px] text-slate-400 mt-1">
                +{report.risk_flags.length - 3} more in full report
              </p>
            )}
          </div>
        )}

        {/* ── CTA ── */}
        <div className="px-5 py-4 bg-slate-50">
          <button
            onClick={() => navigate('/report')}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-bold px-4 py-3 rounded-xl transition-all"
          >
            <FileText className="w-4 h-4" />
            View Full Report
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </motion.div>
  );
}
