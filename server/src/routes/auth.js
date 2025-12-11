import express from 'express';
import { register, login } from '../controllers/authController.js';
import { authLimiter, registerLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting to auth endpoints
router.post('/register', registerLimiter, register);
router.post('/login', authLimiter, login);

export default router;
