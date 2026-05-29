import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Loader2, X, ChevronRight } from 'lucide-react';
import {
  writeLocationHistory,
  FALLBACK_LOCATION_CANDIDATES,
} from '../../utils/analyzeUtils';
import useTerraStore from '../../store/useTerraStore';

const KENYA_BOUNDS = {
  north: 5.6,
  south: -4.8,
  west: 33.6,
  east: 42.6,
};

/**
 * LocationSearch — search bar + candidate list for confirming a map location.
 * Uses Google Places autocomplete and Google reverse geocoding only.
 * Updates mapState.approvedLocationData.
 */
export default function LocationSearch({ onLocationConfirmed }) {
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { setApprovedLocationData, setPinnedCoordinates } = useTerraStore();
  const inputRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const geocoderRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const searchDebounceRef = useRef(null);

  const ensureGoogleServices = () => {
    if (!window.google?.maps?.places) return null;
    if (!autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
    }
    if (!geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    }
    return window.google.maps;
  };

  const buildGoogleBounds = () => {
    const maps = window.google?.maps;
    if (!maps) return null;
    return new maps.LatLngBounds(
      new maps.LatLng(KENYA_BOUNDS.south, KENYA_BOUNDS.west),
      new maps.LatLng(KENYA_BOUNDS.north, KENYA_BOUNDS.east),
    );
  };

  const extractPlaceName = (result) => {
    const components = result?.address_components || [];
    const pick = (...types) => components.find((part) => types.every((type) => part.types?.includes(type)))?.long_name;
    return (
      result?.name ||
      pick('premise') ||
      pick('subpremise') ||
      [pick('street_number'), pick('route')].filter(Boolean).join(' ') ||
      pick('neighborhood') ||
      pick('sublocality', 'sublocality_level_1') ||
      pick('locality') ||
      result?.formatted_address?.split(',')?.[0] ||
      'Selected location'
    );
  };

  const mapPredictionToCandidate = (prediction, index) => ({
    id: prediction.place_id || `google-${index}`,
    placeId: prediction.place_id,
    name: prediction.structured_formatting?.main_text || prediction.description?.split(',')?.[0] || 'Suggested place',
    region: prediction.structured_formatting?.secondary_text || 'Kenya',
    country: 'Kenya',
    latitude: null,
    longitude: null,
    overview: prediction.description || prediction.structured_formatting?.secondary_text || 'Google Maps suggestion',
    wikiTitle: prediction.structured_formatting?.main_text,
  });

  const fetchGooglePredictions = async (searchTerm) => {
    const maps = ensureGoogleServices();
    if (!maps) {
      setCandidates(FALLBACK_LOCATION_CANDIDATES);
      setOpen(true);
      setLoading(false);
      return;
    }

    const request = {
      input: searchTerm,
      componentRestrictions: { country: 'ke' },
      locationBias: buildGoogleBounds(),
      sessionToken: sessionTokenRef.current,
    };

    autocompleteServiceRef.current.getPlacePredictions(request, (results, status) => {
      if (status === maps.places.PlacesServiceStatus.OK && Array.isArray(results) && results.length > 0) {
        setCandidates(results.map(mapPredictionToCandidate));
      } else {
        setCandidates(FALLBACK_LOCATION_CANDIDATES);
      }
      setOpen(true);
      setLoading(false);
    });
  };

  useEffect(() => {
    const trimmed = query.trim();

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!trimmed) {
      setCandidates([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    if (trimmed.length < 2) {
      setCandidates([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    searchDebounceRef.current = setTimeout(() => {
      fetchGooglePredictions(trimmed);
    }, 220);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [query]);

  // When a pin is dropped: silently reverse-geocode and auto-confirm the top result.
  // No dropdown is shown to the user — the pin coordinates are the source of truth.
  const loadCandidatesForPin = async ({ lat, lng }) => {
    try {
      const maps = ensureGoogleServices();
      if (!maps || !geocoderRef.current) return;

      const { results } = await geocoderRef.current.geocode({ location: { lat, lng } });
      const bestResult = results?.[0];

      if (bestResult) {
        const location = bestResult.geometry?.location;
        const candidate = {
          id: bestResult.place_id || `pin-${lat}-${lng}`,
          placeId: bestResult.place_id,
          name: extractPlaceName(bestResult),
          region: bestResult.formatted_address || 'Kenya',
          country: bestResult.address_components?.find((part) => part.types?.includes('country'))?.long_name || 'Kenya',
          latitude: typeof location?.lat === 'function' ? location.lat() : lat,
          longitude: typeof location?.lng === 'function' ? location.lng() : lng,
          overview: bestResult.formatted_address || 'Google reverse geocode result',
          wikiTitle: extractPlaceName(bestResult),
        };

        // Auto-confirm the most precise Google result silently.
        const locationData = {
          address: candidate.region,
          placeName: candidate.name,
          country: candidate.country ?? 'Kenya',
          latitude: candidate.latitude,
          longitude: candidate.longitude,
        };
        setApprovedLocationData(locationData);
        setQuery(candidate.name);
        setCandidates([candidate]);
        setOpen(false);
        onLocationConfirmed?.(candidate);
      }
    } catch {
      // Silent failure — user can still use the search box manually
    }
  };

  // Text-based search uses Google Places autocomplete only.
  const handleSearch = async () => {
    if (!query.trim()) return;
    if (candidates.length > 0 && open) {
      await confirmCandidate(candidates[0]);
      return;
    }

    setLoading(true);
    setOpen(true);
    await fetchGooglePredictions(query.trim());
  };

  const confirmCandidate = async (candidate) => {
    let resolved = candidate;

    if (candidate?.placeId && window.google?.maps?.Geocoder) {
      try {
        const geocoder = geocoderRef.current || new window.google.maps.Geocoder();
        const { results } = await geocoder.geocode({ placeId: candidate.placeId });
        const place = results?.[0];
        if (place?.geometry?.location) {
          resolved = {
            ...candidate,
            name: extractPlaceName(place),
            region: place.formatted_address || candidate.region,
            country: place.address_components?.find((part) => part.types?.includes('country'))?.long_name || candidate.country,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            overview: place.formatted_address || candidate.overview,
            wikiTitle: extractPlaceName(place),
          };
        }
      } catch {
        // Keep the prediction result if the details lookup fails.
      }
    }

    const locationData = {
      address: resolved.region,
      placeName: resolved.name,
      country: resolved.country,
      latitude: resolved.latitude,
      longitude: resolved.longitude,
    };
    setApprovedLocationData(locationData);
    setPinnedCoordinates(resolved.latitude, resolved.longitude);
    writeLocationHistory(resolved);
    setOpen(false);
    setQuery(resolved.name);
    sessionTokenRef.current = null;
    onLocationConfirmed?.(resolved);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Expose loadCandidatesForPin to parent via ref-like prop pattern
  LocationSearch.loadForPin = loadCandidatesForPin;

  return (
    <div className="relative w-[min(92vw,42rem)] max-w-none">
      {/* Search Input */}
      <div className="flex items-center gap-3 bg-white border border-terra-border rounded-full shadow-xl px-4 py-3.5">
        <Search className="w-4 h-4 text-terra-muted flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search location in Kenya…"
          className="flex-1 text-sm sm:text-base text-terra-heading placeholder:text-terra-muted bg-transparent focus:outline-none min-w-0"
        />
        {loading && <Loader2 className="w-4 h-4 text-terra-muted animate-spin flex-shrink-0" />}
        {query && !loading && (
          <button onClick={() => { setQuery(''); setCandidates([]); setOpen(false); }}>
            <X className="w-4 h-4 text-terra-muted hover:text-terra-heading" />
          </button>
        )}
      </div>

      {/* Candidate Dropdown */}
      <AnimatePresence>
        {open && candidates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-3xl border border-terra-border shadow-2xl overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-terra-border">
              <p className="text-xs text-terra-muted font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3 h-3" /> Google Maps Suggestions
              </p>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
              {candidates.map((c) => (
                <button
                  key={c.id}
                  onClick={() => confirmCandidate(c)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-terra-heading truncate">{c.name}</p>
                    <p className="text-xs text-terra-muted truncate">{c.region}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-terra-muted flex-shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
