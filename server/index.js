const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const analyticsRoutes = require('./routes/analytics');
const shiftRoutes = require('./routes/shifts');
const uspsLabelsRoute = require('./routes/uspsLabels');
const uspsGoalsRoute = require('./routes/uspsGoals');
const auraNestRoutes = require('./routes/auraNest');
const inventoryRoutes = require('./routes/inventory');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection with retry logic
const connectDB = async () => {
  let retries = 0;
  const maxRetries = 5;
  
  const attemptConnection = async () => {
    try {
      const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://msubhan6612:fICMiSbzLjPCotWF@cluster0.ilp6wrn.mongodb.net/employee-attendance?retryWrites=true&w=majority';
      
      console.log(`🔄 Attempting MongoDB connection (attempt ${retries + 1}/${maxRetries})...`);
      
      await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 1,
      });
      
      console.log('✅ Connected to MongoDB Atlas');
      console.log(`   Database: ${mongoose.connection.name}`);
      console.log(`   Host: ${mongoose.connection.host}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Test the connection with a simple query
      const employeeCount = await mongoose.model('Employee').countDocuments();
      console.log(`   Employee count: ${employeeCount}`);
      
    } catch (err) {
      retries++;
      console.error(`❌ MongoDB connection error (attempt ${retries}/${maxRetries}):`, err.message);
      
      if (retries < maxRetries) {
        console.log(`⏳ Retrying in 5 seconds...`);
        setTimeout(attemptConnection, 5000);
      } else {
        console.error('💥 Failed to connect to MongoDB after maximum retries');
        console.log('💡 Make sure your MongoDB Atlas cluster allows connections from all IPs (0.0.0.0/0)');
        console.log('💡 Or add Railway\'s IP addresses to your Atlas whitelist');
        console.log('💡 Check your MONGODB_URI environment variable on Railway');
        
        // Don't exit the process, let it continue but log errors
        process.exit(1);
      }
    }
  };
  
  await attemptConnection();
};

// Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/usps-labels', uspsLabelsRoute);
app.use('/api/usps-goals', uspsGoalsRoute);
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/aura-nest', auraNestRoutes);
app.use('/api/inventory', inventoryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../client/build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Connect to MongoDB
  connectDB();
}); 