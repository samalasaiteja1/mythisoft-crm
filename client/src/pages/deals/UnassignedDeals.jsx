import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import Deals from '../Deals';

export default function UnassignedDeals() {
  const { isAdmin, isManager } = usePermissions();
  if (!isAdmin && !isManager) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Deals unassignedOnly />;
}
