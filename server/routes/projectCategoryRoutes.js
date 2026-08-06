import express from 'express';
import {
  getAll,
  getOne,
  getOptions,
  create,
  update,
  remove,
} from '../controllers/projectCategoryController.js';
import { protect, authorize } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';

const router = express.Router();
const manage = authorize('admin', 'manager');

router.use(protect);

router.get('/options', checkModule('projects'), getOptions);
router.route('/')
  .get(manage, getAll)
  .post(manage, create);
router.route('/:id')
  .get(manage, getOne)
  .put(manage, update)
  .delete(manage, remove);

export default router;
