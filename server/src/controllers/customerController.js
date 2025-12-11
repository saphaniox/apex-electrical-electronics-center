import { getDatabase } from '../db/connection.js';
import { ObjectId } from 'mongodb';

export async function createCustomer(req, res) {
  const { name, phone, email, address } = req.body;

  try {
    const db = getDatabase();
    const customersCollection = db.collection('customers');

    // Check if customer already exists
    const existing = await customersCollection.findOne({ phone });
    if (existing) {
      return res.status(400).json({ error: `A customer with phone number "${phone}" already exists. Please use a different phone number or update the existing customer.` });
    }

    const result = await customersCollection.insertOne({
      name,
      phone,
      email: email || '',
      address: address || '',
      total_purchases: 0,
      total_spent: 0,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json({
      _id: result.insertedId,
      name,
      phone,
      email,
      address,
      total_purchases: 0,
      total_spent: 0
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getAllCustomers(req, res) {
  try {
    const db = getDatabase();
    const customersCollection = db.collection('customers');

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
        // Search across multiple fields: name, phone, email, address
        query = {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { address: { $regex: search, $options: 'i' } }
          ]
        };
      }
    }

    const [customers, total] = await Promise.all([
      customersCollection
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      customersCollection.countDocuments(query)
    ]);

    // Return both formats for compatibility
    if (req.query.page || req.query.limit) {
      res.json({
        data: customers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } else {
      res.json(customers);
    }
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getCustomer(req, res) {
  const { id } = req.params;

  try {
    const db = getDatabase();
    const customersCollection = db.collection('customers');

    const customer = await customersCollection.findOne({
      _id: new ObjectId(id)
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function updateCustomer(req, res) {
  const { id } = req.params;
  const { name, phone, email, address } = req.body;

  try {
    const db = getDatabase();
    const customersCollection = db.collection('customers');

    const result = await customersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          name,
          phone,
          email,
          
          address,
          updated_at: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    // Handle both old and new MongoDB driver response formats
    const customer = result.value || result;
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getCustomerPurchaseHistory(req, res) {
  const { id } = req.params;

  try {
    const db = getDatabase();
    const customersCollection = db.collection('customers');
    const salesOrdersCollection = db.collection('sales_orders');
    const invoicesCollection = db.collection('invoices');

    // Get customer
    const customer = await customersCollection.findOne({ _id: new ObjectId(id) });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get all sales orders for this customer
    const orders = await salesOrdersCollection
      .find({
        $or: [
          { customer_phone: customer.phone },
          { customer_name: customer.name }
        ]
      })
      .sort({ order_date: -1 })
      .toArray();

    // Get all invoices for this customer
    const invoices = await invoicesCollection
      .find({
        $or: [
          { customer_phone: customer.phone },
          { customer_name: customer.name }
        ]
      })
      .sort({ created_at: -1 })
      .toArray();

    // Calculate statistics
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Get most purchased products
    const productCounts = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        const productName = item.product_name;
        if (productName) {
          productCounts[productName] = (productCounts[productName] || 0) + item.quantity;
        }
      });
    });

    const topProducts = Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));

    // Get last order date
    const lastOrderDate = orders.length > 0 ? orders[0].order_date : null;

    res.json({
      customer: {
        ...customer,
        id: customer._id
      },
      stats: {
        total_orders: totalOrders,
        total_spent: totalSpent,
        avg_order_value: avgOrderValue,
        last_order_date: lastOrderDate
      },
      orders,
      invoices,
      top_products: topProducts
    });
  } catch (error) {
    console.error('Get customer purchase history error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function deleteCustomer(req, res) {
  const { id } = req.params;

  try {
    const db = getDatabase();
    const customersCollection = db.collection('customers');

    const result = await customersCollection.deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted', id });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: error.message });
  }
}
