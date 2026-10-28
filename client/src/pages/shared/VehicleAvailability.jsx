import { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Car } from 'lucide-react';

export default function VehicleAvailability() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ travelDate: '', returnDate: '', vehicleType: '' });
  const [availability, setAvailability] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/vehicles');
        setVehicles(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const checkAvailability = async () => {
    if (!filters.travelDate || !filters.returnDate) return;
    try {
      const res = await api.get('/vehicles/availability', { params: filters });
      setAvailability(res.data);
    } catch (err) { console.error(err); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Vehicle Availability</h1>
      <p className="text-sm text-gray-500 mb-6">Check vehicle availability for your dates</p>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Travel Date</label>
            <input type="date" value={filters.travelDate} onChange={e => setFilters(p => ({ ...p, travelDate: e.target.value }))} className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Return Date</label>
            <input type="date" value={filters.returnDate} onChange={e => setFilters(p => ({ ...p, returnDate: e.target.value }))} className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Type</label>
            <select value={filters.vehicleType} onChange={e => setFilters(p => ({ ...p, vehicleType: e.target.value }))} className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-500">
              <option value="">All Types</option>
              <option value="Bus">Bus</option>
              <option value="Mini Bus">Mini Bus</option>
              <option value="Van">Van</option>
              <option value="Car">Car</option>
            </select>
          </div>
          <button onClick={checkAvailability} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">Check</button>
        </div>
      </div>

      {availability && (
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm font-medium text-blue-900">{availability.available.length} vehicles available for selected dates</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3">Vehicle</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Model</th>
                <th className="px-5 py-3">Seats</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Current Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(availability ? availability.all : vehicles).map(v => {
                const isAvailable = availability ? !availability.busyVehicleIds.includes(v.id) && v.status !== 'MAINTENANCE' : v.status === 'AVAILABLE';
                return (
                  <tr key={v.id} className={`hover:bg-gray-50 transition-colors ${!isAvailable && availability ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{v.registrationNumber}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{v.vehicleType}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{v.model}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{v.seatingCapacity}</td>
                    <td className="px-5 py-3.5">
                      {availability ? (
                        <StatusBadge status={isAvailable ? 'AVAILABLE' : 'BOOKED'} />
                      ) : (
                        <StatusBadge status={v.status} />
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {v.allocations?.[0]?.driver?.name || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
