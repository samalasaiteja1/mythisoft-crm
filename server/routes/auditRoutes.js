import express from 'express';
import { getAuditLogs, getPermissions } from '../controllers/auditController.js';
import { protect, authorize } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';

const router = express.Router();
router.use(protect);
router.get('/permissions', getPermissions);
router.get('/system', checkModule('logs'), getAuditLogs);
router.get('/', checkModule('audit'), getAuditLogs);
export default router;
