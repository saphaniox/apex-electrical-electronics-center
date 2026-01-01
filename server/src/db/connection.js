import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/electronics_shop';

// MongoDB connection options with compression enabled
const clientOptions = {
  compressors: ['zstd', 'snappy', 'zlib'], // Use Zstandard first for best compression, fallback to snappy/zlib
  zlibCompressionLevel: 6, // Compression level for zlib (1-9, where 9 is highest but slower)
};

const client = new MongoClient(mongoUrl, clientOptions);

let db = null;

export async function connectDatabase() {
  try {
    await client.connect();
    db = client.db('electronics_shop');
    console.log('✅ Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return db;
}

export default { connectDatabase, getDatabase };


