import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock3, MapPinned, ThermometerSun, Route, ArrowRight, Globe2, Loader2 } from 'lucide-react';
import { fetchWikiSummary } from '../../utils/analyzeUtils';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const KENYA_CITY_FALLBACKS = [
  { name: 'Nairobi', latitude: -1.286389, longitude: 36.817223 },
  { name: 'Mombasa', latitude: -4.043477, longitude: 39.668206 },
  { name: 'Kisumu', latitude: -0.091702, longitude: 34.767956 },
  { name: 'Nakuru', latitude: -0.303099, longitude: 36.080025 },
  { name: 'Eldoret', latitude: 0.514277, longitude: 35.26978 },
  { name: 'Kajiado', latitude: -1.852378, longitude: 36.77684 },
];

function toRad(value) {
  return (value * Math.PI) / 180;
}

function haversineKm(a, b) {
  const radiusKm = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const c = 2 * Math.atan2(
    Math.sqrt(sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng),
    Math.sqrt(1 - sinLat * sinLat - Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng),
  );
  return radiusKm * c;
}

function formatDistance(km) {
  if (!Number.isFinite(km)) return 'Nearby';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function formatTimeFromTimeZone(timeZoneId) {
  try {
    return new Intl.DateTimeFormat('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
      timeZone: timeZoneId,
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
    }).format(new Date());
  }
}

function buildGoogleStreetViewUrl(lat, lng) {
  if (!GOOGLE_MAPS_KEY) return '';
  return `https://maps.googleapis.com/maps/api/streetview?size=1200x700&location=${encodeURIComponent(`${lat},${lng}`)}&fov=80&pitch=0&key=${GOOGLE_MAPS_KEY}`;
}

function getNearestTown(place) {
  const name = place?.locality || place?.town || place?.neighborhood || place?.region || place?.placeName || 'Nearby town';
  const point = { latitude: place.latitude, longitude: place.longitude };
  const candidates = KENYA_CITY_FALLBACKS.map((item) => ({
    ...item,
    distanceKm: haversineKm(point, item),
  }));
  const nearest = candidates.sort((a, b) => a.distanceKm - b.distanceKm)[0];
  return {
    name,
    distanceKm: nearest?.name === name ? 0 : nearest?.distanceKm,
    nearestName: nearest?.name || name,
  };
}

async function fetchGoogleTimeZone(lat, lng) {
  if (!GOOGLE_MAPS_KEY) return null;
  const timestamp = Math.floor(Date.now() / 1000);
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${GOOGLE_MAPS_KEY}`,
  );
  if (!response.ok) return null;
  const payload = await response.json();
  return payload?.timeZoneId || null;
}

async function fetchWeather(lat, lng) {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&temperature_unit=celsius`,
  );
  if (!response.ok) return null;
  const payload = await response.json();
  return payload?.current_weather?.temperature ?? null;
}

export default function PlaceInsightCard({ place, onRunSpatialEngine }) {
  const [loading, setLoading] = useState(true);
  const [wiki, setWiki] = useState(null);
  const [timeZoneId, setTimeZoneId] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [nearestTown, setNearestTown] = useState(null);

  const heroTitle = useMemo(() => place?.placeName || place?.name || 'Selected place', [place]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!place?.latitude || !place?.longitude) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const placeSummaryPromise = fetchWikiSummary(place.wikiTitle || place.placeName || place.name);
      const timeZonePromise = fetchGoogleTimeZone(place.latitude, place.longitude);
      const weatherPromise = fetchWeather(place.latitude, place.longitude);

      const locationPoint = { latitude: place.latitude, longitude: place.longitude };
      const townInfo = getNearestTown(place);

      const [summary, zoneId, temp] = await Promise.all([
        placeSummaryPromise,
        timeZonePromise,
        weatherPromise,
      ]);

      if (cancelled) return;

      setWiki(summary);
      setTimeZoneId(zoneId);
      setTemperature(Number.isFinite(temp) ? temp : null);
      setNearestTown(townInfo);
      setPhotoUrl(summary?.imageUrl || buildGoogleStreetViewUrl(locationPoint.latitude, locationPoint.longitude) || DEFAULT_IMAGE);
      setLoading(false);
    };

    run().catch(() => {
      if (!cancelled) {
        setPhotoUrl(DEFAULT_IMAGE);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [place]);

  if (!place) return null;

  const timeLabel = timeZoneId ? formatTimeFromTimeZone(timeZoneId) : formatTimeFromTimeZone();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className="absolute left-1/2 bottom-4 z-30 w-[min(92vw,28rem)] -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0"
    >
      <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_30px_80px_rgba(15,23,42,0.28)] backdrop-blur-xl">
        <div className="relative h-52 bg-slate-200">
          <img
            src={photoUrl || DEFAULT_IMAGE}
            alt={heroTitle}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] backdrop-blur-md">
              <MapPinned className="h-3.5 w-3.5" />
              Location preview
            </div>
            <h3 className="mt-3 text-2xl font-black leading-tight">{heroTitle}</h3>
            <p className="mt-1 text-sm text-white/85">{place.region || place.address || 'Kenya'}</p>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[1.5rem] bg-slate-950 px-4 py-3 text-white">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.26em] text-white/65">
                <Route className="h-3.5 w-3.5" />
                Nearest town
              </div>
              <p className="mt-2 text-sm font-semibold leading-tight">{nearestTown?.nearestName || nearestTown?.name || 'Nearby town'}</p>
              <p className="mt-1 text-xs text-white/70">{formatDistance(nearestTown?.distanceKm)}</p>
            </div>
            <div className="rounded-[1.5rem] bg-emerald-50 px-4 py-3 text-emerald-950">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.26em] text-emerald-700/75">
                <Clock3 className="h-3.5 w-3.5" />
                Local time
              </div>
              <p className="mt-2 text-sm font-semibold leading-tight">{timeLabel}</p>
              <p className="mt-1 text-xs text-emerald-700/75">{loading ? 'Syncing...' : 'Current at location'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[1.5rem] bg-amber-50 px-4 py-3 text-amber-950">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.26em] text-amber-700/75">
                <ThermometerSun className="h-3.5 w-3.5" />
                Temperature
              </div>
              <p className="mt-2 text-sm font-semibold leading-tight">{temperature != null ? `${temperature.toFixed(1)}°C` : 'Not available'}</p>
              <p className="mt-1 text-xs text-amber-700/75">Open-Meteo current weather</p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-100 px-4 py-3 text-slate-900">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.26em] text-slate-500">
                <Globe2 className="h-3.5 w-3.5" />
                Source
              </div>
              <p className="mt-2 text-sm font-semibold leading-tight">Wikipedia + Google Maps</p>
              <p className="mt-1 text-xs text-slate-500">High-confidence preview data</p>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-slate-400">Wikipedia snapshot</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {wiki?.overview || place.overview || 'No Wikipedia summary was found for this place yet.'}
            </p>
          </div>

          <button
            onClick={() => onRunSpatialEngine?.()}
            className="w-full rounded-full bg-slate-950 px-5 py-4 text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98] hover:bg-slate-800"
          >
            <span className="inline-flex items-center justify-center gap-2">
              Run Spatial Engine
              <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}