import React from 'react';
import { Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { S, COLORS, fmt } from '../pdfStyles';

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', backgroundColor: COLORS.slate900, padding: 0 },
  bgStripe: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 220, backgroundColor: '#0a1628' },
  emeraldAccent: { position: 'absolute', top: 0, right: 0, width: 160, height: 160, backgroundColor: COLORS.emerald500, opacity: 0.08, borderBottomLeftRadius: 160 },
  body: { flex: 1, padding: 52, justifyContent: 'space-between' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  logoDot: { width: 18, height: 18, backgroundColor: COLORS.emerald500, borderRadius: 5 },
  logoText: { color: COLORS.white, fontSize: 16, fontFamily: 'Helvetica-Bold' },
  tagline: { color: COLORS.slate400, fontSize: 8, letterSpacing: 2, textTransform: 'uppercase' },
  titleBlock: { marginTop: 80 },
  reportType: { color: COLORS.emerald500, fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 },
  mainTitle: { color: COLORS.white, fontSize: 34, fontFamily: 'Helvetica-Bold', lineHeight: 1.15, marginBottom: 6 },
  subTitle: { color: COLORS.slate400, fontSize: 12, marginBottom: 32 },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, alignSelf: 'flex-start' },
  metaRow: { flexDirection: 'row', gap: 24, marginTop: 28 },
  metaLabel: { color: COLORS.slate400, fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  metaValue: { color: COLORS.white, fontSize: 10 },
  metaValueMono: { color: COLORS.emerald500, fontSize: 9 },
  bottomStrip: { borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  confidential: { color: COLORS.slate400, fontSize: 7, letterSpacing: 2, textTransform: 'uppercase' },
});

export default function CoverPage({ payload, report, coordinates, date }) {
  const place  = [payload?.place_name, payload?.ward, payload?.county].filter(Boolean).join(', ') || 'Kenya';
  const score  = typeof report?.land_feasibility_score === 'number' ? report.land_feasibility_score : 0;
  const label  = String(report?.land_feasibility_label ?? '—');
  const verdict = report?.investment_verdict ? String(report.investment_verdict) : null;
  const lat = coordinates?.lat;
  const lng = coordinates?.lng;
  const getRiskColors = (score) => {
    if (score >= 80) return COLORS.emerald500;
    if (score >= 50) return COLORS.amber500;
    return COLORS.red500;
  };
  const scoreColor = getRiskColors(score);

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.bgStripe} />
      <View style={styles.emeraldAccent} />
      {/* Decorative grid — replaced with View-based approach to avoid react-pdf SVG wrap warning */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.04 }}>
        {[0,1,2,3,4,5,6].map(i => (
          <View key={'v'+i} style={{ position: 'absolute', top: 0, bottom: 0, left: i * 85, width: 1, backgroundColor: COLORS.white }} />
        ))}
        {[0,1,2,3,4,5,6,7,8,9].map(i => (
          <View key={'h'+i} style={{ position: 'absolute', left: 0, right: 0, top: i * 84, height: 1, backgroundColor: COLORS.white }} />
        ))}
      </View>
      <View style={styles.body}>
        <View>
          <View style={styles.logoRow}>
            <View style={styles.logoDot} />
            <Text style={styles.logoText}>Terra AI</Text>
          </View>
          <Text style={styles.tagline}>Enterprise Land Intelligence Platform</Text>
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.reportType}>Geospatial Risk Assessment Dossier</Text>
          <Text style={styles.mainTitle}>Land Pre-Purchase{'\n'}Intelligence Report</Text>
          <Text style={styles.subTitle}>{place}</Text>
          <View style={styles.scoreBadge}>
            <View>
              <Text style={{ color: COLORS.slate400, fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Land Feasibility Score</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ color: scoreColor, fontSize: 42, fontFamily: 'Helvetica-Bold', lineHeight: 1 }}>{score}</Text>
                <Text style={{ color: COLORS.slate400, fontSize: 16, marginBottom: 5 }}>/100</Text>
              </View>
            </View>
            <View style={{ width: 1, height: 48, backgroundColor: 'rgba(255,255,255,0.12)' }} />
            <View>
              <Text style={{ color: COLORS.slate400, fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 5 }}>Classification</Text>
              <Text style={{ color: scoreColor, fontSize: 14, fontFamily: 'Helvetica-Bold' }}>{label}</Text>
              {verdict && <Text style={{ color: COLORS.slate400, fontSize: 7.5, marginTop: 3 }}>{verdict}</Text>}
            </View>
          </View>
          <View style={styles.metaRow}>
            <View><Text style={styles.metaLabel}>Generated</Text><Text style={styles.metaValue}>{date}</Text></View>
            {lat != null && <View><Text style={styles.metaLabel}>Coordinates</Text><Text style={styles.metaValueMono}>{lat.toFixed(6)}, {lng?.toFixed(6)}</Text></View>}
            <View><Text style={styles.metaLabel}>County</Text><Text style={styles.metaValue}>{String(payload?.county ?? 'Kenya')}</Text></View>
            <View><Text style={styles.metaLabel}>Engine</Text><Text style={styles.metaValue}>Terra AI v2.0</Text></View>
          </View>
        </View>
        <View style={styles.bottomStrip}>
          <Text style={styles.confidential}>Confidential — For Client Use Only</Text>
          <Text style={{ color: COLORS.slate400, fontSize: 7 }}>Page 1 of 9</Text>
        </View>
      </View>
    </Page>
  );
}
