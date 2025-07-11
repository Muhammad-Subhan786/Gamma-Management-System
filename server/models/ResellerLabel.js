const mongoose = require('mongoose');

const resellerLabelSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResellerClient',
    required: true
  },
  portal: {
    type: String,
    required: true,
    enum: ['ShipAir', 'ShipRoger', 'Other'],
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
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  saleDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  },
  screenshot: {
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

// Virtual for total profit
resellerLabelSchema.virtual('totalProfit').get(function() {
  return (this.clientRate - this.vendorRate) * this.quantity;
});

module.exports = mongoose.model('ResellerLabel', resellerLabelSchema); 