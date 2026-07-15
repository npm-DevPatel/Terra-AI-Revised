/**
 * FlowWorkspace.jsx — Terra Report (Terra Flow)
 *
 * Report types:
 *   Existing: due_diligence, lender, planning, executive, progress
 *   New:      site_suitability, investor, architect
 *
 * Features:
 *   • Sidebar with all reports for this project
 *   • "New report" modal with type + audience picker
 *   • JSON report view (existing) AND HTML report view (new — beautiful 12-page)
 *   • "Export / Print" button opens HTML report in a new tab for browser PDF
 *   • Navigate to Lens or Planner
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText, Plus, Sparkles, ChevronRight, ScanSearch,
  LayoutDashboard, Printer, ExternalLink, X, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useTerraStore from '../../store/useTerraStore';
import { supabase } from '../../lib/supabaseClient';
import { API_BASE_URL as API_BASE } from '../../lib/apiBase';
import '../../styles/workspace.css';

const REPORT_TYPES = [
  { value: 'site_suitability', label: 'Site Suitability',  desc: 'Complete land assessment for any decision-maker', color: '#10b981', html: true },
  { value: 'investor',         label: 'Investor Report',   desc: 'Returns, risks, and viability for investors',    color: '#f59e0b', html: true },
  { value: 'architect',        label: 'Architect Brief',   desc: 'Site data, soil, terrain and constraints',       color: '#3b82f6', html: true },
  { value: 'due_diligence',    label: 'Due Diligence',     desc: 'Full pre-purchase risk assessment',              color: '#8b5cf6', html: false },
  { value: 'lender',           label: 'Lender Report',     desc: 'For banks and financing institutions',           color: '#60a5fa', html: false },
  { value: 'planning',         label: 'Planning Report',   desc: 'For county planning authorities',                color: '#34d399', html: false },
  { value: 'executive',        label: 'Executive Summary', desc: 'High-level brief for stakeholders',             color: '#f97316', html: false },
];

const AUDIENCES = [
  { value: 'client',     label: 'Client'     },
  { value: 'bank',       label: 'Bank'       },
  { value: 'government', label: 'Government' },
  { value: 'internal',   label: 'Internal'   },
];

function ago(d) {
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function HtmlReportViewer({ html, title, onClose }) {
  const openInTab = () => {
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
  };
  const print = () => {
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 600);
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0f', zIndex: 80, display: 'flex', flexDirection: 'column', fontFamily: "'Gabarito','Inter',system-ui" }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: '#111118' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f8' }}>{title}</div>
          <div style={{ fontSize: 11, color: '#4b5563' }}>Terra AI — Where Building Begins…</div>
        </div>
        <button onClick={print}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#10b981', color: '#fff', border: 'none', borderRadius: 100, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Printer size={13} /> Print / Save PDF
        </button>
        <button onClick={openInTab}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          <ExternalLink size={13} /> New tab
        </button>
        <button onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 7, cursor: 'pointer', color: '#6b7280', display: 'flex' }}>
          <X size={15} />
        </button>
      </div>
      <iframe
        srcDoc={html}
        style={{ flex: 1, border: 'none', background: '#fff' }}
        title={title}
        sandbox="allow-same-origin"
      />
    </div>
  );
}

export default function FlowWorkspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { session } = useTerraStore();

  const [reports, setReports] = useState([]);
  const [activeReport, setActiveReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [reportType, setReportType] = useState('site_suitability');
  const [audience, setAudience] = useState('client');
  const [error, setError] = useState('');
  const [htmlViewer, setHtmlViewer] = useState(null); // {html, title}

  useEffect(() => { loadReports(); }, [projectId]);

  async function loadReports() {
    const { data } = await supabase.from('flow_reports')
      .select('id, title, report_type, audience, content, created_at')
      .eq('project_id', projectId).order('created_at', { ascending: false });
    if (data?.length) { setReports(data); setActiveReport(data[0]); }
  }

  const selectedMeta = REPORT_TYPES.find(r => r.value === reportType) || REPORT_TYPES[0];

  const generate = async () => {
    setGenerating(true); setError(''); setShowNew(false);
    try {
      const endpoint = selectedMeta.html ? `${API_BASE}/api/flow/html` : `${API_BASE}/api/flow/report`;
      const res = await fetch(endpoint, { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ project_id: projectId, report_type: reportType, audience }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (selectedMeta.html && data.html) {
        // Show immediately in HTML viewer
        setHtmlViewer({ html: data.html, title: data.title });
        // Also add to sidebar list
        const newReport = { id: data.flow_report_id || Date.now(), title: data.title, report_type: reportType, audience, content: { html: true, title: data.title }, created_at: new Date().toISOString() };
        setReports(prev => [newReport, ...prev]);
      } else {
        const newReport = { id: data.flow_report_id, title: data.title, report_type: reportType, audience, content: data, created_at: new Date().toISOString() };
        setReports(prev => [newReport, ...prev]);
        setActiveReport(newReport);
      }
    } catch (err) { setError(err.message); }
    setGenerating(false);
  };

  const content = activeReport?.content;
  const typeMeta = REPORT_TYPES.find(r => r.value === activeReport?.report_type);
  const typeColor = typeMeta?.color || '#6b7280';

  return (
    <>
      {htmlViewer && <HtmlReportViewer html={htmlViewer.html} title={htmlViewer.title} onClose={() => setHtmlViewer(null)} />}

      <div className="flow-screen">
        {/* Sidebar */}
        <div className="flow-sidebar">
          {/* Nav links */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            <button onClick={() => navigate(`/workspace/${projectId}/lens`)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '6px', color: '#34d399', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <ScanSearch size={11} /> Lens
            </button>
            <button onClick={() => navigate(`/workspace/${projectId}/planner`)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, padding: '6px', color: '#60a5fa', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <LayoutDashboard size={11} /> Planner
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f8' }}>Reports</div>
            <button onClick={() => setShowNew(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#10b981', color: '#fff', border: 'none', borderRadius: 100, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={11} /> New
            </button>
          </div>

          {reports.length === 0 && !generating && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#374151', fontSize: 12 }}>No reports yet.<br />Click New to generate one.</div>
          )}

          {generating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 10 }}>
              <Loader2 size={16} className="spin" color="#c084fc" />
              <span style={{ fontSize: 12, color: '#c084fc' }}>Generating…</span>
            </div>
          )}

          {reports.map(r => (
            <button key={r.id} className={`flow-report-card ${activeReport?.id === r.id ? 'active' : ''}`}
              onClick={() => setActiveReport(r)}
              style={{ background: '#f8fafc', border: '1px solid #f1f5f9', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: REPORT_TYPES.find(t => t.value === r.report_type)?.color || '#6b7280', flexShrink: 0 }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: REPORT_TYPES.find(t => t.value === r.report_type)?.color || '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {REPORT_TYPES.find(t => t.value === r.report_type)?.label || r.report_type}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#d1d5db', marginBottom: 4, lineHeight: 1.3 }}>{r.title || 'Untitled Report'}</div>
              <div style={{ fontSize: 11, color: '#374151' }}>{ago(r.created_at)}</div>
            </button>
          ))}
        </div>

        {/* Document area */}
        <div className="flow-document">
          {!activeReport && !generating ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, textAlign: 'center', color: '#374151' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(168,85,247,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={24} color="#c084fc" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>No report selected</div>
                <div style={{ fontSize: 13 }}>Generate a report or select one from the sidebar.</div>
              </div>
              <button onClick={() => setShowNew(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 100, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Sparkles size={14} /> Generate first report
              </button>
            </motion.div>
          ) : activeReport && content ? (
            <motion.div key={activeReport.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {/* HTML report card */}
              {content.html ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 60, textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 20, background: `${typeColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={28} color={typeColor} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f0f8', marginBottom: 6 }}>{activeReport.title || 'Report'}</div>
                    <div style={{ fontSize: 13, color: '#4b5563' }}>12-page HTML report — ready to view or print as PDF</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => {
                      setGenerating(true);
                      fetch(`${API_BASE}/api/flow/html`, { method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                        body: JSON.stringify({ project_id: projectId, report_type: activeReport.report_type, audience: activeReport.audience }) })
                        .then(r => r.json()).then(d => { if (d.html) setHtmlViewer({ html: d.html, title: d.title }); }).catch(() => {}).finally(() => setGenerating(false));
                    }}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, background: typeColor, color: '#fff', border: 'none', borderRadius: 100, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <ExternalLink size={14} /> View Full Report
                    </button>
                  </div>
                </div>
              ) : (
                /* JSON report view */
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: `${typeColor}14`, color: typeColor, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          {REPORT_TYPES.find(t => t.value === activeReport.report_type)?.label}
                        </span>
                        <span style={{ fontSize: 11, color: '#64748b', padding: '3px 8px', background: '#f1f5f9', borderRadius: 100 }}>
                          {AUDIENCES.find(a => a.value === activeReport.audience)?.label}
                        </span>
                      </div>
                      <h1 className="flow-doc-title">{content.title || 'Report'}</h1>
                      <div className="flow-doc-meta"><span>Prepared by Terra AI</span></div>
                    </div>
                  </div>

                  {content.executive_summary && (
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: '18px 20px', marginBottom: 24, borderLeft: `4px solid ${typeColor}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: typeColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Executive Summary</div>
                      <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>{content.executive_summary}</p>
                    </div>
                  )}

                  {content.sections?.map((s, i) => (
                    <div key={i} style={{ marginBottom: 20 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{s.title}</h3>
                      <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{s.content}</p>
                    </div>
                  ))}

                  {content.appendix?.disclaimer && (
                    <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #f1f5f9', fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
                      {content.appendix.disclaimer}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ) : null}
        </div>
      </div>

      {/* New report modal */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90 }}
            onClick={e => e.target === e.currentTarget && setShowNew(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: '#fff', borderRadius: 24, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 40px 80px rgba(0,0,0,0.2)', fontFamily: "'Gabarito','Inter',system-ui" }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>New Report</h2>
                <button onClick={() => setShowNew(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' }}><X size={15} color="#64748b" /></button>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Report type</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {REPORT_TYPES.map(rt => (
                    <button key={rt.value} onClick={() => setReportType(rt.value)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12,
                        background: reportType === rt.value ? rt.color + '0f' : '#f8fafc',
                        border: `1.5px solid ${reportType === rt.value ? rt.color + '40' : '#e2e8f0'}`,
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: rt.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {rt.label}
                          {rt.html && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 100, background: rt.color + '18', color: rt.color }}>12-page PDF</span>}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{rt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Audience</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {AUDIENCES.map(a => (
                    <button key={a.value} onClick={() => setAudience(a.value)}
                      style={{ padding: '7px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                        background: audience === a.value ? 'rgba(139,92,246,0.08)' : '#f8fafc',
                        border: `1.5px solid ${audience === a.value ? 'rgba(139,92,246,0.3)' : '#e2e8f0'}`,
                        color: audience === a.value ? '#8b5cf6' : '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && <div style={{ fontSize: 13, color: '#ef4444', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>{error}</div>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowNew(false)}
                  style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: 100, padding: '11px', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={generate} disabled={generating}
                  style={{ flex: 2, background: generating ? '#e2e8f0' : selectedMeta.color, border: 'none', borderRadius: 100, padding: '11px', color: generating ? '#94a3b8' : '#fff', fontSize: 13, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  {generating ? <><Loader2 size={14} className="spin" /> Generating…</> : <><Sparkles size={14} /> Generate {selectedMeta.label}</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
