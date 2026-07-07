import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  ScanSearch, LayoutDashboard, FileText, Hash, Plus,
  Bell, Sparkles, ChevronLeft, Settings, Users, LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useTerraStore from '../../store/useTerraStore';
import { supabase } from '../../lib/supabaseClient';
import TerraCopilot from './TerraCopilot';
import '../../styles/workspace.css';

const PRODUCTS = [
  { id: 'lens', label: 'Terra Lens', Icon: ScanSearch, color: '#34d399', path: 'lens' },
  { id: 'sim',  label: 'Terra Sim',  Icon: LayoutDashboard, color: '#60a5fa', path: 'sim' },
  { id: 'flow', label: 'Terra Flow', Icon: FileText, color: '#c084fc', path: 'flow' },
];

export default function WorkspaceLayout() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { workspace, setActiveProject, setActiveChannel, toggleCopilot, user } = useTerraStore();

  const [project, setProject] = useState(null);
  const [channels, setChannels] = useState([]);
  const [members, setMembers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const activeProduct = PRODUCTS.find(p => location.pathname.includes(`/${p.path}`));

  useEffect(() => {
    if (!projectId) return;
    loadProject();
    loadChannels();
    loadMembers();
    subscribeToNotifications();
  }, [projectId]);

  async function loadProject() {
    const { data } = await supabase
      .from('projects')
      .select('id, name, description, product')
      .eq('id', projectId)
      .single();
    if (data) {
      setProject(data);
      setActiveProject(data.id, data.name);
    }
  }

  async function loadChannels() {
    const { data } = await supabase
      .from('channels')
      .select('id, name')
      .eq('project_id', projectId)
      .order('created_at');
    if (data?.length) {
      setChannels(data);
      if (!workspace.activeChannelId) setActiveChannel(data[0].id);
    }
  }

  async function loadMembers() {
    const { data } = await supabase
      .from('project_members')
      .select('user_id, role, profiles(display_name, avatar_url, username)')
      .eq('project_id', projectId);
    if (data) setMembers(data);
  }

  function subscribeToNotifications() {
    const sub = supabase
      .channel(`notifs:${user?.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user?.id}`,
      }, () => setUnreadCount(n => n + 1))
      .subscribe();
    return () => supabase.removeChannel(sub);
  }

  const navigateTo = (path) => navigate(`/workspace/${projectId}/${path}`);

  const initials = (name) => name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const avatarColor = (str) => {
    const colors = ['#34d399','#60a5fa','#c084fc','#f59e0b','#f87171','#a78bfa'];
    let hash = 0;
    for (let i = 0; i < (str?.length || 0); i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="workspace-shell" style={{ position: 'relative' }}>
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="workspace-sidebar">
        {/* Project header */}
        <div className="sidebar-project-header">
          <button
            onClick={() => navigate('/workspace')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 12, padding: 0, marginBottom: 10 }}
          >
            <ChevronLeft size={14} /> All Projects
          </button>
          <div className="sidebar-project-name">{project?.name || '…'}</div>
          <div className="sidebar-project-badge">Project workspace</div>
        </div>

        {/* Products */}
        <div className="sidebar-section-label">Products</div>
        {PRODUCTS.map(({ id, label, Icon, color, path }) => (
          <button
            key={id}
            className={`sidebar-nav-item ${activeProduct?.id === id ? 'active' : ''}`}
            onClick={() => navigateTo(path)}
            style={activeProduct?.id === id ? { color } : {}}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}

        {/* Channels */}
        <div className="sidebar-section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 12 }}>
          Channels
          <button
            onClick={async () => {
              const name = prompt('Channel name:');
              if (!name) return;
              const { data } = await supabase.from('channels').insert({ project_id: projectId, name: name.toLowerCase().replace(/\s+/g, '-'), created_by: user?.id }).select().single();
              if (data) setChannels(c => [...c, data]);
            }}
            style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: 0 }}
          >
            <Plus size={13} />
          </button>
        </div>
        {channels.map((ch) => (
          <button
            key={ch.id}
            className={`sidebar-channel-item ${workspace.activeChannelId === ch.id ? 'active' : ''}`}
            onClick={() => setActiveChannel(ch.id)}
          >
            <Hash size={13} />
            {ch.name}
          </button>
        ))}

        {/* Bottom actions */}
        <div style={{ marginTop: 'auto' }}>
          <button
            className="sidebar-nav-item"
            onClick={() => { setUnreadCount(0); toggleCopilot(); }}
          >
            <div style={{ position: 'relative', display: 'flex' }}>
              <Sparkles size={15} />
              {unreadCount > 0 && (
                <span className="notif-badge" style={{ width: 14, height: 14, fontSize: 9 }}>{unreadCount}</span>
              )}
            </div>
            Terra Copilot
          </button>
          <button className="sidebar-nav-item" onClick={() => navigate('/workspace')}>
            <Settings size={15} />
            Settings
          </button>
        </div>

        {/* Team avatars */}
        <div className="sidebar-team-avatars">
          {members.slice(0, 5).map((m) => {
            const name = m.profiles?.display_name || m.profiles?.username || '?';
            return (
              <div
                key={m.user_id}
                className="team-avatar"
                title={name}
                style={{ background: avatarColor(name) }}
              >
                {m.profiles?.avatar_url
                  ? <img src={m.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : initials(name)
                }
              </div>
            );
          })}
          {members.length > 5 && (
            <div className="team-avatar" style={{ background: '#1f2937', color: '#6b7280', fontSize: 10 }}>
              +{members.length - 5}
            </div>
          )}
          <button
            onClick={async () => {
              const email = prompt('Invite by email or @username:');
              if (!email) return;
              await supabase.from('project_invites').insert({ project_id: projectId, invited_by: user?.id, email: email.includes('@') && !email.startsWith('@') ? email : null, username: email.startsWith('@') ? email.slice(1) : null });
              alert('Invite sent!');
            }}
            className="team-avatar"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)', color: '#6b7280', cursor: 'pointer' }}
          >
            <Plus size={12} />
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="workspace-main">
        {/* Topbar */}
        <div className="workspace-topbar">
          <div className="workspace-topbar-title">
            {activeProduct && (
              <>
                <span className={`product-pill ${activeProduct.id}`}>{activeProduct.label}</span>
                {project?.name}
              </>
            )}
            {!activeProduct && <span style={{ color: '#6b7280' }}>Select a product</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={toggleCopilot}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: workspace.copilotOpen ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)',
                border: '1px solid',
                borderColor: workspace.copilotOpen ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)',
                color: workspace.copilotOpen ? '#34d399' : '#9ca3af',
                padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
              }}
            >
              <Sparkles size={13} />
              Copilot
            </button>
          </div>
        </div>

        {/* Product content */}
        <div className="workspace-content">
          <Outlet />
        </div>
      </div>

      {/* ── Copilot panel ────────────────────────────────────────────────── */}
      <TerraCopilot projectId={projectId} projectName={project?.name} />
    </div>
  );
}
