import express from 'express';
import { getAll, getOne, create, update, remove, updateWorkflowStage, getTechnicalTeam, getSupportTeam, assignProjectTeam, uploadProjectRequirementsDocument, getProjectRequirementsDocuments, listAssignedRequirementsDocuments, getProjectDeliveryDocuments, listAssignedDeliveryDocuments, uploadProjectDeliveryDocument, uploadCustomerRequirementsDocument, getProjectCustomerRequirementsDocuments, listCustomerRequirementsDocuments, handoffProjectToSupport, listSupportHandoffDocuments, getSupportReviewQueue, reviewSupportHandoff, startUpdateRequestFix, resubmitProjectToSupport, verifySupportFix, acceptProject, markCustomerAcceptanceByManager, assignSupportTeamToProject } from '../controllers/projectController.js';
import {
  getProjectSupportTasks,
  getMySupportTasks,
  completeSupportProjectTask,
  verifySupportProjectTasks,
  submitProjectToCustomer,
  createSupportProjectTask,
  getSupportTaskAssignees,
  getSupportTaskTeamMembers,
  getSupportTaskProjects,
  getSupportProjectTask,
  getSupportManagerCreatedTasks,
  deleteSupportProjectTask,
  addSupportTaskProgress,
  getSupportMainTaskBatch,
  approveSupportMainTaskBatch,
} from '../controllers/supportProjectTaskController.js';
import { protect } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';
import { upload, documentUpload } from '../middleware/upload.js';

const router = express.Router();
router.use(protect);
router.get('/team/technical', checkModule('projects'), getTechnicalTeam);
router.get('/team/support', checkModule('projects'), getSupportTeam);
router.get('/support-handoff-documents', checkModule('projects'), listSupportHandoffDocuments);
router.get('/support-task-projects', checkModule('supportTasks'), getSupportTaskProjects);
router.get('/support-task-assignees', checkModule('supportTasks'), getSupportTaskAssignees);
router.get('/support-task-team-members', checkModule('supportTasks'), getSupportTaskTeamMembers);
router.get('/my-support-tasks', checkModule('supportTasks'), getMySupportTasks);
router.get('/support-manager-tasks', checkModule('supportTasks'), getSupportManagerCreatedTasks);
router.get('/support-review-queue', checkModule('projects'), getSupportReviewQueue);
router.get('/requirements-documents', checkModule('projects'), listAssignedRequirementsDocuments);
router.get('/customer-requirements-documents', checkModule('projects'), listCustomerRequirementsDocuments);
router.get('/delivery-documents', checkModule('projects'), listAssignedDeliveryDocuments);
router.route('/').get(checkModule('projects'), getAll).post(checkModule('projects', 'create'), create);
router.patch('/:id/workflow', checkModule('projects', 'update'), updateWorkflowStage);
router.patch('/:id/assign-team', checkModule('projects', 'assign'), assignProjectTeam);
router.get('/:id/requirements-documents', checkModule('projects'), getProjectRequirementsDocuments);
router.get('/:id/customer-requirements-documents', checkModule('projects'), getProjectCustomerRequirementsDocuments);
router.get('/:id/delivery-documents', checkModule('projects'), getProjectDeliveryDocuments);
router.post('/:id/requirements-document', checkModule('projects', 'assign'), documentUpload.single('file'), uploadProjectRequirementsDocument);
router.post('/:id/customer-requirements-document', checkModule('projects', 'create'), documentUpload.single('file'), uploadCustomerRequirementsDocument);
router.post('/:id/delivery-document', checkModule('projects', 'update'), documentUpload.single('file'), uploadProjectDeliveryDocument);
router.post('/:id/handoff-to-support', checkModule('projects', 'assign'), handoffProjectToSupport);
router.post('/:id/support-review', checkModule('projects', 'update'), reviewSupportHandoff);
router.get('/:id/support-tasks', checkModule('supportTasks'), getProjectSupportTasks);
router.post('/:id/support-tasks', checkModule('supportTasks', 'create'), documentUpload.single('file'), createSupportProjectTask);
router.get('/:id/support-tasks/:taskId', checkModule('supportTasks'), getSupportProjectTask);
router.post('/:id/support-tasks/:taskId/complete', checkModule('supportTasks', 'update'), completeSupportProjectTask);
router.post('/:id/support-tasks/:taskId/progress', checkModule('supportTasks', 'update'), documentUpload.single('file'), addSupportTaskProgress);
router.get('/:id/support-task-batches/:batchId', checkModule('supportTasks'), getSupportMainTaskBatch);
router.post('/:id/support-task-batches/:batchId/approve', checkModule('supportTasks', 'update'), approveSupportMainTaskBatch);
router.delete('/:id/support-tasks/:taskId', checkModule('supportTasks', 'delete'), deleteSupportProjectTask);
router.post('/:id/verify-support-tasks', checkModule('supportTasks', 'update'), verifySupportProjectTasks);
router.post('/:id/submit-to-customer', checkModule('projects', 'update'), submitProjectToCustomer);
router.post('/:id/assign-support-team', checkModule('projects', 'update'), assignSupportTeamToProject);
router.post('/:id/start-update-fix', checkModule('projects', 'update'), startUpdateRequestFix);
router.post('/:id/resubmit-to-support', checkModule('projects', 'update'), resubmitProjectToSupport);
router.post('/:id/verify-support-fix', checkModule('projects', 'update'), verifySupportFix);
router.post('/:id/accept', checkModule('projects', 'approve'), acceptProject);
router.post('/:id/mark-customer-acceptance', checkModule('projects', 'update'), markCustomerAcceptanceByManager);
router.route('/:id').get(checkModule('projects'), getOne).put(checkModule('projects', 'update'), update).delete(checkModule('projects', 'delete'), remove);
export default router;
