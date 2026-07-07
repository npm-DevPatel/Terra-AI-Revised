import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Plus, Download, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useTerraStore from '../../store/useTerraStore';
import { supabase } from '../../lib/supabaseClient';
import '../../styles/workspace.css';

const REPORT_TYPES = [
  { value: 'due_diligence', label: 'Due Diligence',    desc: 'Full pre-purchase risk assessment' },
  { value: 'lender',        label: 'Lender Report',    desc: 'For banks and financing institutions' },
  { value: 'planning',      label: 'Planning Report',  desc: 'For county planning authorities' },
  { value: 'executive',     label: 'Executive Summary', desc: 'High-level brief for stakeholders' },
  { value: 'progress',      label: 'Progress Report',  desc: 'Construction phase update' },
];

const AUDIENCES = [
  { value: 'client',     label: 'Client' },
  { value: 'bank',       label: 'Bank' },
  { value: 'government', label: 'Government' },
  { value: 'internal',   label: 'Internal' },
];

const TYPE_COLORS = {
  due_diligence: '#c084fc',
  lender: '#60a5fa',
  planning: '#34d399',
  executive: '#f59e0b',
  progress: '#f87171',
};

export default function FlowWorkspace() {
  const { projectId } = useParams();
  const { session } = useTerraStore();

  const [reports, setReports] = useState([]);
  const [activeReport, setActiveReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [reportType, setReportType] = useState('due_diligence');
  const [audience, setAudience] = useState('client');
  const [error, setError] = useState('');

  useEffect(() => {
    loadReports();
  }, [projectId]);

  async function loadReports() {
    const { data } = await supabase
      .from('flow_reports')
      .select('id, title, report_type, audience, content, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (data?.length) {
      setReports(data);
      setActiveReport(data[0]);
    }
  }

  const generate = async () => {
    setGenerating(true);
    setError('');
    setShowNew(false);

    try {
      const res = await fetch('/api/flow/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ project_id: projectId, report_type: reportType, audience }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const newReport = {
        id: data.flow_report_id,
        title: data.title,
        report_type: reportType,
        audience,
        content: data,
        created_at: new Date().toISOString(),
      };
      setReports(prev => [newReport, ...prev]);
      setActiveReport(newReport);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const content = activeReport?.content;
  const typeColor = TYPE_COLORS[activeReport?.report_type] || '#6b7280';

  const ago = (d) => {
    const diff = Date.now() - new Date(d).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="flow-screen">
      {/* ── Reports sidebar ──────────────────────────────────────────── */}
      <div className="flow-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f8' }}>Reports</div>
          <button
            onClick={() => setShowNew(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#34d399', color: '#0a0a0f',
              border: 'none', borderRadius: 100, padding: '5px 10px',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Plus size={11} /> New
          </button>
        </div>

        {reports.length === 0 && !generating && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#374151', fontSize: 12 }}>
            No reports yet.<br />Click New to generate one.
          </div>
        )}

        {generating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 10 }}>
            <div className="terra-spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: '#c084fc', borderColor: 'rgba(168,85,247,0.15)' }} />
            <span style={{ fontSize: 12, color: '#c084fc' }}>Generating…</span>
          </div>
        )}

        {reports.map((r) => (
          <button
            key={r.id}
            className={`flow-report-card ${activeReport?.id === r.id ? 'active' : ''}`}
            onClick={() => setActiveReport(r)}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.07)', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: TYPE_COLORS[r.report_type] || '#6b7280', flexShrink: 0 }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLORS[r.report_type] || '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {REPORT_TYPES.find(t => t.value === r.report_type)?.label || r.report_type}
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#d1d5db', marginBottom: 4, lineHeight: 1.3 }}>
              {r.title || 'Untitled Report'}
            </div>
            <div style={{ fontSize: 11, color: '#374151' }}>{ago(r.created_at)}</div>
          </button>
        ))}
      </div>

      {/* ── Document view ──────────────────────────────────────────────── */}
      <div className="flow-document">
        {!activeReport && !generating ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, textAlign: 'center', color: '#374151' }}
          >
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(168,85,247,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={24} color="#c084fc" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>No report selected</div>
              <div style={{ fontSize: 13 }}>Generate a report or select one from the sidebar.</div>
            </div>
            <button
              onClick={() => setShowNew(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#c084fc', color: '#0a0a0f',
                border: 'none', borderRadius: 100, padding: '10px 20px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Sparkles size={14} /> Generate first report
            </button>
          </motion.div>
        ) : activeReport && content ? (
          <motion.div key={activeReport.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {/* Doc header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: `${typeColor}14`, color: typeColor, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {REPORT_TYPES.find(t => t.value === activeReport.report_type)?.label}
                  </span>
                  <span style={{ fontSize: 11, color: '#4b5563', padding: '3px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 100, border: '1px solid rgba(255,255,255,0.06)' }}>
                    {AUDIENCES.find(a => a.value === activeReport.audience)?.label}
                  </span>
                </div>
                <h1 className="flow-doc-title">{content.title || 'Report'}</h1>
                <div className="flow-doc-meta">
                  <span>Prepared by Terra AI</span>
                  <span>{ago(activeReport.created_at)}</span>
                </div>
              </div>
              <button
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: '7px 12px', color: '#9ca3af',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <Download size={13} /> Export PDF
              </button>
            </div>

            {/* Executive summary */}
            {content.executive_summary && (
              <div className="flow-doc-section" style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.12)', borderRadius: 12, padding: '18px 20px', marginBottom: 28 }}>
                <div className="flow-doc-section-title" style={{ borderColor: 'rgba(168,85,247,0.15)', color: '#c084fc' }}>
                  Executive Summary
                </div>
                <p className="flow-doc-body">{content.executive_summary}</p>
              </div>
            )}

            {/* Sections */}
            {(content.sections || []).map((s) => (
              <div key={s.id} className="flow-doc-section">
                <div className="flow-doc-section-title">{s.title}</div>
                <p className="flow-doc-body">{s.content}</p>
              </div>
            ))}

            {/* Appendix */}
            {content.appendix && (
              <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Disclaimer</div>
                <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{content.appendix.disclaimer}</p>
              </div>
            )}
          </motion.div>
        ) : null}
      </div>

      {/* ── New report modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
            onClick={(e) => e.target === e.currentTarget && setShowNew(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f0f0f8', margin: 0 }}>Generate Report</h2>
                <p style={{ fontSize: 13, color: '#4b5563', margin: '6px 0 0' }}>Terra AI will write it from your project data.</p>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Report Type</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {REPORT_TYPES.map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setReportType(value)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: 10,
                        background: reportType === value ? `${TYPE_COLORS[value]}10` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${reportType === value ? `${TYPE_COLORS[value]}35` : 'rgba(255,255,255,0.07)'}`,
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: reportType === value ? TYPE_COLORS[value] : '#d1d5db' }}>{label}</div>
                        <div style={{ fontSize: 11, color: '#4b5563' }}>{desc}</div>
                      </div>
                      {reportType === value && <ChevronRight size={14} color={TYPE_COLORS[value]} />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Audience</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {AUDIENCES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setAudience(value)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 8,
                        background: audience === value ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${audience === value ? 'rgba(168,85,247,0.35)' : 'rgba(255,255,255,0.07)'}`,
                        color: audience === value ? '#c084fc' : '#6b7280',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div style={{ fontSize: 12, color: '#ef4444', background: 'rgba(239,68,68,0.07)', borderRadius: 8, padding: '10px 12px' }}>{error}</div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowNew(false)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '9px 18px', color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button
                  onClick={generate}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#c084fc', color: '#0a0a0f', border: 'none', borderRadius: 100, padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <Sparkles size={13} /> Generate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
