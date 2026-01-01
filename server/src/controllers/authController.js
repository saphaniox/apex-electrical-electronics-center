import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getDatabase } from '../db/connection.js';

// Generate a secure refresh token
function generateRefreshToken() {
  return crypto.randomBytes(32).toString('hex');
}

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
  const { username, password, rememberMe } = req.body;

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

    // Generate refresh token for remember-me functionality (7 days)
    let refreshToken = null;
    let refreshTokenExpiry = null;

    if (rememberMe) {
      refreshToken = generateRefreshToken();
      refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Store refresh token in database
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            refresh_token: refreshToken,
            refresh_token_expiry: refreshTokenExpiry,
            last_login: new Date()
          }
        }
      );
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile_picture: user.profile_picture
      },
      token,
      refreshToken: rememberMe ? refreshToken : null,
      expiresIn: 604800 // 7 days in seconds
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Refresh token endpoint - get new access token using refresh token
export async function refreshToken(req, res) {
  const { refreshToken } = req.body;

  try {
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const db = getDatabase();
    const usersCollection = db.collection('users');

    // Find user with this refresh token
    const user = await usersCollection.findOne({
      refresh_token: refreshToken,
      refresh_token_expiry: { $gt: new Date() } // Token not expired
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired refresh token. Please login again.' });
    }

    // Generate new access token
    const newToken = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Token refreshed successfully',
      token: newToken,
      expiresIn: 604800 // 7 days in seconds
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Logout endpoint - revoke refresh token
export async function logout(req, res) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const db = getDatabase();
    const usersCollection = db.collection('users');

    // Remove refresh token from database
    await usersCollection.updateOne(
      { _id: userId },
      {
        $unset: {
          refresh_token: '',
          refresh_token_expiry: ''
        }
      }
    );

    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
