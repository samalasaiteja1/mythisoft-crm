import express from 'express';
import { getSettings, updateSettings, addApiKey, revokeApiKey } from '../controllers/settingsController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getSettings).put(authorize('admin', 'manager'), upload.single('logo'), updateSettings);
router.post('/api-keys', authorize('admin'), addApiKey);
router.delete('/api-keys/:keyId', authorize('admin'), revokeApiKey);

export default router;
