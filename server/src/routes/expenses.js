import express from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import {
  createExpense,
  getAllExpenses,
  getExpensesSummary,
  updateExpense,
  deleteExpense
} from '../controllers/expensesController.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Create new expense - admin only
router.post('/', authorize('admin', 'manager'), createExpense);

// Get all expenses with pagination
router.get('/', getAllExpenses)

// Get expenses summary
router.get('/summary', getExpensesSummary)

// Update expense - admin only
router.put('/:id', authorize('admin', 'manager'), updateExpense);

// Delete expense - admin only
router.delete('/:id', authorize('admin'), deleteExpense)

export default router
