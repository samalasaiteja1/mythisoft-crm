import express from 'express';
import {
  getUsers, getUser, createUser, updateUser, deleteUser, getTeams, createTeam, updateTeam, deleteTeam,
  getSalesTeam, getManagers, checkEmailAvailable, changeUserPassword,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import { checkModule } from '../middleware/permissions.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);
router.get('/sales-team', getSalesTeam);
router.get('/managers', getManagers);
router.get('/', checkModule('users'), getUsers);

router.use(authorize('admin'));

router.get('/check-email', checkEmailAvailable);

router.route('/teams')
  .get(getTeams)
  .post(createTeam);

router.route('/teams/:id')
  .put(updateTeam)
  .delete(deleteTeam);

router.post('/', createUser);

router.route('/:id')
  .get(getUser)
  .put(upload.single('avatar'), updateUser)
  .delete(deleteUser);

router.put('/:id/change-password', changeUserPassword);

export default router;
