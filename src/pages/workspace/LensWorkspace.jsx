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
  X, AlertTriangle, CheckCircle,
  Maximize2, Minimize2, Crosshair, MessageSquare,
  LayoutDashboard, FileText, Sparkles, Loader2, MapPin,
  Image as ImageIcon, Search, Navigation, Layers3, Check,
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
import demoAnnotations from '../../../presentation_mode/annotations.json';
import { lensDemoResponses, plannerGeneration } from '../../../presentation_mode/demoContent';
import aiIcon from '../../assets/ai_chat/ai_icon.png';
import attachmentIcon from '../../assets/ai_chat/attachment_icon.png';
import micIcon from '../../assets/ai_chat/mic_icon.png';
import voiceListeningGif from '../../assets/ai_chat/voice_listening.gif';
import sendIcon from '../../assets/ai_chat/send.png';
import thinkingGif from '../../assets/made_projects/4_word_loading.gif';

const GALLERY_IMAGES = [
  { id: 'art', src: artAesthetic, label: 'Abstract art piece', isKilgoris: false },
  { id: 'bird', src: birdInMotion, label: 'Avian flight path', isKilgoris: false },
  { id: 'castle', src: castle, label: 'Stone fortress structure', isKilgoris: false },
  { id: 'greenery', src: greenery, label: 'Lush forest canopy', isKilgoris: false },
  { id: 'kilgoris', src: kilgoris, label: 'Highlands of Limuru', isKilgoris: true },
  { id: 'puppy', src: puppy, label: 'Playful golden pup', isKilgoris: false },
];

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const TIGONI_LOCATION = {
  lat: -1.1398,
  lng: 36.6789,
  label: 'Tigoni, Limuru, Kiambu County, Kenya',
};
const DEMO_LOCATION_SUGGESTIONS = [
  { place_id: 'demo-tigoni', description: 'Tigoni, Limuru, Kiambu County, Kenya', label: TIGONI_LOCATION.label, lat: TIGONI_LOCATION.lat, lng: TIGONI_LOCATION.lng },
  { place_id: 'demo-limuru', description: 'Limuru, Kiambu County, Kenya', label: 'Limuru, Kiambu County, Kenya', lat: -1.1071, lng: 36.6427 },
  { place_id: 'demo-brackenhurst', description: 'Brackenhurst, Tigoni, Limuru, Kenya', label: 'Brackenhurst, Tigoni, Limuru, Kenya', lat: -1.1291, lng: 36.6819 },
  { place_id: 'demo-kiambu', description: 'Kiambu County, Kenya', label: 'Kiambu County, Kenya', lat: -1.0314, lng: 36.8681 },
];
const LOADING_WORDS = ['synthesizing', 'pondering', 'crafting', 'composing'];
const DRAW_VOICE_QUESTIONS = {
  '#ef4444': 'Based on what you can see and I have drawn, should we build facing towards the hill or away from it?',
  '#10b981': 'Based on the dark clouds on the sky, does Tigoni rain a lot?',
  '#ffffff': 'I have circled two parcels of land, between the two which one looks buildable?',
};

function buildDemoLensResult(image, location, title) {
  const objects = image?.isKilgoris
    ? [
        { name: 'front parcel', confidence: 0.94, bbox: demoAnnotations.regions[0].polygon },
        { name: 'upper parcel', confidence: 0.9, bbox: demoAnnotations.regions[1].polygon },
        { name: 'hillside terrain', confidence: 0.86, bbox: demoAnnotations.regions[2].polygon },
        { name: 'weather cues', confidence: 0.82, bbox: demoAnnotations.regions[3].polygon },
      ]
    : [];

  return {
    analysis_id: `demo-${Date.now()}`,
    score: image?.isKilgoris ? 84 : 72,
    label: image?.isKilgoris ? 'Highly buildable with drainage discipline' : 'Review required',
    address: title || location?.label || image?.label || 'Preloaded site image',
    geospatial_available: Boolean(location),
    key_risks: image?.isKilgoris
      ? [
          'Highland rainfall requires early stormwater routing and temporary site drainage.',
          'Slope and soil moisture should be validated before foundation details are repeated.',
          'First phase should stay on the cleaner open parcel to protect budget and momentum.',
        ]
      : [
          'This preloaded visual is not the Limuru demo parcel, so Terra marks it for manual review.',
          'Confirm parcel boundary, access, and planning context before treating the image as buildable land.',
        ],
    vision: {
      labels: image?.isKilgoris
        ? ['Highland site', 'Open parcel', 'Hillside', 'Weather exposure', 'Vegetation edge']
        : ['Preloaded image', 'Visual scan', 'Manual context needed'],
      objects,
      water_signals: image?.isKilgoris,
      construction_detected: false,
    },
  };
}

function FadedActionWord({ word }) {
  const first = word.slice(0, 2);
  const middle = word.slice(2, -3);
  const last = word.slice(-3);
  return (
    <span className="lens-faded-word" aria-label={word}>
      <strong>{first}</strong>
      <span>{middle}</span>
      <strong>{last}</strong>
    </span>
  );
}

function responseForLensQuestion(question, fallbackKey = 'land') {
  const clean = question.toLowerCase();
  if (clean.includes('cloud') || clean.includes('rain') || clean.includes('prone')) return lensDemoResponses.sky;
  if (clean.includes('hill') || clean.includes('design perspective') || clean.includes('facing')) return lensDemoResponses.hillside;
  if (clean.includes('two') || clean.includes('spaced') || clean.includes('different') || clean.includes('pieces of land')) return lensDemoResponses.comparison;
  return lensDemoResponses[fallbackKey] || lensDemoResponses.land;
}

/* ── Satellite Location Picker ─────────────────────────────────── */
function SatelliteLocationPicker({ onPlaceSelected, onClose }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const polygonRef = useRef(null);
  const placesServiceRef = useRef(null);
  const searchInputRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const demoSuggestionsFor = (value = '') => {
    const needle = value.trim().toLowerCase();
    if (!needle) return DEMO_LOCATION_SUGGESTIONS.slice(0, 3);
    return DEMO_LOCATION_SUGGESTIONS
      .filter((place) => place.description.toLowerCase().includes(needle))
      .slice(0, 4);
  };

  const buildBoundary = (lat, lng) => ([
    { lat: lat + 0.0031, lng: lng - 0.0038 },
    { lat: lat + 0.0042, lng: lng + 0.0015 },
    { lat: lat + 0.0011, lng: lng + 0.0044 },
    { lat: lat - 0.0034, lng: lng + 0.0028 },
    { lat: lat - 0.0028, lng: lng - 0.0027 },
  ]);

  const paintSelectedLand = (map, loc) => {
    if (!window.google?.maps || !map) return;
    if (markerRef.current) markerRef.current.setMap(null);
    if (polygonRef.current) polygonRef.current.setMap(null);

    const boundary = buildBoundary(loc.lat, loc.lng);
    polygonRef.current = new window.google.maps.Polygon({
      paths: boundary,
      strokeColor: '#10b981',
      strokeOpacity: 1,
      strokeWeight: 4,
      fillColor: '#22c55e',
      fillOpacity: 0.3,
      geodesic: true,
      clickable: false,
      map,
    });

    markerRef.current = new window.google.maps.Marker({
      position: { lat: loc.lat, lng: loc.lng },
      map,
      animation: window.google.maps.Animation.DROP,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: '#10b981',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3,
      },
    });

    const bounds = new window.google.maps.LatLngBounds();
    boundary.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, 72);
  };

  const selectLocation = (loc, zoom = 16) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.panTo({ lat: loc.lat, lng: loc.lng });
    map.setZoom(zoom);
    paintSelectedLand(map, loc);
    setSelectedLocation(loc);
    setSearchValue(loc.label);
    setSuggestionsOpen(false);
  };

  const initMap = () => {
    if (!mapRef.current || !window.google?.maps) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: TIGONI_LOCATION.lat, lng: TIGONI_LOCATION.lng },
      zoom: 15,
      mapTypeId: 'satellite',
      tilt: 0,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_CENTER,
      },
    });
    mapInstanceRef.current = map;
    placesServiceRef.current = new window.google.maps.places.AutocompleteService();

    // Click to drop pin
    map.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      // Reverse geocode
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        const label = status === 'OK' && results[0]
          ? results[0].formatted_address
          : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        selectLocation({ lat, lng, label }, 16);
      });
    });

    setMapReady(true);
    selectLocation(TIGONI_LOCATION, 15);
    setSuggestions(demoSuggestionsFor(''));
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

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    const fallbackSuggestions = demoSuggestionsFor(value);

    if (value.trim().length < 2) {
      setSuggestions(fallbackSuggestions);
      setSuggestionsOpen(fallbackSuggestions.length > 0);
      return;
    }

    if (!placesServiceRef.current) {
      setSuggestions(fallbackSuggestions);
      setSuggestionsOpen(fallbackSuggestions.length > 0);
      return;
    }

    placesServiceRef.current.getPlacePredictions({
      input: value,
      componentRestrictions: { country: 'ke' },
      locationBias: {
        center: { lat: TIGONI_LOCATION.lat, lng: TIGONI_LOCATION.lng },
        radius: 80000,
      },
    }, (predictions, status) => {
      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions?.length) {
        setSuggestions(fallbackSuggestions);
        setSuggestionsOpen(fallbackSuggestions.length > 0);
        return;
      }
      const merged = [
        ...fallbackSuggestions,
        ...predictions.slice(0, 5),
      ].filter((item, index, all) => (
        all.findIndex((candidate) => candidate.description === item.description) === index
      )).slice(0, 6);
      setSuggestions(merged);
      setSuggestionsOpen(true);
    });
  };

  const handleSuggestionSelect = (suggestion) => {
    if (Number.isFinite(suggestion.lat) && Number.isFinite(suggestion.lng)) {
      selectLocation({
        lat: suggestion.lat,
        lng: suggestion.lng,
        label: suggestion.label || suggestion.description,
      }, 16);
      return;
    }

    const service = new window.google.maps.places.PlacesService(mapInstanceRef.current);
    service.getDetails({
      placeId: suggestion.place_id,
      fields: ['formatted_address', 'geometry', 'name'],
    }, (place, status) => {
      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) return;
      selectLocation({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        label: place.formatted_address || place.name || suggestion.description,
      }, 16);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        fontFamily: "'Gabarito','Inter',system-ui",
      }}
    >
      {/* Full-page 100% satellite map */}
      <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Loading overlay */}
      {!mapReady && (
        <div style={{
          position: 'absolute', inset: 0,
          background: '#0a0f1a',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 14,
        }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(52,211,153,0.2)', borderTopColor: '#34d399' }} />
          <span style={{ fontSize: 13, color: '#64748b' }}>Loading satellite imagery…</span>
        </div>
      )}

      {/* Floating top search bar */}
      <div className="lens-map-search">
        <div className="lens-map-search-row">
          <Search size={16} color="#10b981" style={{ flexShrink: 0 }} />
          <input
            ref={searchInputRef}
            value={searchValue}
            onChange={handleSearchChange}
            onFocus={() => {
              const nextSuggestions = suggestions.length ? suggestions : demoSuggestionsFor(searchValue);
              setSuggestions(nextSuggestions);
              setSuggestionsOpen(nextSuggestions.length > 0);
            }}
            placeholder="Search Tigoni, Limuru, Kiambu..."
          />
          <button onClick={onClose} className="lens-icon-button" aria-label="Close location picker">
            <X size={14} />
          </button>
        </div>
        {suggestionsOpen && suggestions.length > 0 && (
          <div className="lens-location-suggestions">
            {suggestions.map((suggestion) => (
              <button key={suggestion.place_id} onMouseDown={(e) => e.preventDefault()} onClick={() => handleSuggestionSelect(suggestion)}>
                <MapPin size={14} />
                <span>{suggestion.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="lens-boundary-note">
        <Layers3 size={14} />
        Selected land boundary is shaded
      </div>

      {/* Floating bottom confirm bar */}
      <div style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
        border: '1px solid #e2e8f0', borderRadius: 16,
        padding: '12px 20px', boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        zIndex: 10, minWidth: 340,
      }}>
        {selectedLocation ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>Location pinned</div>
              <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedLocation.label}</div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, fontSize: 12, color: '#94a3b8' }}>Tap anywhere on map to drop a pin</div>
        )}
        <button onClick={handleConfirm} disabled={!selectedLocation}
          style={{
            background: selectedLocation ? '#10b981' : '#e2e8f0',
            color: selectedLocation ? '#fff' : '#94a3b8',
            border: 'none', borderRadius: 10, padding: '10px 22px',
            fontSize: 13, fontWeight: 700, cursor: selectedLocation ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', transition: 'all 0.2s', flexShrink: 0,
          }}
        >
          Confirm Location
        </button>
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

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersects = ((yi > point.y) !== (yj > point.y))
      && (point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 1) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function AnnotatedViewer({ image, result, projectName, projectId, analysisId, onClose }) {
  const navigate = useNavigate();
  const { session, user } = useTerraStore();
  const imgRef = useRef(null);
  const copilotFileRef = useRef(null);
  const [imgDims, setImgDims] = useState(null);
  const [tapMode, setTapMode] = useState(false);
  const [tapPos, setTapPos] = useState(null);
  const [tapLoading, setTapLoading] = useState(false);
  const [tapAnswer, setTapAnswer] = useState('');
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMsgs, setChatMsgs] = useState([{ role: 'ai', text: 'Hi! Ask me anything about this site. I have the full analysis context.' }]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatLoadingText, setChatLoadingText] = useState('');
  const [chatLoadingMode, setChatLoadingMode] = useState('thinking');
  const [copilotListening, setCopilotListening] = useState(false);
  const [profileName, setProfileName] = useState('');
  const messagesEndRef = useRef(null);

  // Pen/Drawing states
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#ef4444');
  const [drawMode, setDrawMode] = useState(false);
  const [drawQuestion, setDrawQuestion] = useState('');

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMsgs, chatLoading]);

  const objects = result?.vision?.objects || [];
  const score = result?.score || 0;
  const scoreColor = score >= 80 ? '#34d399' : score >= 50 ? '#f59e0b' : '#ef4444';
  const createdAt = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const isKilgorisDemo = image?.isKilgoris || image?.url?.includes('kilgoris');
  const annotationRegions = isKilgorisDemo ? demoAnnotations.regions : [];
  const displayName = profileName
    || user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')?.[0]
    || 'there';

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        const nextName = data?.display_name || data?.username;
        if (nextName) setProfileName(nextName);
      });
  }, [user?.id]);

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
    const matchingRegion = annotationRegions.find((region) => (
      pointInPolygon({ x: tapPos.xPct, y: tapPos.yPct }, region.polygon)
    ));
    if (matchingRegion?.response_key) {
      window.setTimeout(() => {
        setTapAnswer(lensDemoResponses[matchingRegion.response_key]);
        setTapLoading(false);
      }, 850);
      return;
    }
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
    setChatLoadingMode('thinking');

    const demoText = responseForLensQuestion(msg, 'land');
    const wantsPlanner = /plan|planner|generate|open terra planner/i.test(msg);
    if (!wantsPlanner) {
      window.setTimeout(() => {
        setChatMsgs(p => [...p, { role: 'ai', text: demoText }]);
        setChatLoading(false);
      }, 2000);
      return;
    }

    setChatLoadingMode('planner');
    let phraseIndex = 0;
    setChatLoadingText(plannerGeneration.phrases[phraseIndex]);
    const phraseTimer = window.setInterval(() => {
      phraseIndex = (phraseIndex + 1) % plannerGeneration.phrases.length;
      setChatLoadingText(plannerGeneration.phrases[phraseIndex]);
    }, 900);

    window.setTimeout(() => {
      window.clearInterval(phraseTimer);
      setChatMsgs(p => [
        ...p,
        {
          role: 'ai',
          text: plannerGeneration.readyMessage,
          action: { label: 'Open Terra Planner', path: `/workspace/${projectId}/planner` },
        },
      ]);
      setChatLoadingText('');
      setChatLoading(false);
    }, 3200);
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
    setChatLoadingMode('thinking');
    
    setTimeout(() => {
      const colorKey = {
        '#ffffff': 'land',
        '#ef4444': 'hillside',
        '#10b981': 'sky',
      }[drawColor];
      const aiText = responseForLensQuestion(question, colorKey);
      
      setChatMsgs(prev => [
        ...prev,
        { role: 'ai', text: aiText }
      ]);
      setChatLoading(false);
    }, 2000);
  };

  const runDrawVoiceDemo = () => {
    if (chatLoading || copilotListening) return;
    const question = DRAW_VOICE_QUESTIONS[drawColor] || DRAW_VOICE_QUESTIONS['#ef4444'];
    const colorKey = {
      '#ffffff': 'land',
      '#ef4444': 'hillside',
      '#10b981': 'sky',
    }[drawColor] || 'hillside';

    setCopilotOpen(true);
    setCopilotListening(true);
    setChatInput('');

    window.setTimeout(() => {
      setChatInput(question);
    }, 520);

    window.setTimeout(() => {
      setCopilotListening(false);
      setChatInput('');
      setChatMsgs(prev => [
        ...prev,
        { role: 'user', text: `[Drawing Inquiry] ${question}` },
      ]);
      setChatLoading(true);
      setChatLoadingMode('thinking');
    }, 1050);

    window.setTimeout(() => {
      setChatMsgs(prev => [
        ...prev,
        { role: 'ai', text: responseForLensQuestion(question, colorKey) },
      ]);
      setChatLoading(false);
    }, 2600);
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
            {annotationRegions.map((region) => {
              const points = region.polygon.map((point) => `${point.x * imgDims.width},${point.y * imgDims.height}`).join(' ');
              return (
                <g key={region.id}>
                  <polygon
                    points={points}
                    fill={region.color === '#ffffff' ? 'rgba(255,255,255,0.08)' : `${region.color}18`}
                    stroke={region.color}
                    strokeWidth="2"
                    strokeDasharray="8 6"
                    opacity="0.75"
                  />
                </g>
              );
            })}
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
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(226, 232, 240, 0.95)',
            borderRadius: 12,
            padding: '12px 18px',
            zIndex: 60,
            boxShadow: '0 18px 38px rgba(15,23,42,0.18)',
            width: 320,
            fontFamily: 'inherit',
          }}>
            {/* Color selection row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>Pen Color:</span>
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
                      border: drawColor === color.hex ? '2px solid #10b981' : '1px solid #cbd5e1',
                      cursor: 'pointer',
                      padding: 0,
                      boxShadow: color.hex === '#ffffff' ? 'inset 0 0 0 1px #e2e8f0' : 'none',
                    }}
                    title={color.label}
                  />
                ))}
              </div>
              <button
                onClick={() => { setLines([]); }}
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  color: '#ef4444',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '5px 8px',
                }}
              >
                Clear
              </button>
            </div>
            
            {/* Drawing question box */}
            {lines.length > 0 && (
              <div style={{ width: '100%', borderTop: '1px solid #e2e8f0', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Ask Terra about the marked area:</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={drawQuestion}
                    onChange={e => setDrawQuestion(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleDrawAsk(); }}
                    placeholder="e.g. Is this soil stable?"
                    style={{
                      flex: 1,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '6px 10px',
                      color: '#0f172a',
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
                      borderRadius: 8,
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
          display: 'flex', gap: 8, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
          border: '1px solid #e2e8f0', borderRadius: 100, padding: '8px 16px', zIndex: 10,
          boxShadow: '0 18px 42px rgba(15,23,42,0.18)' }}>
          {toolbarBtns.map((btn, i) => btn === null ? (
            <div key={i} style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
          ) : (
            <button key={i} onClick={btn.onClick}
              style={{ display: 'flex', alignItems: 'center', gap: 6,
                background: btn.active ? btn.color + '20' : 'transparent',
                border: btn.active ? `1px solid ${btn.color}50` : '1px solid transparent',
                borderRadius: 100, padding: '6px 14px', color: btn.active ? btn.color : '#475569',
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
            style={{ background: '#fff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '-18px 0 48px rgba(15,23,42,0.16)' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={aiIcon} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Terra Copilot</div>
                    <div style={{ fontSize: 11, color: '#0f172a', lineHeight: 1.35 }}>Hello {displayName}, What do you want to dive in today</div>
                  </div>
                </div>
                <button onClick={() => setCopilotOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={15} /></button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {chatMsgs.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '85%', padding: '9px 12px', borderRadius: 12,
                    background: m.role === 'user' ? '#10b981' : '#f8fafc',
                    color: m.role === 'user' ? '#fff' : '#334155', fontSize: 13, lineHeight: 1.5,
                    border: m.role === 'user' ? '1px solid #10b981' : '1px solid #e2e8f0',
                    borderBottomRightRadius: m.role === 'user' ? 4 : 12,
                    borderBottomLeftRadius: m.role === 'ai' ? 4 : 12 }}>
                    {m.text}
                    {m.action && (
                      <button
                        onClick={() => navigate(m.action.path)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          width: '100%',
                          marginTop: 10,
                          border: 'none',
                          borderRadius: 8,
                          background: '#10b981',
                          color: '#fff',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: 12,
                          fontWeight: 800,
                          padding: '8px 10px',
                        }}
                      >
                        <LayoutDashboard size={13} /> {m.action.label}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 2px', color: '#64748b', fontSize: 13, fontWeight: 800 }}>
                  <img src={thinkingGif} alt="" style={{ width: 26, height: 26 }} />
                  {chatLoadingMode === 'planner' ? (
                    <span>{chatLoadingText || 'Generating Your Plan'}</span>
                  ) : (
                    <span className="lens-faded-word thinking-word" aria-label="thinking"><strong>th</strong><span>inki</span><strong>ng</strong></span>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '7px 8px' }}>
                <input
                  ref={copilotFileRef}
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []).map((file) => file.name);
                    if (files.length) setChatInput((value) => `${value}${value ? ' ' : ''}${files.map((name) => `Attached ${name}`).join(', ')}`);
                    event.target.value = '';
                  }}
                />
                <button onClick={() => copilotFileRef.current?.click()} aria-label="Attach file" style={{ width: 28, height: 28, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                  <img src={attachmentIcon} alt="" style={{ width: 19, height: 19 }} />
                </button>
                <button onClick={runDrawVoiceDemo} aria-label="Use voice" style={{ width: 28, height: 28, border: 'none', borderRadius: 8, background: copilotListening ? '#dcfce7' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                  <img src={micIcon} alt="" style={{ width: 19, height: 19 }} />
                </button>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                  {copilotListening && (
                    <img src={voiceListeningGif} alt="" style={{ width: 30, height: 30, objectFit: 'contain', marginRight: 6 }} />
                  )}
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCopilotSend()}
                    placeholder={copilotListening ? 'Listening...' : 'Message Terra...'}
                    style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none',
                      padding: '7px 4px', color: '#0f172a', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                </div>
                <button onClick={handleCopilotSend} disabled={!chatInput.trim() || chatLoading}
                  style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: chatInput.trim() ? '#10b981' : '#e2e8f0', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: chatInput.trim() ? 'pointer' : 'default' }}>
                  <img src={sendIcon} alt="" style={{ width: 18, height: 18, opacity: chatInput.trim() ? 1 : 0.45 }} />
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
  const [fullscreen, setFullscreen] = useState(false);
  const [projectName, setProjectName] = useState('');

  // Gallery and scanning flow state
  const [showGallery, setShowGallery] = useState(false);
  const [showSatellitePicker, setShowSatellitePicker] = useState(false);
  const [selectionError, setSelectionError] = useState(null);
  const [mapLoadingCard, setMapLoadingCard] = useState(false);
  const [loaderWordIndex, setLoaderWordIndex] = useState(0);

  const uploadZoneRef = useRef(null);

  const handleImageSelect = (img) => {
    setSelectionError(null);
    // Convert image to base64 if needed, or set image URL
    fetch(img.src)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          setImage({ url: img.src, base64, source: 'gallery', label: img.label, isKilgoris: img.isKilgoris });
        };
        reader.readAsDataURL(blob);
      })
      .catch(() => {
        setImage({ url: img.src, base64: '', source: 'gallery', label: img.label, isKilgoris: img.isKilgoris });
      });

    setShowGallery(false);
  };

  const openLocationPicker = () => {
    setMapLoadingCard(true);
    window.setTimeout(() => {
      setMapLoadingCard(false);
      setShowSatellitePicker(true);
    }, 900);
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

  const analyze = useCallback(async ({ keepVisualLoader = false } = {}) => {
    if (!image) return;
    if (!keepVisualLoader) setPhase('analyzing');
    setError('');
    if (image.source === 'gallery') {
      const demoResult = buildDemoLensResult(image, location, title);
      setResult(demoResult);
      setAnalysisId(demoResult.analysis_id);
      setGeminiReport({
        executive_summary: image.isKilgoris
          ? 'The Grove at Highlands of Limuru is a strong candidate for a landscape-led residential estate. Terra recommends a phased first cluster, early drainage engineering, and design rules that protect the highland character.'
          : 'Terra has prepared a visual demo read for this preloaded image. Select the Highlands of Limuru image for the full estate-specific planning narrative.',
        visual_site_summary: image.isKilgoris
          ? 'The image shows open highland land, rolling terrain, moisture-heavy skies, and clear opportunity for view-led planning with careful runoff control.'
          : 'This image can be explored visually, but it is not the primary Limuru site asset.',
      });
      setFullscreen(true);
      setPhase('result');
      return;
    }
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
      setFullscreen(true);
      setPhase('result'); subscribeToGemini(data.analysis_id);
    } catch (err) { setError(err.message); setPhase('upload'); }
  }, [image, location, projectId, session, subscribeToGemini, title]);

  useEffect(() => {
    if (phase !== 'scanning') {
      return;
    }
    const resetTimer = setTimeout(() => setLoaderWordIndex(0), 0);
    const wordInterval = setInterval(() => {
      setLoaderWordIndex((index) => (index + 1) % LOADING_WORDS.length);
    }, 1000);
    const analysisTimer = setTimeout(() => {
      analyze({ keepVisualLoader: true });
    }, 4700);

    return () => {
      clearTimeout(resetTimer);
      clearInterval(wordInterval);
      clearTimeout(analysisTimer);
    };
  }, [phase, analyze]);

  const reset = () => {
    setPhase('upload'); setImage(null); setResult(null); setGeminiReport(null);
    setError(''); setLocation(null); setTitle(''); setAnalysisId(null); setFullscreen(false);
  };

  if (fullscreen && image && result) {
    return <AnnotatedViewer image={image} result={result}
      projectName={projectName} projectId={projectId} analysisId={analysisId}
      onClose={() => setFullscreen(false)} />;
  }

  return (
    <div className="lens-screen">
      <AnimatePresence mode="wait">
        {phase === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className={`lens-upload-flow ${showGallery ? 'with-gallery' : ''}`}>

            {/* LEFT COLUMN — main upload card */}
            <div className="lens-upload-primary">

              {/* Header */}
              <div className="lens-upload-heading">
                <span>Terra Lens</span>
                <h2>Where your Idea begins</h2>
                <p>Terra Lens has the ability to see and understand what you see</p>
              </div>

              {/* Upload / image preview card */}
              <div ref={uploadZoneRef} className="lens-upload-card">
                {image ? (
                  /* Image selected preview */
                  <div className="lens-selected-preview">
                    <img src={image.url} alt="Selected site"
                      className="lens-selected-image" />
                    <div className="lens-selected-meta">
                      <div>
                        <span>Step 1 complete</span>
                        <strong>Picture selected</strong>
                      </div>
                      <Check size={18} />
                    </div>
                    <button onClick={() => { setImage(null); setShowGallery(true); }}
                      className="lens-soft-button">Change image</button>
                  </div>
                ) : (
                  /* Upload zone */
                  <div
                    className="lens-upload-zone"
                    onClick={() => setShowGallery(true)}
                  >
                    <div className="lens-upload-icon">
                      <ImageIcon size={24} />
                    </div>
                    <p>Choose a preloaded site image</p>
                    <small>Open the Terra image library and select the view for this demo.</small>
                    <div className="lens-upload-actions">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setShowGallery(true);
                        }}
                      >
                        <ImageIcon size={14} />
                        Open Image Library
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Location picker button — shown after image selected */}
              {image && (
                <motion.div
                  className="lens-location-step"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="lens-step-copy">
                    <span>Step 2</span>
                    <strong>Pick the land on satellite imagery</strong>
                    <p>Start near Tigoni, Limuru, Kenya, or search another Kenyan location.</p>
                  </div>
                  <button
                    onClick={openLocationPicker}
                    className={`lens-location-button ${location ? 'is-picked' : ''}`}
                  >
                    <div className="lens-location-button-icon">
                      {location ? <Check size={18} /> : <Navigation size={18} />}
                    </div>
                    <div>
                      {location ? (
                        <>
                          <span>Location pinned</span>
                          <strong>{location.label}</strong>
                        </>
                      ) : (
                        <>
                          <span>Required before analysis</span>
                          <strong>Pick Location</strong>
                        </>
                      )}
                    </div>
                  </button>
                  <AnimatePresence>
                    {mapLoadingCard && (
                      <motion.div
                        className="lens-map-loading-card"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                      >
                        <img src={thinkingGif} alt="" />
                        <span>Your Land by Design, Loading Satellite Imagery...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Analyse Site button — shown after image + location */}
              {image && location && (
                <button
                  onClick={() => setPhase('scanning')}
                  className="lens-analyze-button"
                >
                  Analyze Site →
                </button>
              )}

              {error && (
                <div style={{ fontSize: 13, color: '#ef4444', background: '#fef2f2',
                  border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px' }}>
                  {error}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN — gallery panel (slides in when open) */}
            <AnimatePresence>
              {showGallery && (
                <motion.div
                  key="gallery"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div className="lens-gallery-panel">
                    <div className="lens-gallery-header">
                      <div>
                        <span>Image library</span>
                        <strong>Choose the view Terra should read</strong>
                      </div>
                      <button onClick={() => setShowGallery(false)} className="lens-icon-button" aria-label="Close gallery">
                        <X size={13} />
                      </button>
                    </div>

                    {selectionError && (
                      <div style={{ fontSize: 12, color: '#ef4444', background: '#fef2f2',
                        border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>
                        {selectionError}
                      </div>
                    )}
                    {/* Full-size image list */}
                    <div className="lens-gallery-grid">
                      {GALLERY_IMAGES.map((img) => (
                        <motion.div
                          key={img.id}
                          onClick={() => handleImageSelect(img)}
                          whileHover={{ y: -3 }}
                          className="lens-gallery-item"
                        >
                          <img
                            src={img.src}
                            alt={img.label}
                            style={{ width: '100%', display: 'block' }}
                          />
                          <div>
                            <span>{img.label}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
            


        {phase === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lens-fullscreen-loader"
          >
            <img src={image?.url} alt="Selected land preview" />
            <div className="lens-loader-shade" />
            <div className="lens-loader-card">
              <img src={thinkingGif} alt="" />
              <span>Terra Lens is</span>
              <AnimatePresence mode="wait">
                <motion.div
                  key={LOADING_WORDS[loaderWordIndex]}
                  initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8, filter: 'blur(8px)' }}
                  transition={{ duration: 0.32 }}
                >
                  <FadedActionWord word={LOADING_WORDS[loaderWordIndex]} />
                </motion.div>
              </AnimatePresence>
              <p>the site story from image, location, and satellite context.</p>
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
    </div>
  );
}
