import { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatCard from '../../components/StatCard';
import { ClipboardList, Car, Users, CheckCircle, Clock, XCircle, Truck, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#64748b'];

export default function ReportsAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/reports');
        setData(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="text-center py-12 text-gray-500">Failed to load reports</div>;

  const { summary, monthlyData, departmentBookings, vehicleUtilization, statusDistribution } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500">System-wide booking and fleet analytics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Bookings" value={summary.totalBookings} icon={ClipboardList} color="blue" />
        <StatCard title="Pending" value={summary.pendingBookings} icon={Clock} color="amber" />
        <StatCard title="Completed" value={summary.completedBookings} icon={CheckCircle} color="green" />
        <StatCard title="Available Vehicles" value={summary.availableVehicles} icon={Car} color="purple" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Bookings */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Monthly Bookings</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#3b82f6" name="Total" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Booking Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusDistribution.filter(s => s.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {statusDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Department-wise Bookings */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Department-wise Bookings</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentBookings} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="department" type="category" tick={{ fontSize: 10 }} width={150} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" name="Bookings" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle Utilization */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Vehicle Utilization</h2>
          {vehicleUtilization.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vehicleUtilization}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="vehicle" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="trips" fill="#f59e0b" name="Trips" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Email Notification Audit Logs (Brevo SMTP status & errors) */}
      <EmailLogsSection />
    </div>
  );
}

function EmailLogsSection() {
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/allocations/email-logs');
        setEmailLogs(res.data || []);
      } catch (err) {
        console.error('Failed to load email logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-900 text-base">Brevo SMTP Email Notification Logs</h2>
          <p className="text-xs text-gray-500">Record of automated emails sent to faculty and drivers upon vehicle assignment</p>
        </div>
        <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded border border-blue-200">
          Brevo Relay (Free)
        </span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-gray-400">Loading email logs...</div>
      ) : emailLogs.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">
          No email notifications recorded yet. Emails will be logged here automatically when allocations are made.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">Timestamp</th>
                <th className="pb-2 font-medium">Recipient</th>
                <th className="pb-2 font-medium">Role</th>
                <th className="pb-2 font-medium">Booking</th>
                <th className="pb-2 font-medium">Subject</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Details / Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {emailLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/80">
                  <td className="py-2.5 text-gray-500">
                    {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 font-medium text-gray-900">{log.recipient}</td>
                  <td className="py-2.5 text-gray-600">{log.recipientRole || '-'}</td>
                  <td className="py-2.5 font-semibold text-blue-600">
                    {log.bookingId ? `#${log.bookingId}` : '-'}
                  </td>
                  <td className="py-2.5 text-gray-700 max-w-xs truncate">{log.subject}</td>
                  <td className="py-2.5">
                    {log.status === 'SENT' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">
                        SENT
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800" title={log.error || ''}>
                        {log.status}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-gray-500 max-w-xs truncate">
                    {log.error || (log.sentAt ? 'Delivered successfully via SMTP' : '-')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

