import express from 'express';
import { getDeals, getDeal, createDeal, updateDeal, updateDealStage, deleteDeal, getPipelineStats, convertDealToCustomer, createProjectFromDeal, assignProjectFromDeal, assignDeal } from '../controllers/dealController.js';
import { protect } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';

const router = express.Router();

router.use(protect);

router.get('/pipeline/stats', checkModule('deals'), getPipelineStats);
router.route('/').get(checkModule('deals'), getDeals).post(checkModule('deals', 'create'), createDeal);
router.post('/:id/assign', checkModule('deals', 'assign'), assignDeal);
router.patch('/:id/stage', checkModule('deals', 'update'), updateDealStage);
router.post('/:id/convert-customer', checkModule('deals', 'update'), convertDealToCustomer);
router.post('/:id/create-project', checkModule('projects', 'create'), createProjectFromDeal);
router.post('/:id/assign-project', checkModule('projects', 'assign'), assignProjectFromDeal);
router.route('/:id')
  .get(checkModule('deals'), getDeal)
  .put(checkModule('deals', 'update'), updateDeal)
  .delete(checkModule('deals', 'delete'), deleteDeal);

export default router;
