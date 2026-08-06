import express from 'express';
import {
  getAll, getOne, create, update, remove, addComment, escalateTicket, assignTechnical, assignSupport, assignTicketByManager,
  getSupportLogs, confirmResolution, reopenTicket, resolveTicket, sendChangeRequestToTechnical,
  completeTechnicalWork, verifyTicketFix, reviewChangeRequestScope,
  updateTicketWorkStatus, reviewTicketResolution,
} from '../controllers/ticketController.js';
import { protect } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';
import { documentUpload } from '../middleware/upload.js';

const router = express.Router();
router.use(protect);
router.get('/support-logs', checkModule('tickets'), getSupportLogs);
router.route('/').get(checkModule('tickets'), getAll).post(checkModule('tickets', 'create'), documentUpload.array('attachments', 5), create);
router.post('/:id/comments', checkModule('tickets', 'update'), addComment);
router.post('/:id/confirm-resolution', checkModule('tickets', 'update'), confirmResolution);
router.post('/:id/reopen', checkModule('tickets', 'update'), reopenTicket);
router.post('/:id/escalate', checkModule('tickets', 'update'), escalateTicket);
router.post('/:id/resolve', checkModule('tickets', 'update'), resolveTicket);
router.post('/:id/send-to-technical', checkModule('tickets', 'update'), sendChangeRequestToTechnical);
router.post('/:id/review-change-scope', checkModule('tickets', 'update'), reviewChangeRequestScope);
router.post('/:id/complete-technical', checkModule('tickets', 'update'), completeTechnicalWork);
router.post('/:id/verify-fix', checkModule('tickets', 'update'), verifyTicketFix);
router.post('/:id/update-work-status', checkModule('tickets', 'update'), updateTicketWorkStatus);
router.post('/:id/review-resolution', checkModule('tickets', 'update'), reviewTicketResolution);
router.post('/:id/assign-technical', checkModule('tickets', 'assign'), assignTechnical);
router.post('/:id/assign-support', checkModule('tickets', 'assign'), assignSupport);
router.post('/:id/assign-by-manager', checkModule('tickets', 'assign'), assignTicketByManager);
router.route('/:id').get(checkModule('tickets'), getOne).put(checkModule('tickets', 'update'), update).delete(checkModule('tickets', 'delete'), remove);
export default router;
