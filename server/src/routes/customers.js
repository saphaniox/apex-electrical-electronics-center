import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateCustomer } from '../middleware/validation.js';
import { createCustomer, getAllCustomers, getCustomer, updateCustomer, deleteCustomer, getCustomerPurchaseHistory } from '../controllers/customerController.js';

const router = express.Router();

router.post('/', authenticate, authorize('admin'), validateCustomer, createCustomer);
router.get('/', authenticate, getAllCustomers);
router.get('/:id', authenticate, getCustomer);
router.get('/:id/purchase-history', authenticate, getCustomerPurchaseHistory);
router.put('/:id', authenticate, authorize('admin'), validateCustomer, updateCustomer);
router.delete('/:id', authenticate, authorize('admin'), deleteCustomer);

export default router;
