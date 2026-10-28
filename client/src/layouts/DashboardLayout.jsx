import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES, getDashboardPath } from '../utils/constants';
import {
  LayoutDashboard, CalendarPlus, Car, ClipboardList, Bell, History, Clock,
  CheckSquare, Truck, Users, UserCog, BarChart3, FileText, Shield,
  LogOut, Menu, X, ChevronDown, Bus, MapPin, Settings
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';

const menuItems = {
  [ROLES.FACULTY]: [
    { path: '/faculty', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { path: '/faculty/book', icon: CalendarPlus, label: 'Book Vehicle' },
    { path: '/faculty/availability', icon: Car, label: 'Vehicle Availability' },
    { path: '/faculty/requests', icon: ClipboardList, label: 'My Requests' },
    { path: '/faculty/history', icon: History, label: 'Booking History' },
    { path: '/faculty/notifications', icon: Bell, label: 'Notifications' },
  ],
  [ROLES.HOD]: [
    { path: '/hod', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { path: '/hod/approvals', icon: CheckSquare, label: 'Request Approvals' },
    { path: '/hod/notifications', icon: Bell, label: 'Notifications' },
  ],
  [ROLES.TRANSPORT_OFFICER]: [
    { path: '/transport', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { path: '/transport/availability', icon: Car, label: 'Vehicle Availability' },
    { path: '/transport/allocations', icon: Truck, label: 'Vehicle Assignment' },
    { path: '/transport/vehicles', icon: Bus, label: 'Vehicle Management' },
    { path: '/transport/drivers', icon: UserCog, label: 'Driver Management' },
    { path: '/transport/trips', icon: MapPin, label: 'Trip Tracking' },
    { path: '/transport/notifications', icon: Bell, label: 'Notifications' },
  ],
  [ROLES.ADMIN]: [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { path: '/admin/users', icon: Users, label: 'User Management' },
    { path: '/admin/vehicles', icon: Bus, label: 'Vehicle Management' },
    { path: '/admin/drivers', icon: UserCog, label: 'Driver Management' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports & Analytics' },
    { path: '/admin/audit', icon: FileText, label: 'Audit Trail' },
    { path: '/admin/history', icon: History, label: 'Booking History' },
    { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
  ],
  [ROLES.DRIVER]: [
    { path: '/driver', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { path: '/driver/trips', icon: MapPin, label: 'Assigned Trips' },
    { path: '/driver/notifications', icon: Bell, label: 'Notifications' },
  ],
};

const roleLabels = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.HOD]: 'Head of Department',
  [ROLES.FACULTY]: 'Faculty',
  [ROLES.TRANSPORT_OFFICER]: 'Transport Officer',
  [ROLES.DRIVER]: 'Driver',
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const items = menuItems[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-white flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold leading-tight">BIT Fleet</h1>
              <p className="text-[10px] text-slate-400 leading-tight">Vehicle Booking Portal</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden absolute top-4 right-3 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User card at bottom */}
        <div className="px-3 py-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{roleLabels[user?.role]}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
                <Menu className="w-6 h-6" />
              </button>
              <div className="hidden sm:block">
                <h2 className="text-sm font-semibold text-gray-900">
                  Bannari Amman Institute of Technology
                </h2>
                <p className="text-xs text-gray-500">Centralized Vehicle Fleet Booking Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell />
              
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">{user?.name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-2">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <p className="text-xs text-blue-600 font-medium mt-1">{roleLabels[user?.role]}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
