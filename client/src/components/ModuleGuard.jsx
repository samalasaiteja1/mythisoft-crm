import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessModule } from '../constants/permissions';

export default function ModuleGuard({ module, children }) {
  const { user } = useAuth();
  if (!canAccessModule(user?.role, module)) return <Navigate to="/dashboard" replace />;
  return children;
}
