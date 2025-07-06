const mongoose = require('mongoose');

const uspsTransactionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true
  },
  carrier: {
    type: String,
    required: true,
    trim: true,
    default: 'USPS'
  },
  date: {
    type: Date,
    required: true
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
    required: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
uspsTransactionSchema.index({ date: 1 });
uspsTransactionSchema.index({ email: 1 });
uspsTransactionSchema.index({ carrier: 1 });
uspsTransactionSchema.index({ createdBy: 1 });

module.exports = mongoose.model('USPSTransaction', uspsTransactionSchema); 