const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    default: 'password123' // Default password for new employees
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  cnic: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  dob: {
    type: Date,
    required: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  bankAccount: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: 'General'
  },
  position: {
    type: String,
    default: 'Employee'
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  salary: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  allowedSessions: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Index for faster queries
employeeSchema.index({ email: 1 });
employeeSchema.index({ cnic: 1 });

module.exports = mongoose.model('Employee', employeeSchema); 