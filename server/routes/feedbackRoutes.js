import express from 'express';
import { getFeedbacks, createFeedback, publishFeedback } from '../controllers/feedbackController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.route('/').get(getFeedbacks).post(createFeedback);
router.post('/:id/publish', publishFeedback);

export default router;
