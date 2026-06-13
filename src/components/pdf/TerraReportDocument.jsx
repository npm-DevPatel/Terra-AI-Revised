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

const WHITE_BG = "#ffffff";
const WHITE_PANEL = "#f8fafc";
const WHITE_PANEL_3 = "#e2e8f0";
const MINT = "#9ff5c8";
const WHITE = "#ffffff";
const SLATE = "#0f172a";
const SLATE_2 = "#334155";
const SLATE_3 = "#64748b";

const DISCLAIMER =
  "Terra AI is a preliminary land intelligence document. It does not replace a licensed survey, title search, geotechnical investigation, NEMA assessment, county planning confirmation, or legal advice.";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Gabarito",
    backgroundColor: WHITE_BG,
    color: SLATE,
    padding: 34,
    fontSize: 9,
  },
  topBand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: "#047857",
  },
  topBandSoft: {
    position: "absolute",
    top: 14,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: WHITE_PANEL_3,
  },
  watermark: {
    position: "absolute",
    width: 320,
    height: 320,
    opacity: 0.025,
    left: 132,
    top: 230,
  },
  watermarkSoft: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#ecfdf5",
    opacity: 0.8,
    right: -50,
    top: 76,
  },
  watermarkSoft2: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#f8fafc",
    left: -28,
    bottom: 88,
  },
  pageChrome: {
    position: "absolute",
    left: 22,
    right: 22,
    top: 22,
    bottom: 22,
    borderWidth: 1,
    borderColor: WHITE_PANEL_3,
    borderRadius: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
    paddingTop: 4,
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
    color: SLATE,
  },
  brandSub: {
    fontSize: 7,
    color: SLATE_3,
    marginTop: 2,
  },
  headerStack: {
    marginLeft: 2,
  },
  headerKicker: {
    fontSize: 7,
    color: "#047857",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  headerNote: {
    fontSize: 6.5,
    color: SLATE_3,
    marginTop: 2,
    textAlign: "right",
    lineHeight: 1.2,
  },
  chip: {
    borderWidth: 1,
    borderColor: WHITE_PANEL_3,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    color: SLATE_2,
    fontSize: 7,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  chipBlock: {
    alignItems: "flex-end",
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 8,
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: "#047857",
    fontWeight: 800,
    marginBottom: 12,
  },
  title: {
    fontSize: 44,
    lineHeight: 0.95,
    fontWeight: 900,
    color: SLATE,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 1.45,
    color: SLATE_2,
    width: "82%",
  },
  heroGrid: {
    flexDirection: "row",
    marginTop: 26,
  },
  heroLeft: {
    flex: 1.25,
    marginRight: 12,
  },
  heroRight: {
    flex: 0.85,
  },
  heroCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: WHITE_PANEL_3,
    borderRadius: 18,
    padding: 16,
  },
  heroScoreLabel: {
    fontSize: 7,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: SLATE_3,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  heroScoreValue: {
    fontSize: 42,
    fontFamily: "Helvetica-Bold",
    color: "#047857",
    lineHeight: 1,
  },
  heroScoreSub: {
    fontSize: 8,
    color: SLATE_2,
    lineHeight: 1.45,
    marginTop: 8,
  },
  coverPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  coverPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#ecfdf5",
    color: "#047857",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  metaGrid: {
    flexDirection: "row",
    marginTop: 28,
  },
  metaBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: WHITE_PANEL_3,
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 13,
    marginRight: 10,
  },
  label: {
    fontSize: 7,
    letterSpacing: 1.5,
    color: SLATE_3,
    textTransform: "uppercase",
    fontWeight: 800,
    marginBottom: 5,
  },
  value: {
    fontSize: 13,
    color: SLATE,
    fontWeight: 800,
    lineHeight: 1.25,
  },
  sectionKicker: {
    color: "#047857",
    fontSize: 8,
    fontWeight: 900,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  sectionFrame: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionFrameLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionRail: {
    width: 5,
    height: 34,
    borderRadius: 4,
    backgroundColor: "#047857",
    marginRight: 10,
  },
  sectionTitle: {
    color: SLATE,
    fontSize: 27,
    lineHeight: 1,
    fontWeight: 900,
    marginBottom: 9,
  },
  sectionLead: {
    color: SLATE_2,
    fontSize: 10,
    lineHeight: 1.45,
    marginBottom: 16,
  },
  sectionBadge: {
    borderWidth: 1,
    borderColor: WHITE_PANEL_3,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: SLATE_3,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  row: {
    flexDirection: "row",
  },
  col: {
    flex: 1,
  },
  card: {
    backgroundColor: WHITE,
    borderColor: WHITE_PANEL_3,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  cardAccent: {
    height: 4,
    backgroundColor: "#047857",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    marginTop: -12,
    marginHorizontal: -12,
    marginBottom: 10,
  },
  darkCard: {
    backgroundColor: WHITE_PANEL,
    borderColor: WHITE_PANEL_3,
  },
  cardTitle: {
    fontSize: 11,
    color: SLATE,
    fontWeight: 900,
    marginBottom: 5,
  },
  bodyText: {
    color: SLATE_2,
    fontSize: 8.5,
    lineHeight: 1.55,
  },
  bigMetric: {
    fontSize: 22,
    fontWeight: 900,
    color: SLATE,
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 7.5,
    color: SLATE_3,
    lineHeight: 1.35,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#ecfdf5",
    color: "#047857",
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
    borderTopColor: WHITE_PANEL_3,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    color: SLATE_3,
    fontSize: 6.5,
    width: "82%",
  },
  footerTag: {
    fontSize: 6.5,
    color: "#047857",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  pageNum: {
    color: SLATE_2,
    fontSize: 7,
    fontWeight: 800,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -5,
  },
  statChip: {
    width: "48%",
    backgroundColor: WHITE_PANEL,
    borderWidth: 1,
    borderColor: WHITE_PANEL_3,
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 5,
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 7,
    color: SLATE_3,
    textTransform: "uppercase",
    letterSpacing: 1.3,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  statValue: {
    fontSize: 14,
    color: SLATE,
    fontFamily: "Helvetica-Bold",
  },
  statSub: {
    fontSize: 7.5,
    color: SLATE_2,
    marginTop: 3,
    lineHeight: 1.35,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#047857",
    marginTop: 4,
    marginRight: 8,
  },
  timelineText: {
    flex: 1,
    fontSize: 8.5,
    color: SLATE_2,
    lineHeight: 1.5,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 7,
  },
  checklistBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: WHITE_PANEL_3,
    marginTop: 3,
    marginRight: 8,
  },
  checklistText: {
    flex: 1,
    fontSize: 8.5,
    color: SLATE_2,
    lineHeight: 1.5,
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
      <View style={styles.topBand} fixed />
      <View style={styles.topBandSoft} fixed />
      <View style={styles.watermarkSoft} fixed />
      <View style={styles.watermarkSoft2} fixed />
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
        <View style={styles.headerStack}>
          <Text style={styles.headerKicker}>Terra AI Dossier</Text>
          <Text style={styles.brandName}>TERRA AI</Text>
          <Text style={styles.brandSub}>Where Building Begins...</Text>
        </View>
      </View>
      <View style={styles.chipBlock}>
        <Text style={styles.chip}>{tag}</Text>
        <Text style={styles.headerNote}>Premium client export</Text>
      </View>
    </View>
  );
}

function Footer({ page }) {
  return (
    <View style={styles.footer} fixed>
      <View>
        <Text style={styles.footerTag}>Confidential dossier</Text>
        <Text style={styles.footerText}>{DISCLAIMER}</Text>
      </View>
      <Text style={styles.pageNum}>{page}</Text>
    </View>
  );
}

function MetricCard({ label, value, sub, style }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardAccent} />
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
  const score = riskScore(payload);
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
        <View style={styles.coverPillRow}>
          <Text style={styles.coverPill}>{payload.county || 'Kenya'}</Text>
          <Text style={styles.coverPill}>{payload.land_use || 'Land intelligence'}</Text>
          <Text style={styles.coverPill}>{coords.lat ? 'Pinned scan' : 'Manual review'}</Text>
          <Text style={styles.coverPill}>{generated}</Text>
        </View>
        <View style={styles.heroGrid}>
          <View style={styles.heroLeft}>
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
          <View style={styles.heroRight}>
            <View style={styles.heroCard}>
              <Text style={styles.heroScoreLabel}>Feasibility Score</Text>
              <Text style={styles.heroScoreValue}>{Math.round(score)}</Text>
              <Text style={styles.heroScoreSub}>
                {verdictLabel(payload)}. Use this dossier as the premium client-ready first pass before surveys, legal review, and negotiation.
              </Text>
            </View>
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
      <View style={styles.sectionFrame}>
        <View style={styles.sectionFrameLeft}>
          <View style={styles.sectionRail} />
          <View>
            <Text style={styles.sectionKicker}>A. Site Intelligence</Text>
            <Text style={styles.sectionTitle}>What the land is telling us now</Text>
          </View>
        </View>
        <Text style={styles.sectionBadge}>Live scan summary</Text>
      </View>
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
      <View style={styles.sectionFrame}>
        <View style={styles.sectionFrameLeft}>
          <View style={styles.sectionRail} />
          <View>
            <Text style={styles.sectionKicker}>B. Build Simulation</Text>
            <Text style={styles.sectionTitle}>How construction might behave here</Text>
          </View>
        </View>
        <Text style={styles.sectionBadge}>Construction lens</Text>
      </View>
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
      <View style={styles.sectionFrame}>
        <View style={styles.sectionFrameLeft}>
          <View style={styles.sectionRail} />
          <View>
            <Text style={styles.sectionKicker}>C. Future Vision & Investment</Text>
            <Text style={styles.sectionTitle}>What this parcel could become</Text>
          </View>
        </View>
        <Text style={styles.sectionBadge}>Investor view</Text>
      </View>
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

function SiteOverviewPage({ payload }) {
  const coords = payload.coordinates || {};
  const score = riskScore(payload);
  return (
    <Page size="A4" style={styles.page}>
      <Watermark />
      <Header tag="Section D" />
      <View style={styles.sectionFrame}>
        <View style={styles.sectionFrameLeft}>
          <View style={styles.sectionRail} />
          <View>
            <Text style={styles.sectionKicker}>D. Site Overview</Text>
            <Text style={styles.sectionTitle}>Parcel snapshot and core metadata</Text>
          </View>
        </View>
        <Text style={styles.sectionBadge}>Briefing page</Text>
      </View>
      <Text style={styles.sectionLead}>
        This page consolidates the parcel identity, the geospatial anchor, and the first-pass engine conclusion so the dossier reads like a formal project brief.
      </Text>

      <View style={styles.statGrid}>
        <View style={styles.statChip}><Text style={styles.statLabel}>Place</Text><Text style={styles.statValue}>{placeName(payload)}</Text><Text style={styles.statSub}>Primary location reference used by the engine.</Text></View>
        <View style={styles.statChip}><Text style={styles.statLabel}>Feasibility Score</Text><Text style={styles.statValue}>{Math.round(score)}/100</Text><Text style={styles.statSub}>{verdictLabel(payload)}</Text></View>
        <View style={styles.statChip}><Text style={styles.statLabel}>Coordinates</Text><Text style={styles.statValue}>{coords.lat ? `${coords.lat.toFixed(5)}, ${coords.lng?.toFixed(5)}` : 'Not supplied'}</Text><Text style={styles.statSub}>Pinned point used for the spatial scan.</Text></View>
        <View style={styles.statChip}><Text style={styles.statLabel}>Report Date</Text><Text style={styles.statValue}>{new Date().toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}</Text><Text style={styles.statSub}>Generated by Terra AI.</Text></View>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.cardTitle}>Executive Summary</Text>
          <Text style={styles.bodyText}>{cleanText(payload.executive_summary, 'No executive summary returned by the engine.').slice(0, 750)}</Text>
        </View>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardTitle}>Quick Flags</Text>
          <Text style={styles.bodyText}>Road reserve risk: {boolText(payload.road_reserve_risk)}</Text>
          <Text style={styles.bodyText}>Riparian breach: {boolText(payload.riparian_breach)}</Text>
          <Text style={styles.bodyText}>Flood history: {boolText(payload.flood_history)}</Text>
          <Text style={styles.bodyText}>Aviation risk: {boolText(payload.aviation_risk)}</Text>
          <Text style={styles.bodyText}>Protected land overlap: {boolText(payload.protected_land_risk)}</Text>
        </View>
      </View>

      <Footer page="04" />
    </Page>
  );
}

function TopographyPage({ payload }) {
  const slope = asNumber(payload.slope_percent ?? payload.slope);
  const elevation = asNumber(payload.elevation_m ?? payload.elevation);
  const soil = sectionById(payload, ['soil', 'soil_geotech', 'foundation_costs']);
  return (
    <Page size="A4" style={styles.page}>
      <Watermark />
      <Header tag="Section E" />
      <View style={styles.sectionFrame}>
        <View style={styles.sectionFrameLeft}>
          <View style={styles.sectionRail} />
          <View>
            <Text style={styles.sectionKicker}>E. Topography</Text>
            <Text style={styles.sectionTitle}>Terrain, slope, and build difficulty</Text>
          </View>
        </View>
        <Text style={styles.sectionBadge}>Ground truth lens</Text>
      </View>
      <Text style={styles.sectionLead}>
        The topography section explains whether the land behaves like a gentle building platform or a site that will need significant grading, drainage, and foundation work.
      </Text>

      <View style={styles.row}>
        <View style={[styles.col, { marginRight: 10 }]}>
          <MetricCard label="Slope" value={slope == null ? 'Not mapped' : `${Math.round(slope)}%`} sub="Derived from the terrain scan" />
          <MetricCard label="Elevation" value={elevation == null ? 'Not mapped' : `${Math.round(elevation)} m`} sub="Estimated altitude at the pinned point" />
          <MetricCard label="Soil / Foundation Read" value={soil ? 'Mapped' : 'Not mapped'} sub={soil ? cleanText(soil.body, 'Foundation context available.').slice(0, 140) : 'The engine did not return a dedicated soil narrative.'} />
        </View>
        <View style={[styles.col, { marginLeft: 10 }]}> 
          <BuildDiagram payload={payload} />
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Interpretation</Text>
            <Text style={styles.bodyText}>
              A flatter site generally reduces cut-and-fill work, while a steeper site increases retaining, drainage, and foundation complexity.
            </Text>
          </View>
        </View>
      </View>

      <Footer page="05" />
    </Page>
  );
}

function AccessAndInfrastructurePage({ payload }) {
  return (
    <Page size="A4" style={styles.page}>
      <Watermark />
      <Header tag="Section F" />
      <View style={styles.sectionFrame}>
        <View style={styles.sectionFrameLeft}>
          <View style={styles.sectionRail} />
          <View>
            <Text style={styles.sectionKicker}>F. Access & Infrastructure</Text>
            <Text style={styles.sectionTitle}>Roads, services, and reachability</Text>
          </View>
        </View>
        <Text style={styles.sectionBadge}>Connectivity</Text>
      </View>
      <Text style={styles.sectionLead}>
        This page focuses on how easily a buyer, builder, and service provider can reach the parcel and connect it to the essentials needed for development.
      </Text>

      <View style={styles.row}>
        <View style={[styles.col, { marginRight: 10 }]}>
          <SiteDiagram payload={payload} />
          <MetricCard label="Nearest Road" value={fmtNumber(payload.nearest_road_m, 'm')} sub="Approximate road proximity from the geospatial engine" />
        </View>
        <View style={styles.col}>
          <MetricCard label="Grid Connection" value={fmtNumber(payload.distance_to_grid_m, 'm')} sub="Distance to the nearest mapped electrical grid" />
          <MetricCard label="Water Connection" value={payload.water_connection_nearby ? 'Nearby' : 'Not confirmed'} sub="Service availability signal from the scan" />
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Access Notes</Text>
            <Text style={styles.bodyText}>{cleanText(sectionById(payload, ['infrastructure'])?.body, 'Road access, utilities, and service access should be verified on site.').slice(0, 560)}</Text>
          </View>
        </View>
      </View>

      <Footer page="06" />
    </Page>
  );
}

function WaterAndDrainagePage({ payload }) {
  const waterway = asNumber(payload.nearest_waterway_m);
  return (
    <Page size="A4" style={styles.page}>
      <Watermark />
      <Header tag="Section G" />
      <View style={styles.sectionFrame}>
        <View style={styles.sectionFrameLeft}>
          <View style={styles.sectionRail} />
          <View>
            <Text style={styles.sectionKicker}>G. Water & Drainage</Text>
            <Text style={styles.sectionTitle}>Water proximity and drainage exposure</Text>
          </View>
        </View>
        <Text style={styles.sectionBadge}>Hydrology</Text>
      </View>
      <Text style={styles.sectionLead}>
        Flooding, riparian sensitivity, drainage paths, and surface water behavior are the difference between a buildable plot and a parcel that needs expensive mitigation.
      </Text>

      <View style={styles.row}>
        <View style={[styles.col, { marginRight: 10 }]}>
          <MetricCard label="Nearest Waterway" value={waterway == null ? 'Not mapped' : `${Math.round(waterway)} m`} sub={boolText(payload.riparian_breach)} />
          <MetricCard label="Flood History" value={boolText(payload.flood_history)} sub="Historical flood exposure from the engine" />
          <MetricCard label="Drainage Signal" value={payload.flood_history || payload.riparian_breach ? 'Review required' : 'Lower concern'} sub="Use this with the ground survey before purchase" />
        </View>
        <View style={styles.col}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Water Interpretation</Text>
            <Text style={styles.bodyText}>
              If the site sits close to waterways or low-lying drainage lines, the buyer should budget for runoff control, raising floor slabs, and possible buffer compliance checks.
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Engine Narrative</Text>
            <Text style={styles.bodyText}>{cleanText(sectionById(payload, ['hydrology', 'environment', 'infrastructure'])?.body, 'The engine did not return a dedicated drainage narrative.').slice(0, 560)}</Text>
          </View>
        </View>
      </View>

      <Footer page="07" />
    </Page>
  );
}

function LegalAndPlanningPage({ payload }) {
  const legal = sectionById(payload, ['legal_risks', 'legal']);
  return (
    <Page size="A4" style={styles.page}>
      <Watermark />
      <Header tag="Section H" />
      <View style={styles.sectionFrame}>
        <View style={styles.sectionFrameLeft}>
          <View style={styles.sectionRail} />
          <View>
            <Text style={styles.sectionKicker}>H. Legal & Planning</Text>
            <Text style={styles.sectionTitle}>Title, zoning, and statutory caution</Text>
          </View>
        </View>
        <Text style={styles.sectionBadge}>Compliance</Text>
      </View>
      <Text style={styles.sectionLead}>
        This section pulls together the legal and planning exposure that should be checked before any commitment is made.
      </Text>

      <View style={styles.row}>
        <View style={[styles.card, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.cardTitle}>Legal Narrative</Text>
          <Text style={styles.bodyText}>{cleanText(legal?.body, 'No dedicated legal narrative returned by the engine.').slice(0, 750)}</Text>
        </View>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardTitle}>Planning Checks</Text>
          <Text style={styles.checklistText}>• Verify title ownership and encumbrances.</Text>
          <Text style={styles.checklistText}>• Confirm zoning and permitted use.</Text>
          <Text style={styles.checklistText}>• Check road reserve and boundary setbacks.</Text>
          <Text style={styles.checklistText}>• Confirm riparian and environmental buffers.</Text>
          <Text style={styles.checklistText}>• Validate county approvals before development.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Risk Summary</Text>
        <Text style={styles.bodyText}>
          Road reserve risk: {boolText(payload.road_reserve_risk)} · Demolition risk: {boolText(payload.demolition_risk)} · Protected land overlap: {boolText(payload.protected_land_risk)}
        </Text>
      </View>

      <Footer page="08" />
    </Page>
  );
}

function CostsAndNextStepsPage({ payload, askingPriceResult }) {
  const cs = payload.cost_summary || {};
  const priceResult = askingPriceResult || null;
  return (
    <Page size="A4" style={styles.page}>
      <Watermark />
      <Header tag="Section I" />
      <View style={styles.sectionFrame}>
        <View style={styles.sectionFrameLeft}>
          <View style={styles.sectionRail} />
          <View>
            <Text style={styles.sectionKicker}>I. Cost Model & Next Steps</Text>
            <Text style={styles.sectionTitle}>What it may cost and what to do next</Text>
          </View>
        </View>
        <Text style={styles.sectionBadge}>Closing page</Text>
      </View>
      <Text style={styles.sectionLead}>
        The final section turns the scan into a practical decision view: likely cost pressure, price context, and the immediate next steps after receiving the dossier.
      </Text>

      <View style={styles.row}>
        <View style={[styles.col, { marginRight: 10 }]}>
          <MetricCard label="Foundation Premium" value={fmtKes(cs.estimated_foundation_premium_kes)} sub="Potential build uplift from terrain and soil conditions" />
          <MetricCard label="Hidden Cost Estimate" value={fmtKes(cs.total_hidden_cost_estimate_kes)} sub="Access, legal, and build exposure combined" />
          <MetricCard label="Broker Price Signal" value={priceResult ? (priceResult.isOvercharged ? `${priceResult.overchargePercent}% above benchmark` : 'Within review range') : 'Not run'} sub={priceResult ? `${fmtKes(priceResult.askingPrice)} asking price` : 'Use the on-page calculator for a broker check'} />
        </View>
        <View style={styles.col}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Next Steps</Text>
            <Text style={styles.timelineText}>1. Do a title search and identity verification.</Text>
            <Text style={styles.timelineText}>2. Confirm beacon boundaries with a licensed surveyor.</Text>
            <Text style={styles.timelineText}>3. Review county planning, access, and utility constraints.</Text>
            <Text style={styles.timelineText}>4. Price the hidden costs before making an offer.</Text>
            <Text style={styles.timelineText}>5. Commission specialist surveys before completion.</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Decision Note</Text>
            <Text style={styles.bodyText}>
              Terra AI is a triage tool. Use this dossier to decide whether the parcel deserves due diligence, negotiation, or a hard stop.
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Appendix Snapshot</Text>
            <Text style={styles.bodyText}>Assumptions: public data may contain gaps, delays, or positional error.</Text>
            <Text style={styles.bodyText}>Checklist: title search, beacon check, zoning confirmation, service pricing, and licensed professional review.</Text>
          </View>
        </View>
      </View>

      <Footer page="09" />
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
      <SiteOverviewPage payload={payload} />
      <TopographyPage payload={payload} />
      <AccessAndInfrastructurePage payload={payload} />
      <WaterAndDrainagePage payload={payload} />
      <LegalAndPlanningPage payload={payload} />
      <CostsAndNextStepsPage payload={payload} askingPriceResult={askingPriceResult} />
    </Document>
  );
}

export default TerraReportDocument;
