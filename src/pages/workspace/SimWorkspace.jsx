import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Layers, Satellite, Map, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useTerraStore from '../../store/useTerraStore';
import { API_BASE_URL as API_BASE } from '../../lib/apiBase';
import '../../styles/workspace.css';

const USE_CLASSES = [
  { value: 'residential_apartment', label: 'Residential Apartments' },
  { value: 'commercial_office',     label: 'Commercial / Office' },
  { value: 'mixed_use',             label: 'Mixed Use' },
  { value: 'industrial',            label: 'Industrial / Warehouse' },
  { value: 'institutional',         label: 'Institutional / School' },
  { value: 'hospitality',           label: 'Hospitality / Hotel' },
];

const PRIORITIES_OPTIONS = [
  'Maximize FAR', 'Maximize parking', 'Maximize green space',
  'Passive cooling', 'Solar orientation', 'Rainwater harvesting', 'Minimize footprint',
];

const SCENARIO_COLORS = { A: '#34d399', B: '#60a5fa', C: '#c084fc' };

export default function SimWorkspace() {
  const { projectId } = useParams();
  const { session } = useTerraStore();

  const [mapMode, setMapMode] = useState('satellite'); // satellite | map
  const [plotArea, setPlotArea] = useState('');
  const [useClass, setUseClass] = useState('residential_apartment');
  const [floors, setFloors] = useState(4);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scenarios, setScenarios] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Load Google Maps with satellite layer
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const loadMap = () => {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: -1.2921, lng: 36.8219 },
        zoom: 17,
        mapTypeId: mapMode === 'satellite' ? 'satellite' : 'roadmap',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
        styles: mapMode === 'map' ? DARK_MAP_STYLES : [],
      });
      mapInstanceRef.current = map;
    };

    if (window.google?.maps) {
      loadMap();
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&loading=async`;
      script.async = true;
      script.onload = loadMap;
      document.head.appendChild(script);
    }
  }, []);

  // Switch map type
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setMapTypeId(mapMode === 'satellite' ? 'satellite' : 'roadmap');
  }, [mapMode]);

  const togglePriority = (p) => {
    setPriorities(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const generate = async () => {
    if (!plotArea) { setError('Enter plot area.'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/sim/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          plot_area_sqm: parseFloat(plotArea),
          use_class: useClass,
          floors: parseInt(floors),
          priorities: priorities.map(p => p.toLowerCase().replace(/\s+/g, '_')),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScenarios(data);
      setSelected('A');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedScenario = scenarios?.scenarios?.find(s => s.id === selected);

  return (
    <div className="sim-screen">
      {/* ── Map area ───────────────────────────────────────────────────── */}
      <div className="sim-map-area">
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* Map type toggle */}
        <div style={{
          position: 'absolute', top: 16, left: 16,
          display: 'flex', gap: 6, zIndex: 10,
        }}>
          {(['satellite', 'map']).map((mode) => (
            <button
              key={mode}
              onClick={() => setMapMode(mode)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: mapMode === mode ? 'rgba(59,130,246,0.2)' : 'rgba(0,0,0,0.6)',
                border: `1px solid ${mapMode === mode ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.15)'}`,
                color: mapMode === mode ? '#60a5fa' : '#9ca3af',
                padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', backdropFilter: 'blur(8px)', fontFamily: 'inherit',
              }}
            >
              {mode === 'satellite' ? <Satellite size={12} /> : <Map size={12} />}
              {mode === 'satellite' ? 'Satellite' : 'Map'}
            </button>
          ))}
        </div>

        {/* Scenario overlay on map */}
        {selectedScenario && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'absolute', bottom: 20, left: 20,
              background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14, padding: '14px 18px',
              minWidth: 220, zIndex: 10,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: SCENARIO_COLORS[selected], letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              Scenario {selected} — {selectedScenario.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
              {[
                ['Footprint', `${selectedScenario.footprint_sqm} sqm`],
                ['Floors', selectedScenario.floors],
                ['FAR', selectedScenario.far],
                ['Parking', `${selectedScenario.parking_bays} bays`],
                ['Green', `${selectedScenario.green_space_sqm} sqm`],
                ['Cost', `KES ${(selectedScenario.estimated_build_cost_kes / 1e6).toFixed(1)}M`],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', fontWeight: 700 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f8' }}>{v}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Controls panel ────────────────────────────────────────────── */}
      <div className="sim-controls">
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f0f8', marginBottom: 4 }}>Terra Sim</div>
          <div style={{ fontSize: 12, color: '#4b5563' }}>AI-powered layout planning</div>
        </div>

        <div className="sim-input-group">
          <label className="sim-label">Plot area (sqm)</label>
          <input className="sim-input" type="number" placeholder="e.g. 450" value={plotArea} onChange={(e) => setPlotArea(e.target.value)} />
        </div>

        <div className="sim-input-group">
          <label className="sim-label">Use class</label>
          <select className="sim-input" value={useClass} onChange={(e) => setUseClass(e.target.value)} style={{ appearance: 'none' }}>
            {USE_CLASSES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="sim-input-group">
          <label className="sim-label">Target floors</label>
          <input className="sim-input" type="number" min="1" max="30" value={floors} onChange={(e) => setFloors(e.target.value)} />
        </div>

        <div className="sim-input-group">
          <label className="sim-label">Priorities</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PRIORITIES_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => togglePriority(p)}
                style={{
                  padding: '5px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                  background: priorities.includes(p) ? 'rgba(59,130,246,0.10)' : '#f8fafc',
                  border: `1px solid ${priorities.includes(p) ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  color: priorities.includes(p) ? '#60a5fa' : '#6b7280',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ fontSize: 12, color: '#ef4444', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px' }}>
            {error}
          </div>
        )}

        <button
          className="btn-primary"
          onClick={generate}
          disabled={loading || !plotArea}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {loading ? (
            <><div className="terra-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating…</>
          ) : (
            <><Sparkles size={14} /> Generate Scenarios</>
          )}
        </button>

        {/* Scenario selector */}
        <AnimatePresence>
          {scenarios?.scenarios && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="sim-label">Scenarios</div>
              {scenarios.scenarios.map((s) => (
                <div
                  key={s.id}
                  className={`sim-scenario-card ${selected === s.id ? 'selected' : ''}`}
                  onClick={() => setSelected(s.id)}
                  style={{ borderColor: selected === s.id ? `${SCENARIO_COLORS[s.id]}50` : undefined, background: selected === s.id ? `${SCENARIO_COLORS[s.id]}08` : undefined }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: SCENARIO_COLORS[s.id] }}>
                      Scenario {s.id}
                    </div>
                    {scenarios.recommended_scenario === s.id && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
                        Recommended
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{s.description}</div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0e0e14' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0e0e14' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4b5563' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1a2744' }] },
];
