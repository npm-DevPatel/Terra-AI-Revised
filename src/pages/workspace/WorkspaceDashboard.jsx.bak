import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ScanSearch, LayoutDashboard, FileText, Layers, ArrowRight, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import useTerraStore from '../../store/useTerraStore';

const PRODUCT_META = {
  lens:  { label: 'Terra Lens',  color: '#34d399', Icon: ScanSearch },
  sim:   { label: 'Terra Sim',   color: '#60a5fa', Icon: LayoutDashboard },
  flow:  { label: 'Terra Flow',  color: '#c084fc', Icon: FileText },
  full:  { label: 'Full Suite',  color: '#f59e0b', Icon: Layers },
};

function ProjectCard({ project, onClick }) {
  const meta = PRODUCT_META[project.product] || PRODUCT_META.full;
  const { Icon, color, label } = meta;

  const ago = (d) => {
    const diff = Date.now() - new Date(d).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: '20px 22px',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 9px',
          borderRadius: 100,
          background: `${color}14`, color,
          letterSpacing: '0.04em',
        }}>
          {label}
        </span>
      </div>

      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f8', marginBottom: 4 }}>
          {project.name}
        </div>
        {project.description && (
          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
            {project.description}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 11, color: '#374151' }}>{ago(project.created_at)}</span>
        <ArrowRight size={14} color="#374151" />
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
        background: 'rgba(0,0,0,0.7)',
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
          background: '#111118',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: 32,
          width: '100%',
          maxWidth: 460,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f0f0f8', margin: 0 }}>New Project</h2>
          <p style={{ fontSize: 13, color: '#4b5563', margin: '6px 0 0' }}>
            Every project is a workspace. All products share it.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            placeholder="Project name — e.g. Patel's Apartment Project"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '11px 14px', color: '#e8e8f0',
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
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '11px 14px', color: '#9ca3af',
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
                    background: product === key ? `${color}14` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${product === key ? `${color}40` : 'rgba(255,255,255,0.08)'}`,
                    color: product === key ? color : '#6b7280',
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
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 100, padding: '9px 18px', color: '#6b7280',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Cancel
          </button>
          <button
            onClick={create}
            disabled={!name.trim() || loading}
            style={{
              background: loading || !name.trim() ? '#1f2937' : '#34d399',
              color: loading || !name.trim() ? '#4b5563' : '#0a0a0f',
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
    const { data } = await supabase
      .from('projects')
      .select('id, name, description, product, created_at')
      .in('id',
        (await supabase.from('project_members').select('project_id').eq('user_id', user?.id)).data?.map(r => r.project_id) || []
      )
      .eq('archived', false)
      .order('created_at', { ascending: false });
    setProjects(data || []);
    setLoading(false);
  }

  async function loadProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
    setProfile(data);
  }

  const needsProfileSetup = profile && !profile.display_name;

  const initials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e8e8f0', fontFamily: "'Gabarito', 'Inter', system-ui" }}>
      {/* Topbar */}
      <div style={{
        height: 60, borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', background: '#0e0e14',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#34d399' }}>Terra AI</div>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ fontSize: 13, color: '#6b7280' }}>Workspace</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #34d399, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff',
          }}>
            {initials(profile?.display_name || user?.email)}
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); logout(); navigate('/'); }}
            style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', display: 'flex' }}
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
              background: 'rgba(245,158,11,0.08)',
              borderBottom: '1px solid rgba(245,158,11,0.2)',
              padding: '12px 32px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 13, color: '#f59e0b' }}>
              Complete your profile so teammates can find and mention you.
            </span>
            <button
              onClick={() => navigate('/profile/setup')}
              style={{
                background: '#f59e0b', color: '#0a0a0f', border: 'none',
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
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f0f0f8', margin: 0 }}>
              Your Projects
            </h1>
            <p style={{ fontSize: 14, color: '#4b5563', margin: '6px 0 0' }}>
              Each project is a shared workspace for your entire team.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#34d399', color: '#0a0a0f',
              border: 'none', borderRadius: 100, padding: '11px 22px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'background 0.15s',
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
              background: 'rgba(52,211,153,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Layers size={28} color="#34d399" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f0f0f8', margin: 0 }}>
              No projects yet
            </h3>
            <p style={{ fontSize: 13, color: '#4b5563', maxWidth: 340 }}>
              Create your first project to start analysing land, planning layouts, and generating reports — all in one workspace.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#34d399', color: '#0a0a0f',
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
        .terra-spinner { width: 36px; height: 36px; border-radius: 50%; border: 3px solid rgba(52,211,153,0.15); border-top-color: #34d399; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
