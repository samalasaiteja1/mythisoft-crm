import express from 'express';
import { getDocuments, createDocument, deleteDocument } from '../controllers/documentController.js';
import { protect } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';
import { documentUpload } from '../middleware/upload.js';

const router = express.Router();
router.use(protect);
router.route('/')
  .get(checkModule('documents', 'read'), getDocuments)
  .post(checkModule('documents', 'create'), documentUpload.single('file'), createDocument);
router.delete('/:id', checkModule('documents', 'delete'), deleteDocument);

export default router;
