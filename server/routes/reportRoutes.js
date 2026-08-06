import express from 'express';
import { protect } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';
import { getReports, getSalesReport, getLeadReport, getProjectReport } from '../controllers/reportController.js';

const router = express.Router();

router.use(protect);

router.get('/', checkModule('reports', 'read'), getReports);
router.get('/sales', checkModule('reports', 'read'), getSalesReport);
router.get('/leads', checkModule('reports', 'read'), getLeadReport);
router.get('/projects', checkModule('reports', 'read'), getProjectReport);

export default router;
