import express from 'express';
import { getSubscriptions, createSubscription, updateSubscription, getSubscriptionStats } from '../controllers/subscriptionController.js';
import { protect } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';

const router = express.Router();
router.use(protect);
router.get('/stats', checkModule('subscriptions', 'read'), getSubscriptionStats);
router.route('/')
  .get(checkModule('subscriptions', 'read'), getSubscriptions)
  .post(checkModule('subscriptions', 'create'), createSubscription);
router.put('/:id', checkModule('subscriptions', 'update'), updateSubscription);

export default router;
