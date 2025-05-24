import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './Context/AuthContext.jsx';
import ProtectedRoutes from './Utils/ProtectedRoute.jsx';
import AdminRegister from './Pages/RegisterAdmin.jsx';

// Lazy-loaded components
const Login = lazy(() => import('./Pages/Login.jsx'));
const AdminLogin = lazy(() => import('./Pages/AdminLogin.jsx'));
const Register = lazy(() => import('./Pages/Register.jsx'));
const UserDashboard = lazy(() => import('./Pages/UserDashboard.jsx'));
const Dashboard = lazy(() => import('./components/Dashboard.jsx'));
const Home = lazy(() => import('./components/Home.jsx'));
const Students = lazy(() => import('./Pages/Students.jsx'));
const TokenList = lazy(() => import('./Pages/Tokens.jsx'));
const Attendance = lazy(() => import('./Pages/Attendance.jsx'));
const AddAdmin = lazy(() => import('./Pages/AddAdmin.jsx'));
const Settings = lazy(() => import('./Pages/Settings.jsx'));
const Error404 = lazy(() => import('./Pages/Error404.jsx'));

// Fallback component for lazy loading
const LoadingFallback = () => (
 <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
  <div className="relative h-16 w-16">
    <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-t-transparent border-b-transparent border-gradient-to-r from-blue-500 to-purple-500"></div>
    <div className="absolute top-0 left-1/2 h-4 w-4 -ml-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
    <div className="absolute bottom-0 left-1/2 h-4 w-4 -ml-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse delay-150"></div>
  </div>
</div>
);

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/student/login" element={<Login />} />
          <Route path="/student/register" element={<Register />} />
          <Route path="/student/dashboard" element={<UserDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Routes */}

          <Route element={<ProtectedRoutes />}>
            <Route path="/admin/dashboard" element={<Dashboard />}>
              <Route index element={<Home />} />
              <Route path="students" element={<Students />} />
              <Route path="tokens" element={<TokenList />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="add-admin" element={<AddAdmin />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Redirects and Fallback */}
          <Route path="/" element={<Navigate to="/student/login" replace />} />
          <Route path="*" element={<Error404 />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}