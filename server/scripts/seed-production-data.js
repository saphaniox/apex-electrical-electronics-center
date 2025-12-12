import { MongoClient, ObjectId, Decimal128 } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/electronics_shop';

const electricalProducts = [
  // Electrical Protection Devices
  { name: 'Phase Monitor 3-Phase PM3P-001', sku: 'PM3P-001', price: 85000, cost_price: 65000, stock: 45, category: 'Protection Devices', description: '3-phase voltage monitor with adjustable delay' },
  { name: 'Digital Voltage Protector DVP-220', sku: 'DVP-220', price: 120000, cost_price: 95000, stock: 30, category: 'Protection Devices', description: 'Automatic voltage regulator and protector' },
  { name: 'Surge Protector SP-6000', sku: 'SP-6000', price: 45000, cost_price: 32000, stock: 60, category: 'Protection Devices', description: '6-outlet surge protection strip' },
  { name: 'Circuit Breaker MCB-32A', sku: 'MCB-32A', price: 12000, cost_price: 8500, stock: 120, category: 'Circuit Breakers', description: '32A miniature circuit breaker' },
  { name: 'RCCB 63A 30mA', sku: 'RCCB-63', price: 75000, cost_price: 58000, stock: 25, category: 'Circuit Breakers', description: 'Residual current circuit breaker' },
  
  // Wiring & Cables
  { name: 'Electrical Cable 2.5mm Twin', sku: 'CAB-2.5T', price: 8500, cost_price: 6200, stock: 200, category: 'Cables', description: 'Per meter - Twin core 2.5mm cable' },
  { name: 'Electrical Cable 4mm Twin', sku: 'CAB-4T', price: 12000, cost_price: 9000, stock: 150, category: 'Cables', description: 'Per meter - Twin core 4mm cable' },
  { name: 'Armoured Cable 6mm', sku: 'CAB-6ARM', price: 18000, cost_price: 13500, stock: 80, category: 'Cables', description: 'Per meter - Armoured 6mm cable' },
  { name: 'Extension Cable 20M Heavy Duty', sku: 'EXT-20HD', price: 95000, cost_price: 72000, stock: 35, category: 'Extension Cables', description: '20 meter heavy duty extension cable' },
  { name: 'Extension Cable 10M Standard', sku: 'EXT-10S', price: 42000, cost_price: 31000, stock: 55, category: 'Extension Cables', description: '10 meter standard extension cable' },
  
  // Switches & Sockets
  { name: 'Wall Socket 13A White', sku: 'SOC-13W', price: 5500, cost_price: 3800, stock: 180, category: 'Sockets', description: 'Single 13A wall socket' },
  { name: 'Wall Socket 13A Double', sku: 'SOC-13D', price: 8500, cost_price: 6200, stock: 140, category: 'Sockets', description: 'Double 13A wall socket' },
  { name: 'Light Switch 1-Gang', sku: 'SW-1G', price: 4200, cost_price: 2900, stock: 200, category: 'Switches', description: 'Single gang light switch' },
  { name: 'Light Switch 2-Gang', sku: 'SW-2G', price: 6800, cost_price: 4800, stock: 160, category: 'Switches', description: 'Double gang light switch' },
  { name: 'Dimmer Switch 400W', sku: 'DIM-400', price: 28000, cost_price: 21000, stock: 40, category: 'Switches', description: 'Rotary dimmer switch 400W' },
  
  // Lighting
  { name: 'LED Bulb 9W Cool White', sku: 'LED-9CW', price: 8000, cost_price: 5500, stock: 250, category: 'Bulbs', description: '9W LED bulb cool white' },
  { name: 'LED Bulb 12W Warm White', sku: 'LED-12WW', price: 10000, cost_price: 7200, stock: 220, category: 'Bulbs', description: '12W LED bulb warm white' },
  { name: 'LED Tube 18W 4ft', sku: 'TUBE-18', price: 18000, cost_price: 13500, stock: 90, category: 'Tubes', description: '18W LED tube 4 feet' },
  { name: 'Emergency Light LED', sku: 'EMERG-LED', price: 45000, cost_price: 34000, stock: 50, category: 'Emergency Lights', description: 'Rechargeable LED emergency light' },
  { name: 'Security Light LED 50W', sku: 'SEC-LED50', price: 65000, cost_price: 48000, stock: 42, category: 'Security Lights', description: 'LED security floodlight 50W' },
  
  // Electronics Components
  { name: 'Soldering Iron 60W', sku: 'SOLD-60', price: 32000, cost_price: 24000, stock: 45, category: 'Tools', description: 'Electric soldering iron 60W' },
  { name: 'Multimeter Digital', sku: 'MULT-DIG', price: 55000, cost_price: 41000, stock: 38, category: 'Testing Equipment', description: 'Digital multimeter with auto-ranging' },
  { name: 'Cable Tester RJ45', sku: 'TEST-RJ45', price: 28000, cost_price: 21000, stock: 30, category: 'Testing Equipment', description: 'Network cable tester' },
  { name: 'Wire Stripper Professional', sku: 'STRIP-PRO', price: 22000, cost_price: 16500, stock: 55, category: 'Tools', description: 'Professional wire stripper tool' },
  { name: 'Crimping Tool RJ45', sku: 'CRIMP-RJ45', price: 35000, cost_price: 26000, stock: 40, category: 'Tools', description: 'Network cable crimping tool' },
  
  // Power & Batteries
  { name: 'UPS 650VA', sku: 'UPS-650', price: 280000, cost_price: 220000, stock: 15, category: 'UPS', description: 'Uninterruptible power supply 650VA' },
  { name: 'UPS 1000VA', sku: 'UPS-1000', price: 450000, cost_price: 360000, stock: 10, category: 'UPS', description: 'Uninterruptible power supply 1000VA' },
  { name: 'Battery 12V 7AH', sku: 'BAT-12V7', price: 45000, cost_price: 34000, stock: 65, category: 'Batteries', description: 'Rechargeable 12V 7AH battery' },
  { name: 'Battery 12V 18AH', sku: 'BAT-12V18', price: 95000, cost_price: 72000, stock: 35, category: 'Batteries', description: 'Rechargeable 12V 18AH battery' },
  { name: 'Solar Panel 100W', sku: 'SOL-100W', price: 280000, cost_price: 220000, stock: 12, category: 'Solar', description: '100W monocrystalline solar panel' },
  
  // Installation Materials
  { name: 'PVC Conduit 20mm (3m)', sku: 'COND-20', price: 5500, cost_price: 3800, stock: 300, category: 'Conduits', description: 'PVC electrical conduit 20mm' },
  { name: 'PVC Conduit 25mm (3m)', sku: 'COND-25', price: 7200, cost_price: 5200, stock: 250, category: 'Conduits', description: 'PVC electrical conduit 25mm' },
  { name: 'Junction Box 4x4', sku: 'JB-4X4', price: 3500, cost_price: 2400, stock: 280, category: 'Junction Boxes', description: '4x4 inch junction box' },
  { name: 'Cable Clips 10mm (100pc)', sku: 'CLIP-10', price: 4500, cost_price: 3100, stock: 150, category: 'Accessories', description: 'Cable clips 10mm pack of 100' },
  { name: 'Insulation Tape Black', sku: 'TAPE-BLK', price: 2500, cost_price: 1800, stock: 320, category: 'Accessories', description: 'Electrical insulation tape' },
  
  // Low Stock Items (to test alerts)
  { name: 'Phase Failure Relay', sku: 'PFR-001', price: 95000, cost_price: 72000, stock: 3, category: 'Protection Devices', description: 'Industrial phase failure relay' },
  { name: 'Motor Starter 7.5HP', sku: 'MS-7.5', price: 180000, cost_price: 140000, stock: 2, category: 'Motor Controls', description: 'Magnetic motor starter 7.5HP' },
  { name: 'Time Delay Relay', sku: 'TDR-12V', price: 42000, cost_price: 32000, stock: 4, category: 'Relays', description: 'Adjustable time delay relay' },
  { name: 'Contactor 32A 3-Phase', sku: 'CONT-32', price: 65000, cost_price: 49000, stock: 5, category: 'Contactors', description: '32A 3-phase contactor' },
  { name: 'Industrial Socket 32A', sku: 'ISOC-32', price: 85000, cost_price: 65000, stock: 3, category: 'Industrial Sockets', description: 'Heavy duty industrial socket' }
];

const customers = [
  { name: 'Kampala Construction Ltd', email: 'info@kampalaconstruction.com', phone: '+256701234567', address: 'Plot 15, Industrial Area, Kampala' },
  { name: 'Elite Electricals Uganda', email: 'sales@eliteelectricals.ug', phone: '+256702345678', address: 'Ntinda Shopping Center, Kampala' },
  { name: 'BuildMart Supplies', email: 'orders@buildmart.ug', phone: '+256703456789', address: 'Naalya, Kampala' },
  { name: 'Tech Solutions Hub', email: 'tech@solutionshub.ug', phone: '+256704567890', address: 'Bukoto, Kampala' },
  { name: 'Nile Contractors', email: 'procurement@nilecontractors.com', phone: '+256705678901', address: 'Muyenga, Kampala' },
  { name: 'Smart Homes Uganda', email: 'info@smarthomes.ug', phone: '+256706789012', address: 'Kololo, Kampala' },
  { name: 'Power Systems Ltd', email: 'sales@powersystems.ug', phone: '+256707890123', address: 'Bugolobi, Kampala' },
  { name: 'Modern Electricals', email: 'contact@modernelectricals.com', phone: '+256708901234', address: 'Wandegeya, Kampala' },
  { name: 'Green Energy Solutions', email: 'info@greenenergy.ug', phone: '+256709012345', address: 'Nakawa, Kampala' },
  { name: 'Royal Hardware Ltd', email: 'royalhardware@gmail.com', phone: '+256700123456', address: 'Kabalagala, Kampala' },
  { name: 'Valley Electronics', email: 'valley.electronics@yahoo.com', phone: '+256711234567', address: 'Namanve Industrial Park' },
  { name: 'Summit Electrical Services', email: 'summit@electrical.ug', phone: '+256712345678', address: 'Kansanga, Kampala' },
  { name: 'City Lights Trading', email: 'citylights@trading.com', phone: '+256713456789', address: 'Ntinda, Kampala' },
  { name: 'Prime Power Distributors', email: 'prime@power.ug', phone: '+256714567890', address: 'Lubowa, Kampala' },
  { name: 'Urban Electrical Supplies', email: 'urban@supplies.com', phone: '+256715678901', address: 'Kyanja, Kampala' }
];

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db();
    
    console.log('✅ Connected successfully!\n');

    // Get admin user to use as product owner
    const adminUser = await db.collection('users').findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('❌ No admin user found. Please create an admin user first.');
      return;
    }
    
    console.log(`📋 Using admin user: ${adminUser.username}\n`);

    // Clear existing data
    console.log('🗑️  Clearing old products, customers, sales, invoices, and returns...');
    await db.collection('products').deleteMany({ user_id: adminUser._id });
    await db.collection('customers').deleteMany({});
    await db.collection('sales').deleteMany({});
    await db.collection('invoices').deleteMany({});
    await db.collection('returns').deleteMany({});
    console.log('✅ Cleared successfully\n');
    
    // Insert Products with correct schema
    console.log('📦 Adding products...');
    const productsToInsert = electricalProducts.map(p => {
      const sellingPrice = parseFloat(p.price) || 0;
      const costPrice = parseFloat(p.cost_price) || 0;
      const profit = sellingPrice - costPrice;
      const profitMargin = sellingPrice > 0 ? ((profit / sellingPrice) * 100) : 0;
      
      return {
        user_id: adminUser._id,
        name: p.name,
        sku: p.sku,
        description: p.description || '',
        category: p.category || '',
        unit_price: Decimal128.fromString(String(sellingPrice)),
        cost_price: Decimal128.fromString(String(costPrice)),
        profit: Decimal128.fromString(String(profit)),
        profit_margin: profitMargin,
        quantity_in_stock: parseInt(p.stock) || 0,
        low_stock_threshold: 10,
        created_at: new Date(),
        updated_at: new Date()
      };
    });
    
    const productsResult = await db.collection('products').insertMany(productsToInsert);
    console.log(`✅ Added ${productsResult.insertedCount} products`);
    
    // Insert Customers
    console.log('👥 Adding customers...');
    const customersResult = await db.collection('customers').insertMany(customers);
    console.log(`✅ Added ${customersResult.insertedCount} customers`);
    
    // Get inserted product and customer IDs
    const allProducts = await db.collection('products').find({}).toArray();
    const allCustomers = await db.collection('customers').find({}).toArray();
    
    // Create Sales Orders (20 sales orders with various statuses)
    console.log('🛒 Creating sales orders...');
    const salesOrders = [];
    const statuses = ['pending', 'processing', 'completed'];
    const now = new Date();
    
    for (let i = 0; i < 25; i++) {
      const customer = allCustomers[Math.floor(Math.random() * allCustomers.length)];
      const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 items per order
      const items = [];
      let totalAmount = 0;
      
      for (let j = 0; j < numItems; j++) {
        const product = allProducts[Math.floor(Math.random() * allProducts.length)];
        const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 quantity
        const amount = product.price * quantity;
        totalAmount += amount;
        
        items.push({
          product_id: product._id.toString(),
          product_name: product.name,
          quantity: quantity,
          unit_price: product.price,
          total: amount
        });
      }
      
      // Random date within last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const orderDate = new Date(now);
      orderDate.setDate(orderDate.getDate() - daysAgo);
      
      salesOrders.push({
        customer_id: customer._id.toString(),
        customer_name: customer.name,
        items: items,
        total_amount: totalAmount,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        created_at: orderDate,
        updated_at: orderDate,
        audit_log: [{
          action: 'created',
          user: 'admin',
          timestamp: orderDate,
          details: 'Sales order created'
        }]
      });
    }
    
    const salesResult = await db.collection('sales').insertMany(salesOrders);
    console.log(`✅ Created ${salesResult.insertedCount} sales orders`);
    
    // Create Invoices (from some of the sales orders)
    console.log('🧾 Creating invoices...');
    const completedOrders = await db.collection('sales')
      .find({ status: { $in: ['processing', 'completed'] } })
      .limit(15)
      .toArray();
    
    const invoices = [];
    const paymentStatuses = ['pending', 'partial', 'paid', 'overdue'];
    let invoiceCounter = 1;
    
    for (const order of completedOrders) {
      const dueDate = new Date(order.created_at);
      dueDate.setDate(dueDate.getDate() + 7); // 7 days payment terms
      
      const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
      let amountPaid = 0;
      
      if (paymentStatus === 'paid') {
        amountPaid = order.total_amount;
      } else if (paymentStatus === 'partial') {
        amountPaid = Math.floor(order.total_amount * (Math.random() * 0.5 + 0.3)); // 30-80% paid
      }
      
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${invoiceCounter}`;
      invoiceCounter++;
      
      invoices.push({
        invoice_number: invoiceNumber,
        sales_order_id: order._id.toString(),
        customer_id: order.customer_id,
        customer_name: order.customer_name,
        customer_phone: allCustomers.find(c => c._id.toString() === order.customer_id)?.phone || '+256700000000',
        items: order.items,
        total_amount: order.total_amount,
        amount_paid: amountPaid,
        balance: order.total_amount - amountPaid,
        payment_status: paymentStatus,
        currency: 'UGX',
        exchange_rate: 1,
        served_by_user_id: adminUser._id,
        served_by_username: adminUser.username,
        notes: '',
        status: 'generated',
        due_date: dueDate,
        created_at: order.created_at,
        updated_at: new Date()
      });
    }
    
    if (invoices.length > 0) {
      const invoicesResult = await db.collection('invoices').insertMany(invoices);
      console.log(`✅ Created ${invoicesResult.insertedCount} invoices`);
    }
    
    // Create some Returns (5 returns with different statuses)
    console.log('↩️  Creating returns...');
    const paidInvoices = await db.collection('invoices')
      .find({ payment_status: 'paid' })
      .limit(5)
      .toArray();
    
    const returns = [];
    const returnStatuses = ['pending', 'approved', 'rejected'];
    const returnReasons = [
      'Defective product',
      'Wrong item delivered',
      'Customer changed mind',
      'Product not as described',
      'Quality issues'
    ];
    
    for (let i = 0; i < Math.min(5, paidInvoices.length); i++) {
      const invoice = paidInvoices[i];
      const returnItem = invoice.items[0]; // Return first item
      const returnQty = Math.min(returnItem.quantity, Math.floor(Math.random() * returnItem.quantity) + 1);
      
      returns.push({
        sales_order_id: invoice.sales_order_id,
        customer_id: invoice.customer_id,
        customer_name: invoice.customer_name,
        items: [{
          product_id: returnItem.product_id,
          product_name: returnItem.product_name,
          quantity: returnQty,
          unit_price: returnItem.unit_price,
          total: returnItem.unit_price * returnQty
        }],
        total_amount: returnItem.unit_price * returnQty,
        reason: returnReasons[Math.floor(Math.random() * returnReasons.length)],
        status: returnStatuses[Math.floor(Math.random() * returnStatuses.length)],
        created_at: new Date(invoice.created_at.getTime() + (1000 * 60 * 60 * 24 * 3)), // 3 days after invoice
        updated_at: new Date()
      });
    }
    
    if (returns.length > 0) {
      const returnsResult = await db.collection('returns').insertMany(returns);
      console.log(`✅ Created ${returnsResult.insertedCount} returns`);
    }
    
    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Products: ${allProducts.length}`);
    console.log(`   - Customers: ${allCustomers.length}`);
    console.log(`   - Sales Orders: ${salesOrders.length}`);
    console.log(`   - Invoices: ${invoices.length}`);
    console.log(`   - Returns: ${returns.length}`);
    console.log('\n✨ Your system is ready for testing!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await client.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

seedDatabase();
