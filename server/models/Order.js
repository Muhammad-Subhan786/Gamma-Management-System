const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Customer Information
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
    required: true,
    trim: true
  },
  
  // Order Details
  products: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  
  // Financial Information
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  advanceAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Order Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'failed', 'returned', 'cancelled'],
    default: 'pending'
  },
  
  // Delivery Tracking
  deliveryStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'out_for_delivery', 'delivered', 'failed', 'returned'],
    default: 'not_started'
  },
  trackingNumber: {
    type: String,
    trim: true
  },
  courierName: {
    type: String,
    trim: true
  },
  estimatedDelivery: {
    type: Date
  },
  actualDelivery: {
    type: Date
  },
  deliveryNotes: {
    type: String,
    trim: true
  },
  
  // Employee Assignment
  assignedEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  
  // Order Management
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  notes: {
    type: String,
    trim: true
  },
  specialInstructions: {
    type: String,
    trim: true
  },
  
  // Timestamps
  orderDate: {
    type: Date,
    default: Date.now
  },
  processingDate: {
    type: Date
  },
  shippingDate: {
    type: Date
  },
  deliveryDate: {
    type: Date
  },
  
  // Revenue Tracking
  revenueGenerated: {
    type: Number,
    default: 0,
    min: 0
  },
  costOfGoods: {
    type: Number,
    default: 0,
    min: 0
  },
  profit: {
    type: Number,
    default: 0
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
orderSchema.index({ status: 1, deliveryStatus: 1 });
orderSchema.index({ assignedEmployee: 1, orderDate: -1 });
orderSchema.index({ customerPhone: 1 });
orderSchema.index({ trackingNumber: 1 });

// Pre-save middleware to calculate totals
orderSchema.pre('save', function(next) {
  // Calculate subtotal from products
  this.subtotal = this.products.reduce((sum, product) => {
    return sum + (product.totalPrice || (product.price * product.quantity));
  }, 0);
  
  // Calculate total amount
  this.totalAmount = this.subtotal;
  
  // Calculate remaining amount
  this.remainingAmount = this.totalAmount - this.advanceAmount;
  
  // Calculate profit
  this.profit = this.revenueGenerated - this.costOfGoods;
  
  // Auto-update delivery status based on order status
  if (this.status === 'processing') {
    this.deliveryStatus = 'in_progress';
  } else if (this.status === 'shipped') {
    this.deliveryStatus = 'out_for_delivery';
  } else if (this.status === 'delivered') {
    this.deliveryStatus = 'delivered';
  } else if (this.status === 'returned') {
    this.deliveryStatus = 'returned';
  }
  
  next();
});

// Method to update delivery status
orderSchema.methods.updateDeliveryStatus = function(newStatus, notes = '') {
  this.deliveryStatus = newStatus;
  this.deliveryNotes = notes;
  
  // Update timestamps
  if (newStatus === 'in_progress' && !this.processingDate) {
    this.processingDate = new Date();
  } else if (newStatus === 'out_for_delivery' && !this.shippingDate) {
    this.shippingDate = new Date();
  } else if (newStatus === 'delivered' && !this.deliveryDate) {
    this.deliveryDate = new Date();
    this.actualDelivery = new Date();
  }
  
  return this.save();
};

// Method to calculate delivery time
orderSchema.methods.getDeliveryTime = function() {
  if (this.deliveryDate && this.orderDate) {
    const diffTime = Math.abs(this.deliveryDate - this.orderDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return null;
};

module.exports = mongoose.model('Order', orderSchema); 