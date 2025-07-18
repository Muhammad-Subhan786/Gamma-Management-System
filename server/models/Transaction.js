const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionType: {
    type: String,
    enum: ['sale', 'purchase', 'expense', 'payroll', 'refund', 'commission', 'bonus'],
    required: true
  },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'PKR', trim: true },
  source: { type: String, trim: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'easypaisa', 'jazz_cash', 'card', 'other'],
    required: false
  },
  notes: { type: String, trim: true },
  transactionDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

transactionSchema.index({ transactionType: 1, status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema); 