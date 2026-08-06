import express from 'express';
import {
  getDashboard,
  getActivities,
  getCommunications,
  createCommunication,
  getNotes,
  createNote,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getReports,
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/activities', getActivities);
router.get('/communications', getCommunications);
router.post('/communications', createCommunication);
router.get('/notes', getNotes);
router.post('/notes', createNote);
router.get('/notifications', getNotifications);
router.put('/notifications/read-all', markAllNotificationsRead);
router.put('/notifications/:id/read', markNotificationRead);
router.get('/reports', getReports);

export default router;
