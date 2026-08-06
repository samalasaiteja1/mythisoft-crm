import express from 'express';
import { getAll, getOne, create, update, remove, approveQuotation, sendQuotation } from '../controllers/quotationController.js';
import { protect } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';

const router = express.Router();
router.use(protect);
router.route('/').get(checkModule('quotations'), getAll).post(checkModule('quotations', 'create'), create);
router.post('/:id/approve', checkModule('quotations', 'approve'), approveQuotation);
router.post('/:id/send', checkModule('quotations', 'update'), sendQuotation);
router.route('/:id').get(checkModule('quotations'), getOne).put(checkModule('quotations', 'update'), update).delete(checkModule('quotations', 'delete'), remove);
export default router;
