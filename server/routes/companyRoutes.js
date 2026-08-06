import express from 'express';
import { getCompanies, getCompany, createCompany, updateCompany, deleteCompany } from '../controllers/companyController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getCompanies).post(upload.single('logo'), createCompany);
router.route('/:id').get(getCompany).put(upload.single('logo'), updateCompany).delete(deleteCompany);

export default router;
