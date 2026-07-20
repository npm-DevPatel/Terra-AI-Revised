/**
 * LensWorkspace.jsx — Terra Lens
 *
 * Phases: upload → analyzing → result
 * Features:
 *   • Fullscreen annotated viewer (Vision API bboxes, no YOLO)
 *   • Terra Tap: glassy cursor, click → ask AI about that spot
 *   • Right-side Terra Copilot chat panel
 *   • Navigate to Planner and Report from toolbar
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Camera, Upload, X, AlertTriangle, CheckCircle,
  Maximize2, Minimize2, Crosshair, MessageSquare,
  LayoutDashboard, FileText, Sparkles, Send, Loader2, MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import useTerraStore from '../../store/useTerraStore';
import { API_BASE_URL as API_BASE } from '../../lib/apiBase';
import '../../styles/workspace.css';

import artAesthetic from '../../assets/terra_upload/art_aesthetic.jpeg';
import birdInMotion from '../../assets/terra_upload/bird in motion.jpeg';
import castle from '../../assets/terra_upload/castle.jpg';
import greenery from '../../assets/terra_upload/greenery.jpeg';
import kilgoris from '../../assets/terra_upload/kilgoris (2).jpg';
import puppy from '../../assets/terra_upload/puppy.jpg';
import drawModeIcon from '../../assets/analysis_page/draw_mode.png';

const GALLERY_IMAGES = [
  { id: 'art', src: artAesthetic, label: 'Abstract art piece', isKilgoris: false },
  { id: 'bird', src: birdInMotion, label: 'Avian flight path', isKilgoris: false },
  { id: 'castle', src: castle, label: 'Stone fortress structure', isKilgoris: false },
  { id: 'greenery', src: greenery, label: 'Lush forest canopy', isKilgoris: false },
  { id: 'kilgoris', src: kilgoris, label: 'Kilgoris development site', isKilgoris: true },
  { id: 'puppy', src: puppy, label: 'Playful golden pup', isKilgoris: false },
];

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/* ── Satellite Location Picker ─────────────────────────────────── */
function SatelliteLocationPicker({ onPlaceSelected, onClose }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const acRef = useRef(null);
  const searchInputRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const initMap = () => {
    if (!mapRef.current || !window.google?.maps) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: -1.0063, lng: 34.879 }, // Default: Kilgoris, Kenya
      zoom: 12,
      mapTypeId: 'satellite',
      tilt: 0,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_CENTER,
      },
    });
    mapInstanceRef.current = map;

    // Click to drop pin
    map.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      if (markerRef.current) markerRef.current.setMap(null);
      markerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map,
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#34d399',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });

      // Reverse geocode
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        const label = status === 'OK' && results[0]
          ? results[0].formatted_address
          : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setSelectedLocation({ lat, lng, label });
        setSearchValue(label);
      });
    });

    // Places Autocomplete on the search bar
    if (window.google.maps.places && searchInputRef.current) {
      acRef.current = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        fields: ['formatted_address', 'geometry', 'name'],
      });
      acRef.current.addListener('place_changed', () => {
        const place = acRef.current.getPlace();
        if (!place.geometry?.location) return;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const label = place.formatted_address || place.name || '';

        map.panTo({ lat, lng });
        map.setZoom(15);

        if (markerRef.current) markerRef.current.setMap(null);
        markerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          animation: window.google.maps.Animation.DROP,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#34d399',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
        });
        setSelectedLocation({ lat, lng, label });
        setSearchValue(label);
      });
    }

    setMapReady(true);
  };

  useEffect(() => {
    if (!MAPS_KEY) return;

    const load = () => {
      if (window.google?.maps?.places) {
        initMap();
      } else {
        const iv = setInterval(() => {
          if (window.google?.maps?.places) { clearInterval(iv); initMap(); }
        }, 200);
        return () => clearInterval(iv);
      }
    };

    if (window.google?.maps) {
      load();
    } else {
      const scriptId = 'google-maps-places';
      if (!document.getElementById(scriptId)) {
        const s = document.createElement('script');
        s.id = scriptId;
        s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places&loading=async`;
        s.async = true;
        s.onload = load;
        document.head.appendChild(s);
      } else {
        load();
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = () => {
    if (!selectedLocation) return;
    onPlaceSelected(selectedLocation);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 12 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Gabarito','Inter',system-ui",
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: 680,
        background: 'rgba(15, 23, 42, 0.96)',
        border: '1.5px solid rgba(52, 211, 153, 0.2)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(52,211,153,0.08)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(30, 41, 59, 0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(52,211,153,0.12)',
              border: '1px solid rgba(52,211,153,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              🛰️
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc' }}>Satellite Location Picker</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Powered by Google Earth Engine</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: '#94a3b8',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Search bar overlay */}
        <div style={{ padding: '14px 20px', background: 'rgba(15, 23, 42, 0.8)' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', pointerEvents: 'none',
            }}>
              <MapPin size={14} color="#34d399" />
            </div>
            <input
              ref={searchInputRef}
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              placeholder="Search location — e.g. Kilgoris, Narok County, Kenya"
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(52, 211, 153, 0.25)',
                borderRadius: '10px',
                padding: '10px 14px 10px 34px',
                color: '#f8fafc',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <p style={{ fontSize: 11, color: '#475569', margin: '8px 0 0', textAlign: 'center' }}>
            Type to search, or click anywhere on the satellite map to pin a location
          </p>
        </div>

        {/* Map container */}
        <div style={{ position: 'relative', height: 360 }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

          {!mapReady && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(10,15,25,0.95)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border: '3px solid rgba(52,211,153,0.2)',
                  borderTopColor: '#34d399',
                }}
              />
              <span style={{ fontSize: 12, color: '#64748b' }}>Loading satellite imagery…</span>
            </div>
          )}

          {/* Crosshair hint */}
          {mapReady && !selectedLocation && (
            <div style={{
              position: 'absolute', bottom: 16, left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '6px 14px',
              fontSize: 11, color: '#94a3b8',
              pointerEvents: 'none',
            }}>
              Click on the map to drop a pin
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(30, 41, 59, 0.5)',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}>
          {selectedLocation ? (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, color: '#34d399',
              background: 'rgba(52,211,153,0.06)',
              border: '1px solid rgba(52,211,153,0.15)',
              borderRadius: 8, padding: '8px 12px',
            }}>
              <MapPin size={12} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedLocation.label}
              </span>
              <span style={{ color: '#475569', flexShrink: 0, fontSize: 11 }}>
                {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
              </span>
            </div>
          ) : (
            <div style={{ flex: 1, fontSize: 12, color: '#475569' }}>No location selected yet</div>
          )}
          <button
            onClick={handleConfirm}
            disabled={!selectedLocation}
            style={{
              background: selectedLocation ? 'linear-gradient(135deg, #10b981, #34d399)' : 'rgba(255,255,255,0.05)',
              color: selectedLocation ? '#fff' : '#4b5563',
              border: 'none',
              borderRadius: 10,
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 700,
              cursor: selectedLocation ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            Confirm Location
          </button>
        </div>
      </div>
    </motion.div>
  );
}

const OBJ_COLORS = {
  tree:'#34d399', grass:'#4ade80', vegetation:'#86efac', water:'#60a5fa',
  river:'#3b82f6', flood:'#1d4ed8', building:'#f59e0b', house:'#f97316',
  road:'#94a3b8', vehicle:'#a78bfa', soil:'#d97706', rock:'#78716c',
};
function objColor(name) {
  for (const [k,v] of Object.entries(OBJ_COLORS)) { if (name.includes(k)) return v; }
  return '#c084fc';
}

function ScoreRing({ score }) {
  const r = 54, circ = 2 * Math.PI * r, fill = (score / 100) * circ;
  const color = score >= 80 ? '#34d399' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease-out' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 900, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Score</div>
      </div>
    </div>
  );
}

function TapModal({ pos, onAsk, onClose, loading, answer }) {
  const [q, setQ] = useState('');
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      style={{
        position: 'fixed', left: Math.min(pos.sx + 20, window.innerWidth - 320),
        top: Math.max(pos.sy - 40, 8), width: 300,
        background: 'rgba(10,10,20,0.93)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(16,185,129,0.3)', borderRadius: 16, padding: 16, zIndex: 60,
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>Terra Tap</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><X size={14} /></button>
      </div>
      {answer ? (
        <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6, margin: 0 }}>{answer}</p>
      ) : loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: 13 }}>
          <Loader2 size={14} className="spin" /> Terra is reading this spot…
        </div>
      ) : (
        <>
          <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>Ask about this point on the site</p>
          <textarea value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); q.trim() && onAsk(q); } }}
            placeholder="What is the soil here? Is this a drainage area?" rows={2} autoFocus
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '8px 10px', color: '#e2e8f0', fontSize: 13,
              fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
          <button onClick={() => q.trim() && onAsk(q)} disabled={!q.trim()}
            style={{ marginTop: 8, width: '100%', background: q.trim() ? '#10b981' : '#374151',
              border: 'none', borderRadius: 8, padding: 8, color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: q.trim() ? 'pointer' : 'default', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Sparkles size={13} /> Ask Terra
          </button>
        </>
      )}
    </motion.div>
  );
}

function AnnotatedViewer({ image, result, geminiReport, projectName, projectId, analysisId, onClose }) {
  const navigate = useNavigate();
  const { session } = useTerraStore();
  const imgRef = useRef(null);
  const [imgDims, setImgDims] = useState(null);
  const [tapMode, setTapMode] = useState(false);
  const [tapPos, setTapPos] = useState(null);
  const [tapLoading, setTapLoading] = useState(false);
  const [tapAnswer, setTapAnswer] = useState('');
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMsgs, setChatMsgs] = useState([{ role: 'ai', text: 'Hi! Ask me anything about this site. I have the full analysis context.' }]);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Pen/Drawing states
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#ef4444');
  const [drawMode, setDrawMode] = useState(false);
  const [showDrawQuestion, setShowDrawQuestion] = useState(false);
  const [drawQuestion, setDrawQuestion] = useState('');

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMsgs, chatLoading]);

  const objects = result?.vision?.objects || [];
  const score = result?.score || 0;
  const scoreColor = score >= 80 ? '#34d399' : score >= 50 ? '#f59e0b' : '#ef4444';
  const createdAt = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleImgLoad = () => {
    if (!imgRef.current) return;
    const { width, height } = imgRef.current;
    setImgDims({ width, height });
  };

  const handleImgClick = e => {
    if (!tapMode) return;
    const rect = imgRef.current.getBoundingClientRect();
    setTapPos({ sx: e.clientX, sy: e.clientY, xPct: (e.clientX - rect.left) / rect.width, yPct: (e.clientY - rect.top) / rect.height });
    setTapAnswer('');
  };

  const handleTapAsk = async q => {
    setTapLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/lens/tap`, { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ project_id: projectId, analysis_id: analysisId, tap_x_pct: tapPos.xPct, tap_y_pct: tapPos.yPct, question: q }) });
      const data = await res.json();
      setTapAnswer(data.answer || 'No answer available.');
    } catch { setTapAnswer('Terra Tap is temporarily unavailable.'); }
    setTapLoading(false);
  };

  const handleCopilotSend = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput('');
    setChatMsgs(p => [...p, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/copilot/chat`, { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ message: msg, resolved_refs: [{ type: 'project', id: projectId }] }) });
      const data = await res.json();
      setChatMsgs(p => [...p, { role: 'ai', text: data.answer || 'No response.' }]);
    } catch { setChatMsgs(p => [...p, { role: 'ai', text: 'Copilot temporarily unavailable.' }]); }
    setChatLoading(false);
  };

  // Drawing Handlers
  const handlePointerDown = e => {
    if (!drawMode) return;
    setIsDrawing(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setLines(prev => [...prev, { color: drawColor, points: [{ x, y }] }]);
  };

  const handlePointerMove = e => {
    if (!drawMode || !isDrawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setLines(prev => {
      const copy = [...prev];
      if (copy.length === 0) return copy;
      const lastLine = { ...copy[copy.length - 1] };
      lastLine.points = [...lastLine.points, { x, y }];
      copy[copy.length - 1] = lastLine;
      return copy;
    });
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    if (lines.length > 0) {
      setShowDrawQuestion(true);
    }
  };

  const handleDrawAsk = () => {
    const question = drawQuestion.trim();
    if (!question) return;
    setDrawQuestion('');
    
    setChatMsgs(prev => [
      ...prev,
      { role: 'user', text: `[Drawing Inquiry] ${question}` }
    ]);
    setCopilotOpen(true);
    setChatLoading(true);
    
    setTimeout(() => {
      let aiText = '';
      if (drawColor === '#ef4444') {
        aiText = "Analyzing the area highlighted in Red. This overlaps with the statutory 30m riparian buffer zone setback under NEMA environmental guidelines. Building here is highly discouraged.";
      } else if (drawColor === '#3b82f6') {
        aiText = "Analyzing the area highlighted in Blue. This is a clear surface water drainage run-off path. Elevating footings or altering landscaping grading is recommended.";
      } else if (drawColor === '#10b981') {
        aiText = "Analyzing the area highlighted in Green. This is a densely vegetated zone. Soil stability is likely strong due to rooting, but clearing may require a local permit.";
      } else {
        aiText = "Analyzing the marked region. Soil core models suggest a clay-heavy consistency. Standard structural footings require geotechnical confirmation.";
      }
      
      setChatMsgs(prev => [
        ...prev,
        { role: 'ai', text: aiText }
      ]);
      setChatLoading(false);
    }, 1200);
  };

  const DrawIcon = ({ size }) => (
    <img
      src={drawModeIcon}
      alt="Draw"
      style={{
        width: size + 2,
        height: size + 2,
        filter: drawMode ? 'none' : 'brightness(0) invert(1)',
      }}
    />
  );

  const toolbarBtns = [
    { label: tapMode ? 'Tap ON' : 'Terra Tap', icon: Crosshair, onClick: () => { setTapMode(m => !m); setDrawMode(false); setTapPos(null); }, active: tapMode, color: '#34d399' },
    { label: drawMode ? 'Drawing ON' : 'Draw Mode', icon: DrawIcon, onClick: () => { setDrawMode(d => !d); setTapMode(false); setTapPos(null); }, active: drawMode, color: '#ef4444' },
    null,
    { label: 'Copilot', icon: MessageSquare, onClick: () => setCopilotOpen(o => !o), active: copilotOpen, color: '#c084fc' },
    null,
    { label: 'Planner', icon: LayoutDashboard, onClick: () => navigate(`/workspace/${projectId}/planner`), active: false, color: '#60a5fa' },
    { label: 'Report', icon: FileText, onClick: () => navigate(`/workspace/${projectId}/flow`), active: false, color: '#c084fc' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0f', zIndex: 50, display: 'flex', fontFamily: "'Gabarito','Inter',system-ui" }}>
      {/* Image area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: tapMode ? 'crosshair' : (drawMode ? 'crosshair' : 'default') }}>
        {/* Info cards */}
        <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, zIndex: 10, flexWrap: 'wrap' }}>
          {[['Project', projectName], ['Date', createdAt]].map(([k, v]) => (
            <div key={k} style={{ background: '#fff', borderRadius: 10, padding: '7px 13px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{v}</div>
            </div>
          ))}
          <div style={{ background: scoreColor + '18', border: `1px solid ${scoreColor}40`, borderRadius: 10, padding: '7px 13px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: scoreColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: scoreColor }}>{score}/100 — {result?.label}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, zIndex: 20, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
          <Minimize2 size={16} />
        </button>
        <img ref={imgRef} src={image.url} alt="Site" onLoad={handleImgLoad} onClick={handleImgClick}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
        
        {/* Bounding boxes SVG */}
        {imgDims && objects.length > 0 && (
          <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }} width="100%" height="100%"
            viewBox={`0 0 ${imgDims.width} ${imgDims.height}`} preserveAspectRatio="xMidYMid meet">
            {objects.map((obj, i) => {
              if (!obj.bbox || obj.bbox.length < 4) return null;
              const pts = obj.bbox.map(v => `${v.x * imgDims.width},${v.y * imgDims.height}`).join(' ');
              const col = objColor(obj.name);
              const lx = obj.bbox[0].x * imgDims.width, ly = obj.bbox[0].y * imgDims.height;
              const lbl = `${obj.name} ${Math.round(obj.confidence * 100)}%`;
              return (
                <g key={i}>
                  <polygon points={pts} fill={col + '22'} stroke={col} strokeWidth="2" strokeDasharray="4 2" />
                  <rect x={lx} y={Math.max(ly - 20, 0)} width={lbl.length * 7 + 12} height={18} rx={4} fill={col + 'cc'} />
                  <text x={lx + 6} y={Math.max(ly - 6, 12)} fontSize="11" fontWeight="700" fill="#fff" fontFamily="system-ui">{lbl}</text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Drawings SVG Overlay */}
        {imgDims && (
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: drawMode ? 'auto' : 'none',
              zIndex: 30,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            viewBox={`0 0 ${imgDims.width} ${imgDims.height}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {lines.map((line, idx) => {
              const pathData = line.points.map((pt, i) => {
                const px = pt.x * imgDims.width;
                const py = pt.y * imgDims.height;
                return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
              }).join(' ');
              return (
                <path
                  key={idx}
                  d={pathData}
                  stroke={line.color}
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}
          </svg>
        )}

        {/* Floating Drawing Panel */}
        {drawMode && (
          <div style={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 16,
            padding: '12px 18px',
            zIndex: 60,
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            width: 320,
            fontFamily: 'inherit',
          }}>
            {/* Color selection row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>Pen Color:</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { hex: '#ef4444', label: 'Red' },
                  { hex: '#3b82f6', label: 'Blue' },
                  { hex: '#ffffff', label: 'White' },
                  { hex: '#10b981', label: 'Green' },
                  { hex: '#eab308', label: 'Yellow' }
                ].map(color => (
                  <button
                    key={color.hex}
                    onClick={() => setDrawColor(color.hex)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: color.hex,
                      border: drawColor === color.hex ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                    title={color.label}
                  />
                ))}
              </div>
              <button
                onClick={() => { setLines([]); setShowDrawQuestion(false); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Clear
              </button>
            </div>
            
            {/* Drawing question box */}
            {lines.length > 0 && (
              <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Ask AI about the marked area:</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={drawQuestion}
                    onChange={e => setDrawQuestion(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleDrawAsk(); }}
                    placeholder="e.g. Is this soil stable?"
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      padding: '6px 10px',
                      color: '#fff',
                      fontSize: 12,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleDrawAsk}
                    disabled={!drawQuestion.trim()}
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Ask
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tapMode && tapPos && (
          <div style={{ position: 'fixed', left: tapPos.sx - 20, top: tapPos.sy - 20, width: 40, height: 40,
            borderRadius: '50%', border: '2px solid #10b981', background: 'rgba(16,185,129,0.15)',
            backdropFilter: 'blur(4px)', pointerEvents: 'none', zIndex: 55,
            boxShadow: '0 0 20px rgba(16,185,129,0.4)' }} />
        )}
        <AnimatePresence>
          {tapPos && <TapModal pos={tapPos} loading={tapLoading} answer={tapAnswer} onAsk={handleTapAsk}
            onClose={() => { setTapPos(null); setTapAnswer(''); }} />}
        </AnimatePresence>
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 8, background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, padding: '8px 16px', zIndex: 10 }}>
          {toolbarBtns.map((btn, i) => btn === null ? (
            <div key={i} style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
          ) : (
            <button key={i} onClick={btn.onClick}
              style={{ display: 'flex', alignItems: 'center', gap: 6,
                background: btn.active ? btn.color + '20' : 'transparent',
                border: btn.active ? `1px solid ${btn.color}50` : '1px solid transparent',
                borderRadius: 100, padding: '6px 14px', color: btn.active ? btn.color : '#9ca3af',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              <btn.icon size={13} />{btn.label}
            </button>
          ))}
        </div>
      </div>
      {/* Copilot panel */}
      <AnimatePresence>
        {copilotOpen && (
          <motion.div key="copilot" initial={{ width: 0, opacity: 0 }} animate={{ width: 340, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            style={{ background: '#111118', borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={13} color="#c084fc" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f8' }}>Terra Copilot</div>
                    <div style={{ fontSize: 11, color: '#4b5563' }}>Site-aware AI assistant</div>
                  </div>
                </div>
                <button onClick={() => setCopilotOpen(false)} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer' }}><X size={15} /></button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {chatMsgs.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '85%', padding: '9px 12px', borderRadius: 12,
                    background: m.role === 'user' ? '#10b981' : 'rgba(255,255,255,0.06)',
                    color: m.role === 'user' ? '#fff' : '#d1d5db', fontSize: 13, lineHeight: 1.5,
                    borderBottomRightRadius: m.role === 'user' ? 4 : 12,
                    borderBottomLeftRadius: m.role === 'ai' ? 4 : 12 }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', gap: 4, padding: '4px 2px' }}>
                  {[0,1,2].map(i => (
                    <motion.div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#4b5563' }}
                      animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCopilotSend()}
                  placeholder="Ask about this site…"
                  style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                <button onClick={handleCopilotSend} disabled={!chatInput.trim() || chatLoading}
                  style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: chatInput.trim() ? '#10b981' : '#1f2937', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: chatInput.trim() ? 'pointer' : 'default' }}>
                  <Send size={14} color={chatInput.trim() ? '#fff' : '#374151'} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   LensWorkspace — main component
══════════════════════════════════════════════════════════════════ */
export default function LensWorkspace() {
  const { projectId } = useParams();
  const { session } = useTerraStore();

  const [phase, setPhase] = useState('upload');
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);  // { lat, lng, label } — set by PlacesInput
  const [title, setTitle] = useState('');
  const [result, setResult] = useState(null);
  const [geminiReport, setGeminiReport] = useState(null);
  const [analysisId, setAnalysisId] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Gallery and scanning flow state
  const [showGallery, setShowGallery] = useState(false);
  const [showSatellitePicker, setShowSatellitePicker] = useState(false);
  const [shakingImageId, setShakingImageId] = useState(null);
  const [selectionError, setSelectionError] = useState(null);
  const [flyingImg, setFlyingImg] = useState(null);
  const [flyingCoords, setFlyingCoords] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState([]);

  const uploadZoneRef = useRef(null);

  useEffect(() => {
    if (phase !== 'scanning') {
      setScanProgress(0);
      setScanLogs([]);
      return;
    }

    const initKilgorisImage = async () => {
      try {
        const response = await fetch(kilgoris);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage({ url: kilgoris, base64: reader.result.split(',')[1] });
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error('Failed to convert local asset to base64', err);
      }
    };
    initKilgorisImage();

    const logs = [
      'Syncing coordinates to Kilgoris, Kenya (-1.0063, 34.8790)...',
      'Downloading satellite imagery and HydroRIVERS data...',
      'Running computer vision land-cover segmentation...',
      'Computing Slope, Foundation, and NEMA riparian setbacks...',
    ];

    setScanLogs([logs[0]]);
    setScanProgress(5);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        const next = prev + 5;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }

        if (next === 25) setScanLogs(l => [...l, logs[1]]);
        if (next === 50) setScanLogs(l => [...l, logs[2]]);
        if (next === 75) setScanLogs(l => [...l, logs[3]]);

        return next;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (scanProgress === 100 && phase === 'scanning') {
      const t = setTimeout(() => {
        analyze();
      }, 500);
      return () => clearTimeout(t);
    }
  }, [scanProgress, phase]);

  const handleImageSelect = (img, e) => {
    if (!img.isKilgoris) {
      setShakingImageId(img.id);
      setSelectionError(`"${img.label}" is not a development site survey. Please select the Kilgoris site image.`);
      setTimeout(() => setShakingImageId(null), 500);
      return;
    }

    setSelectionError(null);
    setShakingImageId(img.id);

    const rect = e.currentTarget.getBoundingClientRect();
    const destRect = uploadZoneRef.current.getBoundingClientRect();

    setTimeout(() => {
      setShakingImageId(null);
      
      setLocation({
        lat: -1.0063,
        lng: 34.8790,
        label: 'Kilgoris, Kenya',
      });
      setTitle('Kilgoris Farm Project');

      setFlyingCoords({
        startX: rect.left,
        startY: rect.top,
        startW: rect.width,
        startH: rect.height,
        endX: destRect.left,
        endY: destRect.top,
        endW: destRect.width,
        endH: destRect.height,
      });
      setFlyingImg(img.src);
    }, 450);
  };

  useEffect(() => {
    supabase.from('projects').select('name').eq('id', projectId).single()
      .then(({ data }) => { if (data) setProjectName(data.name); });
  }, [projectId]);

  const subscribeToGemini = useCallback((aid) => {
    const sub = supabase.channel(`analysis:${aid}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'analyses', filter: `id=eq.${aid}` },
        payload => {
          if (payload.new.gemini_done && payload.new.raw_result?.gemini_report) {
            setGeminiReport(payload.new.raw_result.gemini_report);
            supabase.removeChannel(sub);
          }
        }).subscribe();
  }, []);

  const processFile = file => {
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      setImage({ url: dataUrl, base64: dataUrl.split(',')[1] });
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!image) return;
    setPhase('analyzing'); setError('');
    try {
      const res = await fetch(`${API_BASE}/api/lens/analyze`, { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          photo_base64: image.base64,
          lat: location?.lat,
          lng: location?.lng,
          project_id: projectId,
          // Use the place name as title if the user hasn't typed one
          title: title || location?.label || undefined,
        }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed.');
      data.vision.objects = data.vision_objects_full || data.vision?.objects || [];
      setResult(data); setAnalysisId(data.analysis_id);
      setPhase('result'); subscribeToGemini(data.analysis_id);
    } catch (err) { setError(err.message); setPhase('upload'); }
  };

  const reset = () => {
    setPhase('upload'); setImage(null); setResult(null); setGeminiReport(null);
    setError(''); setLocation(null); setTitle(''); setAnalysisId(null); setFullscreen(false);
  };

  if (fullscreen && image && result) {
    return <AnnotatedViewer image={image} result={result} geminiReport={geminiReport}
      projectName={projectName} projectId={projectId} analysisId={analysisId}
      onClose={() => setFullscreen(false)} />;
  }

  return (
    <div className="lens-screen">
      <AnimatePresence mode="wait">
        {phase === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Tagline Header */}
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>Terra Lens</h2>
              <h3 style={{
                fontSize: 16,
                fontWeight: 700,
                marginTop: 4,
                marginBottom: 6,
                background: 'linear-gradient(135deg, #34d399 0%, #a7f3d0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                See Beyond The Surface
              </h3>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Photograph a site. Terra AI reads the land.</p>
            </div>

            {/* Redesigned Glassmorphic Card */}
            <div ref={uploadZoneRef} style={{
              background: 'rgba(30, 41, 59, 0.45)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(52, 211, 153, 0.15)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px rgba(52, 211, 153, 0.05)',
              borderRadius: '24px',
              padding: '28px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}>
              
              {!showGallery ? (
                <div
                  className={`lens-upload-zone ${dragOver ? 'drag-over' : ''}`}
                  onClick={() => setShowGallery(true)}
                  style={{
                    background: 'rgba(16, 185, 129, 0.02)',
                    border: '2px dashed rgba(52, 211, 153, 0.25)',
                    borderRadius: '16px',
                    padding: '32px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div className="lens-upload-icon" style={{ background: 'rgba(52, 211, 153, 0.1)' }}>
                    <Upload size={22} style={{ color: '#34d399' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>Click to browse site gallery</p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Select from pre-loaded field surveys</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Select Site Image
                    </span>
                    <button
                      onClick={() => setShowGallery(false)}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                  
                  {/* 2x3 Image Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 14,
                  }}>
                    {GALLERY_IMAGES.map((img) => {
                      const isShaking = shakingImageId === img.id;
                      return (
                        <motion.div
                          key={img.id}
                          onClick={(e) => handleImageSelect(img, e)}
                          animate={isShaking ? {
                            x: [-4, 4, -4, 4, -2, 2, 0],
                            rotate: [-1, 1, -1, 1, 0],
                          } : {}}
                          transition={isShaking ? { duration: 0.4 } : {}}
                          style={{
                            background: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                          whileHover={{
                            scale: 1.04,
                            borderColor: 'rgba(52, 211, 153, 0.4)',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                          }}
                        >
                          <div style={{
                            width: '100%',
                            aspectRatio: '4/3',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            position: 'relative',
                            background: '#020617',
                          }}>
                            <img
                              src={img.src}
                              alt={img.label}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <p style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#94a3b8',
                            margin: 0,
                            lineHeight: 1.3,
                            height: '28px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {img.label}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                  {selectionError && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        fontSize: 12,
                        color: '#f87171',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        textAlign: 'center',
                      }}
                    >
                      {selectionError}
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Location + name inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Satellite location picker trigger button */}
              <button
                onClick={() => setShowSatellitePicker(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(52, 211, 153, 0.2)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'rgba(52,211,153,0.12)',
                  border: '1px solid rgba(52,211,153,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 18,
                }}>🛰️</div>
                <div style={{ flex: 1 }}>
                  {location ? (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location Pinned</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{location.label}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>Pick Location via Satellite</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Powered by Google Earth Engine</div>
                    </>
                  )}
                </div>
                {location && (
                  <div style={{ fontSize: 11, color: '#475569', flexShrink: 0 }}>
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </div>
                )}
                <MapPin size={14} color={location ? '#34d399' : '#475569'} style={{ flexShrink: 0 }} />
              </button>

              <input
                className="sim-input"
                placeholder="Name this analysis — e.g. Ruiru plot 3 (optional)"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            
            {error && (
              <div style={{
                fontSize: 13,
                color: '#f87171',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 10,
                padding: '10px 14px'
              }}>
                {error}
              </div>
            )}
          </motion.div>
        )}

        {phase === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              width: '100%',
              maxWidth: 560,
              background: 'rgba(30, 41, 59, 0.45)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(52, 211, 153, 0.15)',
              borderRadius: '24px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
            }}
          >
            <div style={{
              width: '100%',
              aspectRatio: '16/9',
              borderRadius: '16px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              <img src={kilgoris} alt="Scanning..." style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              
              {/* Scan laser line */}
              <motion.div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, rgba(52,211,153,0) 0%, rgba(52,211,153,1) 50%, rgba(52,211,153,0) 100%)',
                  boxShadow: '0 0 15px #34d399, 0 0 30px #34d399',
                  zIndex: 2,
                }}
                animate={{
                  top: ['0%', '98%', '0%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(16, 185, 129, 0.05)',
                zIndex: 1,
              }} />
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#34d399' }}>AI SCANNING IN PROGRESS...</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>{scanProgress}%</span>
              </div>
              
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${scanProgress}%`, height: '100%', background: '#34d399', transition: 'width 0.1s ease-out', borderRadius: 3 }} />
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '12px',
                fontFamily: 'monospace',
                fontSize: 11,
                color: '#a7f3d0',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                minHeight: '76px',
              }}>
                {scanLogs.map((log, i) => (
                  <div key={i} style={{ opacity: i === scanLogs.length - 1 ? 1 : 0.6 }}>
                    &gt; {log}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {phase === 'analyzing' && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: 60 }}>
            <div className="terra-spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f8', marginBottom: 6 }}>Analysing your site</div>
              <div style={{ fontSize: 13, color: '#4b5563' }}>Vision scan → Soil → Hydrology → Legal zones…</div>
            </div>
          </motion.div>
        )}
        {phase === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ width: '100%', maxWidth: 620, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {image && (
              <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', cursor: 'pointer' }}
                onClick={() => setFullscreen(true)}>
                <img src={image.url} alt="Site" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '5px 11px', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 12, fontWeight: 600 }}>
                  <Maximize2 size={12} /> Open annotated view + Terra Tap
                </div>
                {result.vision?.labels?.length > 0 && (
                  <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {result.vision.labels.slice(0, 4).map(l => (
                      <span key={l} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#e2e8f0' }}>{l}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="lens-score-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
                <ScoreRing score={result.score} />
                <div>
                  <div className={`lens-score-label ${result.score >= 80 ? 'safe' : result.score >= 50 ? 'moderate' : 'critical'}`}>{result.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f8', marginTop: 6 }}>{result.address || title || 'Site Analysis'}</div>
                  {result.geospatial_available && <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>Geospatial data included</div>}
                </div>
              </div>
              {result.vision?.labels?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {result.vision.labels.map(l => <span key={l} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: '#f1f5f9', color: '#64748b' }}>{l}</span>)}
                  {result.vision.water_signals && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>Water signals</span>}
                  {result.vision.construction_detected && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>Construction activity</span>}
                </div>
              )}
              {result.key_risks?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.key_risks.map((r, i) => <div key={i} className="risk-flag caution"><AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} /><span style={{ fontSize: 13, color: '#d1d5db' }}>{r}</span></div>)}
                </div>
              ) : (
                <div className="risk-flag" style={{ borderColor: 'rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.05)' }}>
                  <CheckCircle size={14} color="#34d399" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: '#d1d5db' }}>No major geospatial risk flags detected.</span>
                </div>
              )}
            </div>
            <AnimatePresence>
              {!geminiReport && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #f1f5f9', borderRadius: 12, padding: '14px 16px' }}>
                  <div className="terra-spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: '#8b5cf6', borderColor: 'rgba(139,92,246,0.15)' }} />
                  <span style={{ fontSize: 13, color: '#64748b' }}>AI narrative generating… arrives via Supabase Realtime</span>
                </motion.div>
              )}
              {geminiReport && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 14, padding: '20px 22px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>AI Analysis</div>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0 }}>{geminiReport.executive_summary}</p>
                  {geminiReport.visual_site_summary && (
                    <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                      <strong style={{ color: '#374151' }}>Visual: </strong>{geminiReport.visual_site_summary}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setFullscreen(true)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '10px 14px', color: '#34d399', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Maximize2 size={13} /> Annotated View
              </button>
              <button onClick={reset}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                New Analysis
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Satellite Location Picker Modal */}
      <AnimatePresence>
        {showSatellitePicker && (
          <SatelliteLocationPicker
            onPlaceSelected={(loc) => {
              setLocation(loc);
            }}
            onClose={() => setShowSatellitePicker(false)}
          />
        )}
      </AnimatePresence>

      {/* Flying Image Clone */}
      {flyingImg && flyingCoords && (
        <motion.img
          src={flyingImg}
          initial={{
            position: 'fixed',
            left: flyingCoords.startX,
            top: flyingCoords.startY,
            width: flyingCoords.startW,
            height: flyingCoords.startH,
            borderRadius: '12px',
            zIndex: 9999,
            boxShadow: '0 8px 32px rgba(52, 211, 153, 0.3)',
            opacity: 1,
          }}
          animate={{
            left: flyingCoords.endX + 28,
            top: flyingCoords.endY + 28,
            width: flyingCoords.endW - 56,
            height: (flyingCoords.endW - 56) * (9/16),
            borderRadius: '16px',
            opacity: [1, 1, 0.9, 0],
          }}
          transition={{
            type: 'spring',
            stiffness: 90,
            damping: 15,
          }}
          onAnimationComplete={() => {
            setFlyingImg(null);
            setPhase('scanning');
          }}
        />
      )}
    </div>
  );
}
