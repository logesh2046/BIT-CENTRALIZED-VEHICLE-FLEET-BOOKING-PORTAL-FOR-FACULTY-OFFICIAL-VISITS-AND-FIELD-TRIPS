const express = require('express');
const router = express.Router();

// In-memory cache for geocoded queries
const geocodeCache = new Map();

// Known common hubs around BIT Sathyamangalam
const KNOWN_LOCATIONS = [
  { match: /bit|bannari|sathyamangalam|campus/i, lat: 11.4969, lon: 77.2770, displayName: 'Bannari Amman Institute of Technology, Sathyamangalam' },
  { match: /coimbatore airport|cbe airport/i, lat: 11.0300, lon: 77.0434, displayName: 'Coimbatore International Airport (CJB)' },
  { match: /coimbatore|kovai|gandhipuram/i, lat: 11.0168, lon: 76.9558, displayName: 'Coimbatore, Tamil Nadu' },
  { match: /erode railway|erode junction/i, lat: 11.3410, lon: 77.7172, displayName: 'Erode Railway Station (ED)' },
  { match: /erode/i, lat: 11.3410, lon: 77.7172, displayName: 'Erode, Tamil Nadu' },
  { match: /tirupur|tiruppur/i, lat: 11.1085, lon: 77.3411, displayName: 'Tirupur, Tamil Nadu' },
  { match: /salem/i, lat: 11.6643, lon: 78.1460, displayName: 'Salem, Tamil Nadu' },
  { match: /chennai/i, lat: 13.0827, lon: 80.2707, displayName: 'Chennai, Tamil Nadu' },
  { match: /bangalore|bengaluru/i, lat: 12.9716, lon: 77.5946, displayName: 'Bengaluru, Karnataka' },
  { match: /mysore|mysuru/i, lat: 12.2958, lon: 76.6394, displayName: 'Mysuru, Karnataka' },
  { match: /ooty|udagamandalam/i, lat: 11.4102, lon: 76.6950, displayName: 'Ooty, The Nilgiris' },
  { match: /bhavani/i, lat: 11.4489, lon: 77.6837, displayName: 'Bhavani, Erode' },
  { match: /gobichettipalayam|gobi/i, lat: 11.4552, lon: 77.4339, displayName: 'Gobichettipalayam, Erode' },
  { match: /anthiyur/i, lat: 11.5802, lon: 77.5945, displayName: 'Anthiyur, Erode' },
];

let lastNominatimRequestTime = 0;

/**
 * User-triggered geocoding using Nominatim
 * Adheres strictly to Nominatim usage policy:
 * - Proper User-Agent header
 * - Rate limiting (minimum 1 sec between calls)
 * - Result caching to minimize requests
 */
router.get('/geocode', async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query) {
    return res.status(400).json({ message: 'Query parameter q is required' });
  }

  // Check in-memory cache
  const cacheKey = query.toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return res.json(geocodeCache.get(cacheKey));
  }

  // Check known locations
  for (const loc of KNOWN_LOCATIONS) {
    if (loc.match.test(query)) {
      const result = { lat: loc.lat, lon: loc.lon, displayName: loc.displayName, source: 'campus_index' };
      geocodeCache.set(cacheKey, result);
      return res.json(result);
    }
  }

  // Rate limit check: at least 1000ms between public Nominatim calls
  const now = Date.now();
  const timeSinceLast = now - lastNominatimRequestTime;
  if (timeSinceLast < 1000) {
    await new Promise((r) => setTimeout(r, 1000 - timeSinceLast));
  }
  lastNominatimRequestTime = Date.now();

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=in`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BIT-Fleet-Portal/1.0 (vehicle-fleet@bit.edu)',
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim responded with status ${response.status}`);
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      // Fallback: If not found, default to Sathyamangalam/Erode region
      return res.status(404).json({ message: 'Location not found in OpenStreetMap' });
    }

    const item = data[0];
    const result = {
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      displayName: item.display_name,
      source: 'nominatim',
    };

    geocodeCache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Nominatim geocode proxy error:', error.message);
    res.status(500).json({ message: 'Failed to geocode location', error: error.message });
  }
});

/**
 * Route calculation using OSRM public endpoint
 */
router.get('/osrm-directions', async (req, res) => {
  const { startLng, startLat, destLng, destLat } = req.query;

  if (!startLng || !startLat || !destLng || !destLat) {
    return res.status(400).json({ message: 'startLng, startLat, destLng, destLat are required' });
  }

  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    const response = await fetch(osrmUrl, {
      headers: {
        'User-Agent': 'BIT-Fleet-Portal/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`OSRM responded with status ${response.status}`);
    }

    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return res.status(404).json({ message: 'No route found between these locations' });
    }

    const route = data.routes[0];
    const distanceKm = (route.distance / 1000).toFixed(1);
    const durationMins = Math.round(route.duration / 60);

    // Format duration to hours and minutes
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    const durationText = hours > 0 ? `${hours} hr${hours > 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}` : `${mins} mins`;

    // Coordinates array: OSRM returns [lng, lat], Leaflet polyline expects [lat, lng]
    const leafletCoordinates = route.geometry.coordinates.map((coord) => [coord[1], coord[0]]);

    res.json({
      distanceKm: parseFloat(distanceKm),
      durationText,
      durationMinutes: durationMins,
      coordinates: leafletCoordinates,
      isPlanned: true, // Clearly labeled as planned route
      attribution: '© OpenStreetMap contributors',
    });
  } catch (error) {
    console.error('OSRM directions proxy error:', error.message);
    res.status(500).json({ message: 'Failed to calculate route via OSRM', error: error.message });
  }
});

module.exports = router;
