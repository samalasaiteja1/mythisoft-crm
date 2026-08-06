import express from 'express';
import { getAll, getOne, create, update, remove } from '../controllers/meetingController.js';
import { protect } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';

const router = express.Router();
router.use(protect);
router.route('/').get(checkModule('meetings'), getAll).post(checkModule('meetings', 'create'), create);
router.route('/:id').get(checkModule('meetings'), getOne).put(checkModule('meetings', 'update'), update).delete(checkModule('meetings', 'delete'), remove);
export default router;
