import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateCustomer } from '../middleware/validation.js';
import { createCustomer, getAllCustomers, getCustomer, updateCustomer, deleteCustomer, getCustomerPurchaseHistory } from '../controllers/customerController.js';

const router = express.Router();

router.post('/', authenticate, validateCustomer, createCustomer);
router.get('/', authenticate, getAllCustomers);
router.get('/:id', authenticate, getCustomer);
router.get('/:id/purchase-history', authenticate, getCustomerPurchaseHistory);
router.put('/:id', authenticate, validateCustomer, updateCustomer);
router.delete('/:id', authenticate, deleteCustomer);

export default router;
