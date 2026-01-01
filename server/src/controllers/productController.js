import { getDatabase } from '../db/connection.js';
import { ObjectId, Decimal128 } from 'mongodb';

export async function createProduct(req, res) {
  const { name, sku, description, price, cost_price = 0, quantity, low_stock_threshold = 10 } = req.body;
  const userId = req.user.id;

  try {
    const db = getDatabase();
    const productsCollection = db.collection('products');

    // Check if SKU already exists
    const existingSku = await productsCollection.findOne({ sku });
    if (existingSku) {
      return res.status(400).json({ error: `This SKU "${sku}" is already in use. Please use a unique SKU for each product.` });
    }

    const sellingPrice = parseFloat(price) || 0;
    const costPrice = parseFloat(cost_price) || 0;
    const profit = sellingPrice - costPrice;
    const profitMargin = sellingPrice > 0 ? ((profit / sellingPrice) * 100) : 0;

    const result = await productsCollection.insertOne({
      user_id: new ObjectId(userId),
      name,
      sku,
      description: description || '',
      unit_price: Decimal128.fromString(String(sellingPrice)),
      cost_price: Decimal128.fromString(String(costPrice)),
      profit: Decimal128.fromString(String(profit)),
      profit_margin: profitMargin,
      quantity_in_stock: parseInt(quantity) || 0,
      low_stock_threshold: parseInt(low_stock_threshold),
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json({
      _id: result.insertedId,
      name,
      sku,
      description: description || '',
      price: parseFloat(price) || 0,
      quantity: parseInt(quantity) || 0,
      created_at: new Date(),
      updated_at: new Date()
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getAllProducts(req, res) {
  try {
    const db = getDatabase();
    const productsCollection = db.collection('products');

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
        // Search across multiple fields: name, SKU, description
        query = {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        };
      }
    }

    // Fetch all products without pagination
    const products = await productsCollection
      .find(query)
      .sort({ created_at: -1 })
      .toArray();

    // Map database fields to API response format
    const mappedProducts = products.map(p => ({
      ...p,
      price: p.unit_price ? parseFloat(p.unit_price.toString()) : (p.price || 0),
      cost_price: p.cost_price ? parseFloat(p.cost_price.toString()) : 0,
      profit: p.profit ? parseFloat(p.profit.toString()) : 0,
      profit_margin: p.profit_margin || 0,
      quantity: p.quantity_in_stock !== undefined ? p.quantity_in_stock : (p.quantity || 0),
      low_stock_threshold: p.low_stock_threshold || 10,
      is_low_stock: (p.quantity_in_stock !== undefined ? p.quantity_in_stock : (p.quantity || 0)) <= (p.low_stock_threshold || 10)
    }));

    res.json({
      data: mappedProducts,
      pagination: {
        total: products.length
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function updateProduct(req, res) {
  const { id } = req.params;
  const { name, sku, description, price, cost_price, quantity, low_stock_threshold } = req.body;

  try {
    const db = getDatabase();
    const productsCollection = db.collection('products');

    const sellingPrice = parseFloat(price) || 0;
    const costPrice = cost_price !== undefined ? parseFloat(cost_price) : undefined;
    
    let updateFields = {
      name,
      sku,
      description: description || '',
      unit_price: Decimal128.fromString(String(sellingPrice)),
      quantity_in_stock: parseInt(quantity) || 0,
      ...(low_stock_threshold !== undefined && { low_stock_threshold: parseInt(low_stock_threshold) }),
      updated_at: new Date()
    };

    // Calculate profit if cost_price is provided
    if (costPrice !== undefined) {
      const profit = sellingPrice - costPrice;
      const profitMargin = sellingPrice > 0 ? ((profit / sellingPrice) * 100) : 0;
      updateFields.cost_price = Decimal128.fromString(String(costPrice));
      updateFields.profit = Decimal128.fromString(String(profit));
      updateFields.profit_margin = profitMargin;
    }

    const result = await productsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: updateFields
      },
      { returnDocument: 'after' }
    );

    // Handle both old and new MongoDB driver response formats
    const product = result.value || result;
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Map database fields to API response format
    res.json({
      ...product,
      price: product.unit_price ? parseFloat(product.unit_price.toString()) : (product.price || 0),
      quantity: product.quantity_in_stock !== undefined ? product.quantity_in_stock : (product.quantity || 0)
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function deleteProduct(req, res) {
  const { id } = req.params;

  try {
    const db = getDatabase();
    const productsCollection = db.collection('products');

    const result = await productsCollection.deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted', id });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getProductDemand(req, res) {
  try {
    const db = getDatabase();
    const salesOrdersCollection = db.collection('sales_orders');
    const productsCollection = db.collection('products');

    // Aggregate sales data to calculate total quantity sold per product
    const salesAggregation = await salesOrdersCollection.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product_id',
          total_sold: { $sum: '$items.quantity' },
          total_revenue: { $sum: '$items.item_total' },
          order_count: { $sum: 1 }
        }
      },
      { $sort: { total_sold: -1 } }
    ]).toArray();

    // Get all products
    const allProducts = await productsCollection.find({}).toArray();
    
    // Create a set of valid product IDs
    const validProductIds = new Set(allProducts.map(p => p._id.toString()));

    // Create a map of product sales data (only for existing products)
    const salesMap = new Map();
    let validSalesCount = 0;
    
    salesAggregation.forEach(sale => {
      const productId = sale._id.toString();
      // Only count sales for products that still exist
      if (validProductIds.has(productId)) {
        salesMap.set(productId, {
          total_sold: sale.total_sold,
          total_revenue: sale.total_revenue,
          order_count: sale.order_count
        });
        validSalesCount++;
      }
    });

    // Calculate overall statistics for demand classification
    const soldQuantities = salesAggregation.map(s => s.total_sold);
    const avgSold = soldQuantities.length > 0 
      ? soldQuantities.reduce((a, b) => a + b, 0) / soldQuantities.length 
      : 0;
    const maxSold = soldQuantities.length > 0 ? Math.max(...soldQuantities) : 0;

    // Classify products by demand level
    const productsWithDemand = allProducts.map(product => {
      const productId = product._id.toString();
      const salesData = salesMap.get(productId) || { 
        total_sold: 0, 
        total_revenue: 0, 
        order_count: 0 
      };

      // Determine demand level based on sales
      let demand_level = 'low';
      if (salesData.total_sold === 0) {
        demand_level = 'none';
      } else if (salesData.total_sold >= avgSold * 1.5) {
        demand_level = 'high';
      } else if (salesData.total_sold >= avgSold * 0.5) {
        demand_level = 'medium';
      }

      return {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        price: product.unit_price ? parseFloat(product.unit_price.toString()) : (product.price || 0),
        current_stock: product.quantity_in_stock !== undefined ? product.quantity_in_stock : (product.quantity || 0),
        total_sold: salesData.total_sold,
        total_revenue: salesData.total_revenue,
        order_count: salesData.order_count,
        demand_level
      };
    });

    // Sort by total sold (descending)
    productsWithDemand.sort((a, b) => b.total_sold - a.total_sold);

    // Separate into high and low demand
    const highDemand = productsWithDemand.filter(p => p.demand_level === 'high');
    const mediumDemand = productsWithDemand.filter(p => p.demand_level === 'medium');
    const lowDemand = productsWithDemand.filter(p => ['low', 'none'].includes(p.demand_level));

    // Calculate products without sales (using valid sales count)
    const productsWithoutSales = allProducts.length - validSalesCount;

    res.json({
      all_products: productsWithDemand,
      high_demand: highDemand,
      medium_demand: mediumDemand,
      low_demand: lowDemand,
      statistics: {
        total_products: allProducts.length,
        products_with_sales: validSalesCount,
        products_without_sales: productsWithoutSales,
        average_sold: Math.round(avgSold * 100) / 100,
        max_sold: maxSold
      }
    });
  } catch (error) {
    console.error('Get product demand error:', error);
    res.status(500).json({ error: error.message });
  }
}
