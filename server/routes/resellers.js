const express = require('express');
const router = express.Router();
const ResellerClient = require('../models/ResellerClient');
const ResellerLabel = require('../models/ResellerLabel');
const ResellerTransaction = require('../models/ResellerTransaction');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup for screenshots
const screenshotStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/reseller-screenshots');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `screenshot-${Date.now()}${ext}`;
    cb(null, filename);
  }
});
const upload = multer({ storage: screenshotStorage });

// --- Reseller Clients ---
// Get all reseller clients
router.get('/clients', async (req, res) => {
  try {
    const clients = await ResellerClient.find({ isActive: true });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new reseller client
router.post('/clients', async (req, res) => {
  try {
    const client = new ResellerClient(req.body);
    await client.save();
    res.status(201).json(client);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a reseller client
router.put('/clients/:id', async (req, res) => {
  try {
    const client = await ResellerClient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete (deactivate) a reseller client
router.delete('/clients/:id', async (req, res) => {
  try {
    const client = await ResellerClient.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- Reseller Labels ---
// Get all reseller labels
router.get('/labels', async (req, res) => {
  try {
    const labels = await ResellerLabel.find({ isActive: true }).populate('clientId');
    res.json(labels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new reseller label sale
router.post('/labels', async (req, res) => {
  try {
    const label = new ResellerLabel(req.body);
    await label.save();
    res.status(201).json(label);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a reseller label
router.put('/labels/:id', async (req, res) => {
  try {
    const label = await ResellerLabel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!label) return res.status(404).json({ error: 'Label not found' });
    res.json(label);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete (deactivate) a reseller label
router.delete('/labels/:id', async (req, res) => {
  try {
    const label = await ResellerLabel.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!label) return res.status(404).json({ error: 'Label not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- Reseller Transactions ---
// Get all reseller transactions
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await ResellerTransaction.find({ isActive: true })
      .populate('resellerLabelId')
      .populate('clientId');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new reseller transaction
router.post('/transactions', async (req, res) => {
  try {
    const transaction = new ResellerTransaction(req.body);
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a reseller transaction
router.put('/transactions/:id', async (req, res) => {
  try {
    const transaction = await ResellerTransaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete (deactivate) a reseller transaction
router.delete('/transactions/:id', async (req, res) => {
  try {
    const transaction = await ResellerTransaction.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Upload screenshot endpoint
router.post('/upload-screenshot', upload.single('screenshot'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ filename: req.file.filename, url: `/api/resellers/screenshot/${req.file.filename}` });
});

// Serve screenshot files
router.get('/screenshot/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads/reseller-screenshots', req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
  res.sendFile(filePath);
});

// --- Dashboard Summary ---
// Get dashboard metrics: total labels sold, total profit, total reseller clients
router.get('/dashboard/summary', async (req, res) => {
  try {
    const [totalLabels, totalProfit, totalClients] = await Promise.all([
      ResellerLabel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: "$quantity" } } }
      ]),
      ResellerLabel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, profit: { $sum: { $multiply: [ { $subtract: ["$clientRate", "$vendorRate"] }, "$quantity" ] } } } }
      ]),
      ResellerClient.countDocuments({ isActive: true })
    ]);
    res.json({
      totalLabelsSold: totalLabels[0]?.total || 0,
      totalProfit: totalProfit[0]?.profit || 0,
      totalResellerClients: totalClients
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 