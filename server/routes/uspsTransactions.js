const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const USPSTransaction = require('../models/USPSTransaction');
const { authenticateEmployee, authenticateAdmin } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/transaction-screenshots';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'transaction-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get all transactions (for admin)
router.get('/admin', authenticateAdmin, async (req, res) => {
  try {
    const transactions = await USPSTransaction.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get my transactions (for employee)
router.get('/my', authenticateEmployee, async (req, res) => {
  try {
    const transactions = await USPSTransaction.find({ 
      createdBy: req.employee._id,
      isActive: true 
    }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transaction dashboard data
router.get('/dashboard', authenticateEmployee, async (req, res) => {
  try {
    const employeeId = req.employee._id;
    
    // Get total transactions count
    const totalTransactions = await USPSTransaction.countDocuments({ 
      createdBy: employeeId,
      isActive: true 
    });
    
    // Get total amount
    const totalAmount = await USPSTransaction.aggregate([
      { $match: { createdBy: employeeId, isActive: true } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get this month's transactions
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const thisMonthTransactions = await USPSTransaction.countDocuments({
      createdBy: employeeId,
      date: { $gte: startOfMonth },
      isActive: true
    });
    
    // Get this month's amount
    const thisMonthAmount = await USPSTransaction.aggregate([
      { 
        $match: { 
          createdBy: employeeId, 
          date: { $gte: startOfMonth },
          isActive: true 
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    res.json({
      totalTransactions,
      totalAmount: totalAmount[0]?.total || 0,
      thisMonthTransactions,
      thisMonthAmount: thisMonthAmount[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new transaction
router.post('/', authenticateEmployee, upload.single('screenshot'), async (req, res) => {
  try {
    const { email, carrier, date, amount, sender, receiver } = req.body;
    
    if (!email || !date || !amount || !sender || !receiver) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }
    
    const transaction = new USPSTransaction({
      email,
      carrier: carrier || 'USPS',
      date: new Date(date),
      amount: parseFloat(amount),
      sender,
      receiver,
      screenshot: req.file ? `/uploads/transaction-screenshots/${req.file.filename}` : null,
      createdBy: req.employee._id
    });
    
    const savedTransaction = await transaction.save();
    res.status(201).json(savedTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update transaction
router.put('/:id', authenticateEmployee, upload.single('screenshot'), async (req, res) => {
  try {
    const { email, carrier, date, amount, sender, receiver } = req.body;
    const transactionId = req.params.id;
    
    const transaction = await USPSTransaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Check if employee owns this transaction or is admin
    if (transaction.createdBy.toString() !== req.employee._id.toString() && req.employee.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this transaction' });
    }
    
    const updateData = {
      email,
      carrier: carrier || 'USPS',
      date: new Date(date),
      amount: parseFloat(amount),
      sender,
      receiver
    };
    
    // Add screenshot if new file uploaded
    if (req.file) {
      updateData.screenshot = `/uploads/transaction-screenshots/${req.file.filename}`;
    }
    
    const updatedTransaction = await USPSTransaction.findByIdAndUpdate(
      transactionId,
      updateData,
      { new: true }
    );
    
    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete transaction
router.delete('/:id', authenticateEmployee, async (req, res) => {
  try {
    const transactionId = req.params.id;
    
    const transaction = await USPSTransaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Check if employee owns this transaction or is admin
    if (transaction.createdBy.toString() !== req.employee._id.toString() && req.employee.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this transaction' });
    }
    
    // Soft delete
    transaction.isActive = false;
    await transaction.save();
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transaction by ID
router.get('/:id', authenticateEmployee, async (req, res) => {
  try {
    const transaction = await USPSTransaction.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Check if employee owns this transaction or is admin
    if (transaction.createdBy._id.toString() !== req.employee._id.toString() && req.employee.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this transaction' });
    }
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 