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
    const salesOrdersCollection = db.collection('sales_orders');

    // Get return record
    const returnRecord = await returnsCollection.findOne({ _id: new ObjectId(id) });
    if (!returnRecord) {
      return res.status(404).json({ error: 'Return not found' });
    }

    if (returnRecord.status !== 'pending') {
      return res.status(400).json({ error: `Cannot approve return with status: ${returnRecord.status}` });
    }

    // Get the original sales order
    const salesOrder = await salesOrdersCollection.findOne({ _id: returnRecord.order_id });
    if (!salesOrder) {
      return res.status(404).json({ error: 'Original sales order not found' });
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

    // Update the sales order to reflect the refund
    // Calculate new totals by removing returned items
    const updatedItems = salesOrder.items.map(orderItem => {
      const returnedItem = returnRecord.items.find(
        ri => ri.product_id.toString() === (orderItem.product_id._id || orderItem.product_id).toString()
      );
      
      if (returnedItem) {
        const newQuantity = orderItem.quantity - returnedItem.quantity;
        const newTotal = orderItem.unit_price * newQuantity;
        const newProfit = orderItem.item_profit ? (orderItem.item_profit / orderItem.quantity) * newQuantity : 0;
        
        return {
          ...orderItem,
          quantity: newQuantity,
          total_price: newTotal,
          item_profit: newProfit,
          returned_quantity: (orderItem.returned_quantity || 0) + returnedItem.quantity
        };
      }
      return orderItem;
    }).filter(item => item.quantity > 0); // Remove items with 0 quantity

    // Recalculate order totals
    const newSubtotal = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
    const newTotalProfit = updatedItems.reduce((sum, item) => sum + (item.item_profit || 0), 0);

    // Update the sales order with new totals and refund information
    await salesOrdersCollection.updateOne(
      { _id: returnRecord.order_id },
      {
        $set: {
          items: updatedItems,
          subtotal: newSubtotal,
          total: newSubtotal, // Assuming no additional fees
          total_profit: newTotalProfit,
          has_returns: true,
          total_refunded: (salesOrder.total_refunded || 0) + returnRecord.total_refund_amount,
          updated_at: new Date()
        }
      }
    );

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
      message: 'Return approved, inventory restored, and financials updated',
      return: result.value || result,
      refund_amount: returnRecord.total_refund_amount,
      updated_order_total: newSubtotal
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
