import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, CheckCircle2, CircleDollarSign, Clock3,
  FileText, MessageSquare, Phone, PlayCircle, Sparkles, Users, Video,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { plannerDemo } from '../../../presentation_mode/demoContent';
import overviewIcon from '../../assets/planner/overview.png';
import siteIcon from '../../assets/planner/site.png';
import projectIcon from '../../assets/planner/project.png';
import buildIcon from '../../assets/planner/build.png';
import resourcesIcon from '../../assets/planner/resources.png';
import collaborateIcon from '../../assets/planner/collaborate.png';
import reportIcon from '../../assets/planner/report.png';
import '../../styles/workspace.css';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: overviewIcon },
  { id: 'site', label: 'Site', icon: siteIcon },
  { id: 'plan', label: 'Plan', icon: projectIcon },
  { id: 'build', label: 'Build', icon: buildIcon },
  { id: 'resources', label: 'Resources', icon: resourcesIcon },
  { id: 'budget', label: 'Budget', Icon: CircleDollarSign },
  { id: 'workspace', label: 'Workspace', icon: collaborateIcon },
  { id: 'reports', label: 'Reports', icon: reportIcon },
];

const STATUS_COLORS = {
  good: '#16a34a',
  warn: '#eab308',
  risk: '#dc2626',
};

function PlannerIcon({ item, active }) {
  if (item.icon) {
    return <img src={item.icon} alt="" className="planner-nav-icon" />;
  }
  const Icon = item.Icon;
  return <Icon size={20} color={active ? '#0f766e' : '#64748b'} />;
}

function SectionHeader({ eyebrow, title, copy }) {
  return (
    <div className="planner-section-header">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      {copy && <p>{copy}</p>}
    </div>
  );
}

function MiniCard({ label, value, status }) {
  const color = STATUS_COLORS[status] || '#64748b';
  return (
    <div className="planner-mini-card">
      <div className="planner-status-dot" style={{ background: color }} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ListPanel({ title, items, icon }) {
  return (
    <div className="planner-panel">
      <div className="planner-panel-title">{icon}{title}</div>
      <div className="planner-list">
        {items.map((item) => (
          <div key={item} className="planner-list-item">
            <CheckCircle2 size={15} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Overview() {
  const { overview, project } = plannerDemo;
  return (
    <div className="planner-content-grid">
      <div className="planner-hero-panel">
        <div className="planner-ai-label"><Sparkles size={14} /> AI Project Summary</div>
        <p>{project.summary}</p>
      </div>
      <div className="planner-health-grid">
        {overview.health.map((item) => <MiniCard key={item.label} {...item} />)}
      </div>
      <ListPanel title="Today's Decisions" items={overview.decisions} icon={<PlayCircle size={16} />} />
      <ListPanel title="Recent Activity" items={overview.activity} icon={<Clock3 size={16} />} />
    </div>
  );
}

function Site() {
  const { site } = plannerDemo;
  return (
    <div className="planner-content-grid">
      <div className="planner-hero-panel">
        <div className="planner-ai-label"><Sparkles size={14} /> AI Recommendations</div>
        <p>{site.recommendation}</p>
      </div>
      <div className="planner-health-grid">
        {site.metrics.map((item) => <MiniCard key={item.label} label={item.label} value={item.value} status="good" />)}
      </div>
      <ListPanel title="Site Intelligence" items={site.sections} icon={<AlertTriangle size={16} />} />
    </div>
  );
}

function Plan() {
  const { plan } = plannerDemo;
  return (
    <div className="planner-two-col">
      <ListPanel title="Pre-Construction Modules" items={plan.modules} icon={<CheckCircle2 size={16} />} />
      <ListPanel title="AI Copilot Questions" items={plan.questions} icon={<MessageSquare size={16} />} />
    </div>
  );
}

function Build() {
  const { build } = plannerDemo;
  return (
    <div className="planner-content-grid">
      <div className="planner-hero-panel">
        <div className="planner-ai-label"><Sparkles size={14} /> Execution Intelligence</div>
        <p>{build.insight}</p>
      </div>
      <div className="planner-panel">
        <div className="planner-panel-title"><CheckCircle2 size={16} /> Construction Checklist</div>
        <div className="planner-progress-list">
          {build.checklist.map((item) => (
            <div key={item.label} className="planner-progress-row">
              <div>
                <span>{item.label}</span>
                <strong>{item.complete}%</strong>
              </div>
              <div className="planner-progress-track">
                <div style={{ width: `${item.complete}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Resources() {
  const { resources } = plannerDemo;
  return (
    <div className="planner-content-grid">
      <div className="planner-two-col">
        <ListPanel title="Materials Nearby" items={resources.materials} icon={<ArrowRight size={16} />} />
        <ListPanel title="Services Nearby" items={resources.services} icon={<Users size={16} />} />
      </div>
      <div className="planner-hero-panel compact"><p>{resources.future}</p></div>
    </div>
  );
}

function Budget() {
  const { budget } = plannerDemo;
  return (
    <div className="planner-two-col">
      <ListPanel title="Financial Intelligence" items={budget.sections} icon={<CircleDollarSign size={16} />} />
      <ListPanel title="AI Insights" items={budget.insights} icon={<Sparkles size={16} />} />
    </div>
  );
}

function Workspace() {
  const { workspace } = plannerDemo;
  return (
    <div className="planner-content-grid">
      <div className="planner-collab-strip">
        <span><Phone size={15} /> Audio Calls</span>
        <span><Video size={15} /> Video Meetings</span>
        <span><MessageSquare size={15} /> Messages</span>
      </div>
      <div className="planner-two-col">
        <ListPanel title="Collaboration Features" items={workspace.features} icon={<Users size={16} />} />
        <ListPanel title="Revision C Demo" items={workspace.demo} icon={<Sparkles size={16} />} />
      </div>
    </div>
  );
}

function Reports() {
  const { reports } = plannerDemo;
  return (
    <div className="planner-two-col">
      <ListPanel title="Available Reports" items={reports.available} icon={<FileText size={16} />} />
      <ListPanel title="Every Report Includes" items={reports.includes} icon={<CheckCircle2 size={16} />} />
    </div>
  );
}

const VIEWS = {
  overview: Overview,
  site: Site,
  plan: Plan,
  build: Build,
  resources: Resources,
  budget: Budget,
  workspace: Workspace,
  reports: Reports,
};

export default function PlannerWorkspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');
  const ActiveView = VIEWS[active];
  const activeItem = NAV_ITEMS.find((item) => item.id === active);

  return (
    <div className="planner-screen">
      <aside className="planner-vertical-menu">
        <div className="planner-brand">
          <div className="planner-brand-mark">T</div>
          <div>
            <span>Terra Planner</span>
            <strong>{plannerDemo.project.name}</strong>
          </div>
        </div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`planner-nav-button ${active === item.id ? 'active' : ''}`}
              title={item.label}
            >
              <PlannerIcon item={item} active={active === item.id} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="planner-main">
        <header className="planner-top">
          <SectionHeader
            eyebrow={plannerDemo.project.type}
            title={activeItem?.label || 'Overview'}
            copy="AI-native construction operating system for planning, execution, collaboration, and reporting."
          />
          <div className="planner-top-actions">
            <button onClick={() => navigate(`/workspace/${projectId}/lens`)}>Lens</button>
            <button onClick={() => navigate(`/workspace/${projectId}/flow`)}>Reports</button>
          </div>
        </header>

        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="planner-view"
        >
          <ActiveView />
        </motion.div>
      </main>
    </div>
  );
}
