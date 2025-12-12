import jwt from 'jsonwebtoken';
import { getDatabase } from '../db/connection.js';
import { ObjectId } from 'mongodb';

export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Fetch fresh user data from database to get current role
    const db = getDatabase();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(decoded.id) });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Use current role from database, not from token
    req.user = {
      id: user._id,
      username: user.username,
      role: user.role // Fresh role from database
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
  };
}
