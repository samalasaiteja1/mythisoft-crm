import express from 'express';
import {
  getAll, getOne, getOptions, create, update, remove,
} from '../controllers/staffRoleController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
const adminOnly = authorize('admin', 'manager');

router.use(protect);

router.get('/options', adminOnly, getOptions);
router.route('/')
  .get(adminOnly, getAll)
  .post(adminOnly, create);
router.route('/:id')
  .get(adminOnly, getOne)
  .put(adminOnly, update)
  .delete(adminOnly, remove);

export default router;
