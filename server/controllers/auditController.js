import AuditLog from '../models/AuditLog.js';
import { asyncHandler } from '../utils/helpers.js';
import {
  ROLE_ACCESS, ROLES, ADMIN_PAGES, ADMIN_RESPONSIBILITIES, ADMIN_ACTION_MATRIX,
  MANAGER_PAGES, MANAGER_RESPONSIBILITIES, MODULE_ACCESS_MATRIX, ACTIONS,
  SALES_PAGES, SALES_RESPONSIBILITIES,
  SUPPORT_PAGES, SUPPORT_RESPONSIBILITIES,
  TECHNICAL_PAGES, TECHNICAL_RESPONSIBILITIES,
  CUSTOMER_PAGES, CUSTOMER_RESPONSIBILITIES,
} from '../constants/permissions.js';

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { module, page = 1, limit = 50 } = req.query;
  const query = module ? { module } : {};
  const total = await AuditLog.countDocuments(query);
  const logs = await AuditLog.find(query)
    .populate('user', 'firstName lastName email role')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));
  res.json({ logs, total, pages: Math.ceil(total / limit) });
});

export const getPermissions = asyncHandler(async (req, res) => {
  res.json({
    roles: ROLES,
    permissions: ROLE_ACCESS,
    moduleAccessMatrix: MODULE_ACCESS_MATRIX,
    actions: ACTIONS,
    admin: {
      pages: ADMIN_PAGES,
      responsibilities: ADMIN_RESPONSIBILITIES,
      actionMatrix: ADMIN_ACTION_MATRIX,
    },
    manager: { pages: MANAGER_PAGES, responsibilities: MANAGER_RESPONSIBILITIES },
    sales: { pages: SALES_PAGES, responsibilities: SALES_RESPONSIBILITIES },
    support: { pages: SUPPORT_PAGES, responsibilities: SUPPORT_RESPONSIBILITIES },
    technical: { pages: TECHNICAL_PAGES, responsibilities: TECHNICAL_RESPONSIBILITIES },
    customer: { pages: CUSTOMER_PAGES, responsibilities: CUSTOMER_RESPONSIBILITIES },
  });
});
