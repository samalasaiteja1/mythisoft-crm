import { canAccessModule, canPerformAction } from '../constants/permissions.js';

export const checkModule = (module, action = 'read') => (req, res, next) => {
  const role = req.user?.role;
  if (!canAccessModule(role, module)) {
    return res.status(403).json({ message: 'Access denied to this module' });
  }
  if (!canPerformAction(role, module, action)) {
    return res.status(403).json({ message: `Action '${action}' not allowed on ${module}` });
  }
  next();
};
