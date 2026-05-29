import React from "react";
import {
  Document,
  Font,
  Image,
  Line,
  Page,
  Rect,
  Svg,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import terraLogo from "../../assets/front_page/terra_logo.png";

Font.register({
  family: "Gabarito",
  fonts: [
    { src: "https://fonts.gstatic.com/s/gabarito/v9/QGYwz_0dZAGKJJ4t3FFkc3Q8AkNP9Pj248K0Fg.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/gabarito/v9/QGYwz_0dZAGKJJ4t3FFkc3Q8AkNP9Pj20cK0Fg.ttf", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/gabarito/v9/QGYwz_0dZAGKJJ4t3FFkc3Q8AkNP9Pj2PcW0Fg.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/gabarito/v9/QGYwz_0dZAGKJJ4t3FFkc3Q8AkNP9Pj2BMW0Fg.ttf", fontWeight: 700 },
    { src: "https://fonts.gstatic.com/s/gabarito/v9/QGYwz_0dZAGKJJ4t3FFkc3Q8AkNP9Pj2Y8W0Fg.ttf", fontWeight: 800 },
    { src: "https://fonts.gstatic.com/s/gabarito/v9/QGYwz_0dZAGKJJ4t3FFkc3Q8AkNP9Pj2SsW0Fg.ttf", fontWeight: 900 },
  ],
});

const GREEN = "#063f2c";
const GREEN_2 = "#07553a";
const GREEN_3 = "#0b6b49";
const MINT = "#9ff5c8";
const CREAM = "#f5efe3";
const WHITE = "#ffffff";

const DISCLAIMER =
  "Terra AI is a preliminary land intelligence document. It does not replace a licensed survey, title search, geotechnical investigation, NEMA assessment, county planning confirmation, or legal advice.";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Gabarito",
    backgroundColor: GREEN,
    color: WHITE,
    padding: 34,
    fontSize: 9,
  },
  watermark: {
    position: "absolute",
    width: 300,
    height: 300,
    opacity: 0.045,
    left: 148,
    top: 250,
  },
  pageChrome: {
    position: "absolute",
    left: 22,
    right: 22,
    top: 22,
    bottom: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: WHITE,
    padding: 4,
    marginRight: 10,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  brandName: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.8,
    color: WHITE,
  },
  brandSub: {
    fontSize: 7,
    color: "rgba(255,255,255,0.62)",
    marginTop: 2,
  },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    color: CREAM,
    fontSize: 7,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  hero: {
    flex: 1,
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: MINT,
    fontWeight: 800,
    marginBottom: 12,
  },
  title: {
    fontSize: 44,
    lineHeight: 0.95,
    fontWeight: 900,
    color: WHITE,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 1.45,
    color: "rgba(255,255,255,0.78)",
    width: "82%",
  },
  metaGrid: {
    flexDirection: "row",
    marginTop: 28,
  },
  metaBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 13,
    marginRight: 10,
  },
  label: {
    fontSize: 7,
    letterSpacing: 1.5,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
    fontWeight: 800,
    marginBottom: 5,
  },
  value: {
    fontSize: 13,
    color: WHITE,
    fontWeight: 800,
    lineHeight: 1.25,
  },
  sectionKicker: {
    color: MINT,
    fontSize: 8,
    fontWeight: 900,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  sectionTitle: {
    color: WHITE,
    fontSize: 27,
    lineHeight: 1,
    fontWeight: 900,
    marginBottom: 9,
  },
  sectionLead: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 10,
    lineHeight: 1.45,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
  },
  col: {
    flex: 1,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.13)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  darkCard: {
    backgroundColor: GREEN_2,
    borderColor: "rgba(159,245,200,0.22)",
  },
  cardTitle: {
    fontSize: 11,
    color: WHITE,
    fontWeight: 900,
    marginBottom: 5,
  },
  bodyText: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 8.5,
    lineHeight: 1.55,
  },
  bigMetric: {
    fontSize: 22,
    fontWeight: 900,
    color: WHITE,
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 7.5,
    color: "rgba(255,255,255,0.62)",
    lineHeight: 1.35,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(159,245,200,0.16)",
    color: MINT,
    fontSize: 7,
    fontWeight: 800,
    marginRight: 6,
    marginBottom: 6,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 34,
    right: 34,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingTop: 9,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    color: "rgba(255,255,255,0.44)",
    fontSize: 6.5,
    width: "82%",
  },
  pageNum: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 7,
    fontWeight: 800,
  },
});

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function fmtNumber(value, suffix = "") {
  const n = asNumber(value);
  if (n == null) return "Not mapped";
  return `${Math.round(n).toLocaleString()}${suffix}`;
}

function fmtKes(value) {
  const n = asNumber(value);
  if (n == null || n === 0) return "Not priced";
  return `KES ${Math.round(n).toLocaleString()}`;
}

function boolText(value) {
  if (value === true) return "Risk detected";
  if (value === false) return "Clear";
  return "Not mapped";
}

function cleanText(text, fallback = "No narrative was returned for this item.") {
  return String(text || fallback)
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/(^|\n)\s*[-•]\s+/g, "$1")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function placeName(payload) {
  return [payload.place_name, payload.ward, payload.subcounty, payload.county]
    .filter(Boolean)
    .join(", ") || "Selected land parcel";
}

function verdictLabel(payload) {
  return payload.investment_verdict || payload.verdict || "CLEAR FOR DUE DILIGENCE";
}

function riskScore(payload) {
  const direct = asNumber(payload.land_feasibility_score ?? payload.feasibility_score);
  if (direct != null) return Math.max(0, Math.min(100, direct));
  const risks = [
    payload.demolition_risk,
    payload.riparian_breach,
    payload.road_reserve_risk,
    payload.aviation_risk,
    payload.flood_history,
  ].filter(Boolean).length;
  return Math.max(20, 92 - risks * 14);
}

function sectionById(payload, ids) {
  const sections = Array.isArray(payload.sections) ? payload.sections : [];
  return sections.find((section) => ids.includes(section.id)) || null;
}

function Watermark() {
  return (
    <>
      <View style={styles.pageChrome} fixed />
      <Image src={terraLogo} style={styles.watermark} fixed />
    </>
  );
}

function Header({ tag = "Land Intelligence Dossier" }) {
  return (
    <View style={styles.header} fixed>
      <View style={styles.brand}>
        <View style={styles.logoWrap}>
          <Image src={terraLogo} style={styles.logo} />
        </View>
        <View>
          <Text style={styles.brandName}>TERRA AI</Text>
          <Text style={styles.brandSub}>Where Building Begins...</Text>
        </View>
      </View>
      <Text style={styles.chip}>{tag}</Text>
    </View>
  );
}

function Footer({ page }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{DISCLAIMER}</Text>
      <Text style={styles.pageNum}>{page}</Text>
    </View>
  );
}

function MetricCard({ label, value, sub, style }) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.bigMetric}>{value}</Text>
      {sub ? <Text style={styles.metricSub}>{sub}</Text> : null}
    </View>
  );
}

function MiniBar({ label, value, danger = false }) {
  const width = Math.max(10, Math.min(100, asNumber(value) ?? 0));
  return (
    <View style={{ marginBottom: 9 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ color: WHITE, fontSize: 8, fontWeight: 800 }}>{label}</Text>
        <Text style={{ color: "rgba(255,255,255,0.68)", fontSize: 8 }}>{Math.round(width)}%</Text>
      </View>
      <View style={{ height: 7, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)" }}>
        <View style={{ width: `${width}%`, height: 7, borderRadius: 999, backgroundColor: danger ? "#f6b37f" : MINT }} />
      </View>
    </View>
  );
}

function SiteDiagram({ payload }) {
  const waterRisk = payload.riparian_breach || payload.flood_history;
  const roadRisk = payload.road_reserve_risk;
  return (
    <View style={[styles.card, styles.darkCard, { padding: 10 }]}>
      <Text style={styles.cardTitle}>Site Relationship Diagram</Text>
      <Svg width="235" height="140" viewBox="0 0 235 140">
        <Rect x="18" y="22" width="82" height="64" rx="10" fill="rgba(159,245,200,0.20)" stroke={MINT} strokeWidth="2" />
        <Rect x="35" y="38" width="48" height="31" rx="5" fill="rgba(255,255,255,0.20)" />
        <Line x1="4" y1="112" x2="230" y2="28" stroke={roadRisk ? "#f6b37f" : "rgba(255,255,255,0.46)"} strokeWidth="8" />
        <Line x1="132" y1="132" x2="214" y2="12" stroke={waterRisk ? "#f6b37f" : "#74dcb0"} strokeWidth="9" />
        <Rect x="125" y="34" width="72" height="44" rx="9" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.22)" />
        <Line x1="132" y1="48" x2="190" y2="48" stroke="rgba(255,255,255,0.42)" strokeWidth="2" />
        <Line x1="132" y1="62" x2="176" y2="62" stroke="rgba(255,255,255,0.30)" strokeWidth="2" />
      </Svg>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 3 }}>
        <Text style={styles.pill}>Road: {boolText(roadRisk)}</Text>
        <Text style={styles.pill}>Water: {boolText(waterRisk)}</Text>
        <Text style={styles.pill}>Grid: {fmtNumber(payload.distance_to_grid_m, "m")}</Text>
      </View>
    </View>
  );
}

function BuildDiagram({ payload }) {
  const slope = asNumber(payload.slope_percent ?? payload.slope);
  const foundationPremium = asNumber(payload.cost_summary?.estimated_foundation_premium_kes);
  return (
    <View style={[styles.card, styles.darkCard]}>
      <Text style={styles.cardTitle}>Build Simulation Diagram</Text>
      <Svg width="235" height="122" viewBox="0 0 235 122">
        <Line x1="18" y1="92" x2="218" y2={slope && slope > 8 ? "58" : "82"} stroke="rgba(255,255,255,0.52)" strokeWidth="3" />
        <Rect x="64" y="48" width="86" height="45" rx="4" fill="rgba(159,245,200,0.22)" stroke={MINT} strokeWidth="2" />
        <Rect x="78" y="64" width="18" height="29" rx="2" fill="rgba(255,255,255,0.20)" />
        <Rect x="112" y="64" width="22" height="14" rx="2" fill="rgba(255,255,255,0.20)" />
        <Line x1="55" y1="96" x2="160" y2="96" stroke={foundationPremium ? "#f6b37f" : MINT} strokeWidth="7" />
        <Line x1="70" y1="103" x2="145" y2="103" stroke="rgba(255,255,255,0.28)" strokeWidth="3" />
      </Svg>
      <Text style={styles.bodyText}>
        Foundation signal: {foundationPremium ? `${fmtKes(foundationPremium)} premium indicated` : "No premium returned by the engine"}.
      </Text>
    </View>
  );
}

function InvestmentDiagram({ score }) {
  return (
    <View style={[styles.card, styles.darkCard]}>
      <Text style={styles.cardTitle}>Future Value Horizon</Text>
      <Svg width="235" height="118" viewBox="0 0 235 118">
        <Line x1="20" y1="92" x2="215" y2="92" stroke="rgba(255,255,255,0.26)" strokeWidth="2" />
        <Line x1="20" y1="92" x2="20" y2="18" stroke="rgba(255,255,255,0.26)" strokeWidth="2" />
        <Line x1="30" y1="82" x2="82" y2={score > 65 ? "65" : "74"} stroke={MINT} strokeWidth="4" />
        <Line x1="82" y1={score > 65 ? "65" : "74"} x2="138" y2={score > 65 ? "43" : "68"} stroke={MINT} strokeWidth="4" />
        <Line x1="138" y1={score > 65 ? "43" : "68"} x2="200" y2={score > 65 ? "28" : "62"} stroke={score > 65 ? MINT : "#f6b37f"} strokeWidth="4" />
        <Rect x="27" y="88" width="26" height="8" rx="3" fill="rgba(255,255,255,0.16)" />
        <Rect x="118" y="88" width="30" height="8" rx="3" fill="rgba(255,255,255,0.16)" />
        <Rect x="184" y="88" width="30" height="8" rx="3" fill="rgba(255,255,255,0.16)" />
      </Svg>
      <Text style={styles.bodyText}>The curve is directional, based on feasibility, constraints, access, utilities, and hidden-cost exposure.</Text>
    </View>
  );
}

function IntroPage({ payload }) {
  const coords = payload.coordinates || {};
  const generated = new Date().toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
  return (
    <Page size="A4" style={styles.page}>
      <Watermark />
      <Header tag="Confidential Land Dossier" />
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Pre-purchase land intelligence</Text>
        <Text style={styles.title}>Where Building Begins...</Text>
        <Text style={styles.subtitle}>
          A Terra AI dossier for understanding the site, simulating build readiness, and framing the investment future before money changes hands.
        </Text>
        <View style={styles.metaGrid}>
          <View style={styles.metaBox}>
            <Text style={styles.label}>Project Name</Text>
            <Text style={styles.value}>{payload.project_name || payload.place_name || payload.ward || "Terra Site Review"}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.label}>Project Location</Text>
            <Text style={styles.value}>{placeName(payload)}</Text>
          </View>
        </View>
        <View style={styles.metaGrid}>
          <View style={styles.metaBox}>
            <Text style={styles.label}>Coordinates</Text>
            <Text style={styles.value}>
              {coords.lat ? `${coords.lat.toFixed(5)}, ${coords.lng?.toFixed(5)}` : "Not supplied"}
            </Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.label}>Generated</Text>
            <Text style={styles.value}>{generated}</Text>
          </View>
        </View>
      </View>
      <Footer page="00" />
    </Page>
  );
}

function SiteIntelligencePage({ payload }) {
  const score = riskScore(payload);
  const summary = cleanText(payload.executive_summary, "Terra AI reviewed this parcel for visible land constraints, infrastructure access, legal exposure, water proximity, and build readiness.");
  const legal = sectionById(payload, ["legal_risks", "legal"]);
  return (
    <Page size="A4" style={styles.page}>
      <Watermark />
      <Header tag="Section A" />
      <Text style={styles.sectionKicker}>A. Site Intelligence</Text>
      <Text style={styles.sectionTitle}>What the land is telling us now</Text>
      <Text style={styles.sectionLead}>{summary.slice(0, 520)}</Text>

      <View style={styles.row}>
        <View style={[styles.col, { marginRight: 10 }]}>
          <MetricCard label="Feasibility Score" value={`${Math.round(score)}/100`} sub={verdictLabel(payload)} />
          <MetricCard label="Nearest Waterway" value={fmtNumber(payload.nearest_waterway_m, "m")} sub={boolText(payload.riparian_breach)} />
          <MetricCard label="Electricity Grid" value={fmtNumber(payload.distance_to_grid_m, "m")} sub="Approximate service proximity from spatial scan" />
        </View>
        <View style={styles.col}>
          <SiteDiagram payload={payload} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.cardTitle}>Constraint Signals</Text>
          <MiniBar label="Legal Exposure" value={payload.demolition_risk ? 88 : payload.road_reserve_risk ? 62 : 18} danger={payload.demolition_risk || payload.road_reserve_risk} />
          <MiniBar label="Water Sensitivity" value={payload.riparian_breach || payload.flood_history ? 78 : 22} danger={payload.riparian_breach || payload.flood_history} />
          <MiniBar label="Access Confidence" value={payload.nearest_road_m ? Math.max(25, 100 - payload.nearest_road_m / 8) : 54} />
        </View>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardTitle}>Due Diligence Priority</Text>
          <Text style={styles.bodyText}>
            {cleanText(legal?.body, "Start with title search, green card review, beacon confirmation, county zoning, and a site visit with neighbours before paying a deposit.").slice(0, 520)}
          </Text>
        </View>
      </View>
      <Footer page="01" />
    </Page>
  );
}

function BuildSimulationPage({ payload }) {
  const cs = payload.cost_summary || {};
  const foundation = sectionById(payload, ["foundation_costs", "soil_geotech", "topography"]);
  const infra = sectionById(payload, ["infrastructure"]);
  return (
    <Page size="A4" style={styles.page}>
      <Watermark />
      <Header tag="Section B" />
      <Text style={styles.sectionKicker}>B. Build Simulation</Text>
      <Text style={styles.sectionTitle}>How construction might behave here</Text>
      <Text style={styles.sectionLead}>
        This section translates the scan into practical building implications: likely foundation complexity, utility friction, access considerations, and the construction risks that can change the real budget.
      </Text>

      <View style={styles.row}>
        <View style={[styles.col, { marginRight: 10 }]}>
          <BuildDiagram payload={payload} />
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Likely Build Sequence</Text>
            <Text style={styles.bodyText}>1. Confirm boundaries and title.</Text>
            <Text style={styles.bodyText}>2. Verify zoning and road reserve.</Text>
            <Text style={styles.bodyText}>3. Conduct soil and drainage checks.</Text>
            <Text style={styles.bodyText}>4. Price foundations, services, and access works.</Text>
          </View>
        </View>
        <View style={styles.col}>
          <MetricCard label="Foundation Premium" value={fmtKes(cs.estimated_foundation_premium_kes)} sub="Engine-estimated build-cost pressure" />
          <MetricCard label="Hidden Cost Estimate" value={fmtKes(cs.total_hidden_cost_estimate_kes)} sub="Legal, foundation, access, and constraint exposure" />
          <MetricCard label="Aviation Constraint" value={boolText(payload.aviation_risk)} sub={payload.nearest_airport_km ? `${payload.nearest_airport_km}km to nearest airport` : "No airport distance returned"} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.cardTitle}>Foundation Read</Text>
          <Text style={styles.bodyText}>{cleanText(foundation?.body, "No detailed foundation narrative was returned. Treat this as a cue to commission a geotechnical test before structural design.").slice(0, 560)}</Text>
        </View>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardTitle}>Infrastructure Read</Text>
          <Text style={styles.bodyText}>{cleanText(infra?.body, "Confirm road access, power, water, stormwater disposal, and county service requirements before purchase.").slice(0, 560)}</Text>
        </View>
      </View>
      <Footer page="02" />
    </Page>
  );
}

function FutureVisionPage({ payload, askingPriceResult }) {
  const score = riskScore(payload);
  const verdict = verdictLabel(payload);
  const isOver = askingPriceResult?.isOvercharged;
  const priceText = askingPriceResult
    ? (isOver ? `${askingPriceResult.overchargePercent}% above benchmark` : "Within review range")
    : "Run broker price check";
  return (
    <Page size="A4" style={styles.page}>
      <Watermark />
      <Header tag="Section C" />
      <Text style={styles.sectionKicker}>C. Future Vision & Investment</Text>
      <Text style={styles.sectionTitle}>What this parcel could become</Text>
      <Text style={styles.sectionLead}>
        Terra AI frames the parcel as an investment decision: what to protect against, what can increase value, and what must be verified before the land becomes a home, rental asset, subdivision, or long-hold position.
      </Text>

      <View style={styles.row}>
        <View style={[styles.col, { marginRight: 10 }]}>
          <InvestmentDiagram score={score} />
        </View>
        <View style={styles.col}>
          <MetricCard label="Investment Verdict" value={verdict} sub="Generated from spatial constraints and report synthesis" />
          <MetricCard label="Broker Price Signal" value={priceText} sub={askingPriceResult ? `${fmtKes(askingPriceResult.askingPrice)} asking price` : "Use the calculator on the report page"} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.cardTitle}>Best-Fit Future Uses</Text>
          <Text style={styles.bodyText}>Family home: {score >= 65 ? "Promising after legal checks." : "Only after resolving major constraints."}</Text>
          <Text style={styles.bodyText}>Rental asset: {payload.distance_to_grid_m != null && payload.distance_to_grid_m < 500 ? "Better utility readiness." : "Budget for service extension."}</Text>
          <Text style={styles.bodyText}>Subdivision: Verify mutation, access width, zoning, and county approvals before relying on future resale.</Text>
        </View>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardTitle}>Next 30 Days</Text>
          <Text style={styles.bodyText}>Week 1: title search, seller identity, green card, and encumbrance check.</Text>
          <Text style={styles.bodyText}>Week 2: surveyor beacon verification and neighbour interviews.</Text>
          <Text style={styles.bodyText}>Week 3: county zoning, access, services, and environmental flags.</Text>
          <Text style={styles.bodyText}>Week 4: negotiate price using hidden-cost exposure and lawyer feedback.</Text>
        </View>
      </View>

      <View style={[styles.card, styles.darkCard, { marginTop: 2 }]}>
        <Text style={styles.cardTitle}>Terra AI Closing Note</Text>
        <Text style={styles.bodyText}>
          A good land purchase is not just cheap land. It is land with clear ownership, usable access, buildable ground, service logic, and a future use that survives due diligence. Use this dossier as your decision map, then let licensed professionals verify the facts on the ground.
        </Text>
      </View>
      <Footer page="03" />
    </Page>
  );
}

export function TerraReportDocument({ payload = {}, askingPriceResult = null }) {
  const titlePlace = payload.place_name || payload.ward || "Land Parcel";
  return (
    <Document
      title={`Terra AI Dossier - ${titlePlace}`}
      author="Terra AI"
      subject="Site Intelligence, Build Simulation, and Future Vision"
      keywords="Terra AI, land, Kenya, due diligence, construction, investment"
    >
      <IntroPage payload={payload} />
      <SiteIntelligencePage payload={payload} />
      <BuildSimulationPage payload={payload} />
      <FutureVisionPage payload={payload} askingPriceResult={askingPriceResult} />
    </Document>
  );
}

export default TerraReportDocument;
