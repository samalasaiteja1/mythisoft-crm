import express from 'express';
import { register, login, getMe, updateProfile, changePassword, forgotPassword, resetPassword, getCustomerPortalProfile, updateCustomerPortalProfile, checkUserExists } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/check-user', checkUserExists);
router.get('/me', protect, getMe);
router.get('/customer-profile', protect, getCustomerPortalProfile);
router.put('/customer-profile', protect, upload.single('companyLogo'), updateCustomerPortalProfile);
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.put('/change-password', protect, changePassword);

export default router;
