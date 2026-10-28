import { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDate } from '../../utils/constants';
import { CheckCircle, XCircle, Eye, AlertCircle } from 'lucide-react';

export default function RequestApprovals() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('PENDING');

  const fetchBookings = async () => {
    try {
      const params = { limit: 100 };
      if (filter) params.status = filter;
      const res = await api.get('/bookings', { params });
      setBookings(res.data.bookings || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, [filter]);

  const handleApprove = async (id) => {
    setProcessing(true);
    setError('');
    try {
      await api.post(`/bookings/${id}/approve`);
      fetchBookings();
      setSelectedBooking(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve');
    } finally { setProcessing(false); }
  };

  const handleReject = async (id) => {
    setProcessing(true);
    setError('');
    try {
      await api.post(`/bookings/${id}/reject`, { rejectionRemarks });
      fetchBookings();
      setSelectedBooking(null);
      setRejectionRemarks('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject');
    } finally { setProcessing(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Request Approvals</h1>
          <p className="text-sm text-gray-500">Review and approve/reject vehicle requests</p>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white outline-none">
          <option value="PENDING">Pending</option>
          <option value="">All</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Faculty</th>
                <th className="px-5 py-3">Purpose</th>
                <th className="px-5 py-3">Destination</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Passengers</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">#{b.id}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700">{b.facultyName}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700 max-w-[200px] truncate">{b.purpose}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700">{b.destination}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(b.travelDate)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{b.numberOfPassengers}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{b.vehicleType}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
                  <td className="px-5 py-3.5">
                    {b.status === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleApprove(b.id)} disabled={processing} className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 text-sm font-medium disabled:opacity-50">
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => setSelectedBooking(b)} className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No action</span>
                    )}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={9} className="px-5 py-8 text-center text-sm text-gray-500">No requests found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Booking #{selectedBooking.id}</h3>
            <p className="text-sm text-gray-500 mb-4">
              Rejecting {selectedBooking.facultyName}'s request for {selectedBooking.destination}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Remarks</label>
              <textarea
                value={rejectionRemarks}
                onChange={e => setRejectionRemarks(e.target.value)}
                rows={3}
                placeholder="Enter reason for rejection..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setSelectedBooking(null); setRejectionRemarks(''); }} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={() => handleReject(selectedBooking.id)} disabled={processing} className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                {processing ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
