import React from 'react';
import { Page, View, Text, Svg, Rect, StyleSheet } from '@react-pdf/renderer';
import { S, COLORS } from '../pdfStyles';

// ─── Sub-components ────────────────────────────────────────────────────────

function PageHeader({ date }) {
  return (
    <View style={S.pageHeader}>
      <View style={S.brandRow}>
        <View style={S.brandDot} />
        <Text style={S.brandName}>Terra AI — Topography & Geotech</Text>
      </View>
      <Text style={S.headerRight}>{date}</Text>
    </View>
  );
}

function PageFooter({ n }) {
  return (
    <View style={S.pageFooter} fixed>
      <Text style={S.footerText}>Terra AI — Confidential</Text>
      <Text style={S.pageNum}>{n} / 8</Text>
    </View>
  );
}

function MeterBar({ label, value, max, color, unit, warning }) {
  const pct = Math.min((value / max) * 220, 220);
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 8.5, color: COLORS.slate600 }}>{label}</Text>
        <Text style={{ fontSize: 8.5, fontFamily: warning ? 'Helvetica-Bold' : 'Helvetica', color: warning ? COLORS.red600 : COLORS.slate900 }}>
          {value != null ? `${value}${unit}` : '—'}
          {warning ? '  ⚠' : ''}
        </Text>
      </View>
      <Svg width="220" height="8">
        <Rect x="0" y="0" width="220" height="8" rx="4" fill={COLORS.slate100} />
        {value != null && <Rect x="0" y="0" width={pct} height="8" rx="4" fill={color} />}
      </Svg>
    </View>
  );
}

function DataCard({ label, value, sub, highlight }) {
  return (
    <View style={[S.card, highlight ? { borderColor: COLORS.red600, borderWidth: 1.5 } : {}]}>
      <Text style={S.cardLabel}>{label}</Text>
      <Text style={[S.cardValue, highlight ? { color: COLORS.red600 } : {}]}>{value}</Text>
      {sub && <Text style={S.cardSub}>{sub}</Text>}
    </View>
  );
}

// ─── Step 3.2: 2-column Page 2 layout with ISRIC SoilGrids data ────────────

export default function TopographySection({ payload, report, date }) {
  const elevation     = payload?.elevation_m          ?? null;
  const slope         = payload?.slope_percent        ?? null;
  const floodHistory  = payload?.flood_history        ?? null;
  const seasonalWater = payload?.seasonal_water       ?? null;
  const wetlandRisk   = payload?.wetland_risk         ?? null;
  const ndvi          = payload?.ndvi_score           ?? null;
  const ndviInterp    = String(payload?.ndvi_interpretation ?? payload?.land_cover_label ?? 'Not classified');
  const soilMoisture  = payload?.soil_moisture        ?? null;
  const highMoisture  = payload?.high_moisture_risk   ?? false;
  const aspect        = payload?.aspect_degrees       ?? null;

  // Step 3.2 — ISRIC SoilGrids exact numbers (blueprint: "makes report look credible")
  const soilType     = payload?.soil_type             ?? null;
  const clayPct      = payload?.soil_clay_pct         ?? null;
  const cecVal       = payload?.soil_cec_cmolc_kg     ?? null;
  const siltPct      = payload?.soil_silt_pct         ?? null;
  const bdod         = payload?.soil_bulk_density_kg_dm3 ?? null;
  const fndWarning   = payload?.soil_foundation_warning ?? null;
  const fndPremium   = payload?.soil_foundation_premium_kes ?? 0;
  const soilSrc      = payload?.soil_data_source       ?? 'fallback';

  // Sinkhole & CHIRPS (Step 1.2 / 1.5)
  const isSinkhole   = payload?.is_topographical_sinkhole ?? false;
  const chirpsIdx    = payload?.chirps_rainfall_index ?? 'Unknown';
  const chirpsMm     = payload?.chirps_max_rainfall_mm ?? null;

  const sections    = Array.isArray(report?.sections) ? report.sections : [];
  const topoSection = sections.find((s) => s.id === 'topography') ?? null;
  const envSection  = sections.find((s) => s.id === 'environmental') ?? null;
  const soilSection = sections.find((s) => s.id === 'soil_geotech') ?? null;
  const drainSection = sections.find((s) => s.id === 'drainage_flood') ?? null;

  const slopeWarning = slope != null && slope >= 12;
  const chirpsHigh   = chirpsIdx === 'High';

  return (
    <>
      {/* ── Page 4: Terrain & Geotech (2-column) ── */}
      <Page size="A4" style={S.page}>
        <PageHeader date={date} />
        <View style={S.body}>

          {/* Page heading */}
          <Text style={S.sectionLabel}>Terrain & Geotechnical Analysis</Text>

          {/* ── 2-column grid: Left = GEE Slope / Right = ISRIC SoilGrids ── */}
          <View style={S.grid2}>

            {/* Left column — GEE Terrain data */}
            <View style={S.col}>
              <Text style={[S.sectionLabel, { fontSize: 9, marginBottom: 8 }]}>
                GEE Slope & Elevation
              </Text>
              <DataCard
                label="Elevation Above Sea Level"
                value={elevation != null ? `${elevation}m` : '—'}
                sub="Google Maps Elevation API"
              />
              <DataCard
                label="Terrain Slope (GEE Terrain.slope)"
                value={slope != null ? `${slope}%` : '—'}
                sub={slopeWarning ? '⚠ Exceeds 12% — Engineering works required' : 'Within standard construction limits'}
                highlight={slopeWarning}
              />
              {aspect != null && (
                <DataCard
                  label="Aspect (Slope Direction)"
                  value={`${aspect}°`}
                  sub="Solar orientation & drainage indicator"
                />
              )}
              <Text style={[S.sectionLabel, { fontSize: 9, marginTop: 12, marginBottom: 8 }]}>
                Drainage & Sinkhole
              </Text>
              <DataCard
                label="Topographical Sinkhole (3×3 Grid)"
                value={isSinkhole ? 'DETECTED' : 'Clear'}
                sub={isSinkhole ? 'Centre point lower than 7+ of 8 surrounding grid points' : 'No depression pattern detected in 100m grid'}
                highlight={isSinkhole}
              />
            </View>

            {/* Right column — ISRIC SoilGrids exact numbers */}
            <View style={S.col}>
              <Text style={[S.sectionLabel, { fontSize: 9, marginBottom: 8 }]}>
                ISRIC SoilGrids (30–60 cm depth)
              </Text>

              <DataCard
                label="Soil Classification"
                value={soilType ?? '—'}
                sub={
                  soilSrc === 'isric_soilgrids'
                    ? 'Verified via ISRIC SoilGrids REST API (exact pixel)'
                    : soilSrc === 'isric_soilgrids_nearby_sample'
                    ? 'ISRIC SoilGrids — nearest non-urban pixel (~500m)'
                    : 'Fallback — ISRIC data unavailable for this pixel'
                }
                highlight={Boolean(soilType && soilType.includes('Black Cotton'))}
              />
              <DataCard
                label="Clay Content"
                value={clayPct != null ? `${clayPct.toFixed(1)} %` : '—'}
                sub="At 30–60 cm depth (g/kg ÷ 10)"
                highlight={clayPct != null && clayPct > 45}
              />
              <DataCard
                label="CEC (Cation Exchange Capacity)"
                value={cecVal != null ? `${cecVal.toFixed(1)} cmol(c)/kg` : '—'}
                sub="At 30–60 cm depth — indicator of shrink-swell potential"
                highlight={cecVal != null && cecVal > 30}
              />
              {siltPct != null && (
                <DataCard
                  label="Silt Content"
                  value={`${siltPct.toFixed(1)} %`}
                  sub="At 30–60 cm depth"
                />
              )}
              {bdod != null && (
                <DataCard
                  label="Bulk Density"
                  value={`${bdod.toFixed(2)} kg/dm³`}
                  sub="Soil compaction indicator"
                />
              )}
              {fndPremium > 0 && (
                <View style={{ backgroundColor: '#fef2f2', borderRadius: 6, padding: 8, marginTop: 6, borderWidth: 1, borderColor: '#fca5a5' }}>
                  <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: COLORS.red600, marginBottom: 3 }}>
                    FOUNDATION PREMIUM
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.red600 }}>
                    KES {fndPremium.toLocaleString('en-KE')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Visual meters */}
          <View style={S.divider} />
          <Text style={[S.sectionLabel, { fontSize: 9, marginBottom: 8 }]}>Visual Meters</Text>
          <View style={S.grid2}>
            <View style={S.col}>
              <MeterBar label="Elevation" value={elevation} max={2200} color={COLORS.indigo600} unit="m" />
              <MeterBar label="Slope %" value={slope} max={30} color={slopeWarning ? COLORS.red500 : COLORS.emerald500} unit="%" warning={slopeWarning} />
            </View>
            <View style={S.col}>
              {clayPct != null && (
                <MeterBar label="Clay % (ISRIC)" value={clayPct} max={100} color={clayPct > 45 ? COLORS.red500 : clayPct > 30 ? '#f59e0b' : COLORS.emerald500} unit="%" warning={clayPct > 30} />
              )}
              {ndvi != null && (
                <MeterBar label="NDVI Vegetation Index" value={Math.round(ndvi * 100)} max={100} color={COLORS.emerald600} unit="" />
              )}
            </View>
          </View>

          {/* Foundation warning */}
          {fndWarning && (
            <>
              <View style={S.divider} />
              <Text style={[S.sectionLabel, { fontSize: 9, marginBottom: 6 }]}>ISRIC Foundation Warning</Text>
              <Text style={[S.bodyText, { color: fndPremium > 0 ? COLORS.red600 : COLORS.slate600 }]}>
                {String(fndWarning)}
              </Text>
            </>
          )}

          {soilSection && (
            <>
              <View style={S.divider} />
              <Text style={[S.sectionLabel, { fontSize: 9, marginBottom: 6 }]}>AI Soil & Foundation Assessment</Text>
              <Text style={S.bodyText}>{String(soilSection.body ?? '')}</Text>
            </>
          )}

          {topoSection && (
            <>
              <View style={S.divider} />
              <Text style={[S.sectionLabel, { fontSize: 9, marginBottom: 6 }]}>AI Terrain Assessment</Text>
              <Text style={S.bodyText}>{String(topoSection.body ?? '')}</Text>
            </>
          )}

          {slopeWarning && (
            <View style={[S.flagItem, { marginTop: 10 }]}>
              <View style={S.flagBullet} />
              <Text style={S.flagText}>
                Slope of {slope}% exceeds the 12% construction threshold. Retaining walls, cut-and-fill,
                or specialised foundations will likely be required. Estimated cost: KES 500,000 – 2,000,000.
              </Text>
            </View>
          )}

        </View>
        <PageFooter n={4} />
      </Page>

      {/* ── Page 5: Environmental, Drainage & Flood ── */}
      <Page size="A4" style={S.page}>
        <PageHeader date={date} />
        <View style={S.body}>
          <Text style={S.sectionLabel}>Environmental, Drainage & Flash Flood Risk</Text>

          {/* CHIRPS & Sinkhole row */}
          <View style={S.grid3}>
            <DataCard
              label="Sinkhole (3×3 Grid)"
              value={isSinkhole ? 'DETECTED' : 'Clear'}
              sub="100m bounding box, 9 elevation points"
            />
            <DataCard
              label="CHIRPS Rainfall Index"
              value={chirpsIdx}
              sub={chirpsMm != null ? `${chirpsMm.toFixed(1)} mm/day historical max` : 'Long-term CHIRPS dataset (1981–2023)'}
            />
            <DataCard
              label="Flash Flood Susceptibility"
              value={(() => {
                const vd = report?.verified_data ?? {};
                return vd.flash_flood_susceptibility ?? (isSinkhole && chirpsHigh ? 'Critical' : isSinkhole || chirpsHigh ? 'High' : 'Low');
              })()}
              sub="CHIRPS intensity + sinkhole flag"
            />
          </View>

          <View style={S.divider} />

          <View style={S.grid3}>
            <DataCard
              label="Flood History"
              value={floodHistory === true ? 'DETECTED' : floodHistory === false ? 'Clear' : '—'}
              sub="JRC / GEE historical flood dataset"
            />
            <DataCard
              label="Seasonal Water"
              value={seasonalWater === true ? 'Yes' : seasonalWater === false ? 'No' : '—'}
              sub="Seasonal surface water presence"
            />
            <DataCard
              label="Wetland Risk"
              value={wetlandRisk === true ? 'Flagged' : wetlandRisk === false ? 'Clear' : '—'}
              sub="GEE land cover wetland class"
            />
          </View>

          <View style={S.divider} />

          <View style={S.grid2}>
            <View style={S.col}>
              <Text style={[S.sectionLabel, { marginBottom: 8, fontSize: 9 }]}>Soil & Moisture</Text>
              <DataCard
                label="Surface Soil Moisture"
                value={soilMoisture != null ? soilMoisture.toString() : '—'}
                sub={highMoisture ? '⚠ High moisture — drainage likely required' : 'Normal moisture levels'}
              />
              <DataCard
                label="Vegetation Cover (NDVI)"
                value={ndvi != null ? ndvi.toFixed(3) : '—'}
                sub={ndviInterp}
              />
            </View>
            <View style={S.col}>
              <Text style={[S.sectionLabel, { marginBottom: 8, fontSize: 9 }]}>Risk Indicators</Text>
              {[
                { label: 'Sinkhole Detected',    val: isSinkhole },
                { label: 'Flood History',         val: floodHistory },
                { label: 'Seasonal Water',        val: seasonalWater },
                { label: 'Wetland Risk',          val: wetlandRisk },
                { label: 'High Soil Moisture',    val: highMoisture },
                { label: 'CHIRPS Rainfall High',  val: chirpsIdx === 'High' },
              ].map(({ label, val }) => (
                <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: COLORS.slate200 }}>
                  <Text style={{ fontSize: 8.5, color: COLORS.slate600 }}>{label}</Text>
                  <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: val ? COLORS.red600 : COLORS.emerald600 }}>
                    {val === true ? '⚠ Yes' : val === false ? '✓ No' : '—'}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {drainSection && (
            <>
              <View style={S.divider} />
              <Text style={[S.sectionLabel, { fontSize: 9, marginBottom: 6 }]}>AI Drainage & Flood Assessment</Text>
              <Text style={S.bodyText}>{String(drainSection.body ?? '')}</Text>
            </>
          )}

          {envSection && (
            <>
              <View style={S.divider} />
              <Text style={[S.sectionLabel, { fontSize: 9, marginBottom: 6 }]}>AI Environmental Assessment</Text>
              <Text style={S.bodyText}>{String(envSection.body ?? '')}</Text>
            </>
          )}

        </View>
        <PageFooter n={5} />
      </Page>
    </>
  );
}
