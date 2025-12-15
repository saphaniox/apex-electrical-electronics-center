import express from 'express'
import { authenticate } from '../middleware/auth.js'
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

// Create new expense
router.post('/', createExpense)

// Get all expenses with pagination
router.get('/', getAllExpenses)

// Get expenses summary
router.get('/summary', getExpensesSummary)

// Update expense
router.put('/:id', updateExpense)

// Delete expense
router.delete('/:id', deleteExpense)

export default router
