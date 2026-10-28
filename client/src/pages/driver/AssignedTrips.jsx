import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDate } from '../../utils/constants';
import { MapPin, Eye } from 'lucide-react';

export default function AssignedTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await api.get('/trips');
        setTrips(res.data.trips || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchTrips();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Assigned Trips</h1>
      <p className="text-sm text-gray-500 mb-6">All trips assigned to you</p>

      <div className="bg-white rounded-xl border border-gray-200">
        {trips.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No trips assigned</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-5 py-3">Booking</th>
                  <th className="px-5 py-3">Destination</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Faculty</th>
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Trip Status</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {trips.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">#{t.id}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{t.destination}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(t.travelDate)}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{t.departureTime}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{t.facultyName}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{t.allocation?.vehicle?.registrationNumber || '-'}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                    <td className="px-5 py-3.5">{t.tripStatus?.[0] ? <StatusBadge status={t.tripStatus[0].status} /> : '-'}</td>
                    <td className="px-5 py-3.5">
                      <Link to={`/driver/trip/${t.id}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
                        <Eye className="w-3.5 h-3.5" /> Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
