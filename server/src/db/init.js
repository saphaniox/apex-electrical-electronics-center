import { connectDatabase, getDatabase } from './connection.js';

export async function initializeDatabase() {
  try {
    // Connect to MongoDB
    await connectDatabase();
    const db = getDatabase();

    // Initialize collections
    await initializeCollections(db);
    console.log('✅ Database collections initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

async function initializeCollections(db) {
  // Create collections with validation schemas
  const collections = {
    users: {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['username', 'email', 'password_hash'],
          properties: {
            _id: { bsonType: 'objectId' },
            username: { bsonType: 'string' },
            email: { bsonType: 'string' },
            password_hash: { bsonType: 'string' },
            role: { bsonType: 'string', enum: ['admin', 'manager', 'sales', 'viewer'] },
            shop_name: { bsonType: 'string' },
            phone: { bsonType: 'string' },
            created_at: { bsonType: 'date' },
            updated_at: { bsonType: 'date' }
          }
        }
      }
    },
    products: {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['user_id', 'name', 'sku', 'unit_price'],
          properties: {
            _id: { bsonType: 'objectId' },
            user_id: { bsonType: 'objectId' },
            name: { bsonType: 'string' },
            sku: { bsonType: 'string' },
            description: { bsonType: 'string' },
            category: { bsonType: 'string' },
            unit_price: { bsonType: 'decimal' },
            quantity_in_stock: { bsonType: 'int' },
            min_stock_level: { bsonType: 'int' },
            created_at: { bsonType: 'date' },
            updated_at: { bsonType: 'date' }
          }
        }
      }
    },
    customers: {},
    sales_orders: {},
    order_items: {},
    invoices: {},
    stock_transactions: {}
  };

  for (const [collectionName, options] of Object.entries(collections)) {
    try {
      // Create collection if it doesn't exist
      const existingCollections = await db.listCollections({ name: collectionName }).toArray();
      
      if (existingCollections.length === 0) {
        if (options.validator) {
          await db.createCollection(collectionName, options);
        } else {
          await db.createCollection(collectionName);
        }
        console.log(`  ✓ Created collection: ${collectionName}`);
      } else {
        console.log(`  ✓ Collection exists: ${collectionName}`);
      }

      // Create indexes for commonly queried fields
      const collection = db.collection(collectionName);
      
      if (collectionName === 'users') {
        await collection.createIndex({ username: 1 }, { unique: true });
        await collection.createIndex({ email: 1 }, { unique: true });
      } else if (collectionName === 'products') {
        await collection.createIndex({ user_id: 1 });
        await collection.createIndex({ sku: 1 }, { unique: true });
      } else if (collectionName === 'sales_orders') {
        await collection.createIndex({ user_id: 1 });
        await collection.createIndex({ customer_id: 1 });
      } else if (collectionName === 'invoices') {
        await collection.createIndex({ user_id: 1 });
        await collection.createIndex({ order_id: 1 });
        await collection.createIndex({ invoice_number: 1 }, { unique: true });
      }
    } catch (error) {
      console.error(`  ✗ Error with collection ${collectionName}:`, error.message);
    }
  }
}


