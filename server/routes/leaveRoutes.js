import express from 'express';
import { getAll, getOne, create, update, remove, approveLeave, rejectLeave } from '../controllers/leaveController.js';
import { protect } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';

const router = express.Router();
router.use(protect);
router.route('/').get(checkModule('leave'), getAll).post(checkModule('leave', 'create'), create);
router.post('/:id/approve', checkModule('leave', 'approve'), approveLeave);
router.post('/:id/reject', checkModule('leave', 'approve'), rejectLeave);
router.route('/:id').get(checkModule('leave'), getOne).put(checkModule('leave', 'update'), update).delete(checkModule('leave', 'delete'), remove);
export default router;
