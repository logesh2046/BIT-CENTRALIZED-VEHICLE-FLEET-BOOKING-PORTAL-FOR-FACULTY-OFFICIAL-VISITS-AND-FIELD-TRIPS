import api from './api';

// Default campus location: Bannari Amman Institute of Technology, Sathyamangalam
export const BIT_CAMPUS_COORDS = {
  lat: 11.4969,
  lng: 77.2770,
  name: 'BIT Campus, Sathyamangalam',
};

/**
 * User-triggered geocoding using Nominatim (via backend proxy or direct with rate-limit respect)
 * Complies with Nominatim usage policy: NO keystroke autocomplete. Only called when user clicks Search/Locate.
 */
export async function geocodeLocation(query) {
  if (!query || !query.trim()) return null;

  try {
    // Try backend proxy first (has caching, server-side User-Agent, and campus index)
    const res = await api.get('/routes/geocode', {
      params: { q: query.trim() },
    });
    return {
      lat: res.data.lat,
      lng: res.data.lon,
      displayName: res.data.displayName,
    };
  } catch (err) {
    console.warn('Backend geocode proxy failed, trying direct OSM Nominatim fallback:', err.message);

    // Direct fallback if backend proxy is unavailable
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&limit=1&countrycodes=in`;
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name,
        };
      }
    } catch (directErr) {
      console.error('Direct Nominatim fetch failed:', directErr);
    }
  }

  return null;
}

/**
 * Prototype route calculation using OSRM public routing endpoint
 * Returns: { coordinates: [[lat, lng], ...], distanceKm, durationText, durationMinutes }
 */
export async function getPlannedRoute(startCoords, destCoords) {
  if (!startCoords || !destCoords) return null;

  const startLng = startCoords.lng || startCoords.lon;
  const startLat = startCoords.lat;
  const destLng = destCoords.lng || destCoords.lon;
  const destLat = destCoords.lat;

  try {
    // Try backend proxy first
    const res = await api.get('/routes/osrm-directions', {
      params: { startLng, startLat, destLng, destLat },
    });

    return {
      coordinates: res.data.coordinates,
      distanceKm: res.data.distanceKm,
      durationText: res.data.durationText,
      durationMinutes: res.data.durationMinutes,
      isPlanned: true,
      attribution: '© OpenStreetMap contributors',
    };
  } catch (err) {
    console.warn('Backend OSRM proxy failed, trying public OSRM endpoint fallback:', err.message);

    // Direct fallback to public OSRM endpoint
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;
      const response = await fetch(osrmUrl);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = parseFloat((route.distance / 1000).toFixed(1));
        const durationMins = Math.round(route.duration / 60);
        const hours = Math.floor(durationMins / 60);
        const mins = durationMins % 60;
        const durationText = hours > 0 ? `${hours} hr${hours > 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}` : `${mins} mins`;
        const leafletCoords = route.geometry.coordinates.map(c => [c[1], c[0]]);

        return {
          coordinates: leafletCoords,
          distanceKm,
          durationText,
          durationMinutes: durationMins,
          isPlanned: true,
          attribution: '© OpenStreetMap contributors',
        };
      }
    } catch (directErr) {
      console.error('Direct OSRM fetch failed:', directErr);
    }
  }

  // Fallback: straight line between the two points if routing server is unreachable
  return {
    coordinates: [
      [startLat, startLng],
      [destLat, destLng],
    ],
    distanceKm: calculateCrowDistance(startLat, startLng, destLat, destLng),
    durationText: 'Estimated ~1-2 hrs',
    isPlanned: true,
    isDirectEstimate: true,
    attribution: '© OpenStreetMap contributors',
  };
}

// Great-circle distance helper for fallback
function calculateCrowDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}
