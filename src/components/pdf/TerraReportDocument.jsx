/**
 * TerraReportDocument.jsx — 3-Page Pre-Purchase Land Dossier
 *
 * Page 1 — Verdict & Pricing Result
 * Page 2 — Legal & Geospatial Flags + Cost Breakdown
 * Page 3 — Printable Due Diligence Checklist + Key Contacts
 *
 * TopographySection and EnvironmentalSection are intentionally REMOVED.
 *
 * @param {object} payload            — merged backend payload + report fields
 * @param {object|null} askingPriceResult — lifted from PricingCalculator:
 *   { askingPrice, pricePerAcre, matchedKey, overchargePercent, isOvercharged, isUnderpriced }
 */

import React from "react";
import {
  Document, Page, View, Text, StyleSheet,
} from "@react-pdf/renderer";

const DISCLAIMER =
  "Terra AI geospatial data is provided for preliminary screening purposes only. " +
  "It does not constitute legal or valuation advice. Always engage a licensed " +
  "conveyancing lawyer and ISK-registered surveyor before completing any land " +
  "transaction in Kenya.";

const VERDICT_COLORS = {
  "DO NOT BUY — FATAL LEGAL FLAW": "#CC2222",
  "PROCEED WITH CAUTION":          "#CC8800",
  "CLEAR FOR DUE DILIGENCE":       "#1A7A3C",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 36,
    paddingBottom: 52,
    paddingHorizontal: 40,
    color: "#1A1A1A",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 7,
    color: "#888888",
    borderTopWidth: 0.5,
    borderTopColor: "#CCCCCC",
    paddingTop: 6,
  },

  // ── Page 1 — Summary ──────────────────────────────────────────
  verdictBanner: {
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  verdictLabel: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  verdictSub: {
    fontSize: 9,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    borderBottomWidth: 0.5,
    borderBottomColor: "#CCCCCC",
    paddingBottom: 4,
    marginBottom: 8,
    marginTop: 14,
  },
  execSummary: {
    fontSize: 10,
    lineHeight: 1.6,
    color: "#333333",
    marginBottom: 12,
  },
  table: {
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: "#DDDDDD",
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F2F2F2",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#DDDDDD",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#EEEEEE",
  },
  tableRowLast: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  colFlag:     { width: "30%", fontSize: 9 },
  colSeverity: { width: "20%", fontSize: 9 },
  colImpact:   { width: "50%", fontSize: 9 },
  severityFatal:    { color: "#CC2222", fontFamily: "Helvetica-Bold" },
  severityCaution:  { color: "#CC8800", fontFamily: "Helvetica-Bold" },
  severityAdvisory: { color: "#555555" },

  // ── Page 2 — Geo Flags ─────────────────────────────────────────
  geoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },
  geoCard: {
    width: "47%",
    borderWidth: 0.5,
    borderColor: "#DDDDDD",
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
    marginRight: "3%",
  },
  geoCardLabel: { fontSize: 8, color: "#888888", marginBottom: 2 },
  geoCardValue: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  geoCardRed:   { color: "#CC2222" },
  geoCardGreen: { color: "#1A7A3C" },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#EEEEEE",
  },
  costLabel: { fontSize: 9, color: "#555555" },
  costValue: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  notesBox: {
    marginTop: 16,
    borderWidth: 0.5,
    borderColor: "#CCCCCC",
    borderRadius: 4,
    height: 120,
    padding: 8,
  },
  notesLabel: { fontSize: 8, color: "#AAAAAA" },

  // ── Page 3 — Checklist ─────────────────────────────────────────
  checklistItem: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 0.75,
    borderColor: "#555555",
    borderRadius: 1,
    marginRight: 8,
    marginTop: 1,
    flexShrink: 0,
  },
  checklistTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 1 },
  checklistMeta:  { fontSize: 8, color: "#666666" },
  contactsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  contactCard: {
    width: "47%",
    borderWidth: 0.5,
    borderColor: "#DDDDDD",
    borderRadius: 4,
    padding: 6,
    marginBottom: 6,
    marginRight: "3%",
  },
  contactName: { fontSize: 8, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  contactUrl:  { fontSize: 7, color: "#1155CC" },
});

// ─── Reusable Footer ──────────────────────────────────────────────────────────
function Footer({ pageNum }) {
  return (
    <View style={styles.footer} fixed>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 7, flex: 1, marginRight: 8 }}>{DISCLAIMER}</Text>
        <Text style={{ fontSize: 7 }}>Page {pageNum} of 3</Text>
      </View>
    </View>
  );
}

// ─── Page 1: Verdict & Pricing Summary ───────────────────────────────────────
function SummaryPage({ payload, askingPriceResult }) {
  const verdict     = payload.investment_verdict || "CLEAR FOR DUE DILIGENCE";
  const bannerColor = VERDICT_COLORS[verdict] || "#1A7A3C";
  const flags       = Array.isArray(payload.risk_flags) ? payload.risk_flags : [];
  const cs          = payload.cost_summary || {};

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={{ marginBottom: 14 }}>
        <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 2 }}>
          Terra AI — Land Pre-Purchase Report
        </Text>
        <Text style={{ fontSize: 9, color: "#666666" }}>
          {payload.place_name || payload.ward || "Unknown location"}
          {payload.county ? ` · ${payload.county} County` : ""}
          {" · "}Generated {new Date().toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}
        </Text>
      </View>

      {/* Verdict Banner */}
      <View style={[styles.verdictBanner, { backgroundColor: bannerColor }]}>
        <Text style={styles.verdictLabel}>{verdict}</Text>
        {payload.executive_summary ? (
          <Text style={styles.verdictSub}>{String(payload.executive_summary).slice(0, 300)}</Text>
        ) : null}
      </View>

      {/* Risk Flags table */}
      {flags.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Risk Flags</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colFlag,     { fontFamily: "Helvetica-Bold" }]}>Flag</Text>
              <Text style={[styles.colSeverity, { fontFamily: "Helvetica-Bold" }]}>Severity</Text>
              <Text style={[styles.colImpact,   { fontFamily: "Helvetica-Bold" }]}>Estimated KES Impact</Text>
            </View>
            {flags.map((f, i) => {
              const isLast = i === flags.length - 1;
              const severityStyle =
                f.severity === "FATAL"   ? styles.severityFatal :
                f.severity === "CAUTION" ? styles.severityCaution :
                styles.severityAdvisory;
              return (
                <View key={i} style={isLast ? styles.tableRowLast : styles.tableRow}>
                  <Text style={styles.colFlag}>{f.flag_name}</Text>
                  <Text style={[styles.colSeverity, severityStyle]}>{f.severity}</Text>
                  <Text style={styles.colImpact}>
                    {typeof f.estimated_kes_impact === "number"
                      ? `KES ${f.estimated_kes_impact.toLocaleString()}`
                      : String(f.estimated_kes_impact || "—")}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* Broker Price Check result (if user used the calculator) */}
      {askingPriceResult && (
        <>
          <Text style={styles.sectionTitle}>Broker Price Check</Text>
          <View style={[styles.table, { padding: 10 }]}>
            <Text style={{ fontSize: 9, marginBottom: 4 }}>
              Asking price:{" "}
              <Text style={{ fontFamily: "Helvetica-Bold" }}>
                KES {askingPriceResult.askingPrice.toLocaleString()}
              </Text>
            </Text>
            <Text style={{ fontSize: 9, marginBottom: 4 }}>
              Market benchmark ({askingPriceResult.matchedKey}):{" "}
              <Text style={{ fontFamily: "Helvetica-Bold" }}>
                KES {askingPriceResult.pricePerAcre.toLocaleString()}/acre
              </Text>
            </Text>
            <Text style={{
              fontSize: 9,
              color: askingPriceResult.isOvercharged ? "#CC2222" :
                     askingPriceResult.isUnderpriced ? "#1155CC" : "#1A7A3C",
              fontFamily: "Helvetica-Bold",
            }}>
              {askingPriceResult.isOvercharged
                ? `OVERCHARGE: ${askingPriceResult.overchargePercent}% above market rate`
                : askingPriceResult.isUnderpriced
                ? `WARNING: ${Math.abs(askingPriceResult.overchargePercent)}% below market — possible fraud`
                : "Within fair market range"}
            </Text>
          </View>
        </>
      )}

      {/* Cost summary pill */}
      {(cs.total_hidden_cost_estimate_kes || cs.estimated_foundation_premium_kes) && (
        <>
          <Text style={styles.sectionTitle}>Cost Summary</Text>
          <View style={[styles.table, { padding: 10 }]}>
            {cs.estimated_foundation_premium_kes > 0 && (
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Foundation Premium</Text>
                <Text style={styles.costValue}>KES {Number(cs.estimated_foundation_premium_kes).toLocaleString()}</Text>
              </View>
            )}
            {cs.estimated_legal_risk_kes > 0 && (
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Legal / Repossession Risk</Text>
                <Text style={[styles.costValue, { color: "#CC2222" }]}>
                  {typeof cs.estimated_legal_risk_kes === "number"
                    ? `KES ${cs.estimated_legal_risk_kes.toLocaleString()}`
                    : String(cs.estimated_legal_risk_kes)}
                </Text>
              </View>
            )}
            {cs.total_hidden_cost_estimate_kes && (
              <View style={[styles.costRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.costLabel, { fontFamily: "Helvetica-Bold", color: "#1A1A1A" }]}>Total Hidden Cost</Text>
                <Text style={[styles.costValue, { color: "#1A1A1A" }]}>
                  {typeof cs.total_hidden_cost_estimate_kes === "number"
                    ? `KES ${cs.total_hidden_cost_estimate_kes.toLocaleString()}`
                    : String(cs.total_hidden_cost_estimate_kes)}
                </Text>
              </View>
            )}
          </View>
        </>
      )}

      <Footer pageNum={1} />
    </Page>
  );
}

// ─── Page 2: Legal & Geospatial Flags ────────────────────────────────────────
function GeoFlagsPage({ payload }) {
  const cs = payload.cost_summary || {};

  // Only buyer-relevant fields — no NDVI, sunshine, soil moisture, elevation
  const geoFields = [
    { label: "Flood Risk Level",              key: "flood_history",         isBool: true },
    { label: "Government Demolition Risk",    key: "demolition_risk",       isBool: true },
    { label: "Road Reserve Encroachment",     key: "road_reserve_risk",     isBool: true },
    { label: "Riparian Zone Violation",       key: "riparian_breach",       isBool: true },
    { label: "Aviation Height Restriction",   key: "aviation_risk",         isBool: true },
    { label: "Dist. to Nearest River/Stream", key: "nearest_waterway_m",    format: v => `${v} m` },
    { label: "Distance to Electricity Grid",  key: "distance_to_grid_m",    format: v => `${v} m` },
  ];

  // AI sections — only legal_risks, foundation_costs, infrastructure
  const allowedSections = ["legal_risks", "foundation_costs", "infrastructure", "legal", "soil_geotech"];
  const sections = (Array.isArray(payload.sections) ? payload.sections : [])
    .filter(s => allowedSections.includes(s.id) && typeof s.body === "string" && s.body.length > 0);

  return (
    <Page size="A4" style={styles.page}>
      <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 12 }}>
        Legal &amp; Geospatial Detail
      </Text>

      {/* Geo flag cards */}
      <Text style={styles.sectionTitle}>Geospatial Risk Indicators</Text>
      <View style={styles.geoGrid}>
        {geoFields.map(({ label, key, isBool, format }) => {
          const raw = payload[key];
          if (raw === undefined || raw === null) return null;
          const displayVal = isBool
            ? (raw ? "⚠ YES" : "✓ NO")
            : (format ? format(raw) : String(raw));
          const isRisk = isBool ? !!raw : false;
          return (
            <View key={key} style={styles.geoCard}>
              <Text style={styles.geoCardLabel}>{label}</Text>
              <Text style={[styles.geoCardValue, isRisk ? styles.geoCardRed : styles.geoCardGreen]}>
                {displayVal}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Hidden Cost Breakdown */}
      {(cs.estimated_foundation_premium_kes || cs.estimated_legal_risk_kes || cs.total_hidden_cost_estimate_kes) ? (
        <>
          <Text style={styles.sectionTitle}>Hidden Cost Estimate</Text>
          <View style={styles.table}>
            {[
              ["Foundation Premium",       cs.estimated_foundation_premium_kes],
              ["Legal / Repossession Risk", cs.estimated_legal_risk_kes],
              ["Total Hidden Cost",        cs.total_hidden_cost_estimate_kes],
            ].map(([label, val], i, arr) => (val ? (
              <View key={String(label)} style={i === arr.length - 1 ? styles.tableRowLast : styles.costRow}>
                <Text style={styles.costLabel}>{label}</Text>
                <Text style={styles.costValue}>
                  {typeof val === "number" ? `KES ${val.toLocaleString()}` : String(val)}
                </Text>
              </View>
            ) : null))}
          </View>
        </>
      ) : null}

      {/* AI analysis sections */}
      {sections.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>AI Analysis</Text>
          {sections.map((s) => (
            <View key={s.id} style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 3 }}>{s.title}</Text>
              <Text style={{ fontSize: 8, color: "#444444", lineHeight: 1.5 }}>
                {String(s.body).slice(0, 600)}
              </Text>
            </View>
          ))}
        </>
      )}

      {/* Notes for lawyer */}
      <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Notes for Your Lawyer</Text>
      <View style={styles.notesBox}>
        <Text style={styles.notesLabel}>Write your notes here after printing</Text>
      </View>

      <Footer pageNum={2} />
    </Page>
  );
}

// ─── Page 3: Printable Checklist ──────────────────────────────────────────────
const CHECKLIST_ITEMS_PDF = [
  { id: 1,  title: "Official Title Search (Ardhisasa / eCitizen)",            cost: "KES 500",                  time: "1–3 days" },
  { id: 2,  title: "Manual Green Card Search at Land Registry",                cost: "KES 500–1,000",            time: "1–3 days" },
  { id: 3,  title: "Physical Site Visit & Boundary Confirmation",              cost: "Transport only",           time: "Half day" },
  { id: 4,  title: "Licensed Surveyor — Beacon Verification & RIM Check",     cost: "KES 15,000–40,000",        time: "1–3 days" },
  { id: 5,  title: "Land Rates Clearance Certificate (County Government)",     cost: "Free to check",            time: "1–3 days" },
  { id: 6,  title: "Land Rent Clearance (Leasehold Land — NLC)",              cost: "Free to check",            time: "2–5 days" },
  { id: 7,  title: "Zoning & Change of User Verification",                     cost: "Free to verify",           time: "1–2 days" },
  { id: 8,  title: "Land Control Board (LCB) Consent (Agricultural Land)",    cost: "~KES 1,000 + lawyer",      time: "4–6 weeks" },
  { id: 9,  title: "Conveyancing Lawyer — Sale Agreement & Escrow",           cost: "~1% of land value",        time: "Ongoing" },
  { id: 10, title: "Stamp Duty Payment (KRA iTax)",                           cost: "2–4% of purchase price",   time: "1–2 days" },
  { id: 11, title: "Community & Neighbour Inquiry",                            cost: "Free",                     time: "1 hour on site" },
  { id: 12, title: "Mutation & Subdivision Verification (subdivided plots)",   cost: "Included in surveyor fee", time: "With surveyor" },
];

const KEY_CONTACTS = [
  { name: "Ardhisasa (Title Search)",    url: "ardhisasa.lands.go.ke" },
  { name: "ISK Surveyor Registry",       url: "isk.or.ke" },
  { name: "Law Society of Kenya (LSK)",  url: "lsk.or.ke" },
  { name: "KRA iTax (Stamp Duty)",       url: "itax.kra.go.ke" },
  { name: "National Land Commission",    url: "nlc.go.ke" },
  { name: "Ministry of Lands",           url: "lands.go.ke" },
];

function ChecklistPage() {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 4 }}>
        Due Diligence Checklist
      </Text>
      <Text style={{ fontSize: 9, color: "#666666", marginBottom: 12 }}>
        Complete every step before transferring any money. Tick each box as you go.
      </Text>

      {CHECKLIST_ITEMS_PDF.map((step) => (
        <View key={step.id} style={styles.checklistItem}>
          <View style={styles.checkbox} />
          <View style={{ flex: 1 }}>
            <Text style={styles.checklistTitle}>
              Step {step.id}: {step.title}
            </Text>
            <Text style={styles.checklistMeta}>
              {step.cost}  ·  {step.time}
            </Text>
          </View>
        </View>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Key Contacts</Text>
      <View style={styles.contactsGrid}>
        {KEY_CONTACTS.map((c) => (
          <View key={c.url} style={styles.contactCard}>
            <Text style={styles.contactName}>{c.name}</Text>
            <Text style={styles.contactUrl}>{c.url}</Text>
          </View>
        ))}
      </View>

      {/* Terra AI branding */}
      <View style={{ marginTop: 20, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: "#CCCCCC" }}>
        <Text style={{ fontSize: 8, color: "#888888", textAlign: "center" }}>
          Generated by Terra AI · Pre-Purchase Land Screener & Fraud Detector · Kenya
        </Text>
      </View>

      <Footer pageNum={3} />
    </Page>
  );
}

// ─── Root document export ─────────────────────────────────────────────────────
/**
 * Named export used with pdf().toBlob() in Report.jsx's handleDownloadPDF.
 *
 * @param {object} payload            — validated backend payload merged with report
 * @param {object|null} askingPriceResult — result from PricingCalculator (or null)
 */
export function TerraReportDocument({ payload = {}, askingPriceResult = null }) {
  return (
    <Document
      title={`Terra AI Report — ${payload.place_name || payload.ward || "Land Parcel"}`}
      author="Terra AI"
      subject="Pre-Purchase Land Screening Report — Kenya"
      keywords="land, Kenya, due diligence, fraud detection, Terra AI"
    >
      <SummaryPage  payload={payload} askingPriceResult={askingPriceResult} />
      <GeoFlagsPage payload={payload} />
      <ChecklistPage />
    </Document>
  );
}

// Default export for backwards compatibility (not used by new blob flow)
export default TerraReportDocument;
