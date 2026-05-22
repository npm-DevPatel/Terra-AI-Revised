import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { S, COLORS } from '../pdfStyles';

function PageHeader({ date }) {
  return (
    <View style={S.pageHeader}>
      <View style={S.brandRow}>
        <View style={S.brandDot} />
        <Text style={S.brandName}>Terra AI — Legal & Zoning Constraints</Text>
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

// ─── String builder helpers (no nested template literals) ──────────────────

function riparianDesc(triggered, waterway, dataSrc) {
  const dist = waterway != null ? String(waterway) + 'm away' : 'data unavailable';
  const src  = dataSrc ? ` (Data source: ${dataSrc.toUpperCase()})` : '';
  if (triggered) {
    return 'CRITICAL: Plot is within 30m of a waterway (' + dist + ')' + src + '. Construction within this buffer is prohibited under EMCA Cap 387. A NEMA Environmental Impact Assessment is mandatory before any development.';
  }
  return 'No riparian encroachment detected. Nearest waterway: ' + dist + src + '. Plot appears outside the legally protected 30m NEMA buffer.';
}

function aviationGenericDesc(triggered, airport) {
  const dist = airport != null ? String(airport) + 'km' : 'data unavailable';
  if (triggered) {
    return 'Plot is within a flight path zone. Nearest airport: ' + dist + '. Height limits may apply under KCAA regulations — verify before multi-storey construction.';
  }
  return 'No aviation height restriction flagged via OSM aerodrome data. Nearest airport: ' + dist + '. Standard building height rules apply.';
}

function aviationKcaaDesc(triggered, zoneName) {
  if (triggered) {
    return 'Plot is within KCAA-mapped approach funnel: ' + (zoneName || 'Unknown zone') + '. Building height strictly capped by KCAA. High-rise apartment development is NOT permissible. Obtain KCAA height certificate before any planning submission.';
  }
  return 'No KCAA aviation height restriction detected from hardcoded approach funnel zones. Standard county building height bylaws apply.';
}

function demolitionDesc(triggered, highway, railway) {
  if (triggered) {
    const hwy = highway != null ? String(highway) + 'm to nearest highway' : null;
    const rwy = railway != null ? String(railway) + 'm to nearest railway' : null;
    const dists = [hwy, rwy].filter(Boolean).join('; ');
    return '100% RISK OF UNCOMPENSATED DEMOLITION by KeNHA/Kenya Railways. ' +
      (dists ? dists + '. ' : '') +
      'Any structure built here is subject to compulsory demolition without compensation under the Kenya Roads Act and Kenya Railways Act. Do NOT purchase.';
  }
  const parts = [];
  if (highway != null) parts.push('Nearest major highway: ' + String(highway) + 'm');
  if (railway != null) parts.push('Nearest railway: ' + String(railway) + 'm');
  return 'No demolition setback breach detected. ' + parts.join('; ') + '. Verify with county surveyor — official road reserves may differ from OSM data.';
}

function cliffDesc(meters) {
  const dist = String(meters) + 'm';
  if (meters < 50) {
    return 'Nearest cliff or escarpment: ' + dist + '. Proximity may create structural and safety risks.';
  }
  return 'Nearest cliff or escarpment: ' + dist + '. Distance appears adequate.';
}

// ─── Risk Row Component ─────────────────────────────────────────────────────

function RiskRow({ label, triggered, description, critical }) {
  const safeDesc = typeof description === 'string' ? description : String(description ?? '');
  const isTriggered = Boolean(triggered);
  const isCritical  = Boolean(critical) && isTriggered;

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.slate200,
      gap: 12,
    }}>
      <View style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: isCritical ? '#fef2f2' : isTriggered ? '#fff7ed' : COLORS.emerald50,
        borderWidth: isCritical ? 2 : 1,
        borderColor: isCritical ? '#ef4444' : isTriggered ? '#f59e0b' : COLORS.emerald100,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 1,
      }}>
        <Text style={{ fontSize: 9, color: isCritical ? '#ef4444' : isTriggered ? '#f59e0b' : COLORS.emerald600, fontFamily: 'Helvetica-Bold' }}>
          {isCritical ? '!!' : isTriggered ? 'X' : 'OK'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.slate900 }}>
            {String(label)}
          </Text>
          <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: isCritical ? '#ef4444' : isTriggered ? '#f59e0b' : COLORS.emerald600 }}>
            {isCritical ? 'CRITICAL' : isTriggered ? 'FLAGGED' : 'CLEAR'}
          </Text>
        </View>
        <Text style={{ fontSize: 8.5, color: COLORS.slate600, lineHeight: 1.6 }}>
          {safeDesc}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function LegalConstraints({ payload, report, date }) {
  const riparianBreach      = payload?.riparian_breach             ?? false;
  const roadReserve         = payload?.road_reserve_risk           ?? false;
  const protectedLand       = payload?.protected_land_risk         ?? false;
  const aviationRisk        = payload?.aviation_risk               ?? false;    // OSM/generic
  const aviationHeightCap   = payload?.aviation_height_restriction ?? false;    // KCAA hardcoded
  const demolitionRisk      = payload?.demolition_risk             ?? false;
  const nearestWaterway     = payload?.nearest_waterway_m          ?? null;
  const nearestAirport      = payload?.nearest_airport_km          ?? null;
  const nearestHighway      = payload?.nearest_highway_m           ?? null;
  const nearestRailway      = payload?.nearest_railway_m           ?? null;
  const kcaaZone            = payload?.kcaa_zone_name              ?? null;
  const riparianSrc         = payload?.riparian_data_source        ?? 'osm';
  const landuse             = String(payload?.landuse_zone         ?? 'Not mapped');
  const nearestCliff        = payload?.nearest_cliff_m             ?? null;

  const sections    = Array.isArray(report?.sections) ? report.sections : [];
  const legalSection  = sections.find((s) => s.id === 'legal')           ?? null;
  const zoningSection = sections.find((s) => s.id === 'zoning')          ?? null;
  const fraudSection  = sections.find((s) => s.id === 'fraud_checklist') ?? null;
  const nextSection   = sections.find((s) => s.id === 'recommendation')  ?? null;

  // New: Groundwater & Air Quality
  const gw  = payload?.groundwater ?? {};
  const env = payload?.environment ?? {};
  const waterScarcityRisk  = Boolean(gw.water_scarcity_risk);
  const severeAirPollution = Boolean(env.severe_air_pollution);
  const no2Val = env.no2_mol_per_m2 != null ? (env.no2_mol_per_m2 * 1e6).toFixed(2) + ' µmol/m²' : 'N/A';
  const gwDepth = gw.depth_to_groundwater_m != null ? String(gw.depth_to_groundwater_m) + 'm' : 'Not determined';

  return (
    <Page size="A4" style={S.page}>
      <PageHeader date={date} />
      <View style={S.body}>
        <Text style={S.sectionLabel}>Legal, Zoning & Regulatory Constraints</Text>

        {/* ── Water Scarcity (BGS Groundwater Atlas) warning box ── */}
        {waterScarcityRisk && (
          <View style={{
            backgroundColor: '#fef2f2',
            borderWidth: 2,
            borderColor: '#dc2626',
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#dc2626', marginBottom: 4, letterSpacing: 0.8 }}>
              ⚠ WATER SCARCITY WARNING — DEEP BOREHOLE REQUIRED
            </Text>
            <Text style={{ fontSize: 8.5, color: '#991b1b', lineHeight: 1.65 }}>
              {'This plot sits on a low-productivity aquifer (BGS Africa Groundwater Atlas). Water depth: ' + gwDepth + '. Aquifer type: ' + (gw.aquifer_productivity || 'Unknown') + '.'}
            </Text>
            <Text style={{ fontSize: 8.5, color: '#991b1b', lineHeight: 1.65, marginTop: 4, fontFamily: 'Helvetica-Bold' }}>
              Budget a minimum of KES 2,000,000 for deep rotary borehole drilling. Standard boreholes (60–120m) will not reach the water table.
            </Text>
          </View>
        )}

        {/* ── Severe Air Pollution (Sentinel-5P NO₂) warning box ── */}
        {severeAirPollution && (
          <View style={{
            backgroundColor: '#fff7ed',
            borderWidth: 1.5,
            borderColor: '#d97706',
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#b45309', marginBottom: 4, letterSpacing: 0.5 }}>
              🌫 ENVIRONMENTAL HAZARD — CHRONIC NO₂ AIR POLLUTION (Copernicus Sentinel-5P)
            </Text>
            <Text style={{ fontSize: 8.5, color: '#92400e', lineHeight: 1.65 }}>
              {'Sentinel-5P satellite telemetry (NRTI L3) indicates severe, chronic nitrogen dioxide (NO₂) pollution at this coordinate. Measured NO₂: ' + no2Val + ' (threshold: 100 µmol/m²). Likely cause: adjacent industrial zoning, waste combustion, or heavy traffic corridors.'}
            </Text>
            <Text style={{ fontSize: 8.5, color: '#92400e', lineHeight: 1.65, marginTop: 4 }}>
              Impact: Severe respiratory health risks for occupants. Residential tenant demand will be materially suppressed. Rental yields and resale values are negatively affected. A NEMA air quality environmental impact assessment is strongly recommended before any development commitment.
            </Text>
          </View>
        )}

        {/* ── Step 3.2: Demolition Setback — Large red warning box if triggered ── */}
        {demolitionRisk && (
          <View style={{
            backgroundColor: '#fef2f2',
            borderWidth: 2,
            borderColor: '#ef4444',
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#ef4444', marginBottom: 4, letterSpacing: 1 }}>
              ⚠ DEMOLITION RISK — DO NOT PURCHASE
            </Text>
            <Text style={{ fontSize: 8.5, color: '#b91c1c', lineHeight: 1.6 }}>
              {demolitionDesc(true, nearestHighway, nearestRailway)}
            </Text>
          </View>
        )}

        {/* ── Step 3.2: KCAA Aviation Cap — detail height cap limits ── */}
        {aviationHeightCap && (
          <View style={{
            backgroundColor: '#fff7ed',
            borderWidth: 1.5,
            borderColor: '#f59e0b',
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#b45309', marginBottom: 4, letterSpacing: 0.5 }}>
              ✈ KCAA AVIATION HEIGHT RESTRICTION
            </Text>
            <Text style={{ fontSize: 8.5, color: '#92400e', lineHeight: 1.6 }}>
              {aviationKcaaDesc(true, kcaaZone)}
            </Text>
            <Text style={{ fontSize: 8, color: '#92400e', marginTop: 6, fontFamily: 'Helvetica-Bold' }}>
              Affected zone: {kcaaZone ?? 'KCAA approach funnel'}
            </Text>
          </View>
        )}

        {/* ── Standard risk rows ── */}
        <RiskRow
          label="Riparian Buffer Zone (30m — EMCA Cap 387)"
          triggered={riparianBreach}
          critical={riparianBreach}
          description={riparianDesc(riparianBreach, nearestWaterway, riparianSrc)}
        />
        <RiskRow
          label="Demolition Setback (KeNHA 60m / Railways 30m)"
          triggered={demolitionRisk}
          critical={demolitionRisk}
          description={demolitionRisk ? '' : demolitionDesc(false, nearestHighway, nearestRailway)}
        />
        <RiskRow
          label="Road Reserve Encroachment (Kenya Roads Act)"
          triggered={roadReserve}
          description={
            roadReserve
              ? 'Plot may overlap with a designated road reserve. Structures within road reserves risk demolition orders under the Kenya Roads Act.'
              : 'No road reserve overlap detected. The plot appears clear of the designated carriageway and road reserves.'
          }
        />
        <RiskRow
          label="Protected Land / Conservation Zone"
          triggered={protectedLand}
          description={
            protectedLand
              ? 'Land cover analysis or OSM boundary data suggests proximity to a protected or conservation area. Confirm with KWS and county government before any development.'
              : 'No protected land or conservation zone overlap detected via OSM boundaries and GEE land cover data.'
          }
        />
        <RiskRow
          label="KCAA Aviation Height Restriction (Hardcoded Approach Funnels)"
          triggered={aviationHeightCap}
          description={aviationHeightCap ? '' : aviationKcaaDesc(false, null)}
        />
        <RiskRow
          label="Aviation Restriction (OSM Aerodrome Data)"
          triggered={aviationRisk}
          description={aviationGenericDesc(aviationRisk, nearestAirport)}
        />
        {nearestCliff != null && (
          <RiskRow
            label="Cliff / Escarpment Hazard"
            triggered={nearestCliff < 50}
            description={cliffDesc(nearestCliff)}
          />
        )}

        <View style={S.divider} />

        <View style={S.grid2}>
          <View style={S.col}>
            <View style={S.card}>
              <Text style={S.cardLabel}>OSM Land Use Zone</Text>
              <Text style={[S.cardValue, { fontSize: 14 }]}>{landuse}</Text>
              <Text style={S.cardSub}>From OpenStreetMap land-use layer</Text>
            </View>
            {zoningSection && (
              <Text style={S.bodyText}>{String(zoningSection.body ?? '')}</Text>
            )}
          </View>
          <View style={S.col}>
            {fraudSection && (
              <>
                <Text style={[S.sectionLabel, { marginBottom: 8 }]}>Fraud Risk Checklist</Text>
                <Text style={[S.bodyText, { lineHeight: 1.9 }]}>{String(fraudSection.body ?? '')}</Text>
              </>
            )}
            {nextSection && (
              <>
                <View style={{ height: 10 }} />
                <Text style={[S.sectionLabel, { marginBottom: 8 }]}>Recommended Next Steps</Text>
                <Text style={[S.bodyText, { lineHeight: 1.9 }]}>{String(nextSection.body ?? '')}</Text>
              </>
            )}
          </View>
        </View>

        {legalSection && (
          <>
            <View style={S.divider} />
            <Text style={[S.sectionLabel, { marginBottom: 6 }]}>AI Legal Assessment</Text>
            <Text style={S.bodyText}>{String(legalSection.body ?? '')}</Text>
          </>
        )}
      </View>
      <PageFooter n={7} />
    </Page>
  );
}
