import { useAuth } from '../context/AuthContext';
import {
  canAccessModule,
  canPerformAction,
  canWrite as checkWrite,
  ROLE_ACCESS,
  isAdmin as checkIsAdmin,
  isManager as checkIsManager,
  isSales as checkIsSales,
  isTechnical as checkIsTechnical,
  isCustomer as checkIsCustomer,
} from '../constants/permissions';
import { isTechManagerUser } from '../utils/roleContext';

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role;

  return {
    role,
    user,
    isAdmin: checkIsAdmin(role),
    isManager: checkIsManager(role),
    isTechManager: isTechManagerUser(user),
    isSales: checkIsSales(role),
    isTechnical: checkIsTechnical(role),
    isCustomer: checkIsCustomer(role),
    canAccess: (module) => canAccessModule(role, module),
    canWrite: (module) => checkWrite(role, module),
    canAction: (module, action) => canPerformAction(role, module, action),
    permissions: ROLE_ACCESS[role] || {},
  };
}
