import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Crosshair, Layers } from 'lucide-react';
import useTerraStore from '../../store/useTerraStore';

const NAIROBI_CENTER = { lat: -1.286389, lng: 36.817223 };
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const MAP_TYPES = [
  { id: 'hybrid',  label: 'GEE',     },  // satellite + labels (default visual)
  { id: 'roadmap', label: 'Map',     },  // standard road map
  { id: 'terrain', label: 'Terrain', },  // topographic
];

export default function InteractiveMap({ onPinDropped }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const spotlightOverlayRef = useRef(null);
  const spotlightLayerRef = useRef(null);
  const spotlightCoordsRef = useRef({ lat: null, lng: null });
  const [mapReady, setMapReady] = useState(false);
  const [apiError, setApiError] = useState(!API_KEY);
  const [activeType, setActiveType] = useState('hybrid');
  const { mapState, setPinnedCoordinates } = useTerraStore();

  useEffect(() => {
    if (!API_KEY) return;
    if (window.google?.maps) { initMap(); return; }
    const scriptId = 'terra-gmaps-script';
    if (document.getElementById(scriptId)) { window.__terraMapCallback = initMap; return; }
    window.__terraMapCallback = initMap;
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&v=weekly&callback=__terraMapCallback&libraries=places,marker&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = () => setApiError(true);
    document.head.appendChild(script);
    return () => { delete window.__terraMapCallback; };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const { lat, lng } = mapState.pinnedCoordinates;
    if (lat == null || lng == null) return;
    spotlightCoordsRef.current = { lat, lng };
    dropPin({ lat, lng }, mapInstanceRef.current);
    updateSpotlight();
  }, [mapReady, mapState.pinnedCoordinates.lat, mapState.pinnedCoordinates.lng]);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || spotlightOverlayRef.current) return;

    const map = mapInstanceRef.current;
    const OverlayView = window.google?.maps?.OverlayView;
    if (!OverlayView) return;

    class SpotlightOverlay extends OverlayView {
      onAdd() {
        const layer = document.createElement('div');
        layer.style.cssText = [
          'position:absolute',
          'inset:0',
          'pointer-events:none',
          'z-index:8',
        ].join(';');

        const veil = document.createElement('div');
        veil.style.cssText = [
          'position:absolute',
          'inset:0',
          'background:rgba(2,6,23,0.42)',
        ].join(';');

        const glow = document.createElement('div');
        glow.style.cssText = [
          'position:absolute',
          'width:320px',
          'height:320px',
          'border-radius:9999px',
          'transform:translate(-50%,-50%)',
          'background:rgba(255,255,255,0.06)',
          'backdrop-filter:brightness(1.7) saturate(1.2)',
          '-webkit-backdrop-filter:brightness(1.7) saturate(1.2)',
          'border:1px solid rgba(255,255,255,0.36)',
          'box-shadow:0 0 0 28px rgba(34,197,94,0.14), 0 0 100px rgba(34,197,94,0.30)',
          'opacity:0',
          'transition:opacity 180ms ease, left 180ms ease, top 180ms ease',
        ].join(';');

        const ring = document.createElement('div');
        ring.style.cssText = [
          'position:absolute',
          'width:132px',
          'height:132px',
          'border-radius:9999px',
          'transform:translate(-50%,-50%)',
          'border:2px solid rgba(255,255,255,0.55)',
          'box-shadow:0 0 0 14px rgba(16,185,129,0.20), 0 0 60px rgba(16,185,129,0.55)',
          'opacity:0',
          'transition:opacity 180ms ease, left 180ms ease, top 180ms ease',
          'animation:terra-spot-pulse 2.6s ease-in-out infinite',
        ].join(';');

        const style = document.createElement('style');
        style.textContent = `
          @keyframes terra-spot-pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(0.96); }
            50% { transform: translate(-50%, -50%) scale(1.03); }
          }
        `;

        layer.appendChild(style);
        layer.appendChild(veil);
        layer.appendChild(glow);
        layer.appendChild(ring);

        this.layer = layer;
        this.glow = glow;
        this.ring = ring;
        spotlightLayerRef.current = layer;
        this.getPanes().overlayLayer.appendChild(layer);
      }

      draw() {
        const layer = this.layer;
        const projection = this.getProjection();
        const { lat, lng } = spotlightCoordsRef.current;

        if (!layer || !projection || lat == null || lng == null) {
          if (this.glow) this.glow.style.opacity = '0';
          if (this.ring) this.ring.style.opacity = '0';
          return;
        }

        const point = projection.fromLatLngToDivPixel(new window.google.maps.LatLng(lat, lng));
        if (!point) return;

        const x = `${point.x}px`;
        const y = `${point.y}px`;
        const glowSize = 320;
        const ringSize = 132;

        this.glow.style.left = x;
        this.glow.style.top = y;
        this.glow.style.width = `${glowSize}px`;
        this.glow.style.height = `${glowSize}px`;
        this.glow.style.opacity = '1';

        this.ring.style.left = x;
        this.ring.style.top = y;
        this.ring.style.width = `${ringSize}px`;
        this.ring.style.height = `${ringSize}px`;
        this.ring.style.opacity = '1';
      }

      onRemove() {
        if (this.layer?.parentNode) {
          this.layer.parentNode.removeChild(this.layer);
        }
        spotlightLayerRef.current = null;
      }
    }

    spotlightOverlayRef.current = new SpotlightOverlay();
    spotlightOverlayRef.current.setMap(map);

    const redraw = () => updateSpotlight();
    map.addListener('idle', redraw);
    const zoomListener = map.addListener('zoom_changed', redraw);
    const centerListener = map.addListener('center_changed', redraw);

    return () => {
      window.google?.maps?.event?.removeListener(zoomListener);
      window.google?.maps?.event?.removeListener(centerListener);
      if (spotlightOverlayRef.current) {
        spotlightOverlayRef.current.setMap(null);
        spotlightOverlayRef.current = null;
      }
    };
  }, [mapReady]);

  const updateSpotlight = () => {
    if (spotlightOverlayRef.current?.draw) {
      spotlightOverlayRef.current.draw();
    }
  };

  function initMap() {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: NAIROBI_CENTER,
      zoom: 13,
      // 'hybrid' = satellite tiles + road/place name labels (best of both)
      mapTypeId: 'hybrid',
      // mapId is required for AdvancedMarkerElement
      mapId: 'terra_ai_map',
      tilt: 0,
      zoomControl: true,
      mapTypeControl: false,   // we build our own toggle
      streetViewControl: false,
      fullscreenControl: true,
      gestureHandling: 'greedy',
    });
    mapInstanceRef.current = map;
    setMapReady(true);
    if (mapState.pinnedCoordinates.lat) dropPin(mapState.pinnedCoordinates, map);
    map.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      dropPin({ lat, lng }, map);
      setPinnedCoordinates(lat, lng);
      onPinDropped?.({ lat, lng });
    });
  }

  function dropPin({ lat, lng }, mapInstance) {
    const map = mapInstance ?? mapInstanceRef.current;
    if (!map) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.map = null;
      markerRef.current = null;
    }

    const pinEl = document.createElement('div');
    pinEl.style.cssText = [
      'width:28px',
      'height:28px',
      'border-radius:9999px',
      'background:radial-gradient(circle at 30% 30%, #ffffff 0%, #bbf7d0 18%, #22c55e 42%, #15803d 100%)',
      'border:3px solid rgba(255,255,255,0.95)',
      'box-shadow:0 0 0 10px rgba(34,197,94,0.18), 0 16px 30px rgba(15,23,42,0.45)',
      'transform:translateY(-4px)',
      'pointer-events:none',
    ].join(';');

    // Use AdvancedMarkerElement (non-deprecated)
    const { AdvancedMarkerElement } = window.google.maps.marker;
    markerRef.current = new AdvancedMarkerElement({
      position: { lat, lng },
      map,
      content: pinEl,
      title: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    });
    spotlightCoordsRef.current = { lat, lng };
    map.panTo({ lat, lng });
    updateSpotlight();
  }

  const switchMapType = (typeId) => {
    setActiveType(typeId);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(typeId);
    }
  };

  if (apiError || !API_KEY) {
    return (
      <div className="relative w-full h-full min-h-[480px] rounded-2xl overflow-hidden bg-slate-900 flex flex-col items-center justify-center gap-4">
        <div className="relative z-10 flex flex-col items-center gap-3 text-center px-8">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
            <MapPin className="w-7 h-7 text-rose-400" />
          </div>
          <p className="text-white font-semibold text-sm">Map Requires API Key</p>
          <p className="text-slate-400 text-xs max-w-xs">
            Add <code className="bg-white/10 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> to your{' '}
            <code className="bg-white/10 px-1 rounded">.env</code> file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[480px] rounded-2xl overflow-hidden shadow-xl isolate">
      {/* Map canvas */}
      <div ref={mapRef} className="absolute inset-0" />

      {/* Loading overlay */}
      <AnimatePresence>
        {!mapReady && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-3">
            <Crosshair className="w-8 h-8 text-rose-400 animate-pulse" />
            <p className="text-slate-400 text-sm font-medium">Loading satellite view…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Map Type Toggle (custom, top-left) ── */}
      {mapReady && (
        <div className="absolute top-16 left-4 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-1">
          <Layers className="w-3.5 h-3.5 text-terra-muted ml-1.5 flex-shrink-0" />
          {MAP_TYPES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => switchMapType(id)}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-150 ${
                activeType === id
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-terra-body hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Coordinates display */}
      {mapState.pinnedCoordinates.lat && (
        <div className="absolute bottom-4 left-4 z-10 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-mono px-3 py-1.5 rounded-lg flex items-center gap-2">
          <MapPin className="w-3 h-3 text-rose-400" />
          {mapState.pinnedCoordinates.lat.toFixed(6)}, {mapState.pinnedCoordinates.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}
