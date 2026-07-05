import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Loader2, X, ChevronRight } from 'lucide-react';
import {
  writeLocationHistory,
  FALLBACK_LOCATION_CANDIDATES,
} from '../../utils/analyzeUtils';
import useTerraStore from '../../store/useTerraStore';

/**
 * LocationSearch — search bar + candidate list for confirming a map location.
 * Uses Google Places Autocomplete and Geocoding APIs.
 * Updates mapState.approvedLocationData.
 */
export default function LocationSearch({ onLocationConfirmed }) {
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { setApprovedLocationData, setPinnedCoordinates } = useTerraStore();
  const inputRef = useRef(null);
  const geocoderRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const suppressSearchRef = useRef(false);
  const searchRequestIdRef = useRef(0);
  const selectionLockedRef = useRef(false);

  const ensureGoogleServices = async () => {
    if (!window.google?.maps?.places) return null;
    if (window.google.maps.importLibrary) {
      await window.google.maps.importLibrary('places');
    }
    if (!geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
    return window.google.maps;
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

  const extractPlaceParts = (result) => {
    const components = result?.address_components || [];
    const pick = (...types) => components.find((part) => types.every((type) => part.types?.includes(type)))?.long_name || null;
    return {
      locality: pick('locality') || pick('administrative_area_level_2') || pick('sublocality', 'sublocality_level_1'),
      region: pick('administrative_area_level_1') || pick('administrative_area_level_2') || result?.formatted_address || 'Kenya',
      country: pick('country') || 'Kenya',
    };
  };

  const fetchGooglePredictions = async (searchTerm) => {
    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;
    const maps = await ensureGoogleServices();

    if (!maps || !window.google?.maps?.places?.AutocompleteService) {
      setCandidates(FALLBACK_LOCATION_CANDIDATES);
      setOpen(true);
      setLoading(false);
      return;
    }

    const service = new window.google.maps.places.AutocompleteService();
    const request = {
      input: searchTerm,
      componentRestrictions: { country: 'ke' },
      types: ['geocode', 'establishment'],
    };

    service.getPlacePredictions(request, (predictions, status) => {
      if (requestId !== searchRequestIdRef.current) return;
      const OK = window.google.maps.places.PlacesServiceStatus.OK;
      if (status === OK && Array.isArray(predictions) && predictions.length > 0) {
        const candidates = predictions.map((pred, index) => ({
          id: pred.place_id || `google-${index}`,
          placeId: pred.place_id,
          name: pred.structured_formatting?.main_text || pred.description?.split(',')?.[0] || 'Place',
          region: pred.structured_formatting?.secondary_text || pred.description || 'Kenya',
          country: 'Kenya',
          latitude: null,
          longitude: null,
          overview: pred.description || '',
          wikiTitle: pred.structured_formatting?.main_text || pred.description?.split(',')?.[0] || '',
        }));
        setCandidates(candidates);
      } else {
        setCandidates(FALLBACK_LOCATION_CANDIDATES);
      }
      setOpen(true);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (suppressSearchRef.current) {
      suppressSearchRef.current = false;
      return;
    }

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
      const maps = await ensureGoogleServices();
      if (!maps || !geocoderRef.current) return;

      const { results } = await geocoderRef.current.geocode({ location: { lat, lng } });
      const bestResult = results?.[0];

      if (bestResult) {
        const location = bestResult.geometry?.location;
        const parts = extractPlaceParts(bestResult);
        const candidate = {
          id: bestResult.place_id || `pin-${lat}-${lng}`,
          placeId: bestResult.place_id,
          name: extractPlaceName(bestResult),
          region: bestResult.formatted_address || parts.region || 'Kenya',
          locality: parts.locality,
          country: parts.country,
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
        searchRequestIdRef.current += 1;
        suppressSearchRef.current = true;
        setCandidates([]);
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

    // Geocode the placeId to get exact coordinates and full address details
    if (candidate?.placeId) {
      try {
        const maps = await ensureGoogleServices();
        if (maps && geocoderRef.current) {
          const { results } = await geocoderRef.current.geocode({ placeId: candidate.placeId });
          const place = results?.[0];
          if (place?.geometry?.location) {
            const parts = extractPlaceParts(place);
            resolved = {
              ...candidate,
              name: extractPlaceName(place),
              region: place.formatted_address || parts.region || candidate.region,
              locality: parts.locality || candidate.locality || null,
              country: parts.country || candidate.country,
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng(),
              overview: place.formatted_address || candidate.overview,
              wikiTitle: extractPlaceName(place),
            };
          }
        }
      } catch {
        // Keep prediction result if geocoding fails
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
    const historyEntry = {
      ...resolved,
      placePrediction: undefined,
    };
    writeLocationHistory(historyEntry);
    searchRequestIdRef.current += 1;
    suppressSearchRef.current = true;
    selectionLockedRef.current = true;
    setCandidates([]);
    setOpen(false);
    setQuery(resolved.name);
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
          onChange={(e) => {
            selectionLockedRef.current = false;
            setQuery(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search location in Kenya…"
          className="flex-1 text-sm sm:text-base text-terra-heading placeholder:text-terra-muted bg-transparent focus:outline-none min-w-0"
        />
        {loading && <Loader2 className="w-4 h-4 text-terra-muted animate-spin flex-shrink-0" />}
        {query && !loading && (
          <button onClick={() => { selectionLockedRef.current = false; setQuery(''); setCandidates([]); setOpen(false); }}>
            <X className="w-4 h-4 text-terra-muted hover:text-terra-heading" />
          </button>
        )}
      </div>

      {/* Candidate Dropdown */}
      <AnimatePresence>
        {open && candidates.length > 0 && !selectionLockedRef.current && (
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
