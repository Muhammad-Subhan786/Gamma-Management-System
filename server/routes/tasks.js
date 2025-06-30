const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT and set req.user
const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.employee = await Employee.findById(decoded.employeeId);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Helper: is admin
const isAdmin = (employee) => employee && employee.role && employee.role.toLowerCase().includes('admin');

// GET /api/tasks (admin: all, employee: assigned to them)
router.get('/', authenticate, async (req, res) => {
  try {
    let tasks;
    if (isAdmin(req.employee)) {
      tasks = await Task.find()
        .populate('assignedTo', 'name email profilePicture')
        .populate('createdBy', 'name email profilePicture')
        .populate('comments.author', 'name email profilePicture');
    } else {
      tasks = await Task.find({ assignedTo: req.employee._id })
        .populate('assignedTo', 'name email profilePicture')
        .populate('createdBy', 'name email profilePicture')
        .populate('comments.author', 'name email profilePicture');
    }
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks (admin: assign to anyone, employee: assign to self)
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, due, status, assignedTo, notes } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    let assignTo = assignedTo;
    if (!isAdmin(req.employee)) assignTo = req.employee._id;
    const task = new Task({
      title,
      description,
      due,
      status: status || 'tasks',
      assignedTo: assignTo,
      createdBy: req.employee._id,
      notes
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id (edit task)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!isAdmin(req.employee) && !task.assignedTo.equals(req.employee._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { title, description, due, status, assignedTo, notes } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (due !== undefined) task.due = due;
    if (status !== undefined) task.status = status;
    if (isAdmin(req.employee) && assignedTo !== undefined) task.assignedTo = assignedTo;
    if (notes !== undefined) task.notes = notes;
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id/move (move task between columns)
router.patch('/:id/move', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!isAdmin(req.employee) && !task.assignedTo.equals(req.employee._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    task.status = status;
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!isAdmin(req.employee) && !task.assignedTo.equals(req.employee._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await task.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/comments (add comment)
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    task.comments.push({ text, author: req.employee._id });
    await task.save();
    await task.populate('comments.author', 'name email profilePicture');
    res.status(201).json(task.comments[task.comments.length - 1]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id/comments/:commentId (delete comment)
router.delete('/:id/comments/:commentId', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const comment = task.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    // Only author or admin can delete
    if (!isAdmin(req.employee) && !comment.author.equals(req.employee._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    comment.remove();
    await task.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 