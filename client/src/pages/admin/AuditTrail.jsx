import { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDateTime } from '../../utils/constants';
import { FileText } from 'lucide-react';

export default function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', entity: '', startDate: '', endDate: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    try {
      const params = { page, limit: 30, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await api.get('/audit-logs', { params });
      setLogs(res.data.logs || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [page, filters]);

  const actionColors = {
    LOGIN: 'bg-blue-50 text-blue-700',
    CREATE_BOOKING: 'bg-green-50 text-green-700',
    APPROVE_BOOKING: 'bg-emerald-50 text-emerald-700',
    REJECT_BOOKING: 'bg-red-50 text-red-700',
    ALLOCATE_VEHICLE: 'bg-purple-50 text-purple-700',
    UPDATE_TRIP_STATUS: 'bg-amber-50 text-amber-700',
    CREATE_VEHICLE: 'bg-indigo-50 text-indigo-700',
    UPDATE_VEHICLE: 'bg-indigo-50 text-indigo-700',
    CREATE_DRIVER: 'bg-cyan-50 text-cyan-700',
    UPDATE_DRIVER: 'bg-cyan-50 text-cyan-700',
    CREATE_USER: 'bg-pink-50 text-pink-700',
    UPDATE_USER: 'bg-pink-50 text-pink-700',
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Audit Trail</h1>
      <p className="text-sm text-gray-500 mb-6">Track all system actions and changes</p>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Action</label>
            <select value={filters.action} onChange={e => { setFilters(p => ({ ...p, action: e.target.value })); setPage(1); }} className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white outline-none">
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="CREATE_BOOKING">Create Booking</option>
              <option value="APPROVE_BOOKING">Approve Booking</option>
              <option value="REJECT_BOOKING">Reject Booking</option>
              <option value="ALLOCATE_VEHICLE">Allocate Vehicle</option>
              <option value="UPDATE_TRIP_STATUS">Update Trip Status</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Entity</label>
            <select value={filters.entity} onChange={e => { setFilters(p => ({ ...p, entity: e.target.value })); setPage(1); }} className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white outline-none">
              <option value="">All Entities</option>
              <option value="User">User</option>
              <option value="Booking">Booking</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Driver">Driver</option>
              <option value="VehicleAllocation">Allocation</option>
              <option value="TripStatus">Trip Status</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
            <input type="date" value={filters.startDate} onChange={e => { setFilters(p => ({ ...p, startDate: e.target.value })); setPage(1); }} className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
            <input type="date" value={filters.endDate} onChange={e => { setFilters(p => ({ ...p, endDate: e.target.value })); setPage(1); }} className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Entity</th>
                  <th className="px-5 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-gray-900">{log.user?.name}</p>
                      <p className="text-xs text-gray-400">{log.user?.role}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${actionColors[log.action] || 'bg-gray-50 text-gray-700'}`}>
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {log.entity}{log.entityId ? ` #${log.entityId}` : ''}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700 max-w-[300px] truncate">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
