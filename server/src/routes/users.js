import express from 'express';
import { getAllUsers, updateUserRole, deleteUser, uploadProfilePicture, deleteProfilePicture, getProfilePicture, adminChangePassword, changeOwnPassword } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Admin only endpoints
router.get('/', authenticate, authorize('admin'), getAllUsers);
router.put('/:id/role', authenticate, authorize('admin'), updateUserRole);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);
router.put('/:userId/password', authenticate, authorize('admin'), adminChangePassword);

// Profile picture endpoints (authenticated users can manage their own)
router.post('/profile-picture', authenticate, upload.single('profile_picture'), uploadProfilePicture);
router.delete('/profile-picture', authenticate, deleteProfilePicture);
router.get('/:userId/profile-picture', authenticate, getProfilePicture);

// Password change endpoint (authenticated users can change their own password)
router.put('/change-password', authenticate, changeOwnPassword);

export default router;
