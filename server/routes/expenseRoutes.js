import express from 'express';
import { getAll, getOne, create, update, remove, approveExpense } from '../controllers/expenseController.js';
import { protect } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';

const router = express.Router();
router.use(protect);
router.route('/').get(checkModule('expenses'), getAll).post(checkModule('expenses', 'create'), create);
router.post('/:id/approve', checkModule('expenses', 'approve'), approveExpense);
router.route('/:id').get(checkModule('expenses'), getOne).put(checkModule('expenses', 'update'), update).delete(checkModule('expenses', 'delete'), remove);
export default router;
