const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// Get all expenses (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { category, vendorId, startDate, endDate } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (vendorId) filter.vendorId = vendorId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expense by ID
router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create expense
router.post('/', async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update expense
router.put('/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete expense (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    expense.isActive = false;
    await expense.save();
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 