import express from 'express';
import { getAll, getOne, create, update, remove } from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';

const router = express.Router();
router.use(protect);
router.route('/').get(checkModule('payments'), getAll).post(checkModule('payments', 'create'), create);
router.route('/:id').get(checkModule('payments'), getOne).put(checkModule('payments', 'update'), update).delete(checkModule('payments', 'delete'), remove);
export default router;
