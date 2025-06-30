const mongoose = require('mongoose');

const uspsLabelSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  totalLabels: {
    type: Number,
    required: true,
    min: 1
  },
  rate: {
    type: Number,
    required: true,
    min: 0.01
  },
  paidLabels: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalRevenue: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  entryDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentScreenshots: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'paid', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total revenue before saving
uspsLabelSchema.pre('save', function(next) {
  this.totalRevenue = this.rate * this.paidLabels;
  this.updatedAt = Date.now();
  next();
});

// Calculate total revenue before updating
uspsLabelSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.rate && update.paidLabels) {
    update.totalRevenue = update.rate * update.paidLabels;
  }
  update.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('USPSLabel', uspsLabelSchema); 