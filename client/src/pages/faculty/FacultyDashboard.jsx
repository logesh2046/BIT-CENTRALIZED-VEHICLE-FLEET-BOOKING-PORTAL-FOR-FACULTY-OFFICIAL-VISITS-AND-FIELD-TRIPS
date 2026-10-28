import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDate } from '../../utils/constants';
import { CalendarPlus, ClipboardList, CheckCircle, Clock, XCircle, Car } from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/bookings?limit=5');
        setBookings(res.data.bookings || []);
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'PENDING').length,
    approved: bookings.filter(b => ['APPROVED', 'ALLOCATED', 'ONGOING'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'COMPLETED').length,
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-gray-500 mt-1">Faculty Dashboard — {user?.department?.name || 'Department'}</p>
        </div>
        <Link
          to="/faculty/book"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <CalendarPlus className="w-4 h-4" />
          Book Vehicle
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Requests" value={stats.total} icon={ClipboardList} color="blue" />
        <StatCard title="Pending" value={stats.pending} icon={Clock} color="amber" />
        <StatCard title="Approved" value={stats.approved} icon={CheckCircle} color="green" />
        <StatCard title="Completed" value={stats.completed} icon={Car} color="purple" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Requests</h2>
          <Link to="/faculty/requests" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All →
          </Link>
        </div>
        {bookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>No bookings yet. Create your first booking!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Destination</th>
                  <th className="px-5 py-3">Travel Date</th>
                  <th className="px-5 py-3">Vehicle Type</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">#{booking.id}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{booking.destination}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(booking.travelDate)}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{booking.vehicleType}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={booking.status} /></td>
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
