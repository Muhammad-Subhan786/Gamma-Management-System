const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['supplier', 'manufacturer', 'courier', 'other'], required: true },
  contactPerson: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, trim: true },
  performance: {
    totalOrders: { type: Number, default: 0 },
    onTimeDeliveries: { type: Number, default: 0 },
    lateDeliveries: { type: Number, default: 0 },
    averageRating: { type: Number, min: 0, max: 5, default: 0 }
  },
  isActive: { type: Boolean, default: true },
  notes: { type: String, trim: true }
}, {
  timestamps: true
});

vendorSchema.index({ name: 1 });

module.exports = mongoose.model('Vendor', vendorSchema); 