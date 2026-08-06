import express from 'express';
import { getPerformance } from '../controllers/performanceController.js';
import { protect } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';

const router = express.Router();
router.use(protect);
router.get('/', checkModule('performance'), getPerformance);
export default router;
