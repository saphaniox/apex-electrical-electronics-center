import { getDatabase } from '../db/connection.js';
import { ObjectId } from 'mongodb';
import PDFDocument from 'pdfkit';

export async function generateInvoice(req, res) {
  const { sales_order_id, customer_name, customer_phone, items, notes, currency = 'UGX' } = req.body;

  try {
    // Validate currency
    if (!['UGX', 'USD'].includes(currency)) {
      return res.status(400).json({ error: 'Currency must be either UGX or USD' });
    }

    const db = getDatabase();
    const salesOrdersCollection = db.collection('sales_orders');
    const invoicesCollection = db.collection('invoices');
    const productsCollection = db.collection('products');

    const EXCHANGE_RATE = 3700;

    let invoiceData = {
      customer_name: '',
      customer_phone: '',
      items: [],
      total_amount: 0,
      currency: currency,
      exchange_rate: EXCHANGE_RATE
    };

    // Two modes: from sales order OR direct invoice creation
    if (sales_order_id) {
      // Mode 1: Generate invoice from existing sales order
      const order = await salesOrdersCollection.findOne({
        _id: new ObjectId(sales_order_id)
      });

      if (!order) {
        return res.status(404).json({ error: 'Sales order not found' });
      }

      // Use the order's currency if available, otherwise use requested currency
      const orderCurrency = order.currency || 'UGX';
      const orderExchangeRate = order.exchange_rate || EXCHANGE_RATE;

      invoiceData = {
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        items: order.items,
        total_amount: order.total_amount,
        currency: orderCurrency,
        exchange_rate: orderExchangeRate,
        sales_order_id: new ObjectId(sales_order_id),
        served_by_user_id: order.served_by_user_id || req.user.id,
        served_by_username: order.served_by_username || req.user.username
      };
    } else {
      // Mode 2: Create invoice directly with products
      if (!customer_name || !customer_phone || !items || items.length === 0) {
        return res.status(400).json({ 
          error: 'Customer name, phone, and items are required for direct invoice creation' 
        });
      }

      // Fetch product details and calculate totals
      const invoiceItems = [];
      let totalAmount = 0;

      for (const item of items) {
        const product = await productsCollection.findOne({
          _id: new ObjectId(item.product_id)
        });

        if (!product) {
          return res.status(404).json({ 
            error: `Product not found: ${item.product_id}` 
          });
        }

        const quantity = parseInt(item.quantity);
        
        // Use custom_price if provided, otherwise use product's default price
        let unitPrice;
        if (item.custom_price !== undefined && item.custom_price !== null && item.custom_price > 0) {
          unitPrice = parseFloat(item.custom_price);
        } else {
          unitPrice = parseFloat(product.unit_price.$numberDecimal || product.unit_price);
        }
        
        // Convert price to invoice currency if needed (product prices stored in UGX)
        if (currency === 'USD') {
          unitPrice = unitPrice / EXCHANGE_RATE;
        }

        const itemTotal = unitPrice * quantity;

        // Get cost price for profit calculation
        const costPrice = product.cost_price ? parseFloat(product.cost_price.toString()) : 0;
        const itemProfit = (unitPrice - costPrice) * quantity;

        invoiceItems.push({
          product_id: product._id,
          product_name: product.name,
          quantity: quantity,
          unit_price: unitPrice,
          cost_price: costPrice,
          item_profit: itemProfit,
          custom_price_used: item.custom_price !== undefined && item.custom_price !== null && item.custom_price > 0
        });

        totalAmount += itemTotal;
      }

      invoiceData = {
        customer_name,
        customer_phone,
        items: invoiceItems,
        total_amount: totalAmount,
        currency: currency,
        exchange_rate: EXCHANGE_RATE,
        served_by_user_id: req.user.id,
        served_by_username: req.user.username
      };
    }

    // Generate invoice number
    const invoiceCount = await invoicesCollection.countDocuments();
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${invoiceCount + 1}`;

    // Create invoice
    const invoiceDocument = {
      invoice_number: invoiceNumber,
      customer_name: invoiceData.customer_name,
      customer_phone: invoiceData.customer_phone,
      items: invoiceData.items,
      total_amount: invoiceData.total_amount,
      currency: invoiceData.currency,
      exchange_rate: invoiceData.exchange_rate,
      served_by_user_id: invoiceData.served_by_user_id,
      served_by_username: invoiceData.served_by_username,
      notes: notes || '',
      status: 'generated',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Add sales_order_id if it exists
    if (invoiceData.sales_order_id) {
      invoiceDocument.sales_order_id = invoiceData.sales_order_id;
    }

    const result = await invoicesCollection.insertOne(invoiceDocument);

    res.status(201).json({
      _id: result.insertedId,
      invoice_number: invoiceNumber,
      customer_name: invoiceData.customer_name,
      total_amount: invoiceData.total_amount,
      status: 'generated'
    });
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getInvoices(req, res) {
  try {
    const db = getDatabase();
    const invoicesCollection = db.collection('invoices');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      invoicesCollection
        .find({})
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      invoicesCollection.countDocuments({})
    ]);

    res.json({
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getInvoice(req, res) {
  const { id } = req.params;

  try {
    const db = getDatabase();
    const invoicesCollection = db.collection('invoices');

    const invoice = await invoicesCollection.findOne({
      _id: new ObjectId(id)
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function updateInvoice(req, res) {
  const { id } = req.params;
  const { customer_name, customer_phone, items, notes, status } = req.body;

  try {
    const db = getDatabase();
    const invoicesCollection = db.collection('invoices');
    const productsCollection = db.collection('products');

    // Get existing invoice
    const existingInvoice = await invoicesCollection.findOne({
      _id: new ObjectId(id)
    });

    if (!existingInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Prepare update data
    let updateData = {
      updated_at: new Date()
    };

    if (customer_name) updateData.customer_name = customer_name;
    if (customer_phone) updateData.customer_phone = customer_phone;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;

    // If items are being updated, recalculate total
    if (items && items.length > 0) {
      let totalAmount = 0;
      const invoiceItems = [];

      // Validate and calculate new items
      for (const item of items) {
        const product = await productsCollection.findOne({
          _id: new ObjectId(item.product_id)
        });

        if (!product) {
          return res.status(404).json({ error: `Product not found: ${item.product_id}` });
        }

        const quantity = parseInt(item.quantity);
        const unitPrice = parseFloat(product.unit_price.$numberDecimal || product.unit_price);
        const itemTotal = unitPrice * quantity;

        invoiceItems.push({
          product_id: product._id,
          product_name: product.name,
          quantity: quantity,
          unit_price: unitPrice,
          item_total: itemTotal
        });

        totalAmount += itemTotal;
      }

      updateData.items = invoiceItems;
      updateData.total_amount = totalAmount;
    }

    // Update invoice
    const result = await invoicesCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    const updatedInvoice = result.value || result;

    res.json({
      message: 'Invoice updated successfully',
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function deleteInvoice(req, res) {
  const { id } = req.params;

  try {
    const db = getDatabase();
    const invoicesCollection = db.collection('invoices');

    // Check if invoice exists
    const invoice = await invoicesCollection.findOne({ _id: new ObjectId(id) });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Delete the invoice
    await invoicesCollection.deleteOne({ _id: new ObjectId(id) });

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function downloadInvoice(req, res) {
  const { id } = req.params;

  try {
    const db = getDatabase();
    const invoicesCollection = db.collection('invoices');

    const invoice = await invoicesCollection.findOne({
      _id: new ObjectId(id)
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Generate PDF
    const doc = new PDFDocument();
    const filename = `${invoice.invoice_number}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', 50, 50);
    doc.fontSize(10).font('Helvetica').text(`Invoice #: ${invoice.invoice_number}`, 50, 80);
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 50, 95);
    
    // Served by info (if available)
    if (invoice.served_by_username) {
      doc.text(`Served By: ${invoice.served_by_username}`, 50, 110);
    }

    // Customer info
    const customerYStart = invoice.served_by_username ? 145 : 130;
    doc.fontSize(12).font('Helvetica-Bold').text('Customer Details', 50, customerYStart);
    doc.fontSize(10).font('Helvetica')
      .text(`Name: ${invoice.customer_name}`, 50, customerYStart + 20)
      .text(`Phone: ${invoice.customer_phone}`, 50, customerYStart + 35);

    // Items table
    const itemsYStart = invoice.served_by_username ? 195 : 210;
    doc.fontSize(12).font('Helvetica-Bold').text('Items', 50, itemsYStart);
    
    let yPos = itemsYStart + 25;
    const itemsHeight = 15;
    
    // Table header
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Product', 50, yPos);
    doc.text('Qty', 300, yPos);
    doc.text('Unit Price', 350, yPos);
    doc.text('Total', 450, yPos);
    
    yPos += itemsHeight + 5;
    doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(50, yPos).lineTo(500, yPos).stroke();
    yPos += 10;

    // Items
    const currency = invoice.currency || 'UGX';
    const currencySymbol = currency === 'USD' ? '$' : 'UGX';
    
    doc.fontSize(9).font('Helvetica');
    invoice.items.forEach((item) => {
      doc.text(item.product_name.substring(0, 35), 50, yPos);
      doc.text(item.quantity.toString(), 300, yPos);
      const unitPriceText = currency === 'USD' ? `${currencySymbol}${item.unit_price.toLocaleString()}` : `${currencySymbol} ${item.unit_price.toLocaleString()}`;
      const itemTotalText = currency === 'USD' ? `${currencySymbol}${item.item_total.toLocaleString()}` : `${currencySymbol} ${item.item_total.toLocaleString()}`;
      doc.text(unitPriceText, 350, yPos);
      doc.text(itemTotalText, 450, yPos);
      yPos += itemsHeight;
    });

    yPos += 10;
    doc.strokeColor('#000000').lineWidth(1).moveTo(50, yPos).lineTo(500, yPos).stroke();
    yPos += 15;

    // Total
    const totalText = currency === 'USD' ? `${currencySymbol}${invoice.total_amount.toLocaleString()}` : `${currencySymbol} ${invoice.total_amount.toLocaleString()}`;
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(`Total Amount: ${totalText}`, 350, yPos);

    // Notes
    if (invoice.notes) {
      yPos += 40;
      doc.fontSize(10).font('Helvetica-Bold').text('Notes:', 50, yPos);
      yPos += 15;
      doc.fontSize(9).font('Helvetica').text(invoice.notes, 50, yPos, { width: 450, align: 'left' });
    }

    // Footer
    doc.fontSize(8).font('Helvetica').fillColor('#999999');
    doc.text('Thank you for your business!', 50, doc.page.height - 50, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({ error: error.message });
  }
}
