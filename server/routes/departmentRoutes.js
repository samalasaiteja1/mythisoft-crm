import express from 'express';
import { getAll, getOne, create, update, remove } from '../controllers/departmentController.js';
import { protect } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';

const router = express.Router();
router.use(protect);
router.route('/').get(checkModule('departments'), getAll).post(checkModule('departments', 'create'), create);
router.route('/:id').get(checkModule('departments'), getOne).put(checkModule('departments', 'update'), update).delete(checkModule('departments', 'delete'), remove);
export default router;
