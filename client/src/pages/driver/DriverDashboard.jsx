import { useState, useEffect } from 'react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDate } from '../../utils/constants';
import { MapPin, Car, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DriverDashboard() {
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

  const active = trips.filter(t => ['ALLOCATED', 'ONGOING'].includes(t.status));
  const completed = trips.filter(t => t.status === 'COMPLETED');

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Your assigned trips and schedule</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Trips" value={trips.length} icon={MapPin} color="blue" />
        <StatCard title="Active Trips" value={active.length} icon={Car} color="amber" />
        <StatCard title="Completed" value={completed.length} icon={CheckCircle} color="green" />
        <StatCard title="Upcoming" value={active.filter(t => t.status === 'ALLOCATED').length} icon={Clock} color="purple" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Active & Upcoming Trips</h2>
          <Link to="/driver/trips" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</Link>
        </div>
        {active.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            <MapPin className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>No active trips</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {active.map(trip => (
              <Link key={trip.id} to={`/driver/trip/${trip.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{trip.destination}</p>
                    <p className="text-xs text-gray-500">{formatDate(trip.travelDate)} • {trip.departureTime}</p>
                    <p className="text-xs text-gray-400">{trip.facultyName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={trip.status} />
                  {trip.allocation?.vehicle && (
                    <p className="text-xs text-gray-400 mt-1">{trip.allocation.vehicle.registrationNumber}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
