import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Truck, Car, Users as UsersIcon, ClipboardList, MapPin, CheckCircle } from 'lucide-react';

export default function TransportDashboard() {
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
        <h1 className="text-2xl font-bold text-gray-900">Transport Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Vehicle allocation and fleet management overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Awaiting Allocation" value={stats?.approvedBookings || 0} icon={ClipboardList} color="amber" />
        <StatCard title="Active Trips" value={(stats?.allocatedBookings || 0) + (stats?.ongoingBookings || 0)} icon={MapPin} color="blue" />
        <StatCard title="Available Vehicles" value={stats?.availableVehicles || 0} icon={Car} color="green" />
        <StatCard title="Available Drivers" value={stats?.availableDrivers || 0} icon={UsersIcon} color="purple" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/transport/allocations', icon: Truck, label: 'Allocate Vehicles', color: 'bg-blue-50 text-blue-700 border-blue-100' },
              { to: '/transport/vehicles', icon: Car, label: 'Manage Vehicles', color: 'bg-green-50 text-green-700 border-green-100' },
              { to: '/transport/drivers', icon: UsersIcon, label: 'Manage Drivers', color: 'bg-purple-50 text-purple-700 border-purple-100' },
              { to: '/transport/trips', icon: MapPin, label: 'Track Trips', color: 'bg-amber-50 text-amber-700 border-amber-100' },
            ].map(a => (
              <Link key={a.to} to={a.to} className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md ${a.color}`}>
                <a.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Fleet Summary</h2>
          <div className="space-y-3">
            <FleetRow label="Total Vehicles" value={stats?.totalVehicles || 0} />
            <FleetRow label="Available" value={stats?.availableVehicles || 0} color="text-green-600" />
            <FleetRow label="In Use" value={stats?.inUseVehicles || 0} color="text-blue-600" />
            <FleetRow label="Under Maintenance" value={stats?.maintenanceVehicles || 0} color="text-orange-600" />
            <div className="border-t border-gray-100 pt-3">
              <FleetRow label="Total Drivers" value={stats?.totalDrivers || 0} />
              <FleetRow label="Available Drivers" value={stats?.availableDrivers || 0} color="text-green-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FleetRow({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
}
