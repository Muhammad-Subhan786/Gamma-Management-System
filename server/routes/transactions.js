const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');

// Configure multer for screenshot uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/payment-screenshots';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get all transactions (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, carrier, employeeId, startDate, endDate } = req.query;
    
    let query = {};
    
    // Filter by status
    if (status) query.status = status;
    
    // Filter by carrier
    if (carrier) query.carrier = carrier;
    
    // Filter by employee
    if (employeeId) query.employeeId = employeeId;
    
    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const transactions = await Transaction.find(query)
      .populate('employeeId', 'name email')
      .populate('approvedBy', 'name')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get employee's own transactions
router.get('/my-transactions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    let query = { employeeId: req.employee.id };
    if (status) query.status = status;
    
    const transactions = await Transaction.find(query)
      .populate('approvedBy', 'name')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching employee transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transaction dashboard stats
router.get('/dashboard', auth, async (req, res) => {
  try {
    const employeeId = req.employee.id;
    
    // Get employee's transaction stats
    const totalTransactions = await Transaction.countDocuments({ employeeId });
    const pendingTransactions = await Transaction.countDocuments({ employeeId, status: 'pending' });
    const approvedTransactions = await Transaction.countDocuments({ employeeId, status: 'approved' });
    const totalAmount = await Transaction.aggregate([
      { $match: { employeeId: mongoose.Types.ObjectId(employeeId), status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get monthly stats
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const monthlyTransactions = await Transaction.countDocuments({
      employeeId,
      date: { $gte: currentMonth }
    });
    
    const monthlyAmount = await Transaction.aggregate([
      { 
        $match: { 
          employeeId: mongoose.Types.ObjectId(employeeId), 
          status: 'approved',
          date: { $gte: currentMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    res.json({
      totalTransactions,
      pendingTransactions,
      approvedTransactions,
      totalAmount: totalAmount[0]?.total || 0,
      monthlyTransactions,
      monthlyAmount: monthlyAmount[0]?.total || 0
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get admin dashboard stats
router.get('/admin-dashboard', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.employee.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const totalTransactions = await Transaction.countDocuments();
    const pendingTransactions = await Transaction.countDocuments({ status: 'pending' });
    const approvedTransactions = await Transaction.countDocuments({ status: 'approved' });
    const totalAmount = await Transaction.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get monthly stats
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const monthlyTransactions = await Transaction.countDocuments({
      date: { $gte: currentMonth }
    });
    
    const monthlyAmount = await Transaction.aggregate([
      { 
        $match: { 
          status: 'approved',
          date: { $gte: currentMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get carrier breakdown
    const carrierStats = await Transaction.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$carrier', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);
    
    res.json({
      totalTransactions,
      pendingTransactions,
      approvedTransactions,
      totalAmount: totalAmount[0]?.total || 0,
      monthlyTransactions,
      monthlyAmount: monthlyAmount[0]?.total || 0,
      carrierStats
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new transaction
router.post('/', auth, upload.single('screenshot'), async (req, res) => {
  try {
    const { email, carrier, date, amount, sender, receiver, notes } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Screenshot is required' });
    }
    
    const employee = await Employee.findById(req.employee.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    const transaction = new Transaction({
      employeeId: req.employee.id,
      employeeName: employee.name,
      email,
      carrier,
      date: new Date(date),
      amount: parseFloat(amount),
      sender,
      receiver,
      screenshot: req.file.path,
      notes
    });
    
    await transaction.save();
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update transaction (Admin only)
router.put('/:id', auth, upload.single('screenshot'), async (req, res) => {
  try {
    if (req.employee.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { email, carrier, date, amount, sender, receiver, status, notes } = req.body;
    
    const updateData = {
      email,
      carrier,
      date: new Date(date),
      amount: parseFloat(amount),
      sender,
      receiver,
      notes
    };
    
    // Handle status change
    if (status) {
      updateData.status = status;
      if (status === 'approved') {
        updateData.approvedBy = req.employee.id;
        updateData.approvedAt = new Date();
      }
    }
    
    // Handle new screenshot
    if (req.file) {
      updateData.screenshot = req.file.path;
    }
    
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('employeeId', 'name email');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete transaction (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.employee.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Delete screenshot file
    if (transaction.screenshot && fs.existsSync(transaction.screenshot)) {
      fs.unlinkSync(transaction.screenshot);
    }
    
    await Transaction.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/Reject transaction (Admin only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (req.employee.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const updateData = { status };
    if (status === 'approved') {
      updateData.approvedBy = req.employee.id;
      updateData.approvedAt = new Date();
    }
    
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('employeeId', 'name email');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Error updating transaction status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 