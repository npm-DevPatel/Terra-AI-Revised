import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  ScanSearch, LayoutDashboard, FileText, MessagesSquare,
  Sparkles, ChevronLeft, Settings, Kanban,
} from 'lucide-react';
import useTerraStore from '../../store/useTerraStore';
import { supabase } from '../../lib/supabaseClient';
import TerraCopilot from './TerraCopilot';

const PRODUCTS = [
  { id: 'lens',    label: 'Terra Lens',      Icon: ScanSearch,      color: '#10b981', bg: '#f0fdf4', path: 'lens' },
  { id: 'planner', label: 'Terra Planner',   Icon: Kanban,          color: '#60a5fa', bg: '#eff6ff', path: 'planner' },
  { id: 'sim',     label: 'Terra Sim',       Icon: LayoutDashboard, color: '#3b82f6', bg: '#eff6ff', path: 'sim' },
  { id: 'flow',    label: 'Terra Report',    Icon: FileText,        color: '#8b5cf6', bg: '#f5f3ff', path: 'flow' },
  { id: 'team',    label: 'Terra Workspace', Icon: MessagesSquare,  color: '#f59e0b', bg: '#fffbeb', path: 'team' },
];

/* ─── WorkspaceLayout ──────────────────────────────────────── */
export default function WorkspaceLayout() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { workspace, setActiveProject, toggleCopilot } = useTerraStore();

  const [project, setProject] = useState(null);
  const [workspaceSidebarOpen, setWorkspaceSidebarOpen] = useState(true);

  const activeProduct = PRODUCTS.find(p => location.pathname.includes(`/${p.path}`));

  useEffect(() => {
    if (!projectId) return;
    loadProject();
  }, [projectId]);

  async function loadProject() {
    try {
      const { data } = await supabase.from('projects').select('id, name, description, product').eq('id', projectId).single();
      if (data) { setProject(data); setActiveProject(data.id, data.name); }
    } catch {}
  }

  const navigateTo = (path) => navigate(`/workspace/${projectId}/${path}`);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: "'Gabarito', 'Inter', system-ui", overflow: 'hidden' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
      `}</style>

      {/* ── Sidebar ── */}
      {!workspaceSidebarOpen && (
        <button
          onClick={() => setWorkspaceSidebarOpen(true)}
          title="Show workspace sidebar"
          style={{ position: 'fixed', left: 12, top: 92, zIndex: 80, width: 34, height: 34, borderRadius: 12, border: '1px solid #dbeafe', background: '#fff', color: '#60a5fa', boxShadow: '0 14px 34px rgba(15,23,42,0.14)', cursor: 'pointer', fontWeight: 900 }}
        >
          +
        </button>
      )}
      <aside style={{ width: workspaceSidebarOpen ? 240 : 0, background: '#fff', borderRight: workspaceSidebarOpen ? '1px solid #f1f5f9' : 'none', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto', overflowX: 'hidden', transition: 'width 0.24s ease' }}>
        {/* Back + project name */}
        <div style={{ padding: '16px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
            <button onClick={() => navigate('/workspace')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 12, padding: 0, fontFamily: 'inherit' }}>
              <ChevronLeft size={13} /> All Projects
            </button>
            <button onClick={() => setWorkspaceSidebarOpen(false)} title="Hide workspace sidebar" style={{ width: 24, height: 20, borderRadius: 8, border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', fontWeight: 900, lineHeight: 1 }}>
              -
            </button>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 2, lineHeight: 1.3 }}>{project?.name || '…'}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Project workspace</div>
        </div>

        <div style={{ height: 1, background: '#f1f5f9', margin: '0 16px' }} />

        {/* Products */}
        <div style={{ padding: '14px 16px 6px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Products</div>
          {PRODUCTS.map(({ id, label, Icon, color, bg, path }) => {
            const isActive = activeProduct?.id === id;
            return (
              <button
                key={id}
                onClick={() => navigateTo(path)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10, border: 'none', background: isActive ? bg : 'transparent', color: isActive ? color : '#475569', fontSize: 13, fontWeight: isActive ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s', marginBottom: 2 }}
              >
                <Icon size={14} color={isActive ? color : '#94a3b8'} />{label}
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        <div style={{ height: 1, background: '#f1f5f9', margin: '0 16px' }} />

        {/* Copilot + Settings */}
        <div style={{ padding: '8px 16px' }}>
          <button
            onClick={toggleCopilot}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10, border: 'none', background: workspace.copilotOpen ? '#f0fdf4' : 'transparent', color: workspace.copilotOpen ? '#10b981' : '#475569', fontSize: 13, fontWeight: workspace.copilotOpen ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 2 }}
          >
            <Sparkles size={14} color={workspace.copilotOpen ? '#10b981' : '#94a3b8'} />Terra Copilot
          </button>
          <button onClick={() => navigate('/workspace')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10, border: 'none', background: 'transparent', color: '#475569', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Settings size={14} color="#94a3b8" />Settings
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{ height: 56, background: '#fff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activeProduct && (
              <>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: activeProduct.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <activeProduct.Icon size={14} color={activeProduct.color} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{activeProduct.label}</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>/</span>
                <span style={{ fontSize: 13, color: '#64748b' }}>{project?.name}</span>
              </>
            )}
            {!activeProduct && <span style={{ fontSize: 14, color: '#94a3b8' }}>Select a product</span>}
          </div>
          <button
            onClick={toggleCopilot}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: workspace.copilotOpen ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${workspace.copilotOpen ? '#bbf7d0' : '#e2e8f0'}`, color: workspace.copilotOpen ? '#10b981' : '#64748b', padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
          >
            <Sparkles size={13} />Copilot
          </button>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </div>
      </div>

      {/* ── Copilot panel ── */}
      <TerraCopilot projectId={projectId} projectName={project?.name} />
    </div>
  );
}
