import { getDatabase } from '../db/connection.js';
import { ObjectId } from 'mongodb';

// Create a new return/refund request
export async function createReturn(req, res) {
  const { order_id, items, reason, refund_method = 'cash' } = req.body;

  try {
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Return must have at least one item' });
    }

    const db = getDatabase();
    const returnsCollection = db.collection('returns');
    const salesOrdersCollection = db.collection('sales_orders');
    const productsCollection = db.collection('products');

    // Verify order exists
    const order = await salesOrdersCollection.findOne({ _id: new ObjectId(order_id) });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Calculate refund amount and validate items
    let refundAmount = 0;
    const returnItems = [];

    for (const item of items) {
      const orderItem = order.items.find(
        oi => oi.product_id.toString() === item.product_id
      );

      if (!orderItem) {
        return res.status(400).json({ 
          error: `Product ${item.product_id} not found in order` 
        });
      }

      if (item.quantity > orderItem.quantity) {
        return res.status(400).json({ 
          error: `Return quantity (${item.quantity}) exceeds ordered quantity (${orderItem.quantity}) for ${orderItem.product_name}` 
        });
      }

      const itemRefund = orderItem.unit_price * item.quantity;
      refundAmount += itemRefund;

      returnItems.push({
        product_id: new ObjectId(item.product_id),
        product_name: orderItem.product_name,
        quantity: item.quantity,
        unit_price: orderItem.unit_price,
        refund_amount: itemRefund
      });
    }

    // Create return record
    const returnRecord = {
      order_id: new ObjectId(order_id),
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      items: returnItems,
      total_refund_amount: refundAmount,
      currency: order.currency || 'UGX',
      reason,
      refund_method,
      status: 'pending',
      created_by_user_id: req.user.id,
      created_by_username: req.user.username,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await returnsCollection.insertOne(returnRecord);

    res.status(201).json({
      message: 'Return request created successfully',
      return: { _id: result.insertedId, ...returnRecord }
    });
  } catch (error) {
    console.error('Create return error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get all returns with pagination
export async function getReturns(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const status = req.query.status;

  try {
    const db = getDatabase();
    const returnsCollection = db.collection('returns');

    let query = {};
    if (status) {
      query.status = status;
    }

    const [returns, total] = await Promise.all([
      returnsCollection
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      returnsCollection.countDocuments(query)
    ]);

    res.json({
      data: returns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get single return by ID
export async function getReturn(req, res) {
  const { id } = req.params;

  try {
    const db = getDatabase();
    const returnsCollection = db.collection('returns');

    const returnRecord = await returnsCollection.findOne({
      _id: new ObjectId(id)
    });

    if (!returnRecord) {
      return res.status(404).json({ error: 'Return not found' });
    }

    res.json(returnRecord);
  } catch (error) {
    console.error('Get return error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Approve return and restore inventory
export async function approveReturn(req, res) {
  const { id } = req.params;

  try {
    const db = getDatabase();
    const returnsCollection = db.collection('returns');
    const productsCollection = db.collection('products');
    const stockTransactionsCollection = db.collection('stock_transactions');

    // Get return record
    const returnRecord = await returnsCollection.findOne({ _id: new ObjectId(id) });
    if (!returnRecord) {
      return res.status(404).json({ error: 'Return not found' });
    }

    if (returnRecord.status !== 'pending') {
      return res.status(400).json({ error: `Cannot approve return with status: ${returnRecord.status}` });
    }

    // Restore inventory for each item
    for (const item of returnRecord.items) {
      // Update product stock
      await productsCollection.updateOne(
        { _id: item.product_id },
        { 
          $inc: { 
            quantity_in_stock: item.quantity,
            quantity: item.quantity 
          } 
        }
      );

      // Create stock transaction record
      await stockTransactionsCollection.insertOne({
        product_id: item.product_id,
        product_name: item.product_name,
        transaction_type: 'return',
        quantity: item.quantity,
        reference_id: returnRecord._id,
        reference_type: 'return',
        performed_by: req.user.id,
        performed_by_username: req.user.username,
        notes: `Return approved - Reason: ${returnRecord.reason}`,
        transaction_date: new Date()
      });
    }

    // Update return status
    const result = await returnsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'approved',
          approved_by_user_id: req.user.id,
          approved_by_username: req.user.username,
          approved_at: new Date(),
          updated_at: new Date()
        } 
      },
      { returnDocument: 'after' }
    );

    res.json({
      message: 'Return approved and inventory restored',
      return: result.value || result
    });
  } catch (error) {
    console.error('Approve return error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Reject return
export async function rejectReturn(req, res) {
  const { id } = req.params;
  const { rejection_reason } = req.body;

  try {
    const db = getDatabase();
    const returnsCollection = db.collection('returns');

    const returnRecord = await returnsCollection.findOne({ _id: new ObjectId(id) });
    if (!returnRecord) {
      return res.status(404).json({ error: 'Return not found' });
    }

    if (returnRecord.status !== 'pending') {
      return res.status(400).json({ error: `Cannot reject return with status: ${returnRecord.status}` });
    }

    const result = await returnsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'rejected',
          rejection_reason,
          rejected_by_user_id: req.user.id,
          rejected_by_username: req.user.username,
          rejected_at: new Date(),
          updated_at: new Date()
        } 
      },
      { returnDocument: 'after' }
    );

    res.json({
      message: 'Return rejected',
      return: result.value || result
    });
  } catch (error) {
    console.error('Reject return error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Delete return (admin only)
export async function deleteReturn(req, res) {
  const { id } = req.params;

  try {
    const db = getDatabase();
    const returnsCollection = db.collection('returns');

    const returnRecord = await returnsCollection.findOne({ _id: new ObjectId(id) });
    if (!returnRecord) {
      return res.status(404).json({ error: 'Return not found' });
    }

    await returnsCollection.deleteOne({ _id: new ObjectId(id) });

    res.json({ message: 'Return deleted successfully' });
  } catch (error) {
    console.error('Delete return error:', error);
    res.status(500).json({ error: error.message });
  }
}
