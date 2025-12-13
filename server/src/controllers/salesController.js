import { getDatabase } from '../db/connection.js';
import { ObjectId } from 'mongodb';

export async function createSalesOrder(req, res) {
  const { customer_name, customer_phone, items, currency = 'UGX' } = req.body;

  try {
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Please add at least one item to create an order.' });
    }

    // Validate currency
    if (!['UGX', 'USD'].includes(currency)) {
      return res.status(400).json({ error: 'Please select a valid currency (UGX or USD).' });
    }

    const db = getDatabase();
    const salesOrdersCollection = db.collection('sales_orders');
    const productsCollection = db.collection('products');
    const stockTransactionsCollection = db.collection('stock_transactions');

    // Exchange rate: 1 USD = 3700 UGX (you can update this or store in database)
    const EXCHANGE_RATE = 3700;

    let totalAmount = 0;
    const orderItems = [];
    const productUpdates = [];

    // First validate all items exist and have sufficient stock
    for (const item of items) {
      const product = await productsCollection.findOne({
        _id: new ObjectId(item.product_id)
      });

      if (!product) {
        return res.status(404).json({ error: `Product not found. It may have been deleted. Please refresh and try again.` });
      }

      const availableQty = product.quantity_in_stock !== undefined ? product.quantity_in_stock : product.quantity;
      
      // Use custom_price if provided, otherwise use product's default price
      let productPrice;
      if (item.custom_price !== undefined && item.custom_price !== null && item.custom_price > 0) {
        productPrice = parseFloat(item.custom_price);
      } else {
        productPrice = product.unit_price ? parseFloat(product.unit_price.toString()) : product.price;
      }
      
      // Convert price to order currency if needed (product prices stored in UGX)
      if (currency === 'USD') {
        productPrice = productPrice / EXCHANGE_RATE;
      }
      
      if (availableQty < item.quantity) {
        return res.status(400).json({ 
          error: `Sorry, we don't have enough stock for ${product.name}. Available: ${availableQty} units, but you requested: ${item.quantity} units. Please reduce the quantity.` 
        });
      }

      const itemTotal = productPrice * item.quantity;
      totalAmount += itemTotal;

      // Get cost price for profit calculation
      const costPrice = product.cost_price ? parseFloat(product.cost_price.toString()) : 0;
      const itemProfit = (productPrice - costPrice) * item.quantity;

      orderItems.push({
        product_id: new ObjectId(item.product_id),
        product_name: product.name,
        quantity: item.quantity,
        unit_price: productPrice,
        cost_price: costPrice,
        item_total: itemTotal,
        item_profit: itemProfit,
        custom_price_used: item.custom_price !== undefined && item.custom_price !== null && item.custom_price > 0
      });

      productUpdates.push({
        product_id: new ObjectId(item.product_id),
        quantity: item.quantity
      });
    }

    // Create sales order first
    const result = await salesOrdersCollection.insertOne({
      customer_name,
      customer_phone,
      items: orderItems,
      total_amount: totalAmount,
      currency: currency,
      exchange_rate: EXCHANGE_RATE,
      status: 'completed',
      served_by_user_id: req.user.id,
      served_by_username: req.user.username,
      order_date: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    });

    // Then update inventory for all items
    for (const update of productUpdates) {
      await productsCollection.updateOne(
        { _id: update.product_id },
        { $inc: { quantity_in_stock: -update.quantity } }
      );

      // Log stock transaction
      await stockTransactionsCollection.insertOne({
        product_id: update.product_id,
        transaction_type: 'sale',
        quantity: update.quantity,
        sales_order_id: result.insertedId,
        created_at: new Date()
      });
    }

    res.status(201).json({
      _id: result.insertedId,
      customer_name,
      customer_phone,
      items: orderItems,
      total_amount: totalAmount,
      currency: currency,
      exchange_rate: EXCHANGE_RATE,
      status: 'completed',
      order_date: new Date()
    });
  } catch (error) {
    console.error('Create sales order error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getSalesOrders(req, res) {
  try {
    const db = getDatabase();
    const salesOrdersCollection = db.collection('sales_orders');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build comprehensive search query
    let query = {};
    if (search) {
      // Check if search term is a valid ObjectId
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(search);
      
      if (isObjectId) {
        // Search by ID
        query = { _id: new ObjectId(search) };
      } else {
        // Search across customer fields and status
        query = {
          $or: [
            { customer_name: { $regex: search, $options: 'i' } },
            { customer_phone: { $regex: search, $options: 'i' } },
            { status: { $regex: search, $options: 'i' } }
          ]
        };
      }
    }

    const [orders, total] = await Promise.all([
      salesOrdersCollection
        .find(query)
        .sort({ order_date: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      salesOrdersCollection.countDocuments(query)
    ]);

    res.json({
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get sales orders error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getSalesOrder(req, res) {
  const { id } = req.params;

  try {
    const db = getDatabase();
    const salesOrdersCollection = db.collection('sales_orders');

    const order = await salesOrdersCollection.findOne({
      _id: new ObjectId(id)
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get sales order error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function updateSalesOrder(req, res) {
  const { id } = req.params;
  const { customer_name, customer_phone, items, status } = req.body;

  try {
    const db = getDatabase();
    const salesOrdersCollection = db.collection('sales_orders');
    const productsCollection = db.collection('products');

    // Get existing order
    const existingOrder = await salesOrdersCollection.findOne({
      _id: new ObjectId(id)
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Track changes for audit trail
    const changes = [];
    const editHistory = existingOrder.edit_history || [];

    // Prepare update data
    let updateData = {
      updated_at: new Date()
    };

    if (customer_name && customer_name !== existingOrder.customer_name) {
      updateData.customer_name = customer_name;
      changes.push({
        field: 'customer_name',
        old_value: existingOrder.customer_name,
        new_value: customer_name
      });
    }
    
    if (customer_phone && customer_phone !== existingOrder.customer_phone) {
      updateData.customer_phone = customer_phone;
      changes.push({
        field: 'customer_phone',
        old_value: existingOrder.customer_phone,
        new_value: customer_phone
      });
    }
    
    if (status && status !== existingOrder.status) {
      updateData.status = status;
      changes.push({
        field: 'status',
        old_value: existingOrder.status,
        new_value: status
      });
    }

    // If items are being updated, recalculate total
    if (items && items.length > 0) {
      let totalAmount = 0;
      const orderItems = [];

      // Validate and calculate new items
      for (const item of items) {
        const product = await productsCollection.findOne({
          _id: new ObjectId(item.product_id)
        });

        if (!product) {
          return res.status(404).json({ error: `Product not found: ${item.product_id}` });
        }

        // Use custom_price if provided, otherwise use product's default price
        let productPrice;
        if (item.custom_price !== undefined && item.custom_price !== null && item.custom_price > 0) {
          productPrice = parseFloat(item.custom_price);
        } else {
          productPrice = product.unit_price ? parseFloat(product.unit_price.toString()) : product.price;
        }

        const itemTotal = productPrice * item.quantity;
        totalAmount += itemTotal;

        // Get cost price for profit calculation
        const costPrice = product.cost_price ? parseFloat(product.cost_price.toString()) : 0;
        const itemProfit = (productPrice - costPrice) * item.quantity;

        orderItems.push({
          product_id: new ObjectId(item.product_id),
          product_name: product.name,
          quantity: item.quantity,
          unit_price: productPrice,
          cost_price: costPrice,
          item_total: itemTotal,
          item_profit: itemProfit,
          custom_price_used: item.custom_price !== undefined && item.custom_price !== null && item.custom_price > 0
        });
      }

      updateData.items = orderItems;
      updateData.total_amount = totalAmount;
      
      // Track items and total changes
      changes.push({
        field: 'items',
        old_value: existingOrder.items,
        new_value: orderItems
      });
      changes.push({
        field: 'total_amount',
        old_value: existingOrder.total_amount,
        new_value: totalAmount
      });
    }

    // Add edit history entry if there are changes
    if (changes.length > 0) {
      editHistory.push({
        edited_at: new Date(),
        edited_by_user_id: req.user.id,
        edited_by_username: req.user.username,
        changes: changes
      });
      updateData.edit_history = editHistory;
    }

    // Update order
    const result = await salesOrdersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    const updatedOrder = result.value || result;

    res.json({
      message: 'Sales order updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update sales order error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function deleteSalesOrder(req, res) {
  const { id } = req.params;

  try {
    const db = getDatabase();
    const salesOrdersCollection = db.collection('sales_orders');

    // Check if order exists
    const order = await salesOrdersCollection.findOne({ _id: new ObjectId(id) });
    if (!order) {
      return res.status(404).json({ error: 'Sales order not found' });
    }

    // Delete the order
    await salesOrdersCollection.deleteOne({ _id: new ObjectId(id) });

    res.json({ message: 'Sales order deleted successfully' });
  } catch (error) {
    console.error('Delete sales order error:', error);
    res.status(500).json({ error: error.message });
  }
}
