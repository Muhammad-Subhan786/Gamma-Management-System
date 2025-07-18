const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// Get all transactions (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { type, vendorId, orderId, employeeId, startDate, endDate } = req.query;
    const filter = { isActive: true };
    if (type) filter.transactionType = type;
    if (vendorId) filter.vendorId = vendorId;
    if (orderId) filter.orderId = orderId;
    if (employeeId) filter.employeeId = employeeId;
    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) filter.transactionDate.$gte = new Date(startDate);
      if (endDate) filter.transactionDate.$lte = new Date(endDate);
    }
    const transactions = await Transaction.find(filter).sort({ transactionDate: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create transaction
router.post('/', async (req, res) => {
  try {
    const transaction = new Transaction(req.body);
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update transaction
router.put('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete transaction (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    transaction.isActive = false;
    await transaction.save();
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 