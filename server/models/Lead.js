const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  customerAddress: {
    type: String,
    trim: true
  },
  productInterest: {
    type: String,
    trim: true
  },
  expectedPrice: {
    type: Number,
    min: 0
  },
  advanceAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  assignedEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'ready_to_order', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
    default: 'new'
  },
  qualificationScore: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  qualificationNotes: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    trim: true,
    enum: ['tiktok', 'meta_ads', 'whatsapp', 'referral', 'website', 'other'],
    default: 'other'
  },
  notes: {
    type: String,
    trim: true
  },
  followUpDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Auto-order creation tracking
  orderCreated: {
    type: Boolean,
    default: false
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  // Qualification criteria
  hasValidAddress: {
    type: Boolean,
    default: false
  },
  hasBudget: {
    type: Boolean,
    default: false
  },
  hasTimeline: {
    type: Boolean,
    default: false
  },
  isReadyToOrder: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
leadSchema.index({ status: 1, assignedEmployee: 1, followUpDate: 1 });
leadSchema.index({ customerName: 'text', customerEmail: 'text', productInterest: 'text' });
leadSchema.index({ qualificationScore: -1, status: 1 });

// Method to calculate qualification score
leadSchema.methods.calculateScore = function() {
  let score = 5; // Base score
  
  // Address validation (30% weight)
  if (this.hasValidAddress && this.customerAddress) {
    score += 3;
  }
  
  // Budget availability (25% weight)
  if (this.hasBudget && this.expectedPrice > 0) {
    score += 2.5;
  }
  
  // Timeline clarity (20% weight)
  if (this.hasTimeline) {
    score += 2;
  }
  
  // Ready to order (25% weight)
  if (this.isReadyToOrder) {
    score += 2.5;
  }
  
  return Math.min(10, Math.max(1, Math.round(score)));
};

// Pre-save middleware to auto-calculate score
leadSchema.pre('save', function(next) {
  this.qualificationScore = this.calculateScore();
  
  // Auto-qualify if score is 8 or higher
  if (this.qualificationScore >= 8 && this.status === 'new') {
    this.status = 'qualified';
  }
  
  // Auto-set ready to order if advance is paid
  if (this.advanceAmount > 0 && this.status === 'qualified') {
    this.status = 'ready_to_order';
    this.isReadyToOrder = true;
  }
  
  next();
});

module.exports = mongoose.model('Lead', leadSchema); 