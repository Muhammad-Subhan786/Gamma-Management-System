const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  createdAt: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  due: { type: Date },
  status: { type: String, enum: ['tasks', 'done', 'complete'], default: 'tasks' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  notes: { type: String, trim: true },
  comments: [commentSchema],
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema); 