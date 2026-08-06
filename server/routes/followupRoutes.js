import express from 'express';
import {
  getFollowups,
  getFollowup,
  createFollowup,
  updateFollowup,
  completeFollowup,
  deleteFollowup,
  getFollowupStats,
  getFollowupReports,
} from '../controllers/followupController.js';
import { protect } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';

const router = express.Router();
router.use(protect);

router.get('/stats', checkModule('followups'), getFollowupStats);
router.get('/reports', checkModule('followups'), getFollowupReports);
router.route('/')
  .get(checkModule('followups'), getFollowups)
  .post(checkModule('followups', 'create'), createFollowup);
router.post('/:id/complete', checkModule('followups', 'update'), completeFollowup);
router.route('/:id')
  .get(checkModule('followups'), getFollowup)
  .put(checkModule('followups', 'update'), updateFollowup)
  .delete(checkModule('followups', 'delete'), deleteFollowup);

export default router;
