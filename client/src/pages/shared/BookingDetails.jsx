import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDate, formatDateTime } from '../../utils/constants';
import { ArrowLeft, MapPin, Calendar, Users, Car, User, Phone, Clock, AlertCircle, CheckCircle, Navigation } from 'lucide-react';
import RouteMap from '../../components/RouteMap';
import { BIT_CAMPUS_COORDS, geocodeLocation, getPlannedRoute } from '../../services/mapService';

export default function BookingDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('STARTED');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Route map states
  const [startCoords, setStartCoords] = useState(BIT_CAMPUS_COORDS);
  const [destCoords, setDestCoords] = useState(null);
  const [routeData, setRouteData] = useState(null);

  const fetchBooking = async () => {
    try {
      const res = await api.get(`/bookings/${id}`);
      const data = res.data;
      setBooking(data);

      // Geocode and calculate route for this booking
      if (data.destination) {
        let start = BIT_CAMPUS_COORDS;
        if (data.startingLocation && !data.startingLocation.toLowerCase().includes('bit') && !data.startingLocation.toLowerCase().includes('campus')) {
          const geocodedStart = await geocodeLocation(data.startingLocation);
          if (geocodedStart) start = { ...geocodedStart, name: data.startingLocation };
        }
        setStartCoords(start);

        const geocodedDest = await geocodeLocation(data.destination);
        if (geocodedDest) {
          const dest = { ...geocodedDest, name: data.destination };
          setDestCoords(dest);
          const route = await getPlannedRoute(start, dest);
          setRouteData(route);
        }
      }
    } catch (err) {
      console.error('Failed to fetch booking:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');
    try {
      await api.put(`/trips/${id}/status`, { status: newStatus, remarks });
      setSuccess(`Trip status updated to ${newStatus}`);
      setRemarks('');
      fetchBooking();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update trip status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!booking) return <div className="text-center py-12 text-gray-500">Booking not found</div>;

  const canUpdateStatus = ['DRIVER', 'TRANSPORT_OFFICER', 'ADMIN'].includes(user?.role) && ['ALLOCATED', 'ONGOING'].includes(booking.status);

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Booking #{booking.id}</h1>
          <p className="text-sm text-gray-500 mt-1">{booking.purpose}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Trip Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Trip Details</h2>
          <div className="space-y-3">
            <InfoRow icon={MapPin} label="Destination" value={booking.destination} />
            <InfoRow icon={MapPin} label="Starting Location" value={booking.startingLocation} />
            <InfoRow icon={Calendar} label="Travel Date" value={`${formatDate(booking.travelDate)} at ${booking.departureTime}`} />
            <InfoRow icon={Calendar} label="Return Date" value={`${formatDate(booking.returnDate)} at ${booking.returnTime}`} />
            <InfoRow icon={Users} label="Passengers" value={booking.numberOfPassengers} />
            <InfoRow icon={Car} label="Vehicle Type" value={booking.vehicleType} />
            {booking.specialRequirements && <InfoRow icon={Clock} label="Special Requirements" value={booking.specialRequirements} />}
            {booking.remarks && <InfoRow icon={Clock} label="Remarks" value={booking.remarks} />}
          </div>
        </div>

        {/* Faculty Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Faculty Details</h2>
            <div className="space-y-3">
              <InfoRow icon={User} label="Name" value={booking.facultyName} />
              <InfoRow icon={Users} label="Department" value={booking.department} />
              <InfoRow icon={Phone} label="Contact" value={booking.contactNumber} />
            </div>
          </div>

          {/* Allocation */}
          {booking.allocation && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Vehicle & Driver</h2>
              <div className="space-y-3">
                <InfoRow icon={Car} label="Vehicle" value={`${booking.allocation.vehicle.registrationNumber} (${booking.allocation.vehicle.vehicleType})`} />
                <InfoRow icon={User} label="Driver" value={booking.allocation.driver.name} />
                <InfoRow icon={Phone} label="Driver Phone" value={booking.allocation.driver.phone} />
              </div>
            </div>
          )}

          {/* Rejection Remarks */}
          {booking.status === 'REJECTED' && booking.rejectionRemarks && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-5">
              <h2 className="font-semibold text-red-900 mb-2">Rejection Reason</h2>
              <p className="text-sm text-red-700">{booking.rejectionRemarks}</p>
            </div>
          )}
        </div>
      </div>

      {/* Planned Route Map Card */}
      {destCoords && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
              <Navigation className="w-4 h-4 text-blue-600" />
              Planned Route (OpenStreetMap & OSRM)
            </h2>
            {routeData?.distanceKm && (
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
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
            height="380px"
            isPlanned={true}
          />
        </div>
      )}

      {/* Driver/Admin Trip Update Form */}
      {canUpdateStatus && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 mt-6">
          <h2 className="font-semibold text-blue-900 mb-3">Update Trip Progress</h2>
          <form onSubmit={handleUpdateStatus} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-blue-800 mb-1">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-blue-300 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="STARTED">Trip Started</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="COMPLETED">Trip Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="flex-[2]">
              <label className="block text-xs font-medium text-blue-800 mb-1">Remarks (optional)</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Reached destination safely"
                className="w-full px-3 py-2 rounded-lg border border-blue-300 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={updating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {updating ? 'Updating...' : 'Update Status'}
            </button>
          </form>
        </div>
      )}

      {/* Trip Status Timeline */}
      {booking.tripStatus && booking.tripStatus.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Trip Timeline</h2>
          <div className="space-y-4">
            {booking.tripStatus.map((ts, i) => (
              <div key={ts.id} className="flex items-start gap-3">
                <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ts.status} />
                    <span className="text-xs text-gray-400">{formatDateTime(ts.createdAt)}</span>
                  </div>
                  {ts.remarks && <p className="text-xs text-gray-500 mt-1">{ts.remarks}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
