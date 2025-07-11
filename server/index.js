const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Debug environment variables
console.log('🔧 Environment Variables Debug:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   PORT:', process.env.PORT);
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('   JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);

const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const analyticsRoutes = require('./routes/analytics');
const shiftRoutes = require('./routes/shifts');
const uspsLabelsRoute = require('./routes/uspsLabels');
const uspsGoalsRoute = require('./routes/uspsGoals');
const auraNestRoutes = require('./routes/auraNest');
const inventoryRoutes = require('./routes/inventory');
const ordersRoutes = require('./routes/orders');
const transactionsRoutes = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced logging middleware
app.use((req, res, next) => {
  console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http://localhost:5000", "https://gamma-management-system-production.up.railway.app"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https://gamma-management-system-production.up.railway.app", "http://localhost:5000", "https://localhost:5000"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('combined'));
app.use(cors({
  origin: ['https://gamma-management-system-production.up.railway.app', 'http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection with enhanced retry logic
const connectDB = async () => {
  let retries = 0;
  const maxRetries = 10;
  
  const attemptConnection = async () => {
    try {
      const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://msubhan6612:fICMiSbzLjPCotWF@cluster0.ilp6wrn.mongodb.net/employee-attendance?retryWrites=true&w=majority';
      
      console.log(`🔄 Attempting MongoDB connection (attempt ${retries + 1}/${maxRetries})...`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Port: ${PORT}`);
      
      await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 1,
        maxIdleTimeMS: 30000,
        retryWrites: true,
        w: 'majority'
      });
      
      console.log('✅ Connected to MongoDB Atlas');
      console.log(`   Database: ${mongoose.connection.name}`);
      console.log(`   Host: ${mongoose.connection.host}`);
      console.log(`   Ready State: ${mongoose.connection.readyState}`);
      
      // Test the connection with a simple query
      try {
        const Employee = mongoose.model('Employee');
        const employeeCount = await Employee.countDocuments();
        console.log(`   Employee count: ${employeeCount}`);
        
        if (employeeCount === 0) {
          console.log('⚠️  Warning: No employees found in database');
        }
      } catch (queryError) {
        console.log('⚠️  Warning: Could not query employees:', queryError.message);
      }
      
    } catch (err) {
      retries++;
      console.error(`❌ MongoDB connection error (attempt ${retries}/${maxRetries}):`, err.message);
      console.error(`   Error code: ${err.code}`);
      console.error(`   Error name: ${err.name}`);
      
      if (retries < maxRetries) {
        const delay = Math.min(5000 * retries, 30000); // Exponential backoff with max 30s
        console.log(`⏳ Retrying in ${delay/1000} seconds...`);
        setTimeout(attemptConnection, delay);
      } else {
        console.error('💥 Failed to connect to MongoDB after maximum retries');
        console.log('💡 Troubleshooting steps:');
        console.log('   1. Check MONGODB_URI environment variable');
        console.log('   2. Verify MongoDB Atlas network access (0.0.0.0/0)');
        console.log('   3. Check Railway environment variables');
        console.log('   4. Verify database credentials');
        
        // Don't exit, let the app continue but log errors
        console.log('⚠️  App will continue without database connection');
      }
    }
  };
  
  await attemptConnection();
};

// Routes with error handling
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/usps-labels', uspsLabelsRoute);
app.use('/api/usps-goals', uspsGoalsRoute);
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/aura-nest', auraNestRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/transactions', transactionsRoutes);

// Enhanced health check endpoint
app.get('/api/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    mongodb: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host || 'unknown',
      database: mongoose.connection.name || 'unknown'
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    uptime: process.uptime()
  };
  
  console.log('🏥 Health check:', health);
  res.json(health);
});

// Test endpoint for debugging
app.get('/api/test', async (req, res) => {
  try {
    console.log('🧪 Running test endpoint...');
    
    // Test database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Test employee query
    let employeeCount = 0;
    let employeeTest = 'failed';
    try {
      const Employee = mongoose.model('Employee');
      employeeCount = await Employee.countDocuments();
      employeeTest = 'success';
    } catch (error) {
      console.error('Employee query failed:', error.message);
    }
    
    const testResult = {
      timestamp: new Date().toISOString(),
      database: dbStatus,
      employeeQuery: employeeTest,
      employeeCount: employeeCount,
      environment: process.env.NODE_ENV || 'development',
      mongodbUri: process.env.MONGODB_URI ? 'set' : 'not set',
      jwtSecret: process.env.JWT_SECRET ? 'set' : 'not set',
      jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0
    };
    
    console.log('🧪 Test result:', testResult);
    res.json(testResult);
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// JWT Secret test endpoint
app.get('/api/test-jwt', (req, res) => {
  const jwtSecret = process.env.JWT_SECRET;
  const result = {
    jwtSecretSet: !!jwtSecret,
    jwtSecretLength: jwtSecret ? jwtSecret.length : 0,
    jwtSecretPreview: jwtSecret ? jwtSecret.substring(0, 10) + '...' : 'not set',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  };
  
  console.log('🔐 JWT Secret test:', result);
  res.json(result);
});

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../client/build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Server error:', err);
  console.error('   Stack:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.get('/api/health', (req, res) => res.send('OK'));
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  // Connect to MongoDB
  connectDB();
});