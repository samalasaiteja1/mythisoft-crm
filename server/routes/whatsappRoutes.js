import express from 'express';
import { getWhatsAppMessages, sendWhatsAppMessage, getWhatsAppTemplates } from '../controllers/whatsappController.js';
import { protect } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';

const router = express.Router();
router.use(protect);
router.get('/templates', checkModule('whatsapp', 'read'), getWhatsAppTemplates);
router.route('/')
  .get(checkModule('whatsapp', 'read'), getWhatsAppMessages)
  .post(checkModule('whatsapp', 'create'), sendWhatsAppMessage);

export default router;
