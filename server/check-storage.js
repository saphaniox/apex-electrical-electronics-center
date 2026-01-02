import { connectDatabase, getDatabase } from './src/db/connection.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabaseStorage() {
  try {
    await connectDatabase();
    const db = getDatabase();
    
    console.log('\n📊 Database Storage Analysis\n');
    console.log('='.repeat(60));
    
    // Get database statistics
    const stats = await db.stats();
    
    const storageSizeBytes = stats.storageSize || 0;
    const dataSizeBytes = stats.dataSize || 0;
    const indexSizeBytes = stats.indexSize || 0;
    
    // Convert to MB and GB
    const storageSizeMB = (storageSizeBytes / (1024 * 1024)).toFixed(2);
    const storageSizeGB = (storageSizeBytes / (1024 * 1024 * 1024)).toFixed(4);
    const dataSizeMB = (dataSizeBytes / (1024 * 1024)).toFixed(2);
    const indexSizeMB = (indexSizeBytes / (1024 * 1024)).toFixed(2);
    
    console.log('\n📈 Storage Breakdown:');
    console.log(`  Data Size:    ${dataSizeMB} MB`);
    console.log(`  Index Size:   ${indexSizeMB} MB`);
    console.log(`  Total Used:   ${storageSizeMB} MB (${storageSizeGB} GB)`);
    
    // MongoDB Atlas free tier is 512 MB
    const FREE_TIER_LIMIT_MB = 512;
    const usedPercentage = (storageSizeBytes / (FREE_TIER_LIMIT_MB * 1024 * 1024) * 100).toFixed(2);
    const remainingMB = (FREE_TIER_LIMIT_MB - storageSizeMB).toFixed(2);
    
    console.log(`\n🎯 MongoDB Atlas Free Tier (512 MB):`);
    console.log(`  Used:      ${storageSizeMB} MB (${usedPercentage}%)`);
    console.log(`  Remaining: ${remainingMB} MB`);
    
    // Show collections breakdown
    console.log(`\n📦 Collections:`);
    const collections = await db.listCollections().toArray();
    
    let totalCollectionSize = 0;
    for (const collection of collections) {
      const collCount = await db.collection(collection.name).countDocuments();
      
      console.log(`  ${collection.name}:`);
      console.log(`    Count:  ${collCount} documents`);
    }
    
    // Alert if usage is high
    console.log('\n' + '='.repeat(60));
    if (parseFloat(usedPercentage) > 80) {
      console.log('⚠️  WARNING: Database usage is above 80%!');
      console.log('💡 Consider upgrading to a paid cluster or cleanup old data');
    } else if (parseFloat(usedPercentage) > 50) {
      console.log('ℹ️  Database is at moderate usage (50%+)');
    } else {
      console.log('✅ Database usage is healthy!');
    }
    console.log('='.repeat(60) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database storage:', error.message);
    process.exit(1);
  }
}

checkDatabaseStorage();
