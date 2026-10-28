import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import RouteMap from '../../components/RouteMap';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDate } from '../../utils/constants';
import { BIT_CAMPUS_COORDS, geocodeLocation, getPlannedRoute } from '../../services/mapService';
import {
  Bus, MapPin, Calendar, Clock, User, Phone, ArrowLeft, Navigation,
  ShieldCheck, AlertCircle, ExternalLink
} from 'lucide-react';

export default function TripRouteView() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Map state
  const [startCoords, setStartCoords] = useState(BIT_CAMPUS_COORDS);
  const [destCoords, setDestCoords] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [routingLoading, setRoutingLoading] = useState(false);

  useEffect(() => {
    const fetchTripData = async () => {
      try {
        setLoading(true);
        // Call public route-info endpoint (works for both authenticated and direct email link users)
        const res = await api.get(`/bookings/${id}/route-info`);
        const data = res.data;
        setTrip(data);

        // Geocode and calculate route
        setRoutingLoading(true);

        // Starting point (check if custom, otherwise use BIT Campus)
        let start = BIT_CAMPUS_COORDS;
        if (data.startingLocation && !data.startingLocation.toLowerCase().includes('bit') && !data.startingLocation.toLowerCase().includes('campus')) {
          const geocodedStart = await geocodeLocation(data.startingLocation);
          if (geocodedStart) {
            start = { ...geocodedStart, name: data.startingLocation };
          }
        }
        setStartCoords(start);

        // Destination point
        if (data.destination) {
          const geocodedDest = await geocodeLocation(data.destination);
          if (geocodedDest) {
            const dest = { ...geocodedDest, name: data.destination };
            setDestCoords(dest);

            // Calculate OSRM route
            const route = await getPlannedRoute(start, dest);
            setRouteData(route);
          }
        }
      } catch (err) {
        console.error('Failed to load trip route:', err);
        setError(err.response?.data?.message || 'Trip route not found or unavailable');
      } finally {
        setLoading(false);
        setRoutingLoading(false);
      }
    };

    if (id) {
      fetchTripData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-sm text-gray-500 mt-3 font-medium">Loading Planned Route & Trip Details...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-md max-w-md w-full p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">Route Not Found</h2>
          <p className="text-sm text-gray-500 mb-6">{error || 'Unable to load trip information'}</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Go to Portal Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      {/* Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">BIT Fleet Vehicle Portal</h1>
              <p className="text-[11px] text-slate-400">Planned Route & Trip Details</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors"
            >
              Portal Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Title & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Booking #{trip.id}</span>
              <StatusBadge status={trip.status} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mt-1">
              Trip to {trip.destination}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{trip.purpose || 'Official Visit'}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              OpenStreetMap Verified
            </span>
          </div>
        </div>

        {/* Map View */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900">Planned Route Map</h3>
            </div>
            <span className="text-xs text-gray-500">
              {routingLoading ? 'Calculating route with OSRM...' : routeData?.distanceKm ? `${routeData.distanceKm} km • ${routeData.durationText}` : 'Free OpenStreetMap Tiles'}
            </span>
          </div>

          {destCoords ? (
            <RouteMap
              startLocation={startCoords}
              destinationLocation={destCoords}
              routeCoordinates={routeData?.coordinates || []}
              distanceKm={routeData?.distanceKm}
              durationText={routeData?.durationText}
              height="450px"
              isPlanned={true}
            />
          ) : (
            <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500 p-6 text-center">
              <MapPin className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium">Destination: {trip.destination}</p>
              <p className="text-xs text-gray-400 mt-1">Locating coordinates on OpenStreetMap...</p>
            </div>
          )}
        </div>

        {/* Trip Details Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Schedule & Locations */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Schedule & Location Info
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs text-gray-500 block">Pickup Point / Starting Location</span>
                  <span className="font-semibold text-gray-900">{trip.startingLocation}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs text-gray-500 block">Destination</span>
                  <span className="font-semibold text-gray-900">{trip.destination}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-xs text-gray-500 block">Departure Date & Time</span>
                  <span className="font-semibold text-gray-900">
                    {formatDate(trip.travelDate)} at {trip.departureTime}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Return Date & Time</span>
                  <span className="font-semibold text-gray-900">
                    {formatDate(trip.returnDate)} at {trip.returnTime}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle, Driver & Faculty Details */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Bus className="w-4 h-4 text-blue-600" />
              Assigned Vehicle & Driver
            </h3>

            {trip.allocation ? (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-gray-500 block">Assigned Vehicle</span>
                  <span className="font-bold text-gray-900 text-base">
                    {trip.allocation.vehicle?.registrationNumber}
                  </span>
                  <span className="text-xs text-gray-500 block mt-0.5">
                    {trip.allocation.vehicle?.vehicleType} • {trip.allocation.vehicle?.model}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500 block">Assigned Driver</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-semibold text-gray-900">{trip.allocation.driver?.name}</span>
                    <a
                      href={`tel:${trip.allocation.driver?.phone}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" /> {trip.allocation.driver?.phone}
                    </a>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500 block">Faculty In-Charge</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-semibold text-gray-900">
                      {trip.facultyName} ({trip.department})
                    </span>
                    <a
                      href={`tel:${trip.contactNumber}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg"
                    >
                      <Phone className="w-3.5 h-3.5 text-gray-500" /> {trip.contactNumber}
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-gray-500 text-sm">
                <p>Vehicle and driver allocation is currently pending.</p>
                <p className="text-xs text-gray-400 mt-1">The Transport Office will allocate resources shortly.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-xs text-gray-400 py-4">
          Bannari Amman Institute of Technology • Centralized Fleet Vehicle Portal • Powered by OpenStreetMap & OSRM
        </div>
      </main>
    </div>
  );
}
