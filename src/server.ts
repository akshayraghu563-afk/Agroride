import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { auth } from './middleware/auth';

// Import routes
import authRoutes from './routes/auth';
import vehicleRoutes from './routes/vehicles';
import bookingRoutes from './routes/bookings';
import paymentRoutes from './routes/payments';

// Import socket service
import socketService from './lib/socket';

dotenv.config();

const app = express();
const server = createServer(app);

// Initialize Socket.IO
socketService.initialize(server);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.NEXTAUTH_URL
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);

// Protected routes example
app.get('/api/protected', auth, (req, res) => {
  res.json({ message: 'Protected route accessed', user: req.user });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 3001;

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agroride')
  .then(() => {
    console.log('Connected to MongoDB');

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  socketService.shutdown();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  socketService.shutdown();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, server };