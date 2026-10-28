import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { VEHICLE_TYPES } from '../../utils/constants';
import { CalendarPlus, Send, AlertCircle, CheckCircle, MapPin, Navigation, Search, Check } from 'lucide-react';
import RouteMap from '../../components/RouteMap';
import { BIT_CAMPUS_COORDS, geocodeLocation, getPlannedRoute } from '../../services/mapService';

export default function BookVehicle() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Map and Route states (Free OSM + OSRM)
  const [startCoords, setStartCoords] = useState(BIT_CAMPUS_COORDS);
  const [destCoords, setDestCoords] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [locatingRoute, setLocatingRoute] = useState(false);
  const [mapError, setMapError] = useState('');

  const [form, setForm] = useState({
    facultyName: user?.name || '',
    department: user?.department?.name || '',
    contactNumber: user?.phone || '',
    purpose: '',
    destination: '',
    startingLocation: 'BIT Campus, Sathyamangalam',
    travelDate: '',
    departureTime: '',
    returnDate: '',
    returnTime: '',
    numberOfPassengers: '',
    vehicleType: '',
    specialRequirements: '',
    remarks: '',
  });

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        facultyName: prev.facultyName || user.name || '',
        department: prev.department || user.department?.name || '',
        contactNumber: prev.contactNumber || user.phone || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setAvailability(null);
  };

  const checkAvailability = async () => {
    if (!form.travelDate || !form.returnDate) {
      setError('Please select travel and return dates first');
      return;
    }
    setCheckingAvailability(true);
    try {
      const res = await api.get('/vehicles/availability', {
        params: {
          travelDate: form.travelDate,
          returnDate: form.returnDate,
          vehicleType: form.vehicleType || undefined,
          passengers: form.numberOfPassengers || undefined,
        },
      });
      setAvailability(res.data);
      setError('');
    } catch (err) {
      setError('Failed to check availability');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleLocateRoute = async () => {
    if (!form.destination || !form.destination.trim()) {
      setMapError('Please enter a destination to locate on the map');
      return;
    }

    setLocatingRoute(true);
    setMapError('');

    try {
      // 1. Starting location geocoding
      let start = BIT_CAMPUS_COORDS;
      if (form.startingLocation && !form.startingLocation.toLowerCase().includes('bit') && !form.startingLocation.toLowerCase().includes('campus')) {
        const customStart = await geocodeLocation(form.startingLocation);
        if (customStart) {
          start = { ...customStart, name: form.startingLocation };
        }
      }
      setStartCoords(start);

      // 2. Destination geocoding (Nominatim user-triggered search)
      const dest = await geocodeLocation(form.destination);
      if (!dest) {
        setMapError(`Could not find "${form.destination}" on OpenStreetMap. Please specify city, town or landmark.`);
        setLocatingRoute(false);
        return;
      }
      const destData = { ...dest, name: form.destination };
      setDestCoords(destData);

      // 3. Route calculation (OSRM prototype routing)
      const route = await getPlannedRoute(start, destData);
      setRouteData(route);
    } catch (err) {
      console.error('Route calculation error:', err);
      setMapError('Failed to calculate route via OpenStreetMap/OSRM. Please try again.');
    } finally {
      setLocatingRoute(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/bookings', form);
      setSuccess(true);
      setTimeout(() => navigate('/faculty/requests'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <div className="bg-white rounded-xl border border-green-200 p-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Submitted!</h2>
          <p className="text-sm text-gray-500">Your vehicle request has been submitted for HOD approval.</p>
          <p className="text-xs text-gray-400 mt-2">Redirecting to My Requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <CalendarPlus className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Book a Vehicle</h1>
          <p className="text-sm text-gray-500">Fill in the details for your trip</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Faculty Info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">Faculty Information</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Faculty Name *</label>
              <input name="facultyName" value={form.facultyName} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department *</label>
              <input name="department" value={form.department} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact Number *</label>
              <input name="contactNumber" value={form.contactNumber} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">Trip Details</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Purpose of Visit *</label>
              <textarea name="purpose" value={form.purpose} onChange={handleChange} required rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Destination *</label>
              <div className="flex gap-2">
                <input
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  placeholder="e.g., Coimbatore Airport, Erode, Salem"
                  required
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleLocateRoute}
                  disabled={locatingRoute || !form.destination}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title="Search destination on OpenStreetMap and calculate planned route"
                >
                  {locatingRoute ? (
                    <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>{locatingRoute ? 'Routing...' : 'Locate on Map'}</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Starting Location *</label>
              <input name="startingLocation" value={form.startingLocation} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>

            {mapError && (
              <div className="sm:col-span-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{mapError}</span>
              </div>
            )}

            {/* Interactive Leaflet Route Map Preview */}
            {destCoords && (
              <div className="sm:col-span-2 mt-2 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    Planned Route Preview (OSRM & OpenStreetMap)
                  </span>
                  {routeData?.distanceKm && (
                    <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {routeData.distanceKm} km • {routeData.durationText}
                    </span>
                  )}
                </div>
                <RouteMap
                  startLocation={startCoords}
                  destinationLocation={destCoords}
                  routeCoordinates={routeData?.coordinates || []}
                  distanceKm={routeData?.distanceKm}
                  durationText={routeData?.durationText}
                  height="340px"
                  isPlanned={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* Date/Time */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">Schedule</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Travel Date *</label>
              <input type="date" name="travelDate" value={form.travelDate} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Departure Time *</label>
              <input type="time" name="departureTime" value={form.departureTime} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Return Date *</label>
              <input type="date" name="returnDate" value={form.returnDate} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Return Time *</label>
              <input type="time" name="returnTime" value={form.returnTime} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Vehicle */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">Vehicle Requirements</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Number of Passengers *</label>
              <input type="number" name="numberOfPassengers" value={form.numberOfPassengers} onChange={handleChange} required min="1" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Type *</label>
              <select name="vehicleType" value={form.vehicleType} onChange={handleChange} required className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                <option value="">Select type</option>
                {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={checkAvailability}
                disabled={checkingAvailability}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {checkingAvailability ? 'Checking...' : 'Check Availability'}
              </button>
            </div>
          </div>

          {availability && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm font-medium text-blue-900 mb-2">
                {availability.available.length} vehicle(s) available for your dates
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {availability.available.map(v => (
                  <div key={v.id} className="bg-white rounded-lg p-3 border border-blue-100 text-xs">
                    <p className="font-semibold text-gray-900">{v.registrationNumber}</p>
                    <p className="text-gray-500">{v.vehicleType} • {v.model}</p>
                    <p className="text-gray-500">{v.seatingCapacity} seats</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Additional */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">Additional Information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Special Requirements</label>
              <textarea name="specialRequirements" value={form.specialRequirements} onChange={handleChange} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" placeholder="e.g., AC required, wheelchair accessible" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
              <textarea name="remarks" value={form.remarks} onChange={handleChange} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" placeholder="Any additional notes" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Request
          </button>
        </div>
      </form>
    </div>
  );
}
