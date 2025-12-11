import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateProduct } from '../middleware/validation.js';
import { createProduct, getAllProducts, updateProduct, deleteProduct, getProductDemand } from '../controllers/productController.js';

const router = express.Router();

router.post('/', authenticate, authorize('admin', 'manager'), validateProduct, createProduct);
router.get('/', authenticate, getAllProducts);
router.get('/demand', authenticate, getProductDemand);
router.put('/:id', authenticate, authorize('admin', 'manager'), validateProduct, updateProduct);
router.delete('/:id', authenticate, authorize('admin'), deleteProduct);

export default router;
