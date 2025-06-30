const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIns: [{
    type: Date,
    default: []
  }],
  checkOuts: [{
    type: Date,
    default: []
  }],
  totalHours: {
    type: Number,
    default: 0
  },
  wasLate: {
    type: Boolean,
    default: false
  },
  wasAbsentYesterday: {
    type: Boolean,
    default: false
  },
  shiftEnded: {
    type: Boolean,
    default: false
  },
  shiftEndTime: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema); 