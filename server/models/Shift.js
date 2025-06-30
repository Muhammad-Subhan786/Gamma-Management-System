const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  startTime: {
    type: String,
    required: true,
    // Format: "HH:mm" (24-hour format)
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Start time must be in HH:mm format (24-hour)'
    }
  },
  endTime: {
    type: String,
    required: true,
    // Format: "HH:mm" (24-hour format)
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'End time must be in HH:mm format (24-hour)'
    }
  },
  workingHours: {
    type: Number,
    required: true,
    min: 0.5,
    max: 24
  },
  assignedEmployees: [{
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    assignedDate: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  daysOfWeek: {
    type: [String],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  color: {
    type: String,
    default: '#3B82F6', // Default blue color
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Color must be a valid hex color code'
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
shiftSchema.index({ name: 1 });
shiftSchema.index({ isActive: 1 });
shiftSchema.index({ 'assignedEmployees.employeeId': 1 });

// Virtual for formatted time range
shiftSchema.virtual('timeRange').get(function() {
  return `${this.startTime} - ${this.endTime}`;
});

// Method to check if shift is currently active
shiftSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // Get HH:mm format
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  
  return this.isActive && 
         this.daysOfWeek.includes(currentDay) && 
         currentTime >= this.startTime && 
         currentTime <= this.endTime;
};

// Method to get employees assigned to this shift
shiftSchema.methods.getAssignedEmployees = function() {
  return this.populate('assignedEmployees.employeeId');
};

module.exports = mongoose.model('Shift', shiftSchema); 