import express from 'express';
import { getContacts, getContact, createContact, updateContact, deleteContact } from '../controllers/contactController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getContacts).post(upload.single('avatar'), createContact);
router.route('/:id').get(getContact).put(upload.single('avatar'), updateContact).delete(deleteContact);

export default router;
