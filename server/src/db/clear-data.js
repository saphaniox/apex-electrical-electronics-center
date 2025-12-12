import { connectDatabase, getDatabase } from './connection.js';

async function clearTestData() {
  try {
    console.log('🗑️  Starting to clear test data...');
    
    await connectDatabase();
    const db = getDatabase();
    
    // Clear all collections EXCEPT users
    const collections = [
      'products',
      'sales',
      'customers',
      'invoices',
      'returns'
    ];
    
    for (const collectionName of collections) {
      const result = await db.collection(collectionName).deleteMany({});
      console.log(`✅ Deleted ${result.deletedCount} documents from ${collectionName}`);
    }
    
    console.log('\n🎉 All test data cleared successfully!');
    console.log('📝 Admin user is preserved.');
    console.log('\nYou can now add your real business data:');
    console.log('  - Products');
    console.log('  - Customers');
    console.log('  - Sales Orders');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    process.exit(1);
  }
}

clearTestData();
