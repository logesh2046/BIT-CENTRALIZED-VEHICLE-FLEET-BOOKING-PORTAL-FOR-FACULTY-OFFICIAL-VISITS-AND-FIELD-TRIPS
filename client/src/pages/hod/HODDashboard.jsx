import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDate } from '../../utils/constants';
import { ClipboardList, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function HODDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/bookings?limit=50');
        setBookings(res.data.bookings || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const stats = {
    pending: bookings.filter(b => b.status === 'PENDING').length,
    approved: bookings.filter(b => b.status === 'APPROVED').length,
    rejected: bookings.filter(b => b.status === 'REJECTED').length,
    total: bookings.length,
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">HOD Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {user?.name} — {user?.department?.name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending Approvals" value={stats.pending} icon={Clock} color="amber" />
        <StatCard title="Approved" value={stats.approved} icon={CheckCircle} color="green" />
        <StatCard title="Rejected" value={stats.rejected} icon={XCircle} color="red" />
        <StatCard title="Total Requests" value={stats.total} icon={ClipboardList} color="blue" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Pending Approvals</h2>
          <Link to="/hod/approvals" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Faculty</th>
                <th className="px-5 py-3">Destination</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Passengers</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.filter(b => b.status === 'PENDING').slice(0, 5).map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">#{b.id}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700">{b.facultyName}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700">{b.destination}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(b.travelDate)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{b.numberOfPassengers}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
              {bookings.filter(b => b.status === 'PENDING').length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500">No pending approvals</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
