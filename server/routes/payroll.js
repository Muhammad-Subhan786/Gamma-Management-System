const express = require('express');
const router = express.Router();
const Payroll = require('../models/Payroll');

// Get all payroll records (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { employeeId, period, status } = req.query;
    const filter = {};
    if (employeeId) filter.employeeId = employeeId;
    if (period) filter.period = period;
    if (status) filter.status = status;
    const payrolls = await Payroll.find(filter).sort({ period: -1 });
    res.json(payrolls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payroll by ID
router.get('/:id', async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) return res.status(404).json({ error: 'Payroll record not found' });
    res.json(payroll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create payroll record
router.post('/', async (req, res) => {
  try {
    const payroll = new Payroll(req.body);
    await payroll.save();
    res.status(201).json(payroll);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update payroll record
router.put('/:id', async (req, res) => {
  try {
    const payroll = await Payroll.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!payroll) return res.status(404).json({ error: 'Payroll record not found' });
    res.json(payroll);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete payroll record (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) return res.status(404).json({ error: 'Payroll record not found' });
    payroll.status = 'failed';
    await payroll.save();
    res.json({ message: 'Payroll record deleted (marked as failed)' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 