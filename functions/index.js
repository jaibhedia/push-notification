const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({ 
  origin: true,
  credentials: true 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Import routes
const deviceRoutes = require('./src/routes/devices');
const notificationRoutes = require('./src/routes/notifications');

// Initialize database and Firebase
const { initializeDatabase } = require('./src/models/database');
const { initializeFirebase } = require('./src/services/firebaseService');

// Initialize services
async function initializeServices() {
  try {
    await initializeDatabase();
    console.log('✅ Database initialized');
    
    await initializeFirebase();
    console.log('✅ Firebase initialized');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
  }
}

// Initialize services on startup
initializeServices();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'push-notification-api'
  });
});

// API routes
app.use('/api/devices', deviceRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`
  });
});

// Export the Express app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);
