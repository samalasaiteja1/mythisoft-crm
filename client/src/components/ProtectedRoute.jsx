import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessModule } from '../constants/permissions';
import LoadingSpinner from './loaders/LoadingSpinner';

export default function ProtectedRoute({ roles, module }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  if (module && !canAccessModule(user.role, module)) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
}
