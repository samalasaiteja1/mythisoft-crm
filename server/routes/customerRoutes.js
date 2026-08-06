import express from 'express';
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, getCustomerOptions, getCustomerHub } from '../controllers/customerController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/options', getCustomerOptions);
router.get('/hub/:type', getCustomerHub);
router.route('/').get(getCustomers).post(upload.single('avatar'), createCustomer);
router.route('/:id').get(getCustomer).put(upload.single('avatar'), updateCustomer).delete(deleteCustomer);

export default router;
