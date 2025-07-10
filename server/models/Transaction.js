const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Transaction Details
  transactionType: {
    type: String,
    enum: ['income', 'expense', 'advance', 'refund', 'commission', 'bonus'],
    required: true
  },
  
  // Amount Information
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'PKR',
    trim: true
  },
  
  // Source/Reference Information
  source: {
    type: String,
    enum: ['order_payment', 'advance_payment', 'full_payment', 'refund', 'commission', 'bonus', 'other'],
    required: true
  },
  
  // Order/Lead Reference
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  // Customer Information
  customerName: {
    type: String,
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  
  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'easypaisa', 'jazz_cash', 'card', 'other'],
    required: true
  },
  
  // Transaction Status & Validation
  status: {
    type: String,
    enum: ['pending', 'pending_approval', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Approval Workflow
  requiresApproval: {
    type: Boolean,
    default: false
  },
  approvalAmount: {
    type: Number,
    min: 0
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  approvedAt: {
    type: Date
  },
  approvalNotes: {
    type: String,
    trim: true
  },
  
  // Validation & Check & Balance
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  validatedAt: {
    type: Date
  },
  validationNotes: {
    type: String,
    trim: true
  },
  
  // Receipt/Proof
  receiptNumber: {
    type: String,
    trim: true
  },
  receiptImage: {
    type: String,
    trim: true
  },
  
  // Employee Information
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  
  // Transaction Details
  description: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  
  // Timestamps
  transactionDate: {
    type: Date,
    default: Date.now
  },
  
  // Reconciliation
  reconciled: {
    type: Boolean,
    default: false
  },
  reconciledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  reconciledAt: {
    type: Date
  },
  
  // Audit Trail
  auditTrail: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'approved', 'rejected', 'validated', 'reconciled'],
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true
    },
    previousValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }],
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
transactionSchema.index({ transactionType: 1, status: 1 });
transactionSchema.index({ recordedBy: 1, transactionDate: -1 });
transactionSchema.index({ orderId: 1 });
transactionSchema.index({ customerPhone: 1 });
transactionSchema.index({ receiptNumber: 1 });

// Pre-save middleware for validation and approval logic
transactionSchema.pre('save', function(next) {
  // Auto-set requires approval for high amounts
  if (this.amount > 50000 && this.transactionType === 'income') {
    this.requiresApproval = true;
    this.approvalAmount = this.amount;
  }
  
  // Auto-set status based on approval requirement
  if (this.requiresApproval && this.status === 'pending') {
    this.status = 'pending_approval';
  }
  
  // Auto-complete if no approval required
  if (!this.requiresApproval && this.status === 'pending') {
    this.status = 'completed';
  }
  
  next();
});

// Method to approve transaction
transactionSchema.methods.approve = function(approvedBy, notes = '') {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  this.approvalNotes = notes;
  
  // Add to audit trail
  this.auditTrail.push({
    action: 'approved',
    performedBy: approvedBy,
    notes: notes,
    newValue: 'approved'
  });
  
  return this.save();
};

// Method to reject transaction
transactionSchema.methods.reject = function(rejectedBy, notes = '') {
  this.status = 'rejected';
  
  // Add to audit trail
  this.auditTrail.push({
    action: 'rejected',
    performedBy: rejectedBy,
    notes: notes,
    newValue: 'rejected'
  });
  
  return this.save();
};

// Method to validate transaction
transactionSchema.methods.validate = function(validatedBy, notes = '') {
  this.validatedBy = validatedBy;
  this.validatedAt = new Date();
  this.validationNotes = notes;
  
  // Add to audit trail
  this.auditTrail.push({
    action: 'validated',
    performedBy: validatedBy,
    notes: notes
  });
  
  return this.save();
};

// Method to reconcile transaction
transactionSchema.methods.reconcile = function(reconciledBy) {
  this.reconciled = true;
  this.reconciledBy = reconciledBy;
  this.reconciledAt = new Date();
  
  // Add to audit trail
  this.auditTrail.push({
    action: 'reconciled',
    performedBy: reconciledBy
  });
  
  return this.save();
};

// Static method to get transaction summary
transactionSchema.statics.getSummary = async function(startDate, endDate) {
  const matchStage = {
    transactionDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    isActive: true
  };
  
  return await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$transactionType',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        pendingAmount: {
          $sum: {
            $cond: [
              { $in: ['$status', ['pending', 'pending_approval']] },
              '$amount',
              0
            ]
          }
        },
        approvedAmount: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'approved'] },
              '$amount',
              0
            ]
          }
        },
        completedAmount: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'completed'] },
              '$amount',
              0
            ]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema); 