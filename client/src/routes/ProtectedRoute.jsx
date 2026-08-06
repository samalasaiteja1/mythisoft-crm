import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/loaders/LoadingSpinner';

export default function ProtectedRoute() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}
