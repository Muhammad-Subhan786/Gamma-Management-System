const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  category: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  description: { type: String, trim: true },
  date: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

expenseSchema.index({ category: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema); 