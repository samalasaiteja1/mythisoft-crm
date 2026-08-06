import express from 'express';
import {
  getLeads, getLead, createLead, updateLead, deleteLead, convertLead,
  getLeadStats, getLeadOptions, assignLead, assignLeadToManager, qualifyLead, convertLeadToDeal, exportLeads, getSalesTeam,
} from '../controllers/leadController.js';
import { protect } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';

const router = express.Router();

router.use(protect);

router.get('/export', checkModule('leads', 'export'), exportLeads);
router.get('/stats', checkModule('leads'), getLeadStats);
router.get('/options', checkModule('leads'), getLeadOptions);
router.get('/team/sales', checkModule('leads', 'assign'), getSalesTeam);
router.route('/').get(checkModule('leads'), getLeads).post(checkModule('leads', 'create'), createLead);
router.post('/:id/assign-manager', checkModule('leads', 'assign'), assignLeadToManager);
router.post('/:id/assign', checkModule('leads', 'assign'), assignLead);
router.post('/:id/qualify', checkModule('leads', 'update'), qualifyLead);
router.post('/:id/convert-deal', checkModule('leads', 'update'), convertLeadToDeal);
router.post('/:id/convert', checkModule('leads', 'update'), convertLead);
router.route('/:id')
  .get(checkModule('leads'), getLead)
  .put(checkModule('leads', 'update'), updateLead)
  .delete(checkModule('leads', 'delete'), deleteLead);

export default router;
