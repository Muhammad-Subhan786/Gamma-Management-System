const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  period: { type: String, required: true }, // e.g., '2024-07'
  baseSalary: { type: Number, default: 0 },
  bonuses: { type: Number, default: 0 },
  commissions: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  totalPay: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  paymentDate: { type: Date },
  notes: { type: String, trim: true }
}, {
  timestamps: true
});

payrollSchema.index({ employeeId: 1, period: -1 });

module.exports = mongoose.model('Payroll', payrollSchema); 