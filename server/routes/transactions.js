const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const Lead = require('../models/Lead');
const Employee = require('../models/Employee');

// Get all transactions with filters
router.get('/', async (req, res) => {
  try {
    const {
      transactionType,
      status,
      source,
      paymentMethod,
      customerPhone,
      startDate,
      endDate,
      requiresApproval,
      page = 1,
      limit = 20
    } = req.query;

    const filter = { isActive: true };
    
    if (transactionType) filter.transactionType = transactionType;
    if (status) filter.status = status;
    if (source) filter.source = source;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (customerPhone) filter.customerPhone = { $regex: customerPhone, $options: 'i' };
    if (requiresApproval !== undefined) filter.requiresApproval = requiresApproval === 'true';
    
    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) filter.transactionDate.$gte = new Date(startDate);
      if (endDate) filter.transactionDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    
    const transactions = await Transaction.find(filter)
      .populate('recordedBy', 'name email phone')
      .populate('approvedBy', 'name')
      .populate('validatedBy', 'name')
      .populate('reconciledBy', 'name')
      .populate('orderId', 'customerName customerPhone totalAmount')
      .populate('leadId', 'customerName customerPhone')
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(filter);

    res.json({
      transactions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('recordedBy', 'name email phone')
      .populate('approvedBy', 'name')
      .populate('validatedBy', 'name')
      .populate('reconciledBy', 'name')
      .populate('orderId', 'customerName customerPhone totalAmount status')
      .populate('leadId', 'customerName customerPhone status');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new transaction
router.post('/', async (req, res) => {
  try {
    console.log('💰 Creating new transaction with data:', JSON.stringify(req.body, null, 2));
    
    const {
      transactionType,
      amount,
      currency,
      source,
      orderId,
      leadId,
      customerName,
      customerPhone,
      paymentMethod,
      description,
      notes,
      receiptNumber,
      receiptImage
    } = req.body;

    // Validate required fields
    if (!transactionType || !amount || !source || !paymentMethod) {
      console.log('❌ Transaction validation failed:', { transactionType, amount, source, paymentMethod });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate amount
    if (amount <= 0) {
      console.log('❌ Invalid amount:', amount);
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Map transaction type to valid enum value
    let validTransactionType = transactionType;
    if (transactionType === 'income' || transactionType === 'expense') {
      validTransactionType = transactionType;
    } else if (transactionType === 'advance') {
      validTransactionType = 'advance';
    } else if (transactionType === 'refund') {
      validTransactionType = 'refund';
    } else if (transactionType === 'commission') {
      validTransactionType = 'commission';
    } else if (transactionType === 'bonus') {
      validTransactionType = 'bonus';
    } else {
      console.log('❌ Invalid transaction type:', transactionType);
      return res.status(400).json({ error: 'Invalid transaction type' });
    }

    console.log('✅ Transaction validation passed, creating transaction...');

    const transaction = new Transaction({
      transactionType: validTransactionType,
      amount,
      currency: currency || 'PKR',
      source,
      orderId,
      leadId,
      customerName,
      customerPhone,
      paymentMethod,
      description,
      notes,
      receiptNumber,
      receiptImage,
      recordedBy: req.user?.id || req.body.recordedBy || 'system' // Fallback to 'system' if no user
    });

    console.log('💾 Saving transaction to database...');
    await transaction.save();
    console.log('✅ Transaction saved successfully with ID:', transaction._id);

    // Update order if this is a payment
    if (orderId && (source === 'full_payment' || source === 'advance_payment')) {
      console.log('🔗 Updating order payment status:', orderId);
      const order = await Order.findById(orderId);
      if (order) {
        if (source === 'advance_payment') {
          order.advanceAmount = (order.advanceAmount || 0) + amount;
          order.remainingAmount = order.totalAmount - order.advanceAmount;
        } else if (source === 'full_payment') {
          order.advanceAmount = order.totalAmount;
          order.remainingAmount = 0;
          order.status = 'delivered';
          order.deliveryStatus = 'delivered';
        }
        await order.save();
        console.log('✅ Order payment status updated');
      }
    }

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('recordedBy', 'name email phone')
      .populate('orderId', 'customerName customerPhone')
      .populate('leadId', 'customerName customerPhone');

    console.log('🎉 Transaction creation completed successfully');
    res.status(201).json(populatedTransaction);
  } catch (error) {
    console.error('❌ Error creating transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update transaction
router.put('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Don't allow updates to approved/completed transactions
    if (['approved', 'completed'].includes(transaction.status)) {
      return res.status(400).json({ error: 'Cannot update approved/completed transactions' });
    }

    // Update transaction fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== '__v' && key !== 'auditTrail') {
        transaction[key] = req.body[key];
      }
    });

    await transaction.save();

    const updatedTransaction = await Transaction.findById(transaction._id)
      .populate('recordedBy', 'name email phone')
      .populate('orderId', 'customerName customerPhone')
      .populate('leadId', 'customerName customerPhone');

    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve transaction
router.patch('/:id/approve', async (req, res) => {
  try {
    const { notes } = req.body;
    const approvedBy = req.user?.id || req.body.approvedBy;

    if (!approvedBy) {
      return res.status(400).json({ error: 'Approver ID is required' });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status !== 'pending_approval') {
      return res.status(400).json({ error: 'Transaction is not pending approval' });
    }

    await transaction.approve(approvedBy, notes);

    const updatedTransaction = await Transaction.findById(transaction._id)
      .populate('recordedBy', 'name email phone')
      .populate('approvedBy', 'name')
      .populate('orderId', 'customerName customerPhone')
      .populate('leadId', 'customerName customerPhone');

    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject transaction
router.patch('/:id/reject', async (req, res) => {
  try {
    const { notes } = req.body;
    const rejectedBy = req.user?.id || req.body.rejectedBy;

    if (!rejectedBy) {
      return res.status(400).json({ error: 'Rejecter ID is required' });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status !== 'pending_approval') {
      return res.status(400).json({ error: 'Transaction is not pending approval' });
    }

    await transaction.reject(rejectedBy, notes);

    const updatedTransaction = await Transaction.findById(transaction._id)
      .populate('recordedBy', 'name email phone')
      .populate('orderId', 'customerName customerPhone')
      .populate('leadId', 'customerName customerPhone');

    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validate transaction
router.patch('/:id/validate', async (req, res) => {
  try {
    const { notes } = req.body;
    const validatedBy = req.user?.id || req.body.validatedBy;

    if (!validatedBy) {
      return res.status(400).json({ error: 'Validator ID is required' });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await transaction.validate(validatedBy, notes);

    const updatedTransaction = await Transaction.findById(transaction._id)
      .populate('recordedBy', 'name email phone')
      .populate('validatedBy', 'name')
      .populate('orderId', 'customerName customerPhone')
      .populate('leadId', 'customerName customerPhone');

    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reconcile transaction
router.patch('/:id/reconcile', async (req, res) => {
  try {
    const reconciledBy = req.user?.id || req.body.reconciledBy;

    if (!reconciledBy) {
      return res.status(400).json({ error: 'Reconciler ID is required' });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.reconciled) {
      return res.status(400).json({ error: 'Transaction is already reconciled' });
    }

    await transaction.reconcile(reconciledBy);

    const updatedTransaction = await Transaction.findById(transaction._id)
      .populate('recordedBy', 'name email phone')
      .populate('reconciledBy', 'name')
      .populate('orderId', 'customerName customerPhone')
      .populate('leadId', 'customerName customerPhone');

    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transactions requiring approval
router.get('/pending-approval', async (req, res) => {
  try {
    const transactions = await Transaction.find({
      requiresApproval: true,
      status: 'pending_approval',
      isActive: true
    })
    .populate('recordedBy', 'name email phone')
    .populate('orderId', 'customerName customerPhone totalAmount')
    .populate('leadId', 'customerName customerPhone')
    .sort({ transactionDate: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transaction analytics
router.get('/analytics/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = { isActive: true };
    if (startDate || endDate) {
      matchStage.transactionDate = {};
      if (startDate) matchStage.transactionDate.$gte = new Date(startDate);
      if (endDate) matchStage.transactionDate.$lte = new Date(endDate);
    }

    const analytics = await Transaction.getSummary(startDate || new Date(0), endDate || new Date());

    // Additional analytics
    const totalTransactions = await Transaction.countDocuments(matchStage);
    const pendingApproval = await Transaction.countDocuments({
      ...matchStage,
      requiresApproval: true,
      status: 'pending_approval'
    });
    const reconciled = await Transaction.countDocuments({
      ...matchStage,
      reconciled: true
    });

    res.json({
      summary: analytics,
      totalTransactions,
      pendingApproval,
      reconciled,
      reconciliationRate: totalTransactions > 0 ? (reconciled / totalTransactions * 100).toFixed(2) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transaction audit trail
router.get('/:id/audit-trail', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('auditTrail.performedBy', 'name email');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction.auditTrail);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete transaction (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Don't allow deletion of approved/completed transactions
    if (['approved', 'completed'].includes(transaction.status)) {
      return res.status(400).json({ error: 'Cannot delete approved/completed transactions' });
    }

    transaction.isActive = false;
    await transaction.save();

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 