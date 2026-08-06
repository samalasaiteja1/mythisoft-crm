import express from 'express';
import {
  getAll, getOne, create, update, remove,
} from '../controllers/milestoneController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
const canManage = authorize('admin', 'manager', 'technical');

router.use(protect);

router.route('/')
  .get(canManage, getAll)
  .post(canManage, create);
router.route('/:id')
  .get(canManage, getOne)
  .put(canManage, update)
  .delete(canManage, remove);

export default router;
