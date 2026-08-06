import express from 'express';
import { getAll, getOne, create, update, remove, sendInvoice, recordPayment } from '../controllers/invoiceController.js';
import { protect } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';

const router = express.Router();
router.use(protect);
router.route('/').get(checkModule('invoices'), getAll).post(checkModule('invoices', 'create'), create);
router.post('/:id/send', checkModule('invoices', 'update'), sendInvoice);
router.post('/:id/payment', checkModule('payments', 'create'), recordPayment);
router.route('/:id').get(checkModule('invoices'), getOne).put(checkModule('invoices', 'update'), update).delete(checkModule('invoices', 'delete'), remove);
export default router;
