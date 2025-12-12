import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL;

async function checkUsers() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('👥 Users in production database:\n');
    
    const users = await db.collection('users').find({}, {
      projection: { username: 1, email: 1, role: 1 }
    }).toArray();
    
    users.forEach(user => {
      console.log(`  - Username: ${user.username}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Role: ${user.role}`);
      console.log('');
    });
    
    console.log(`Total users: ${users.length}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

checkUsers();
