const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const USPSLabel = require('../models/USPSLabel');
const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/payment-screenshots';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed!'));
    }
  }
});

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify employee token
const verifyEmployeeToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const employee = await Employee.findById(decoded.employeeId);
    
    if (!employee) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.employee = employee;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all USPS labels for an employee
router.get('/employee', verifyEmployeeToken, async (req, res) => {
  try {
    const labels = await USPSLabel.find({ employeeId: req.employee._id })
      .sort({ createdAt: -1 });
    
    res.json(labels);
  } catch (error) {
    console.error('Error fetching employee labels:', error);
    res.status(500).json({ error: 'Failed to fetch labels' });
  }
});

// Get employee dashboard stats
router.get('/employee/dashboard', verifyEmployeeToken, async (req, res) => {
  try {
    const labels = await USPSLabel.find({ employeeId: req.employee._id });
    
    const stats = {
      totalLabels: labels.reduce((sum, label) => sum + label.totalLabels, 0),
      totalRevenue: labels.reduce((sum, label) => sum + label.totalRevenue, 0),
      averageRate: labels.length > 0 ? 
        labels.reduce((sum, label) => sum + label.rate, 0) / labels.length : 0,
      totalCustomers: new Set(labels.map(label => label.customerEmail)).size,
      pendingLabels: labels.filter(label => label.status === 'pending').length,
      paidLabels: labels.filter(label => label.status === 'paid').length,
      completedLabels: labels.filter(label => label.status === 'completed').length
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching employee dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Create new USPS label
router.post('/employee', verifyEmployeeToken, upload.array('paymentScreenshots', 5), async (req, res) => {
  try {
    const { customerName, customerEmail, totalLabels, rate, paidLabels, notes, status, entryDate } = req.body;
    
    // Validate required fields
    if (!customerName || !customerEmail || !totalLabels || !rate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Process uploaded files
    const paymentScreenshots = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      uploadDate: new Date()
    })) : [];

    const labelData = {
      employeeId: req.employee._id,
      customerName,
      customerEmail,
      totalLabels: parseInt(totalLabels),
      rate: parseFloat(rate),
      paidLabels: parseInt(paidLabels) || 0,
      notes,
      status: status || 'pending',
      entryDate: entryDate ? new Date(entryDate) : new Date(),
      paymentScreenshots
    };

    const newLabel = new USPSLabel(labelData);
    await newLabel.save();

    // --- Bonus logic: check if employee closed a client with 100+ paid labels ---
    if (newLabel.status === 'paid') {
      // Sum all paid labels for this employee and customerEmail
      const paidLabelsSum = await USPSLabel.aggregate([
        { $match: { employeeId: req.employee._id, customerEmail: customerEmail.toLowerCase(), status: 'paid' } },
        { $group: { _id: null, total: { $sum: "$paidLabels" } } }
      ]);
      const totalPaid = paidLabelsSum[0]?.total || 0;
      if (totalPaid >= 100) {
        // Check if bonus already awarded for this client
        const employee = await Employee.findById(req.employee._id);
        const alreadyAwarded = employee.bonuses.some(b => b.reason.includes(customerEmail.toLowerCase()));
        if (!alreadyAwarded) {
          employee.bonuses.push({
            amount: 2000,
            reason: `Closed client (${customerEmail.toLowerCase()}) with 100+ paid labels`,
            date: new Date()
          });
          await employee.save();
        }
      }
    }
    // --- End bonus logic ---

    res.status(201).json(newLabel);
  } catch (error) {
    console.error('Error creating USPS label:', error);
    res.status(500).json({ error: 'Failed to create label' });
  }
});

// Update USPS label
router.put('/employee/:id', verifyEmployeeToken, upload.array('paymentScreenshots', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, customerEmail, totalLabels, rate, paidLabels, notes, status, entryDate } = req.body;
    
    const label = await USPSLabel.findOne({ _id: id, employeeId: req.employee._id });
    if (!label) {
      return res.status(404).json({ error: 'Label not found' });
    }

    // Process new uploaded files
    const newScreenshots = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      uploadDate: new Date()
    })) : [];

    // Combine existing and new screenshots
    const updatedScreenshots = [...label.paymentScreenshots, ...newScreenshots];

    const updateData = {
      customerName,
      customerEmail,
      totalLabels: parseInt(totalLabels),
      rate: parseFloat(rate),
      paidLabels: parseInt(paidLabels) || 0,
      notes,
      status,
      entryDate: entryDate ? new Date(entryDate) : label.entryDate,
      paymentScreenshots: updatedScreenshots
    };

    const updatedLabel = await USPSLabel.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    res.json(updatedLabel);
  } catch (error) {
    console.error('Error updating USPS label:', error);
    res.status(500).json({ error: 'Failed to update label' });
  }
});

// Delete USPS label
router.delete('/employee/:id', verifyEmployeeToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const label = await USPSLabel.findOne({ _id: id, employeeId: req.employee._id });
    if (!label) {
      return res.status(404).json({ error: 'Label not found' });
    }

    // Delete associated files
    label.paymentScreenshots.forEach(screenshot => {
      const filePath = path.join('uploads/payment-screenshots', screenshot.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await USPSLabel.findByIdAndDelete(id);
    res.json({ message: 'Label deleted successfully' });
  } catch (error) {
    console.error('Error deleting USPS label:', error);
    res.status(500).json({ error: 'Failed to delete label' });
  }
});

// Get payment screenshot
router.get('/payment-screenshot/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join('uploads/payment-screenshots', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Error serving payment screenshot:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Admin routes (no authentication for now, but should be added in production)
// Get all USPS labels for admin
router.get('/admin', async (req, res) => {
  try {
    const labels = await USPSLabel.find()
      .populate('employeeId', 'name email position')
      .sort({ createdAt: -1 });
    
    res.json(labels);
  } catch (error) {
    console.error('Error fetching all labels:', error);
    res.status(500).json({ error: 'Failed to fetch labels' });
  }
});

// Update the /admin/dashboard endpoint:
router.get('/admin/dashboard', async (req, res) => {
  try {
    // Parse query params for filtering
    const { month, dateFrom, dateTo } = req.query;
    let match = {};
    if (month) {
      // month format: YYYY-MM
      const [year, m] = month.split('-');
      const start = new Date(Number(year), Number(m) - 1, 1);
      const end = new Date(Number(year), Number(m), 1);
      match.createdAt = { $gte: start, $lt: end };
    } else if (dateFrom || dateTo) {
      match.createdAt = {};
      if (dateFrom) match.createdAt.$gte = new Date(dateFrom);
      if (dateTo) match.createdAt.$lte = new Date(dateTo);
    }
    // Use aggregation for performance
    const pipeline = [
      { $match: match },
      { $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employeeId',
        }
      },
      { $unwind: { path: '$employeeId', preserveNullAndEmptyArrays: true } },
    ];
    const labels = await USPSLabel.aggregate(pipeline);
    // Guard against missing/null/NaN fields
    const safeNum = v => typeof v === 'number' && !isNaN(v) ? v : 0;
    const safeStr = v => typeof v === 'string' ? v : '';
    const safeObjId = v => v && typeof v === 'object' && v._id ? v._id.toString() : '';
    const stats = {
      totalLabels: labels.reduce((sum, label) => sum + safeNum(label.totalLabels), 0),
      totalRevenue: labels.reduce((sum, label) => sum + safeNum(label.totalRevenue), 0),
      averageRate: labels.length > 0 ? 
        labels.reduce((sum, label) => sum + safeNum(label.rate), 0) / labels.length : 0,
      totalCustomers: new Set(labels.map(label => safeStr(label.customerEmail)).filter(Boolean)).size,
      totalEmployees: new Set(labels.map(label => safeObjId(label.employeeId)).filter(Boolean)).size,
      pendingLabels: labels.filter(label => safeStr(label.status) === 'pending').length,
      paidLabels: labels.filter(label => safeStr(label.status) === 'paid').length,
      completedLabels: labels.filter(label => safeStr(label.status) === 'completed').length,
      cancelledLabels: labels.filter(label => safeStr(label.status) === 'cancelled').length
    };
    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    if (error && error.stack) console.error(error.stack);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});
// TODO: Add authentication middleware for admin routes

// Admin update USPS label
router.put('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Handle entryDate conversion if provided
    if (updateData.entryDate) {
      updateData.entryDate = new Date(updateData.entryDate);
    }
    
    const updatedLabel = await USPSLabel.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('employeeId', 'name email position');

    if (!updatedLabel) {
      return res.status(404).json({ error: 'Label not found' });
    }

    res.json(updatedLabel);
  } catch (error) {
    console.error('Error updating USPS label:', error);
    res.status(500).json({ error: 'Failed to update label' });
  }
});

// Admin delete USPS label
router.delete('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const label = await USPSLabel.findById(id);
    if (!label) {
      return res.status(404).json({ error: 'Label not found' });
    }

    // Delete associated files
    label.paymentScreenshots.forEach(screenshot => {
      const filePath = path.join('uploads/payment-screenshots', screenshot.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await USPSLabel.findByIdAndDelete(id);
    res.json({ message: 'Label deleted successfully' });
  } catch (error) {
    console.error('Error deleting USPS label:', error);
    res.status(500).json({ error: 'Failed to delete label' });
  }
});

// Debug endpoint to test JWT verification
router.get('/debug-auth', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Debug - Token received:', token ? 'Yes' : 'No');
    console.log('Debug - JWT_SECRET:', JWT_SECRET ? 'Set' : 'Not set');
    console.log('Debug - JWT_SECRET value:', JWT_SECRET);
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided', debug: { jwtSecretSet: !!JWT_SECRET } });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Debug - Token decoded successfully:', decoded);
      
      const employee = await Employee.findById(decoded.employeeId);
      console.log('Debug - Employee found:', employee ? 'Yes' : 'No');
      
      if (!employee) {
        return res.status(401).json({ error: 'Employee not found', debug: { decoded, jwtSecretSet: !!JWT_SECRET } });
      }

      res.json({ 
        success: true, 
        employee: { id: employee._id, name: employee.name, email: employee.email },
        debug: { jwtSecretSet: !!JWT_SECRET, tokenLength: token.length }
      });
    } catch (jwtError) {
      console.log('Debug - JWT verification failed:', jwtError.message);
      return res.status(401).json({ 
        error: 'JWT verification failed', 
        debug: { 
          jwtError: jwtError.message, 
          jwtSecretSet: !!JWT_SECRET,
          tokenLength: token.length
        } 
      });
    }
  } catch (error) {
    console.log('Debug - General error:', error.message);
    res.status(500).json({ error: 'Debug endpoint error', debug: { error: error.message } });
  }
});

module.exports = router; 