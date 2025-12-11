import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getDatabase } from '../db/connection.js';

const router = express.Router();

router.get('/sales-summary', authenticate, async (req, res) => {
  try {
    const db = getDatabase();
    const salesOrdersCollection = db.collection('sales_orders');

    const result = await salesOrdersCollection
      .aggregate([
        { $match: { status: { $in: ['pending', 'completed'] } } },
        {
          $group: {
            _id: null,
            total_orders: { $sum: 1 },
            total_sales: { $sum: '$total_amount' },
            avg_order_value: { $avg: '$total_amount' }
          }
        }
      ])
      .toArray();

    const data = result.length > 0 ? result[0] : { total_orders: 0, total_sales: 0, avg_order_value: 0 };

    res.json({
      total_orders: data.total_orders || 0,
      total_sales: data.total_sales || 0,
      avg_order_value: Math.round(data.avg_order_value) || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stock-status', authenticate, async (req, res) => {
  try {
    const db = getDatabase();
    const productsCollection = db.collection('products');

    // Get total products and total items
    const productsResult = await productsCollection
      .aggregate([
        {
          $addFields: {
            qty: { $ifNull: ['$quantity_in_stock', '$quantity'] },
            price_val: {
              $cond: [
                { $eq: [{ $type: '$unit_price' }, 'decimal'] },
                { $toDouble: '$unit_price' },
                { $ifNull: ['$price', 0] }
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            total_products: { $sum: 1 },
            total_items: { $sum: '$qty' },
            total_value: { $sum: { $multiply: ['$qty', '$price_val'] } }
          }
        }
      ])
      .toArray();

    const productsData = productsResult.length > 0 ? productsResult[0] : { total_products: 0, total_items: 0, total_value: 0 };

    res.json({
      total_products: productsData.total_products || 0,
      total_items: productsData.total_items || 0,
      total_inventory_value: Math.round(productsData.total_value) || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/top-products', authenticate, async (req, res) => {
  try {
    const db = getDatabase();
    const orderItemsCollection = db.collection('order_items');
    
    const topProducts = await orderItemsCollection
      .aggregate([
        {
          $group: {
            _id: '$product_id',
            product_name: { $first: '$product_name' },
            total_quantity: { $sum: '$quantity' },
            total_revenue: { $sum: '$item_total' }
          }
        },
        { $sort: { total_quantity: -1 } },
        { $limit: 10 }
      ])
      .toArray();

    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/low-stock', authenticate, async (req, res) => {
  try {
    const db = getDatabase();
    const productsCollection = db.collection('products');

    // Get products where stock is at or below threshold
    const lowStockProducts = await productsCollection
      .find({
        $expr: {
          $lte: [
            { $ifNull: ['$quantity_in_stock', '$quantity'] },
            { $ifNull: ['$low_stock_threshold', 10] }
          ]
        }
      })
      .toArray();

    // Map the products to include alert level
    const mappedProducts = lowStockProducts.map(p => {
      const quantity = p.quantity_in_stock !== undefined ? p.quantity_in_stock : (p.quantity || 0);
      const threshold = p.low_stock_threshold || 10;
      return {
        ...p,
        quantity,
        threshold,
        alert_level: quantity === 0 ? 'critical' : quantity <= threshold * 0.5 ? 'high' : 'medium',
        price: p.unit_price ? parseFloat(p.unit_price.toString()) : (p.price || 0)
      };
    });

    res.json({
      count: mappedProducts.length,
      items: mappedProducts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/sales-trend', authenticate, async (req, res) => {
  try {
    const db = getDatabase();
    const salesOrdersCollection = db.collection('sales_orders');

    // Get sales for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trend = await salesOrdersCollection
      .aggregate([
        { $match: { order_date: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$order_date' } },
            sales: { $sum: '$total_amount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ])
      .toArray();

    res.json(trend);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Daily analytics - revenue and orders for today
router.get('/analytics/daily', authenticate, async (req, res) => {
  try {
    const db = getDatabase();
    const salesOrdersCollection = db.collection('sales_orders');
    const EXCHANGE_RATE = 3700;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyStats = await salesOrdersCollection
      .aggregate([
        { 
          $match: { 
            order_date: { 
              $gte: today, 
              $lt: tomorrow 
            } 
          } 
        },
        {
          $group: {
            _id: '$currency',
            total_revenue: { $sum: '$total_amount' },
            total_orders: { $sum: 1 }
          }
        }
      ])
      .toArray();

    // Calculate totals for both currencies
    let totalRevenueUGX = 0;
    let totalRevenueUSD = 0;
    let totalOrders = 0;

    dailyStats.forEach(stat => {
      totalOrders += stat.total_orders;
      if (stat._id === 'USD') {
        totalRevenueUSD += stat.total_revenue;
        totalRevenueUGX += stat.total_revenue * EXCHANGE_RATE;
      } else {
        totalRevenueUGX += stat.total_revenue;
        totalRevenueUSD += stat.total_revenue / EXCHANGE_RATE;
      }
    });

    res.json({
      period: 'daily',
      date: today.toISOString().split('T')[0],
      total_revenue_ugx: Math.round(totalRevenueUGX),
      total_revenue_usd: Math.round(totalRevenueUSD * 100) / 100,
      total_orders: totalOrders,
      avg_order_value_ugx: totalOrders > 0 ? Math.round(totalRevenueUGX / totalOrders) : 0,
      avg_order_value_usd: totalOrders > 0 ? Math.round((totalRevenueUSD / totalOrders) * 100) / 100 : 0,
      exchange_rate: EXCHANGE_RATE
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Time-based analytics - week, month, 3 months, 6 months, year
router.get('/analytics/period', authenticate, async (req, res) => {
  try {
    const db = getDatabase();
    const salesOrdersCollection = db.collection('sales_orders');
    const { period } = req.query; // week, month, 3months, 6months, year

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    let groupFormat = '%Y-%m-%d';
    let periodLabel = 'Daily';

    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        groupFormat = '%Y-%m-%d';
        periodLabel = 'Last 7 Days';
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        groupFormat = '%Y-%m-%d';
        periodLabel = 'Last 30 Days';
        break;
      case '3months':
        startDate.setMonth(endDate.getMonth() - 3);
        groupFormat = '%Y-W%U';
        periodLabel = 'Last 3 Months (Weekly)';
        break;
      case '6months':
        startDate.setMonth(endDate.getMonth() - 6);
        groupFormat = '%Y-W%U';
        periodLabel = 'Last 6 Months (Weekly)';
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        groupFormat = '%Y-%m';
        periodLabel = 'Last 12 Months (Monthly)';
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    // Get detailed breakdown
    const breakdown = await salesOrdersCollection
      .aggregate([
        { 
          $match: { 
            order_date: { 
              $gte: startDate, 
              $lte: endDate 
            } 
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: groupFormat, date: '$order_date' } },
            revenue: { $sum: '$total_amount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ])
      .toArray();

    // Get overall totals for the period (with currency conversion)
    const EXCHANGE_RATE = 3700;
    const totals = await salesOrdersCollection
      .aggregate([
        { 
          $match: { 
            order_date: { 
              $gte: startDate, 
              $lte: endDate 
            } 
          } 
        },
        {
          $group: {
            _id: '$currency',
            total_revenue: { $sum: '$total_amount' },
            total_orders: { $sum: 1 }
          }
        }
      ])
      .toArray();

    // Calculate totals for both currencies
    let totalRevenueUGX = 0;
    let totalRevenueUSD = 0;
    let totalOrders = 0;

    totals.forEach(stat => {
      totalOrders += stat.total_orders;
      if (stat._id === 'USD') {
        totalRevenueUSD += stat.total_revenue;
        totalRevenueUGX += stat.total_revenue * EXCHANGE_RATE;
      } else {
        totalRevenueUGX += stat.total_revenue;
        totalRevenueUSD += stat.total_revenue / EXCHANGE_RATE;
      }
    });

    res.json({
      period,
      period_label: periodLabel,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      total_revenue_ugx: Math.round(totalRevenueUGX),
      total_revenue_usd: Math.round(totalRevenueUSD * 100) / 100,
      total_orders: totalOrders,
      avg_order_value_ugx: totalOrders > 0 ? Math.round(totalRevenueUGX / totalOrders) : 0,
      avg_order_value_usd: totalOrders > 0 ? Math.round((totalRevenueUSD / totalOrders) * 100) / 100 : 0,
      exchange_rate: EXCHANGE_RATE,
      breakdown: breakdown.map(item => ({
        date: item._id,
        revenue: item.revenue,
        orders: item.orders
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Profit analytics endpoint
router.get('/profit-analytics', authenticate, async (req, res) => {
  try {
    const db = getDatabase();
    const productsCollection = db.collection('products');
    const salesOrdersCollection = db.collection('sales_orders');

    // Get products with profit data
    const products = await productsCollection
      .find({})
      .project({
        name: 1,
        sku: 1,
        unit_price: 1,
        cost_price: 1,
        profit: 1,
        profit_margin: 1,
        quantity_in_stock: 1
      })
      .toArray();

    // Calculate total profit metrics
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    const profitableProducts = products
      .map(p => ({
        ...p,
        price: p.unit_price ? parseFloat(p.unit_price.toString()) : 0,
        cost: p.cost_price ? parseFloat(p.cost_price.toString()) : 0,
        profit: p.profit ? parseFloat(p.profit.toString()) : 0,
        profit_margin: p.profit_margin || 0,
        quantity: p.quantity_in_stock || 0
      }))
      .filter(p => p.profit > 0)
      .sort((a, b) => b.profit_margin - a.profit_margin);

    // Calculate totals
    products.forEach(p => {
      const price = p.unit_price ? parseFloat(p.unit_price.toString()) : 0;
      const cost = p.cost_price ? parseFloat(p.cost_price.toString()) : 0;
      const qty = p.quantity_in_stock || 0;
      
      totalRevenue += price * qty;
      totalCost += cost * qty;
    });

    totalProfit = totalRevenue - totalCost;
    const overallMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

    // Get profit by category (high, medium, low margin)
    const highMargin = profitableProducts.filter(p => p.profit_margin > 30).length;
    const mediumMargin = profitableProducts.filter(p => p.profit_margin > 15 && p.profit_margin <= 30).length;
    const lowMargin = profitableProducts.filter(p => p.profit_margin <= 15).length;

    res.json({
      total_revenue: Math.round(totalRevenue),
      total_cost: Math.round(totalCost),
      total_profit: Math.round(totalProfit),
      overall_margin: parseFloat(overallMargin.toFixed(2)),
      top_profitable_products: profitableProducts.slice(0, 10),
      margin_distribution: {
        high_margin: highMargin,
        medium_margin: mediumMargin,
        low_margin: lowMargin
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
