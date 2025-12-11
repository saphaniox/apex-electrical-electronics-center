import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { 
  createBackup, 
  getBackups, 
  restoreBackup, 
  downloadBackup,
  deleteBackup 
} from '../controllers/backupController.js';

const router = express.Router();

// All backup operations are admin-only
router.post('/create', authenticate, authorize('admin'), createBackup);
router.get('/', authenticate, authorize('admin'), getBackups);
router.post('/restore', authenticate, authorize('admin'), restoreBackup);
router.get('/download/:backup_name', authenticate, authorize('admin'), downloadBackup);
router.delete('/:backup_name', authenticate, authorize('admin'), deleteBackup);

export default router;
