const mongoose = require('mongoose');

const uspsGoalSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  month: {
    type: String,
    required: true,
    format: 'YYYY-MM' // e.g., '2025-06'
  },
  targetLabels: {
    type: Number,
    required: true,
    min: 1
  },
  currentLabels: {
    type: Number,
    default: 0,
    min: 0
  },
  targetRevenue: {
    type: Number,
    required: true,
    min: 0.01
  },
  currentRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'overdue'],
    default: 'active'
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

// Calculate completion percentage
uspsGoalSchema.virtual('labelsProgress').get(function() {
  return this.targetLabels > 0 ? (this.currentLabels / this.targetLabels) * 100 : 0;
});

uspsGoalSchema.virtual('revenueProgress').get(function() {
  return this.targetRevenue > 0 ? (this.currentRevenue / this.targetRevenue) * 100 : 0;
});

uspsGoalSchema.virtual('overallProgress').get(function() {
  const labelsProgress = this.labelsProgress;
  const revenueProgress = this.revenueProgress;
  return (labelsProgress + revenueProgress) / 2;
});

// Update goal status based on progress and date
uspsGoalSchema.methods.updateStatus = function() {
  const now = new Date();
  const goalMonth = new Date(this.month + '-01');
  const monthEnd = new Date(goalMonth.getFullYear(), goalMonth.getMonth() + 1, 0);
  
  if (this.overallProgress >= 100) {
    this.status = 'completed';
  } else if (now > monthEnd) {
    this.status = 'overdue';
  } else {
    this.status = 'active';
  }
};

// Ensure virtuals are serialized
uspsGoalSchema.set('toJSON', { virtuals: true });
uspsGoalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('USPSGoal', uspsGoalSchema); 