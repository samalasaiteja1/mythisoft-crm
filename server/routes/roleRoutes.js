import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getRoles, getRoleById, createRole, updateRole, deleteRole } from '../controllers/roleController.js';

const router = express.Router();

router.route('/')
  .get(protect, getRoles)
  .post(protect, authorize('admin'), createRole);

router.route('/:id')
  .get(protect, getRoleById)
  .put(protect, authorize('admin'), updateRole)
  .delete(protect, authorize('admin'), deleteRole);

export default router;
