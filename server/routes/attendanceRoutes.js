import express from 'express';
import { getAll, getOne, create, update, remove, getAttendanceStats } from '../controllers/attendanceController.js';
import { protect } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';

const router = express.Router();
router.use(protect);
router.get('/stats', checkModule('attendance'), getAttendanceStats);
router.route('/').get(checkModule('attendance'), getAll).post(checkModule('attendance', 'create'), create);
router.route('/:id').get(checkModule('attendance'), getOne).put(checkModule('attendance', 'update'), update).delete(checkModule('attendance', 'delete'), remove);
export default router;
