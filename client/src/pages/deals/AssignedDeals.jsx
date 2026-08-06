import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import Deals from '../Deals';

export default function AssignedDeals() {
  const { isAdmin, isManager } = usePermissions();
  if (!isAdmin && !isManager) {
    return <Navigate to="/deals" replace />;
  }
  return <Deals assignedOnly />;
}
