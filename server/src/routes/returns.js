import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { 
  createReturn, 
  getReturns, 
  getReturn, 
  approveReturn, 
  rejectReturn,
  deleteReturn 
} from '../controllers/returnController.js';

const router = express.Router();

// Create return request
router.post('/', authenticate, createReturn);

// Get all returns
router.get('/', authenticate, getReturns);

// Get single return
router.get('/:id', authenticate, getReturn);

// Approve return (admin only)
router.put('/:id/approve', authenticate, authorize('admin'), approveReturn);

// Reject return (admin only)
router.put('/:id/reject', authenticate, authorize('admin'), rejectReturn);

// Delete return (admin only)
router.delete('/:id', authenticate, authorize('admin'), deleteReturn);

export default router;
