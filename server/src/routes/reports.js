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
    const orderItemsCollection = db.collection('order_items');

    // Get period from query params (default to 'all')
    const period = req.query.period || 'all';
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch(period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Build date filter for sales orders
    const dateFilter = period === 'all' ? {} : {
      order_date: { $gte: startDate.toISOString().split('T')[0] }
    };

    // Get sales data with product details from order_items
    const salesData = await orderItemsCollection.aggregate([
      {
        $lookup: {
          from: 'sales_orders',
          localField: 'order_id',
          foreignField: '_id',
          as: 'order'
        }
      },
      { $unwind: '$order' },
      {
        $match: {
          'order.status': { $in: ['pending', 'completed'] },
          ...Object.keys(dateFilter).length > 0 && { 'order.order_date': dateFilter.order_date }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $addFields: {
          unit_price: {
            $cond: [
              { $eq: [{ $type: '$unit_price' }, 'decimal'] },
              { $toDouble: '$unit_price' },
              { $ifNull: ['$unit_price', 0] }
            ]
          },
          cost_price: {
            $cond: [
              { $eq: [{ $type: '$product.cost_price' }, 'decimal'] },
              { $toDouble: '$product.cost_price' },
              { $ifNull: ['$product.cost_price', 0] }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$product_id',
          product_name: { $first: '$product.name' },
          total_quantity: { $sum: '$quantity' },
          total_revenue: { $sum: { $multiply: ['$unit_price', '$quantity'] } },
          total_cost: { $sum: { $multiply: ['$cost_price', '$quantity'] } },
          unit_price: { $first: '$unit_price' },
          cost_price: { $first: '$cost_price' }
        }
      },
      {
        $addFields: {
          total_profit: { $subtract: ['$total_revenue', '$total_cost'] },
          profit_margin: {
            $cond: [
              { $gt: ['$total_revenue', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$total_revenue', '$total_cost'] }, '$total_revenue'] }, 100] },
              0
            ]
          },
          profit_per_unit: { $subtract: ['$unit_price', '$cost_price'] }
        }
      }
    ]).toArray();

    // Calculate overall totals
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    salesData.forEach(item => {
      totalRevenue += item.total_revenue || 0;
      totalCost += item.total_cost || 0;
      totalProfit += item.total_profit || 0;
    });

    const overallMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

    // Sort by profit margin for top products
    const sortedProducts = salesData.sort((a, b) => b.profit_margin - a.profit_margin);

    // Get profit margin distribution
    const highMargin = salesData.filter(p => p.profit_margin > 30).length;
    const mediumMargin = salesData.filter(p => p.profit_margin > 15 && p.profit_margin <= 30).length;
    const lowMargin = salesData.filter(p => p.profit_margin <= 15).length;

    // Format top profitable products
    const topProfitableProducts = sortedProducts.slice(0, 10).map(p => ({
      _id: p._id,
      name: p.product_name,
      profit_margin: parseFloat(p.profit_margin.toFixed(2)),
      profit: Math.round(p.profit_per_unit),
      total_sold: p.total_quantity,
      total_profit: Math.round(p.total_profit)
    }));

    // Get period label
    const periodLabels = {
      today: "Today",
      week: "Last 7 Days",
      month: "This Month",
      quarter: "This Quarter",
      year: "This Year",
      all: "All Time"
    };

    res.json({
      period: period,
      period_label: periodLabels[period] || "All Time",
      total_revenue: Math.round(totalRevenue),
      total_cost: Math.round(totalCost),
      total_profit: Math.round(totalProfit),
      overall_margin: parseFloat(overallMargin.toFixed(2)),
      top_profitable_products: topProfitableProducts,
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
