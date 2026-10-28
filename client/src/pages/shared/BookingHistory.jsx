import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDate } from '../../utils/constants';
import { History, Search, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function BookingHistory() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', department: '', destination: '', startDate: '', endDate: '' });

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const params = { limit: 100, ...filters };
        Object.keys(params).forEach(k => !params[k] && delete params[k]);
        const res = await api.get('/bookings', { params });
        setBookings(res.data.bookings || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchBookings();
  }, [filters]);

  const basePath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'HOD' ? '/hod' : '/faculty';

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Booking History</h1>
      <p className="text-sm text-gray-500 mb-6">Search and filter all booking records</p>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))} className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white outline-none">
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ALLOCATED">Allocated</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Destination</label>
            <input value={filters.destination} onChange={e => setFilters(p => ({ ...p, destination: e.target.value }))} placeholder="Search..." className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
            <input type="date" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
            <input type="date" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {bookings.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Faculty</th>
                  <th className="px-5 py-3">Destination</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Driver</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">#{b.id}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{b.facultyName}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{b.destination}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(b.travelDate)}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{b.allocation?.vehicle?.registrationNumber || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{b.allocation?.driver?.name || '-'}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
                    <td className="px-5 py-3.5">
                      <Link to={`${basePath}/booking/${b.id}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
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
