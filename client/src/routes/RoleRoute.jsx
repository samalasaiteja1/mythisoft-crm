import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessModule } from '../constants/permissions';

/** Guard route by role list and/or module permission */
export default function RoleRoute({ roles, module }) {
  const { user } = useAuth();

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  if (module && !canAccessModule(user?.role, module)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
