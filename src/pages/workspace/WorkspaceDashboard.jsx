import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ScanSearch, LayoutDashboard, FileText, Layers, ArrowRight, LogOut, Calendar, User } from 'lucide-react';
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

function projectCoverImage(project) {
  const text = `${project.name || ''} ${project.description || ''}`.toLowerCase();
  if (text.includes('kilimani') || text.includes('residence') || text.includes('home')) return momsHome;
  if (text.includes('patel') || text.includes('apartment') || text.includes('library')) return libraryProject;
  if (text.includes('park') || text.includes('urban')) return urbanPark;
  return null;
}

function ProjectCard({ project, onClick }) {
  const meta = PRODUCT_META[project.product] || PRODUCT_META.full;
  const { Icon, color, bg, label } = meta;
  const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const coverImage = projectCoverImage(project);

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.10)' }}
      onClick={onClick}
      style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 20, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s' }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Cover */}
      <div style={{
        height: 130,
        background: coverImage ? `linear-gradient(180deg, rgba(15,23,42,0.05), rgba(15,23,42,0.42)), url(${coverImage}) center/cover` : coverGradient(project.name),
        display: 'flex',
        alignItems: 'flex-end',
        padding: '14px 16px',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.92)', color, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon size={11} />{label}
        </span>
      </div>
      {/* Content */}
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4, lineHeight: 1.3 }}>{project.name}</div>
        {project.description && (
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {project.description}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94a3b8' }}><Calendar size={11} />{fmt(project.created_at)}</div>
            {project.owner_name && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94a3b8' }}><User size={11} />{project.owner_name}</div>}
          </div>
          <div style={{ width: 28, height: 28, borderRadius: 100, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight size={13} color={color} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CreateProjectModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
            placeholder="Project name — e.g. Patel's Apartment Project"
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
            placeholder="Short description (optional)"
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
  const { user, logout } = useTerraStore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) { loadProjects(); loadProfile(); }
  }, [user]);

  async function loadProjects() {
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
  }

  async function loadProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
    setProfile(data);
  }

  const needsProfileSetup = profile && !profile.display_name;

  const initials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

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
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px' }}>
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
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div className="terra-spinner" />
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 16, padding: '100px 0', textAlign: 'center',
            }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: '#f0fdf4',
              border: '2px dashed #bbf7d0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Layers size={28} color="#10b981" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              No projects yet
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', maxWidth: 340 }}>
              Create your first project to start analysing land, planning layouts, and generating reports — all in one workspace.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#10b981', color: '#fff',
                border: 'none', borderRadius: 100, padding: '11px 24px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Plus size={15} /> Create your first project
            </button>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {projects.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ProjectCard
                  project={p}
                  onClick={() => navigate(`/workspace/${p.id}/lens`)}
                />
              </motion.div>
            ))}
          </div>
        )}
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
