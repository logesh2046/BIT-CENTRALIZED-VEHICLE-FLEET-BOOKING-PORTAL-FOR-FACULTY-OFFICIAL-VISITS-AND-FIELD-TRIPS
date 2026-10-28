import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDate } from '../../utils/constants';
import { ClipboardList, Eye } from 'lucide-react';

export default function MyRequests() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const params = { limit: 50 };
        if (filter) params.status = filter;
        const res = await api.get('/bookings', { params });
        setBookings(res.data.bookings || []);
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [filter]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Requests</h1>
          <p className="text-sm text-gray-500">View and track your vehicle booking requests</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="ALLOCATED">Allocated</option>
          <option value="ONGOING">Ongoing</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {bookings.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Destination</th>
                  <th className="px-5 py-3">Travel Date</th>
                  <th className="px-5 py-3">Passengers</th>
                  <th className="px-5 py-3">Vehicle Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">#{b.id}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{b.destination}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(b.travelDate)}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{b.numberOfPassengers}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{b.vehicleType}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
                    <td className="px-5 py-3.5">
                      <Link to={`/faculty/booking/${b.id}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
                        <Eye className="w-3.5 h-3.5" /> View
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
