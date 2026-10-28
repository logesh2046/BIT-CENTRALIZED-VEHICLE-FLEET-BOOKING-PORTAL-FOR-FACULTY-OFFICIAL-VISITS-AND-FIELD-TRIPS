import { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDate, VEHICLE_TYPES } from '../../utils/constants';
import { Car, Plus, Edit2, AlertCircle, CheckCircle } from 'lucide-react';

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    registrationNumber: '', vehicleType: '', model: '', seatingCapacity: '',
    status: 'AVAILABLE', insuranceExpiry: '', fitnessExpiry: '', maintenanceInfo: '',
  });

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const resetForm = () => {
    setForm({ registrationNumber: '', vehicleType: '', model: '', seatingCapacity: '', status: 'AVAILABLE', insuranceExpiry: '', fitnessExpiry: '', maintenanceInfo: '' });
    setEditingVehicle(null);
    setShowForm(false);
    setError('');
  };

  const editVehicle = (v) => {
    setForm({
      registrationNumber: v.registrationNumber, vehicleType: v.vehicleType, model: v.model,
      seatingCapacity: v.seatingCapacity.toString(), status: v.status,
      insuranceExpiry: v.insuranceExpiry ? v.insuranceExpiry.split('T')[0] : '',
      fitnessExpiry: v.fitnessExpiry ? v.fitnessExpiry.split('T')[0] : '',
      maintenanceInfo: v.maintenanceInfo || '',
    });
    setEditingVehicle(v);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle.id}`, form);
        setSuccess('Vehicle updated successfully');
      } else {
        await api.post('/vehicles', form);
        setSuccess('Vehicle added successfully');
      }
      resetForm();
      fetchVehicles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save vehicle');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="text-sm text-gray-500">{vehicles.length} vehicles in fleet</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Registration Number *</label>
              <input value={form.registrationNumber} onChange={e => setForm(p => ({ ...p, registrationNumber: e.target.value }))} required className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Type *</label>
              <select value={form.vehicleType} onChange={e => setForm(p => ({ ...p, vehicleType: e.target.value }))} required className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select</option>
                {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Model *</label>
              <input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} required className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Seating Capacity *</label>
              <input type="number" value={form.seatingCapacity} onChange={e => setForm(p => ({ ...p, seatingCapacity: e.target.value }))} required min="1" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                <option value="AVAILABLE">Available</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Insurance Expiry</label>
              <input type="date" value={form.insuranceExpiry} onChange={e => setForm(p => ({ ...p, insuranceExpiry: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fitness Expiry</label>
              <input type="date" value={form.fitnessExpiry} onChange={e => setForm(p => ({ ...p, fitnessExpiry: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Maintenance Info</label>
              <input value={form.maintenanceInfo} onChange={e => setForm(p => ({ ...p, maintenanceInfo: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">{editingVehicle ? 'Update' : 'Add Vehicle'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3">Registration</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Model</th>
                <th className="px-5 py-3">Seats</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Insurance</th>
                <th className="px-5 py-3">Fitness</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {vehicles.map(v => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{v.registrationNumber}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700">{v.vehicleType}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{v.model}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{v.seatingCapacity}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={v.status} /></td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(v.insuranceExpiry)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(v.fitnessExpiry)}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => editVehicle(v)} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
