import { ROLE_LABELS } from '../constants/permissions';

export const getRoleLabel = (role) => ROLE_LABELS[role] || role;

export const formatRole = (role) => getRoleLabel(role);
