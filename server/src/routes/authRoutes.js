import { Router } from 'express';
import { register, login, me, updateMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { uploadAvatar, deleteAvatar, changePassword, deleteAccount } from '../controllers/profileController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.patch('/me', protect, updateMe);
router.delete('/me', protect, deleteAccount);
router.patch('/me/password', protect, changePassword);
router.put('/me/avatar', protect, uploadAvatar);
router.delete('/me/avatar', protect, deleteAvatar);

export default router;
