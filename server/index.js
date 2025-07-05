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

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://msubhan6612:fICMiSbzLjPCotWF@cluster0.ilp6wrn.mongodb.net/employee-attendance?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

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
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 