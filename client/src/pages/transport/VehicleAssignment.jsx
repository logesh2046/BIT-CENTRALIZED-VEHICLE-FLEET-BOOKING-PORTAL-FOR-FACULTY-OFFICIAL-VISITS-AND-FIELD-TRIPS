import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDate } from '../../utils/constants';
import {
  Truck, AlertCircle, CheckCircle, RefreshCw, Mail, Calendar,
  Navigation, User, Clock, Edit3, Send, Check
} from 'lucide-react';

export default function VehicleAssignment() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'allocated' | 'logs'
  const [bookings, setBookings] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Allocation modal (initial allocation)
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [form, setForm] = useState({ vehicleId: '', driverId: '' });
  const [processing, setProcessing] = useState(false);

  // Reassignment modal (updating existing allocation)
  const [editingAllocation, setEditingAllocation] = useState(null);
  const [reassignForm, setReassignForm] = useState({ vehicleId: '', driverId: '' });
  const [reassigning, setReassigning] = useState(false);

  // Test email state
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, allocationsRes, vehiclesRes, driversRes, logsRes] = await Promise.all([
        api.get('/bookings?status=APPROVED&limit=100'),
        api.get('/allocations'),
        api.get('/vehicles'),
        api.get('/drivers'),
        api.get('/allocations/email-logs').catch(() => ({ data: [] })),
      ]);
      setBookings(bookingsRes.data.bookings || []);
      setAllocations(allocationsRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setDrivers(driversRes.data || []);
      setEmailLogs(logsRes.data || []);
    } catch (err) {
      console.error('Fetch error in VehicleAssignment:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshLogs = async () => {
    try {
      const res = await api.get('/allocations/email-logs');
      setEmailLogs(res.data || []);
    } catch (err) {
      console.error('Error refreshing email logs:', err);
    }
  };

  // 1. Initial Allocation
  const openAllocation = async (booking) => {
    setSelectedBooking(booking);
    setForm({ vehicleId: '', driverId: '' });
    setError('');
    try {
      const [vRes, dRes] = await Promise.all([
        api.get('/vehicles/availability', { params: { travelDate: booking.travelDate, returnDate: booking.returnDate, vehicleType: booking.vehicleType } }),
        api.get('/drivers/availability', { params: { travelDate: booking.travelDate, returnDate: booking.returnDate } }),
      ]);
      setVehicles(vRes.data.available || []);
      setDrivers(dRes.data.available || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAllocate = async () => {
    if (!form.vehicleId || !form.driverId) {
      setError('Please select both a vehicle and a driver');
      return;
    }
    setProcessing(true);
    setError('');
    try {
      await api.post('/allocations', {
        bookingId: selectedBooking.id,
        vehicleId: form.vehicleId,
        driverId: form.driverId,
      });
      setSuccess(`Vehicle & driver allocated for booking #${selectedBooking.id}. Notification emails dispatched via Brevo SMTP.`);
      setSelectedBooking(null);
      setForm({ vehicleId: '', driverId: '' });
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to allocate vehicle');
    } finally {
      setProcessing(false);
    }
  };

  // 2. Reassignment / Modify Allocation
  const openReassignment = async (alloc) => {
    setEditingAllocation(alloc);
    setReassignForm({
      vehicleId: alloc.vehicleId?.toString() || '',
      driverId: alloc.driverId?.toString() || '',
    });
    setError('');
    try {
      const [vRes, dRes] = await Promise.all([
        api.get('/vehicles/availability', { params: { travelDate: alloc.booking.travelDate, returnDate: alloc.booking.returnDate } }),
        api.get('/drivers/availability', { params: { travelDate: alloc.booking.travelDate, returnDate: alloc.booking.returnDate } }),
      ]);
      // Include currently assigned vehicle & driver in the dropdown
      const availVehicles = [...(vRes.data.available || [])];
      if (!availVehicles.find(v => v.id === alloc.vehicle.id)) {
        availVehicles.unshift(alloc.vehicle);
      }
      const availDrivers = [...(dRes.data.available || [])];
      if (!availDrivers.find(d => d.id === alloc.driver.id)) {
        availDrivers.unshift(alloc.driver);
      }
      setVehicles(availVehicles);
      setDrivers(availDrivers);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReassign = async () => {
    if (!reassignForm.vehicleId && !reassignForm.driverId) {
      setError('Please select a vehicle or driver');
      return;
    }
    setReassigning(true);
    setError('');
    try {
      const payload = {};
      if (reassignForm.vehicleId) payload.vehicleId = reassignForm.vehicleId;
      if (reassignForm.driverId) payload.driverId = reassignForm.driverId;
      await api.put(`/allocations/${editingAllocation.id}`, payload);
      setSuccess(`Allocation updated for booking #${editingAllocation.bookingId}. Update emails dispatched to faculty and driver.`);
      setEditingAllocation(null);
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update allocation');
    } finally {
      setReassigning(false);
    }
  };

  // 3. Test Email verification
  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmailAddress) return;
    setSendingTestEmail(true);
    setTestEmailResult(null);
    try {
      const res = await api.post('/allocations/test-email', { to: testEmailAddress });
      setTestEmailResult({ success: true, message: 'Test email dispatched. Check delivery status in the table below.' });
      refreshLogs();
    } catch (err) {
      setTestEmailResult({ success: false, message: err.response?.data?.message || 'Failed to send test email' });
    } finally {
      setSendingTestEmail(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Title & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Vehicle & Driver Assignment</h1>
          <p className="text-sm text-gray-500">
            Allocate vehicles and drivers to approved bookings with automated Brevo SMTP notifications and OpenStreetMap routing
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Awaiting Allocation</p>
            <p className="text-xl font-bold text-gray-900">{bookings.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Active Allocations</p>
            <p className="text-xl font-bold text-gray-900">{allocations.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Recorded Emails (Brevo)</p>
            <p className="text-xl font-bold text-gray-900">{emailLogs.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>Pending Allocation</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
            {bookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('allocated')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'allocated'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>Active Allocations & Reassignment</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
            {allocations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'logs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Brevo Email Delivery Logs</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
            {emailLogs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PENDING ALLOCATION */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Approved Bookings Awaiting Allocation</h2>
            <span className="text-xs text-gray-400">Step 1: Select booking to assign vehicle & driver</span>
          </div>

          {bookings.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium">No approved bookings awaiting allocation</p>
              <p className="text-xs text-gray-400 mt-1">All approved bookings have been allocated.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50/60 border-b border-gray-100">
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Faculty & Dept</th>
                    <th className="px-5 py-3">Destination</th>
                    <th className="px-5 py-3">Pickup Date</th>
                    <th className="px-5 py-3">Return Date</th>
                    <th className="px-5 py-3">Passengers</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Route Map</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-gray-900">#{b.id}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-gray-800 block">{b.facultyName}</span>
                        <span className="text-xs text-gray-400">{b.department}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 font-medium">{b.destination}</td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {formatDate(b.travelDate)} <span className="text-xs text-gray-400">({b.departureTime})</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {formatDate(b.returnDate)} <span className="text-xs text-gray-400">({b.returnTime})</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{b.numberOfPassengers}</td>
                      <td className="px-5 py-3.5 text-gray-600">{b.vehicleType}</td>
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/trips/${b.id}/route`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Planned Route
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => openAllocation(b)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                        >
                          <Truck className="w-3.5 h-3.5" /> Allocate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE ALLOCATIONS & REASSIGNMENT */}
      {activeTab === 'allocated' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Active Vehicle & Driver Allocations</h2>
              <p className="text-xs text-gray-500">Modify or reassign vehicle & driver when needed (triggers assignment update email)</p>
            </div>
          </div>

          {allocations.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium">No active allocations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50/60 border-b border-gray-100">
                    <th className="px-5 py-3">Booking</th>
                    <th className="px-5 py-3">Faculty / Purpose</th>
                    <th className="px-5 py-3">Destination</th>
                    <th className="px-5 py-3">Schedule</th>
                    <th className="px-5 py-3">Assigned Vehicle</th>
                    <th className="px-5 py-3">Assigned Driver</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Route Link</th>
                    <th className="px-5 py-3 text-right">Reassign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {allocations.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-gray-900">#{a.bookingId}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-gray-800 block">{a.booking?.facultyName}</span>
                        <span className="text-xs text-gray-400">{a.booking?.department}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 font-medium">{a.booking?.destination}</td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {formatDate(a.booking?.travelDate)} <span className="text-xs text-gray-400">({a.booking?.departureTime})</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-gray-900 block">{a.vehicle?.registrationNumber}</span>
                        <span className="text-xs text-gray-500">{a.vehicle?.vehicleType} - {a.vehicle?.model}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-gray-900 block">{a.driver?.name}</span>
                        <a href={`tel:${a.driver?.phone}`} className="text-xs text-blue-600 hover:underline">{a.driver?.phone}</a>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={a.booking?.status || 'ALLOCATED'} />
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/trips/${a.bookingId}/route`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Planned Route
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => openReassignment(a)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-600" /> Reassign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BREVO EMAIL NOTIFICATION AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Test Email Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 text-sm mb-1">Verify Brevo Free SMTP Service</h2>
            <p className="text-xs text-gray-500 mb-4">
              Send a test notification to verify SMTP host, port, user and pass configured in backend environment variables.
            </p>
            <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row gap-3 max-w-xl">
              <input
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="Enter recipient email (e.g. transport@bit.edu)"
                required
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={sendingTestEmail || !testEmailAddress}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                {sendingTestEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{sendingTestEmail ? 'Sending...' : 'Send Test Email'}</span>
              </button>
            </form>

            {testEmailResult && (
              <div className={`mt-3 p-3 rounded-lg text-xs flex items-center gap-2 ${testEmailResult.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {testEmailResult.success ? <Check className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                <span>{testEmailResult.message}</span>
              </div>
            )}
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Email Notification Audit Logs</h2>
                <p className="text-xs text-gray-500">Record of bilingual emails sent to faculty/staff and Tamil-first emails to drivers</p>
              </div>
              <button
                onClick={refreshLogs}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3 h-3" /> Refresh Logs
              </button>
            </div>

            {emailLogs.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium">No email notifications recorded yet</p>
                <p className="text-xs text-gray-400 mt-1">Logs will appear automatically whenever vehicle allocations are created or changed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-3">Timestamp</th>
                      <th className="px-5 py-3">Recipient</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Booking ID</th>
                      <th className="px-5 py-3">Subject</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Details / Delivery Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {emailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/80">
                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-3 font-semibold text-gray-900">{log.recipient}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.recipientRole === 'FACULTY' ? 'bg-blue-100 text-blue-800' :
                            log.recipientRole === 'DRIVER' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.recipientRole || 'USER'}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-bold text-blue-600">
                          {log.bookingId ? `#${log.bookingId}` : '-'}
                        </td>
                        <td className="px-5 py-3 text-gray-800 max-w-xs truncate" title={log.subject}>
                          {log.subject}
                        </td>
                        <td className="px-5 py-3">
                          {log.status === 'SENT' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">
                              SENT
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              FAILED
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-gray-500 max-w-sm truncate" title={log.error || (log.sentAt ? 'Delivered successfully via SMTP' : '')}>
                          {log.error || (log.sentAt ? 'Delivered successfully via SMTP' : '-')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: INITIAL ALLOCATION */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Allocate Vehicle & Driver</h3>
            <p className="text-sm text-gray-500 mb-4">
              Booking #{selectedBooking.id} — {selectedBooking.destination} ({formatDate(selectedBooking.travelDate)})
            </p>

            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs space-y-1">
              <p><span className="font-semibold text-gray-700">Faculty:</span> {selectedBooking.facultyName} ({selectedBooking.department})</p>
              <p><span className="font-semibold text-gray-700">Pickup Point:</span> {selectedBooking.startingLocation}</p>
              <p><span className="font-semibold text-gray-700">Destination:</span> {selectedBooking.destination}</p>
              <p><span className="font-semibold text-gray-700">Date & Time:</span> {formatDate(selectedBooking.travelDate)} at {selectedBooking.departureTime}</p>
              <p><span className="font-semibold text-gray-700">Passengers:</span> {selectedBooking.numberOfPassengers}</p>
              <p><span className="font-semibold text-gray-700">Requested Type:</span> {selectedBooking.vehicleType}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Vehicle *</label>
                <select
                  value={form.vehicleId}
                  onChange={e => setForm(p => ({ ...p, vehicleId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} — {v.vehicleType} ({v.model}, {v.seatingCapacity} seats)
                    </option>
                  ))}
                </select>
                {vehicles.length === 0 && <p className="text-xs text-red-500 mt-1">No vehicles available for these dates</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Driver *</label>
                <select
                  value={form.driverId}
                  onChange={e => setForm(p => ({ ...p, driverId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a driver</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.phone}
                    </option>
                  ))}
                </select>
                {drivers.length === 0 && <p className="text-xs text-red-500 mt-1">No drivers available for these dates</p>}
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-start gap-2">
                <Mail className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  Confirming this allocation will automatically trigger <strong>Bilingual emails to faculty/staff</strong> and <strong>Tamil-first emails to the driver</strong> containing planned route links.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAllocate}
                disabled={processing}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
              >
                {processing ? 'Allocating...' : 'Confirm Allocation & Send Emails'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REASSIGNMENT / MODIFY ALLOCATION */}
      {editingAllocation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingAllocation(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Change / Reassign Vehicle or Driver</h3>
            <p className="text-sm text-gray-500 mb-4">
              Booking #{editingAllocation.bookingId} — {editingAllocation.booking?.destination}
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs space-y-1 text-amber-900">
              <p className="font-semibold text-amber-800">Current Assignment:</p>
              <p>Vehicle: <strong>{editingAllocation.vehicle?.registrationNumber} ({editingAllocation.vehicle?.model})</strong></p>
              <p>Driver: <strong>{editingAllocation.driver?.name} ({editingAllocation.driver?.phone})</strong></p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Update Vehicle</label>
                <select
                  value={reassignForm.vehicleId}
                  onChange={e => setReassignForm(p => ({ ...p, vehicleId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} — {v.vehicleType} ({v.model})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Update Driver</label>
                <select
                  value={reassignForm.driverId}
                  onChange={e => setReassignForm(p => ({ ...p, driverId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-start gap-2">
                <Mail className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  Modifying this assignment will automatically dispatch <strong>Assignment Update emails</strong> to both the faculty member and assigned driver.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingAllocation(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                disabled={reassigning}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
              >
                {reassigning ? 'Updating...' : 'Save Changes & Notify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
