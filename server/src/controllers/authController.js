import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../db/connection.js';

export async function register(req, res) {
  const { username, email, password } = req.body;

  try {
    // Validate password length
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long for security' });
    }

    const db = getDatabase();
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'This username or email is already registered. Please try a different one.' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    
    const result = await usersCollection.insertOne({
      username,
      email,
      password_hash: hashedPassword,
      role: 'viewer',
      created_at: new Date()
    });

    const newUser = {
      id: result.insertedId,
      username,
      email,
      role: 'viewer'
    };

    const token = jwt.sign(
      { id: result.insertedId, username, role: 'viewer' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function login(req, res) {
  const { username, password } = req.body;

  try {
    const db = getDatabase();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: 'Username not found. Please check your credentials and try again.' });
    }

    const passwordMatch = await bcryptjs.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile_picture: user.profile_picture
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
