import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { initializeDatabase } from './db/init.js';
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import customersRoutes from './routes/customers.js';
import salesRoutes from './routes/sales.js';
import invoicesRoutes from './routes/invoices.js';
import reportsRoutes from './routes/reports.js';
import usersRoutes from './routes/users.js';
import returnsRoutes from './routes/returns.js';
import backupRoutes from './routes/backup.js';
import expensesRoutes from './routes/expenses.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' } // Allow images from different origins
}));

// CORS Configuration - Allow all origins in development, specific in production
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://10.177.144.92:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins for easier testing
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    if (allowedOrigins.some(allowedOrigin => origin.startsWith(allowedOrigin))) {
      callback(null, true);
    } else {
      console.log(`⚠️ CORS blocked origin: ${origin}`);
      callback(null, false); // Block but don't throw error
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));

// Sanitize data to prevent NoSQL injection
app.use(mongoSanitize());

// Serve static files (profile pictures)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Initialize database and start server
async function initAndStart() {
  await initializeDatabase();

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/customers', customersRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/invoices', invoicesRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/returns', returnsRoutes);
  app.use('/api/backup', backupRoutes);
  app.use('/api/expenses', expensesRoutes);

  // Error handling
  app.use(errorHandler);

  // Start server with automatic port fallback
  startServer();
}

function startServer(port = PORT) {
  if (port > 5050) {
    console.error('❌ All ports in range are in use');
    process.exit(1);
  }
  
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Server running on:`);
    console.log(`   - Local:   http://localhost:${port}`);
    console.log(`   - Network: http://10.177.144.92:${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying ${port + 1}...`);
      server.close();
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

// Initialize and start
initAndStart().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
  console.error(reason?.stack || reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[CRITICAL] Uncaught Exception:', error);
  console.error(error.stack);
});

// Handle process exit
process.on('exit', (code) => {
  console.log(`[DEBUG] Process exiting with code ${code}`);
});
