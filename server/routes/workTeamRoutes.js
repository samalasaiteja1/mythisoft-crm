import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getAll, getOne, create, update, remove, getOptions,
} from '../controllers/workTeamController.js';

const router = express.Router();

router.use(protect);

router.get('/options', getOptions);
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', authorize('admin', 'manager'), create);
router.put('/:id', authorize('admin', 'manager'), update);
router.delete('/:id', authorize('admin'), remove);

export default router;
