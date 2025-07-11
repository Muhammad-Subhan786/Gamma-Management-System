const mongoose = require('mongoose');

const resellerClientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  portal: {
    type: String,
    required: true,
    enum: ['ShipAir', 'ShipRoger', 'Other'], // Extend as needed
  },
  labelType: {
    type: String,
    required: true,
    trim: true
  },
  vendorRate: {
    type: Number,
    required: true,
    min: 0
  },
  clientRate: {
    type: Number,
    required: true,
    min: 0
  },
  labels: {
    type: Number,
    min: 0,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for profit per label
resellerClientSchema.virtual('profitPerLabel').get(function() {
  return this.clientRate - this.vendorRate;
});

module.exports = mongoose.model('ResellerClient', resellerClientSchema); 