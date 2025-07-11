const mongoose = require('mongoose');

const resellerTransactionSchema = new mongoose.Schema({
  resellerLabelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResellerLabel',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResellerClient',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  transactionType: {
    type: String,
    enum: ['sale', 'refund', 'adjustment'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  transactionDate: {
    type: Date,
    default: Date.now
  },
  auditTrail: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'completed', 'failed', 'cancelled'],
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

module.exports = mongoose.model('ResellerTransaction', resellerTransactionSchema); 