import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ClipboardList, Car, Users, CheckCircle, Clock, XCircle, BarChart3, Truck } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/reports');
        setStats(res.data.summary);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">System overview and management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Bookings" value={stats?.totalBookings || 0} icon={ClipboardList} color="blue" />
        <StatCard title="Pending" value={stats?.pendingBookings || 0} icon={Clock} color="amber" />
        <StatCard title="Completed" value={stats?.completedBookings || 0} icon={CheckCircle} color="green" />
        <StatCard title="Rejected" value={stats?.rejectedBookings || 0} icon={XCircle} color="red" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Vehicles" value={stats?.totalVehicles || 0} icon={Car} color="indigo" />
        <StatCard title="Available Vehicles" value={stats?.availableVehicles || 0} icon={Car} color="green" />
        <StatCard title="Total Drivers" value={stats?.totalDrivers || 0} icon={Users} color="purple" />
        <StatCard title="Active Trips" value={(stats?.allocatedBookings || 0) + (stats?.ongoingBookings || 0)} icon={Truck} color="blue" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/admin/users', icon: Users, label: 'Manage Users', color: 'bg-blue-50 text-blue-700 border-blue-100' },
              { to: '/admin/vehicles', icon: Car, label: 'Manage Vehicles', color: 'bg-green-50 text-green-700 border-green-100' },
              { to: '/admin/drivers', icon: Users, label: 'Manage Drivers', color: 'bg-purple-50 text-purple-700 border-purple-100' },
              { to: '/admin/reports', icon: BarChart3, label: 'View Reports', color: 'bg-amber-50 text-amber-700 border-amber-100' },
            ].map(a => (
              <Link key={a.to} to={a.to} className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md ${a.color}`}>
                <a.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="space-y-3">
            <StatusRow label="Bookings pending approval" value={stats?.pendingBookings || 0} color={stats?.pendingBookings > 0 ? 'text-amber-600' : 'text-green-600'} />
            <StatusRow label="Bookings awaiting allocation" value={stats?.approvedBookings || 0} color={stats?.approvedBookings > 0 ? 'text-blue-600' : 'text-green-600'} />
            <StatusRow label="Ongoing trips" value={stats?.ongoingBookings || 0} color="text-purple-600" />
            <StatusRow label="Vehicles in maintenance" value={stats?.maintenanceVehicles || 0} color={stats?.maintenanceVehicles > 0 ? 'text-orange-600' : 'text-green-600'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}
