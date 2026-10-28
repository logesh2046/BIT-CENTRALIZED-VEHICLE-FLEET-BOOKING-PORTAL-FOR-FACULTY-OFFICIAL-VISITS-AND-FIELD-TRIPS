import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';

// Faculty pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import BookVehicle from './pages/faculty/BookVehicle';
import MyRequests from './pages/faculty/MyRequests';

// HOD pages
import HODDashboard from './pages/hod/HODDashboard';
import RequestApprovals from './pages/hod/RequestApprovals';

// Transport pages
import TransportDashboard from './pages/transport/TransportDashboard';
import VehicleAssignment from './pages/transport/VehicleAssignment';

// Driver pages
import DriverDashboard from './pages/driver/DriverDashboard';
import AssignedTrips from './pages/driver/AssignedTrips';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ReportsAnalytics from './pages/admin/ReportsAnalytics';
import AuditTrail from './pages/admin/AuditTrail';

// Shared pages
import BookingHistory from './pages/shared/BookingHistory';
import BookingDetails from './pages/shared/BookingDetails';
import VehicleManagement from './pages/shared/VehicleManagement';
import VehicleAvailability from './pages/shared/VehicleAvailability';
import DriverManagement from './pages/shared/DriverManagement';
import TripTracking from './pages/shared/TripTracking';
import NotificationsPage from './pages/shared/NotificationsPage';
import TripRouteView from './pages/shared/TripRouteView';

export default function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          {/* Direct Trip Planned Route View (from email notifications) */}
          <Route path="/trips/:id/route" element={<TripRouteView />} />
          <Route path="/routes/:id" element={<TripRouteView />} />

          {/* Authenticated Dashboard Routes (wrapped in DashboardLayout) */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Faculty Routes */}
            <Route
              path="/faculty"
              element={
                <ProtectedRoute allowedRoles={['FACULTY']}>
                  <FacultyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/dashboard"
              element={
                <ProtectedRoute allowedRoles={['FACULTY']}>
                  <FacultyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/book"
              element={
                <ProtectedRoute allowedRoles={['FACULTY']}>
                  <BookVehicle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/requests"
              element={
                <ProtectedRoute allowedRoles={['FACULTY']}>
                  <MyRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/availability"
              element={
                <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN', 'HOD', 'TRANSPORT_OFFICER']}>
                  <VehicleAvailability />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/history"
              element={
                <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN', 'HOD', 'TRANSPORT_OFFICER']}>
                  <BookingHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/notifications"
              element={<NotificationsPage />}
            />
            <Route
              path="/faculty/booking/:id"
              element={<BookingDetails />}
            />

            {/* HOD Routes */}
            <Route
              path="/hod"
              element={
                <ProtectedRoute allowedRoles={['HOD', 'ADMIN']}>
                  <HODDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hod/dashboard"
              element={
                <ProtectedRoute allowedRoles={['HOD', 'ADMIN']}>
                  <HODDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hod/approvals"
              element={
                <ProtectedRoute allowedRoles={['HOD', 'ADMIN']}>
                  <RequestApprovals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hod/notifications"
              element={<NotificationsPage />}
            />
            <Route
              path="/hod/booking/:id"
              element={<BookingDetails />}
            />

            {/* Transport Officer Routes */}
            <Route
              path="/transport"
              element={
                <ProtectedRoute allowedRoles={['TRANSPORT_OFFICER', 'ADMIN']}>
                  <TransportDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transport/dashboard"
              element={
                <ProtectedRoute allowedRoles={['TRANSPORT_OFFICER', 'ADMIN']}>
                  <TransportDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transport/assignments"
              element={
                <ProtectedRoute allowedRoles={['TRANSPORT_OFFICER', 'ADMIN']}>
                  <VehicleAssignment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transport/allocations"
              element={
                <ProtectedRoute allowedRoles={['TRANSPORT_OFFICER', 'ADMIN']}>
                  <VehicleAssignment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transport/vehicles"
              element={
                <ProtectedRoute allowedRoles={['TRANSPORT_OFFICER', 'ADMIN']}>
                  <VehicleManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transport/drivers"
              element={
                <ProtectedRoute allowedRoles={['TRANSPORT_OFFICER', 'ADMIN']}>
                  <DriverManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transport/availability"
              element={
                <ProtectedRoute allowedRoles={['TRANSPORT_OFFICER', 'ADMIN']}>
                  <VehicleAvailability />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transport/trips"
              element={
                <ProtectedRoute allowedRoles={['TRANSPORT_OFFICER', 'ADMIN']}>
                  <TripTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transport/notifications"
              element={<NotificationsPage />}
            />
            <Route
              path="/transport/booking/:id"
              element={<BookingDetails />}
            />

            {/* Driver Routes */}
            <Route
              path="/driver"
              element={
                <ProtectedRoute allowedRoles={['DRIVER']}>
                  <DriverDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/dashboard"
              element={
                <ProtectedRoute allowedRoles={['DRIVER']}>
                  <DriverDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/trips"
              element={
                <ProtectedRoute allowedRoles={['DRIVER']}>
                  <AssignedTrips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/trip/:id"
              element={
                <ProtectedRoute allowedRoles={['DRIVER', 'TRANSPORT_OFFICER', 'ADMIN']}>
                  <BookingDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/booking/:id"
              element={
                <ProtectedRoute allowedRoles={['DRIVER', 'TRANSPORT_OFFICER', 'ADMIN']}>
                  <BookingDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/notifications"
              element={<NotificationsPage />}
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/vehicles"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TRANSPORT_OFFICER']}>
                  <VehicleManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/drivers"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TRANSPORT_OFFICER']}>
                  <DriverManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TRANSPORT_OFFICER']}>
                  <ReportsAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AuditTrail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AuditTrail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/history"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <BookingHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={<NotificationsPage />}
            />
            <Route
              path="/admin/booking/:id"
              element={<BookingDetails />}
            />

            {/* Shared Authenticated Routes */}
            <Route path="/bookings" element={<BookingHistory />} />
            <Route path="/bookings/:id" element={<BookingDetails />} />
            <Route path="/vehicles" element={<VehicleManagement />} />
            <Route path="/vehicles/availability" element={<VehicleAvailability />} />
            <Route path="/drivers" element={<DriverManagement />} />
            <Route path="/tracking/:id" element={<TripTracking />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Catch all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
