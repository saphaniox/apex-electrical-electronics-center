import bcrypt from 'bcryptjs';
import { connectDatabase, getDatabase } from './connection.js';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDatabase();
    const db = getDatabase();
    
    // Create admin user
    const usersCollection = db.collection('users');
    
    // Check if admin exists
    const existingAdmin = await usersCollection.findOne({ username: 'admin' });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin@123456', 10);
      
      await usersCollection.insertOne({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: hashedPassword,
        role: 'admin',
        phone: '+256700000000',
        created_at: new Date(),
        updated_at: new Date()
      });
      
      console.log('✅ Admin user created');
      console.log('   Username: admin');
      console.log('   Password: Admin@123456');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
    
    console.log('✅ Database seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
