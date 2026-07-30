import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, ScanSearch, LayoutDashboard, FileText, Layers, ArrowRight, LogOut, Calendar, User, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import useTerraStore from '../../store/useTerraStore';
import libraryProject from '../../assets/made_projects/library_project.jpeg';
import momsHome from '../../assets/made_projects/moms_home.jpeg';
import urbanPark from '../../assets/made_projects/urban_park.jpeg';

const PRODUCT_META = {
  lens:  { label: 'Terra Lens',  color: '#10b981', bg: '#f0fdf4', Icon: ScanSearch },
  sim:   { label: 'Terra Sim',   color: '#3b82f6', bg: '#eff6ff', Icon: LayoutDashboard },
  flow:  { label: 'Terra Flow',  color: '#8b5cf6', bg: '#f5f3ff', Icon: FileText },
  full:  { label: 'Full Suite',  color: '#f59e0b', bg: '#fffbeb', Icon: Layers },
};

const COVER_GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#0ba360,#3cba92)',
  'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
];
function coverGradient(str) {
  let h = 0;
  for (let i = 0; i < (str?.length || 0); i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return COVER_GRADIENTS[Math.abs(h) % COVER_GRADIENTS.length];
}

const SHOWCASE_PROJECTS = [
  {
    id: 'showcase-urban-park',
    name: 'The Urban Park - Westlands',
    description: 'A climate-conscious public realm concept with shaded promenades, water-sensitive planting, and flexible gathering lawns for a growing urban district.',
    product: 'full',
    coverImage: urbanPark,
    created_at: '2026-07-18T09:00:00.000Z',
    owner_name: 'Terra Studio',
    isShowcase: true,
  },
  {
    id: 'showcase-library',
    name: 'The Observatory Library - Nairobi',
    description: 'A refined cultural anchor blending quiet study terraces, luminous reading halls, and civic-grade circulation planning for daily community use.',
    product: 'full',
    coverImage: libraryProject,
    created_at: '2026-07-16T09:00:00.000Z',
    owner_name: 'Terra Studio',
    isShowcase: true,
  },
  {
    id: 'showcase-moms-home',
    name: "Mom's Courtyard Home - Timau",
    description: 'A warm residential retreat shaped around garden views, soft daylight, and practical family living with a premium site-to-home design narrative.',
    product: 'full',
    coverImage: momsHome,
    created_at: '2026-07-14T09:00:00.000Z',
    owner_name: 'Terra Studio',
    isShowcase: true,
  },
];

function ProjectCard({ project, onClick, onDelete, deleting }) {
  const meta = PRODUCT_META[project.product] || PRODUCT_META.full;
  const { Icon, color, bg, label } = meta;
  const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const coverImage = project.coverImage || null;
  const interactive = typeof onClick === 'function';

  return (
    <motion.div
      whileHover={interactive ? { y: -4, boxShadow: '0 24px 48px rgba(0,0,0,0.12)' } : {}}
      onClick={onClick}
      style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 22, overflow: 'hidden', cursor: interactive ? 'pointer' : 'default', boxShadow: '0 10px 30px rgba(15,23,42,0.08)', transition: 'box-shadow 0.2s' }}
      whileTap={interactive ? { scale: 0.98 } : {}}
    >
      {/* Cover */}
      <div style={{
        position: 'relative',
        height: 185,
        background: coverImage ? `linear-gradient(180deg, rgba(15,23,42,0.05), rgba(15,23,42,0.42)), url(${coverImage}) center/cover` : coverGradient(project.name),
        display: 'flex',
        alignItems: 'flex-end',
        padding: '18px 20px',
      }}>
        {onDelete && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(project);
            }}
            disabled={deleting}
            aria-label={`Delete ${project.name}`}
            title="Delete project"
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 34,
              height: 34,
              borderRadius: 100,
              border: '1px solid rgba(255,255,255,0.5)',
              background: deleting ? 'rgba(255,255,255,0.82)' : 'rgba(15,23,42,0.42)',
              color: deleting ? '#64748b' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: deleting ? 'wait' : 'pointer',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 10px 24px rgba(15,23,42,0.18)',
            }}
          >
            {deleting ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
          </button>
        )}
        <span style={{ fontSize: 12, fontWeight: 800, padding: '6px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.94)', color, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon size={11} />{label}
        </span>
      </div>
      {/* Content */}
      <div style={{ padding: '20px 22px 22px' }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 7, lineHeight: 1.25 }}>{project.name}</div>
        {project.description && (
          <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.55, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {project.description}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}><Calendar size={12} />{fmt(project.created_at)}</div>
            {project.owner_name && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}><User size={12} />{project.owner_name}</div>}
          </div>
          {interactive && (
            <div style={{ width: 34, height: 34, borderRadius: 100, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowRight size={15} color={color} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CreateProjectModal({ onClose, onCreated }) {
  const [name, setName] = useState('The Grove at the Highlands of Limuru');
  const [description, setDescription] = useState('Write the description');
  const [product, setProduct] = useState('full');
  const [loading, setLoading] = useState(false);
  const { user } = useTerraStore();

  const create = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const { data: proj, error } = await supabase
      .from('projects')
      .insert({ name: name.trim(), description, product, owner_id: user?.id })
      .select()
      .single();

    if (error || !proj) { setLoading(false); return; }

    // Add creator as owner member
    await supabase.from('project_members').insert({ project_id: proj.id, user_id: user?.id, role: 'owner' });

    // Create default channels
    await supabase.from('channels').insert([
      { project_id: proj.id, name: 'general',      created_by: user?.id },
      { project_id: proj.id, name: 'site-updates', created_by: user?.id },
      { project_id: proj.id, name: 'reports',      created_by: user?.id },
    ]);

    setLoading(false);
    onCreated(proj);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.5)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        style={{
          background: '#fff',
          borderRadius: 24,
          padding: 32,
          width: '100%',
          maxWidth: 460,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          boxShadow: '0 40px 80px rgba(0,0,0,0.15)',
        }}
      >
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>New Project</h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 0' }}>
            Every project is a workspace. All products share it.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              background: '#f8fafc', border: '1.5px solid #e2e8f0',
              borderRadius: 10, padding: '11px 14px', color: '#0f172a',
              fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%',
            }}
            autoFocus
          />
          <textarea
            placeholder="Project Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            style={{
              background: '#f8fafc', border: '1.5px solid #e2e8f0',
              borderRadius: 10, padding: '11px 14px', color: '#64748b',
              fontSize: 13, fontFamily: 'inherit', outline: 'none',
              resize: 'none', width: '100%',
            }}
          />

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              Starting with
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.entries(PRODUCT_META).map(([key, { label, color, Icon }]) => (
                <button
                  key={key}
                  onClick={() => setProduct(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', borderRadius: 10,
          background: product === key ? `${color}14` : '#f8fafc',
                    border: `1.5px solid ${product === key ? `${color}40` : '#e2e8f0'}`,
                    color: product === key ? color : '#64748b',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            background: '#f1f5f9', border: 'none',
            borderRadius: 100, padding: '9px 18px', color: '#64748b',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Cancel
          </button>
          <button
            onClick={create}
            disabled={!name.trim() || loading}
            style={{
              background: !name.trim() ? '#e2e8f0' : '#10b981',
              color: !name.trim() ? '#94a3b8' : '#fff',
              border: 'none', borderRadius: 100, padding: '9px 22px',
              fontSize: 13, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', transition: 'background 0.15s',
            }}
          >
            {loading ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function WorkspaceDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useTerraStore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [profile, setProfile] = useState(null);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    if (!user) { setProjects([]); setLoading(false); return; }
    try {
      const membersRes = await supabase.from('project_members').select('project_id').eq('user_id', user?.id);
      const ids = membersRes.data?.map(r => r.project_id) || [];
      if (!ids.length) { setProjects([]); setLoading(false); return; }
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, product, created_at, owner_id')
        .in('id', ids)
        .eq('archived', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const enriched = await Promise.all((data || []).map(async p => {
        const { data: op } = await supabase.from('profiles').select('display_name, username').eq('id', p.owner_id).single();
        return { ...p, owner_name: op?.display_name || op?.username || 'Team Lead' };
      }));
      setProjects(enriched);
    } catch { setProjects([]); }
    setLoading(false);
  }, [user]);

  const loadProfile = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
    setProfile(data);
  }, [user?.id]);

  useEffect(() => {
    if (!user) return undefined;
    const timer = window.setTimeout(() => {
      loadProjects();
      loadProfile();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user, loadProjects, loadProfile]);

  // Auto-open create modal when arriving via ?create=true (e.g. from Navbar CTA)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      setShowCreate(true);
      // Clean up the query param without triggering a re-render loop
      navigate('/workspace', { replace: true });
    }
  }, [location.search, navigate]);

  const needsProfileSetup = profile && !profile.display_name;

  const initials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const displayProjects = [...SHOWCASE_PROJECTS, ...projects];

  const deleteProjectData = async (project) => {
    if (!project?.id || project.isShowcase || deletingProjectId) return;
    const confirmed = window.confirm(`Delete "${project.name}" and all its Terra data from Supabase? This cannot be undone.`);
    if (!confirmed) return;

    setDeleteError('');
    setDeletingProjectId(project.id);

    try {
      const { error: archiveError } = await supabase
        .from('projects')
        .update({ archived: true })
        .eq('id', project.id);
      if (archiveError) throw archiveError;

      setProjects((current) => current.filter((item) => item.id !== project.id));

      const { data: channelsData, error: channelsFetchError } = await supabase
        .from('channels')
        .select('id')
        .eq('project_id', project.id);
      if (channelsFetchError) throw channelsFetchError;

      const channelIds = channelsData?.map((channel) => channel.id).filter(Boolean) || [];
      if (channelIds.length > 0) {
        const { error: messagesError } = await supabase
          .from('workspace_messages')
          .delete()
          .in('channel_id', channelIds);
        if (messagesError) throw messagesError;
      }

      const projectTables = [
        'flow_reports',
        'sim_plans',
        'analyses',
        'project_invites',
        'channels',
      ];

      for (const table of projectTables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('project_id', project.id);
        if (error) throw error;
      }

      const { error: projectDeleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);
      if (!projectDeleteError) {
        await supabase
          .from('project_members')
          .delete()
          .eq('project_id', project.id);
      }

      setProjects((current) => current.filter((item) => item.id !== project.id));
    } catch (err) {
      setDeleteError(err?.message || 'Could not delete this project.');
    } finally {
      setDeletingProjectId(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Gabarito', 'Inter', system-ui" }}>
      {/* Topbar */}
      <div style={{
        height: 60, borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>Terra AI</div>
          <div style={{ width: 1, height: 16, background: '#e2e8f0' }} />
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Workspace</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #10b981, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff',
          }}>
            {initials(profile?.display_name || user?.email)}
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); logout(); navigate('/'); }}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 8px', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Profile setup nudge */}
      <AnimatePresence>
        {needsProfileSetup && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              background: 'rgba(245,158,11,0.06)',
              borderBottom: '1px solid #fde68a',
              padding: '12px 32px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 13, color: '#92400e' }}>
              Complete your profile so teammates can find and mention you.
            </span>
            <button
              onClick={() => navigate('/profile/setup')}
              style={{
                background: '#f59e0b', color: '#fff', border: 'none',
                borderRadius: 100, padding: '6px 16px', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Set up profile
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div style={{ maxWidth: 1420, margin: '0 auto', padding: '48px 32px 72px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Your Projects
            </h1>
            <p style={{ fontSize: 14, color: '#94a3b8', margin: '6px 0 0' }}>
              Each project is a shared workspace for your entire team.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#10b981', color: '#fff',
              border: 'none', borderRadius: 100, padding: '11px 22px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'background 0.15s',
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
            }}
          >
            <Plus size={15} />
            New Project
          </button>
        </div>

        {/* Grid */}
        {deleteError && (
          <div style={{ marginBottom: 16, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 700 }}>
            {deleteError}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 22 }}>
          {displayProjects.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <ProjectCard
                project={p}
                onClick={p.isShowcase ? undefined : () => navigate(`/workspace/${p.id}/lens`)}
                onDelete={p.isShowcase ? undefined : deleteProjectData}
                deleting={deletingProjectId === p.id}
              />
            </motion.div>
          ))}
          {loading && (
            <div style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="terra-spinner" />
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateProjectModal
            onClose={() => setShowCreate(false)}
            onCreated={(proj) => {
              setShowCreate(false);
              setProjects(prev => [proj, ...prev]);
              navigate(`/workspace/${proj.id}/lens`);
            }}
          />
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Gabarito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .terra-spinner { width: 36px; height: 36px; border-radius: 50%; border: 3px solid #e2e8f0; border-top-color: #10b981; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
