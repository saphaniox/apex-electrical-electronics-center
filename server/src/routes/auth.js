import express from 'express';
import { register, login, refreshToken, logout } from '../controllers/authController.js';
import { authLimiter, registerLimiter } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply rate limiting to auth endpoints
router.post('/register', registerLimiter, register);
router.post('/login', authLimiter, login);

// Refresh token endpoint - get new access token (no rate limit needed, only for valid tokens)
router.post('/refresh', refreshToken);

// Logout endpoint - requires authentication
router.post('/logout', authenticate, logout);

export default router;
