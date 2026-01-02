import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { generateInvoice, getInvoices, updateInvoice, deleteInvoice } from '../controllers/invoiceController.js';

const router = express.Router();

router.post('/generate', authenticate, authorize('admin'), generateInvoice);
router.get('/', authenticate, getInvoices);
router.put('/:id', authenticate, authorize('admin'), updateInvoice);
router.delete('/:id', authenticate, authorize('admin'), deleteInvoice);

export default router;
