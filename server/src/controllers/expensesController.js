import { getDatabase } from '../db/connection.js'
import { ObjectId } from 'mongodb'

/**
 * Create a new expense record
 */
export const createExpense = async (req, res) => {
  try {
    const { amount, description, category, date } = req.body
    const userId = req.user?.userId

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' })
    }

    if (!description || description.trim() === '') {
      return res.status(400).json({ error: 'Description is required' })
    }

    const db = getDatabase()
    const expensesCollection = db.collection('expenses')

    const newExpense = {
      amount: parseFloat(amount),
      description: description.trim(),
      category: category?.trim() || null,
      date: date ? new Date(date) : new Date(),
      user_id: userId,
      username: req.user?.username || 'Unknown',
      created_at: new Date(),
      updated_at: new Date()
    }

    const result = await expensesCollection.insertOne(newExpense)
    const insertedExpense = await expensesCollection.findOne({ _id: result.insertedId })

    res.status(201).json({
      message: 'Expense recorded successfully',
      data: insertedExpense
    })
  } catch (error) {
    console.error('Error creating expense:', error)
    res.status(500).json({ error: 'Failed to record expense' })
  }
}

/**
 * Get all expenses with pagination and filters
 */
export const getAllExpenses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 50
    const skip = (page - 1) * limit

    const { startDate, endDate, category } = req.query

    const db = getDatabase()
    const expensesCollection = db.collection('expenses')

    // Build filter
    const filter = {}
    
    if (startDate || endDate) {
      filter.date = {}
      if (startDate) filter.date.$gte = new Date(startDate)
      if (endDate) filter.date.$lte = new Date(endDate)
    }

    if (category && category !== 'all') {
      filter.category = category
    }

    const expenses = await expensesCollection
      .find(filter)
      .sort({ date: -1, created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await expensesCollection.countDocuments(filter)

    res.json({
      data: expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    res.status(500).json({ error: 'Failed to fetch expenses' })
  }
}

/**
 * Get expenses summary for a date range
 */
export const getExpensesSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const db = getDatabase()
    const expensesCollection = db.collection('expenses')

    const filter = {}
    if (startDate || endDate) {
      filter.date = {}
      if (startDate) filter.date.$gte = new Date(startDate)
      if (endDate) filter.date.$lte = new Date(endDate)
    }

    const summary = await expensesCollection.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]).toArray()

    // Get breakdown by category
    const byCategory = await expensesCollection.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]).toArray()

    res.json({
      totalExpenses: summary[0]?.totalExpenses || 0,
      totalCount: summary[0]?.count || 0,
      byCategory: byCategory.map(item => ({
        category: item._id || 'Uncategorized',
        total: item.total,
        count: item.count
      }))
    })
  } catch (error) {
    console.error('Error fetching expenses summary:', error)
    res.status(500).json({ error: 'Failed to fetch expenses summary' })
  }
}

/**
 * Update an expense record
 */
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params
    const { amount, description, category, date } = req.body

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid expense ID' })
    }

    const db = getDatabase()
    const expensesCollection = db.collection('expenses')
    
    const updateData = {
      updated_at: new Date()
    }

    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0' })
      }
      updateData.amount = parseFloat(amount)
    }

    if (description !== undefined) {
      if (description.trim() === '') {
        return res.status(400).json({ error: 'Description cannot be empty' })
      }
      updateData.description = description.trim()
    }

    if (category !== undefined) {
      updateData.category = category?.trim() || null
    }

    if (date !== undefined) {
      updateData.date = new Date(date)
    }

    const result = await expensesCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (!result) {
      return res.status(404).json({ error: 'Expense not found' })
    }

    res.json({
      message: 'Expense updated successfully',
      data: result
    })
  } catch (error) {
    console.error('Error updating expense:', error)
    res.status(500).json({ error: 'Failed to update expense' })
  }
}

/**
 * Delete an expense record
 */
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid expense ID' })
    }

    const db = getDatabase()
    const expensesCollection = db.collection('expenses')

    const result = await expensesCollection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Expense not found' })
    }

    res.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    res.status(500).json({ error: 'Failed to delete expense' })
  }
}


