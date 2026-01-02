import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateSalesOrder } from '../middleware/validation.js';
import { createSalesOrder, getSalesOrders, getSalesOrder, updateSalesOrder, deleteSalesOrder } from '../controllers/salesController.js';

const router = express.Router();

router.post('/', authenticate, authorize('admin'), validateSalesOrder, createSalesOrder);
router.get('/', authenticate, getSalesOrders);
router.get('/:id', authenticate, getSalesOrder);
router.put('/:id', authenticate, authorize('admin'), updateSalesOrder);
router.delete('/:id', authenticate, authorize('admin'), deleteSalesOrder);

export default router;
