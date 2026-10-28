import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Clock, Info, ShieldCheck } from 'lucide-react';

// Custom SVG-based Leaflet DivIcons to prevent bundler asset path breakages
const createCustomMarker = (color, label, iconSvg) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="background: ${color}; color: white; padding: 6px; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
          ${iconSvg}
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${color};"></div>
        <div style="background: rgba(15, 23, 42, 0.85); color: white; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; white-space: nowrap; margin-top: 2px; backdrop-filter: blur(2px);">
          ${label}
        </div>
      </div>
    `,
    iconSize: [34, 48],
    iconAnchor: [0, 0],
  });
};

const pickupIcon = createCustomMarker(
  '#2563eb', // BIT Blue
  'Pickup / Start',
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>'
);

const destinationIcon = createCustomMarker(
  '#16a34a', // Emerald Green
  'Destination',
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>'
);

const driverGpsIcon = createCustomMarker(
  '#ea580c', // Orange/Amber
  'Live Driver GPS',
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>'
);

/**
 * Controller to adjust bounds whenever markers or route coordinates change
 */
function MapBoundsController({ bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      try {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 14,
        });
      } catch (e) {
        // Ignore bounds edge cases
      }
    }
  }, [bounds, map]);

  return null;
}

/**
 * RouteMap component built with React Leaflet and OpenStreetMap tiles.
 *
 * Props:
 * - startLocation: { lat, lng, name }
 * - destinationLocation: { lat, lng, name }
 * - routeCoordinates: [[lat, lng], ...]
 * - distanceKm: number
 * - durationText: string
 * - driverGpsCoords: { lat, lng } (optional)
 * - height: string (default: "400px")
 * - isPlanned: boolean (default: true)
 */
export default function RouteMap({
  startLocation,
  destinationLocation,
  routeCoordinates = [],
  distanceKm,
  durationText,
  driverGpsCoords = null,
  height = '420px',
  isPlanned = true,
}) {
  // Center defaults to BIT campus (Sathyamangalam)
  const defaultCenter = [11.4969, 77.2770];

  const bounds = useMemo(() => {
    const points = [];
    if (startLocation?.lat && startLocation?.lng) {
      points.push([startLocation.lat, startLocation.lng]);
    }
    if (destinationLocation?.lat && destinationLocation?.lng) {
      points.push([destinationLocation.lat, destinationLocation.lng]);
    }
    if (driverGpsCoords?.lat && driverGpsCoords?.lng) {
      points.push([driverGpsCoords.lat, driverGpsCoords.lng]);
    }
    if (routeCoordinates && routeCoordinates.length > 0) {
      // Include start, middle, and end of route to shape bounds nicely
      points.push(routeCoordinates[0]);
      points.push(routeCoordinates[Math.floor(routeCoordinates.length / 2)]);
      points.push(routeCoordinates[routeCoordinates.length - 1]);
    }
    return points;
  }, [startLocation, destinationLocation, routeCoordinates, driverGpsCoords]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-slate-100">
      {/* Top Floating Badge Bar with Distance, Duration, and Planned Route Indicator */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-lg shadow-md border border-gray-200 text-xs flex items-center gap-3 pointer-events-auto">
          {/* Label indicating Planned Route vs Live GPS */}
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            {driverGpsCoords ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
                <span className="text-orange-700">Live Driver GPS</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-blue-900 font-bold">Planned Route</span>
              </>
            )}
          </div>

          {(distanceKm !== undefined && distanceKm !== null) && (
            <div className="flex items-center gap-1 text-slate-700 border-l border-gray-200 pl-2.5">
              <span className="text-gray-400 font-normal">Distance:</span>
              <span className="font-bold text-gray-900">{distanceKm} km</span>
            </div>
          )}

          {durationText && (
            <div className="flex items-center gap-1 text-slate-700 border-l border-gray-200 pl-2.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-gray-400 font-normal">Est. Time:</span>
              <span className="font-bold text-gray-900">{durationText}</span>
            </div>
          )}
        </div>

        {/* Free API / OpenStreetMap Info Tag */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/90 text-white px-2.5 py-1.5 rounded-md text-[11px] shadow border border-slate-700/50 backdrop-blur-md pointer-events-auto">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>OpenStreetMap & OSRM</span>
        </div>
      </div>

      {/* Leaflet Map Container */}
      <MapContainer
        center={startLocation ? [startLocation.lat, startLocation.lng] : defaultCenter}
        zoom={11}
        scrollWheelZoom={false}
        style={{ height, width: '100%' }}
        className="z-0"
      >
        {/* OpenStreetMap Tiles with Required Attribution */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {/* Auto fit bounds when locations change */}
        {bounds.length >= 2 && <MapBoundsController bounds={bounds} />}

        {/* Pickup Marker */}
        {startLocation?.lat && startLocation?.lng && (
          <Marker position={[startLocation.lat, startLocation.lng]} icon={pickupIcon}>
            <Popup>
              <div className="text-xs p-1">
                <p className="font-bold text-blue-700">Pickup Location</p>
                <p className="text-gray-800 font-medium mt-0.5">{startLocation.name || 'BIT Campus, Sathyamangalam'}</p>
                <p className="text-[10px] text-gray-500 mt-1">Lat: {startLocation.lat.toFixed(4)}, Lng: {startLocation.lng.toFixed(4)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destinationLocation?.lat && destinationLocation?.lng && (
          <Marker position={[destinationLocation.lat, destinationLocation.lng]} icon={destinationIcon}>
            <Popup>
              <div className="text-xs p-1">
                <p className="font-bold text-green-700">Trip Destination</p>
                <p className="text-gray-800 font-medium mt-0.5">{destinationLocation.name || 'Destination Point'}</p>
                <p className="text-[10px] text-gray-500 mt-1">Lat: {destinationLocation.lat.toFixed(4)}, Lng: {destinationLocation.lng.toFixed(4)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Optional Live Driver GPS Marker */}
        {driverGpsCoords?.lat && driverGpsCoords?.lng && (
          <Marker position={[driverGpsCoords.lat, driverGpsCoords.lng]} icon={driverGpsIcon}>
            <Popup>
              <div className="text-xs p-1">
                <p className="font-bold text-orange-600">Current Driver Location</p>
                <p className="text-gray-600 mt-0.5">Active Vehicle Position</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Polyline (Planned Route) */}
        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: '#2563eb', // BIT Blue
              weight: 5,
              opacity: 0.85,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          >
            <Popup>
              <div className="text-xs">
                <span className="font-semibold text-blue-700">Planned Route Line (OSRM)</span>
                {distanceKm && <p className="text-gray-600">{distanceKm} km total distance</p>}
              </div>
            </Popup>
          </Polyline>
        )}
      </MapContainer>

      {/* Footer Info Notice */}
      <div className="px-3.5 py-2 bg-slate-50 border-t border-gray-200 flex flex-wrap items-center justify-between text-[11px] text-gray-500 gap-2">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
          <span>
            Route shown is the <strong>Planned Route</strong> calculated via open-source OSRM routing.
          </span>
        </div>
        <span className="text-gray-400">Map Data &copy; OpenStreetMap contributors</span>
      </div>
    </div>
  );
}
