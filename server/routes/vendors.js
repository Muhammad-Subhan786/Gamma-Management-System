const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');

// Get all vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.find({ isActive: true });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vendor by ID
router.get('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create vendor
router.post('/', async (req, res) => {
  try {
    const vendor = new Vendor(req.body);
    await vendor.save();
    res.status(201).json(vendor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update vendor
router.put('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json(vendor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete vendor (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    vendor.isActive = false;
    await vendor.save();
    res.json({ message: 'Vendor deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vendor performance stats
router.get('/:id/performance', async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json(vendor.performance || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all couriers
router.get('/couriers', async (req, res) => {
  try {
    const couriers = await Vendor.find({ isActive: true, type: 'courier' });
    res.json(couriers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 