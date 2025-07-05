const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift');
const Employee = require('../models/Employee');

// Get all shifts
router.get('/', async (req, res) => {
  try {
    console.log('📊 Fetching all shifts...');
    const shifts = await Shift.find()
      .populate('assignedEmployees.employeeId', 'name email position department profilePicture')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${shifts.length} shifts`);
    res.json(shifts);
  } catch (error) {
    console.error('❌ Error fetching shifts:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch shifts',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get active shifts
router.get('/active', async (req, res) => {
  try {
    const shifts = await Shift.find({ isActive: true })
      .populate('assignedEmployees.employeeId', 'name email position department profilePicture')
      .sort({ name: 1 });
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get employees not assigned to any shift
router.get('/unassigned-employees', async (req, res) => {
  try {
    const allShifts = await Shift.find({ isActive: true });
    const assignedEmployeeIds = new Set();
    allShifts.forEach(shift => {
      shift.assignedEmployees.forEach(assignment => {
        assignedEmployeeIds.add(assignment.employeeId.toString());
      });
    });
    const unassignedEmployees = await Employee.find({
      _id: { $nin: Array.from(assignedEmployeeIds) },
      isActive: true
    }).select('name email position department profilePicture');
    res.json(unassignedEmployees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get shift by ID
router.get('/:id', async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id)
      .populate('assignedEmployees.employeeId', 'name email position department profilePicture');
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    res.json(shift);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new shift
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      startTime,
      endTime,
      workingHours,
      daysOfWeek,
      color,
      assignedEmployees
    } = req.body;
    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:mm (24-hour format)' });
    }
    // Validate that end time is after start time
    if (startTime >= endTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }
    // Validate assigned employees if provided
    if (assignedEmployees && assignedEmployees.length > 0) {
      const employeeIds = assignedEmployees.map(emp => emp.employeeId);
      const existingEmployees = await Employee.find({ _id: { $in: employeeIds } });
      if (existingEmployees.length !== employeeIds.length) {
        return res.status(400).json({ error: 'One or more assigned employees not found' });
      }
    }
    const shift = new Shift({
      name,
      description,
      startTime,
      endTime,
      workingHours,
      daysOfWeek: daysOfWeek || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      color: color || '#3B82F6',
      assignedEmployees: assignedEmployees || []
    });
    const savedShift = await shift.save();
    const populatedShift = await Shift.findById(savedShift._id)
      .populate('assignedEmployees.employeeId', 'name email position department profilePicture');
    res.status(201).json(populatedShift);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update shift
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      description,
      startTime,
      endTime,
      workingHours,
      daysOfWeek,
      color,
      isActive
    } = req.body;
    const shift = await Shift.findById(req.params.id);
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    // Validate time format if provided
    if (startTime || endTime) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      const newStartTime = startTime || shift.startTime;
      const newEndTime = endTime || shift.endTime;
      if (!timeRegex.test(newStartTime) || !timeRegex.test(newEndTime)) {
        return res.status(400).json({ error: 'Invalid time format. Use HH:mm (24-hour format)' });
      }
      if (newStartTime >= newEndTime) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }
    }
    const updatedShift = await Shift.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        startTime,
        endTime,
        workingHours,
        daysOfWeek,
        color,
        isActive
      },
      { new: true, runValidators: true }
    ).populate('assignedEmployees.employeeId', 'name email position department profilePicture');
    res.json(updatedShift);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete shift
router.delete('/:id', async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    // Check if shift has assigned employees
    if (shift.assignedEmployees.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete shift with assigned employees. Please unassign employees first.' 
      });
    }
    await Shift.findByIdAndDelete(req.params.id);
    res.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign employees to shift
router.post('/:id/assign-employees', async (req, res) => {
  try {
    const { employeeIds } = req.body;
    if (!employeeIds || !Array.isArray(employeeIds)) {
      return res.status(400).json({ error: 'Employee IDs array is required' });
    }
    const shift = await Shift.findById(req.params.id);
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    // Validate that all employees exist
    const existingEmployees = await Employee.find({ _id: { $in: employeeIds } });
    if (existingEmployees.length !== employeeIds.length) {
      return res.status(400).json({ error: 'One or more employees not found' });
    }
    // Check for duplicate assignments
    const existingAssignments = shift.assignedEmployees.map(assignment => 
      assignment.employeeId.toString()
    );
    const newAssignments = employeeIds.filter(empId => 
      !existingAssignments.includes(empId)
    );
    if (newAssignments.length === 0) {
      return res.status(400).json({ error: 'All employees are already assigned to this shift' });
    }
    // Add new assignments
    const assignmentsToAdd = newAssignments.map(employeeId => ({
      employeeId,
      assignedDate: new Date()
    }));
    shift.assignedEmployees.push(...assignmentsToAdd);
    await shift.save();
    const updatedShift = await Shift.findById(req.params.id)
      .populate('assignedEmployees.employeeId', 'name email position department profilePicture');
    res.json(updatedShift);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unassign employees from shift
router.post('/:id/unassign-employees', async (req, res) => {
  try {
    const { employeeIds } = req.body;
    if (!employeeIds || !Array.isArray(employeeIds)) {
      return res.status(400).json({ error: 'Employee IDs array is required' });
    }
    const shift = await Shift.findById(req.params.id);
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    // Remove assignments
    shift.assignedEmployees = shift.assignedEmployees.filter(assignment => 
      !employeeIds.includes(assignment.employeeId.toString())
    );
    await shift.save();
    const updatedShift = await Shift.findById(req.params.id)
      .populate('assignedEmployees.employeeId', 'name email position department profilePicture');
    res.json(updatedShift);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get shift statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id)
      .populate('assignedEmployees.employeeId', 'name email position department');
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    const stats = {
      totalAssignedEmployees: shift.assignedEmployees.length,
      workingHours: shift.workingHours,
      timeRange: shift.timeRange,
      daysOfWeek: shift.daysOfWeek,
      isActive: shift.isActive,
      isCurrentlyActive: shift.isCurrentlyActive()
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
