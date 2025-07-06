const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  carrier: {
    type: String,
    required: true,
    enum: ['USPS', 'FedEx', 'UPS', 'DHL', 'Other']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  sender: {
    type: String,
    required: true,
    trim: true
  },
  receiver: {
    type: String,
    required: true,
    trim: true
  },
  screenshot: {
    type: String, // URL to uploaded screenshot
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
transactionSchema.index({ employeeId: 1, date: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ carrier: 1 });

module.exports = mongoose.model('Transaction', transactionSchema); 