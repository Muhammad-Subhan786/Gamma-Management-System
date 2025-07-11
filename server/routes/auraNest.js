const express = require('express');
const router = express.Router();
const moment = require('moment');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

// Import models
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const PaymentMethod = require('../models/PaymentMethod');
const Vendor = require('../models/Vendor');
const Employee = require('../models/Employee');

// Configure multer for CSV uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/aura-nest';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'transaction-' + uniqueSuffix + '.csv');
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'));
    }
  }
});

// Middleware to check if user has Aura Nest access
const checkAuraNestAccess = async (req, res, next) => {
  try {
    // For now, allow all authenticated users
    // TODO: Implement role-based access control
    next();
  } catch (error) {
    res.status(403).json({ error: 'Access denied to Aura Nest module' });
  }
};

// Apply middleware to all routes
router.use(checkAuraNestAccess);

// ==================== CATEGORIES ====================

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new category
router.post('/categories', async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update category
router.put('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PAYMENT METHODS ====================

// Get all payment methods
router.get('/payment-methods', async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find({ isActive: true }).sort({ name: 1 });
    res.json(paymentMethods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new payment method
router.post('/payment-methods', async (req, res) => {
  try {
    const paymentMethod = new PaymentMethod(req.body);
    await paymentMethod.save();
    res.status(201).json(paymentMethod);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== VENDORS ====================

// Get all vendors
router.get('/vendors', async (req, res) => {
  try {
    const vendors = await Vendor.find({ isActive: true }).sort({ name: 1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new vendor
router.post('/vendors', async (req, res) => {
  try {
    const vendor = new Vendor(req.body);
    await vendor.save();
    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update vendor
router.put('/vendors/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== TRANSACTIONS ====================

// Get all transactions with filters
router.get('/transactions', async (req, res) => {
  try {
    console.log('🔍 Fetching transactions with filters:', req.query);
    
    const { 
      startDate, 
      endDate, 
      type, 
      category, 
      vendor, 
      paymentMethod,
      page = 1,
      limit = 50
    } = req.query;

    const query = { isActive: true };

    // Date filter
    if (startDate && endDate) {
      query.transactionDate = {
        $gte: moment(startDate).startOf('day').toDate(),
        $lte: moment(endDate).endOf('day').toDate()
      };
    }

    // Other filters
    if (type) query.transactionType = type;
    if (category) query.category = category;
    if (vendor) query.vendor = vendor;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    console.log('🔍 Final query:', JSON.stringify(query, null, 2));

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(query)
      .populate('recordedBy', 'name')
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    console.log(`✅ Found ${transactions.length} transactions out of ${total} total`);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new transaction
router.post('/transactions', async (req, res) => {
  try {
    console.log('💰 Creating transaction in aura-nest:', JSON.stringify(req.body, null, 2));
    
    const transaction = new Transaction({
      ...req.body,
      recordedBy: req.body.recordedBy || '507f1f77bcf86cd799439011' // Default admin ID
    });
    await transaction.save();

    console.log('✅ Transaction created successfully:', transaction._id);

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('recordedBy', 'name');

    res.status(201).json(populatedTransaction);
  } catch (error) {
    console.error('❌ Error creating transaction in aura-nest:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update transaction
router.put('/transactions/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('category', 'name type')
      .populate('vendor', 'name type')
      .populate('paymentMethod', 'name')
      .populate('createdBy', 'name');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete transaction (soft delete)
router.delete('/transactions/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(req.params.id, { isActive: false });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ANALYTICS ====================

// Get financial summary
router.get('/analytics/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { isActive: true };

    if (startDate && endDate) {
      query.date = {
        $gte: moment(startDate).startOf('day').toDate(),
        $lte: moment(endDate).endOf('day').toDate()
      };
    }

    const transactions = await Transaction.find(query);

    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      netIncome: 0,
      transactionCount: transactions.length,
      incomeCount: 0,
      expenseCount: 0
    };

    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        summary.totalIncome += transaction.amount;
        summary.incomeCount++;
      } else {
        summary.totalExpense += transaction.amount;
        summary.expenseCount++;
      }
    });

    summary.netIncome = summary.totalIncome - summary.totalExpense;

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get category-wise breakdown
router.get('/analytics/categories', async (req, res) => {
  try {
    console.log('📊 Fetching category analytics with filters:', req.query);
    
    const { startDate, endDate } = req.query;
    const query = { isActive: true };

    if (startDate && endDate) {
      query.transactionDate = {
        $gte: moment(startDate).startOf('day').toDate(),
        $lte: moment(endDate).endOf('day').toDate()
      };
    }

    console.log('📊 Final query:', JSON.stringify(query, null, 2));

    const transactions = await Transaction.find(query);

    console.log(`📊 Found ${transactions.length} transactions for analytics`);

    const categoryBreakdown = {};

    transactions.forEach(transaction => {
      // Use source as category since we don't have category field
      const categoryName = transaction.source || 'other';
      if (!categoryBreakdown[categoryName]) {
        categoryBreakdown[categoryName] = {
          income: 0,
          expense: 0,
          count: 0
        };
      }

      if (transaction.transactionType === 'income') {
        categoryBreakdown[categoryName].income += transaction.amount;
      } else {
        categoryBreakdown[categoryName].expense += transaction.amount;
      }
      categoryBreakdown[categoryName].count++;
    });

    console.log('📊 Category breakdown:', categoryBreakdown);

    res.json(categoryBreakdown);
  } catch (error) {
    console.error('❌ Error fetching category analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== CSV IMPORT ====================

// Import transactions from CSV
router.post('/import/transactions', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          const importedTransactions = [];

          for (let i = 0; i < results.length; i++) {
            const row = results[i];
            try {
              // Parse CSV row (expected format: date, type, category, amount, paymentMethod, vendor, description)
              const transactionData = {
                date: moment(row.date, 'YYYY-MM-DD').toDate(),
                type: row.type.toLowerCase(),
                amount: parseFloat(row.amount),
                description: row.description || '',
                reference: row.reference || '',
                createdBy: req.body.createdBy || '507f1f77bcf86cd799439011'
              };

              // Find or create category
              let category = await Category.findOne({ name: { $regex: new RegExp(row.category, 'i') } });
              if (!category) {
                category = new Category({
                  name: row.category,
                  type: transactionData.type
                });
                await category.save();
              }
              transactionData.category = category._id;

              // Find or create payment method
              let paymentMethod = await PaymentMethod.findOne({ name: { $regex: new RegExp(row.paymentMethod, 'i') } });
              if (!paymentMethod) {
                paymentMethod = new PaymentMethod({ name: row.paymentMethod });
                await paymentMethod.save();
              }
              transactionData.paymentMethod = paymentMethod._id;

              // Find vendor if provided
              if (row.vendor) {
                let vendor = await Vendor.findOne({ name: { $regex: new RegExp(row.vendor, 'i') } });
                if (!vendor) {
                  vendor = new Vendor({
                    name: row.vendor,
                    type: 'supplier'
                  });
                  await vendor.save();
                }
                transactionData.vendor = vendor._id;
              }

              const transaction = new Transaction(transactionData);
              await transaction.save();
              importedTransactions.push(transaction);

            } catch (rowError) {
              errors.push(`Row ${i + 1}: ${rowError.message}`);
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.json({
            success: true,
            imported: importedTransactions.length,
            errors: errors,
            message: `Successfully imported ${importedTransactions.length} transactions`
          });

        } catch (error) {
          // Clean up uploaded file
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          res.status(500).json({ error: error.message });
        }
      });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 