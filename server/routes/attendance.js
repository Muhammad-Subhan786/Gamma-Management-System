const express = require('express');
const router = express.Router();
const moment = require('moment');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

// Check-in endpoint
router.post('/checkin', async (req, res) => {
  try {
    const { employeeId, name, email } = req.body;
    let employee;
    if (employeeId) {
      console.log('[Check-in] Received employeeId:', employeeId);
      employee = await Employee.findOne({ employeeId: employeeId.trim().toLowerCase() });
      console.log('[Check-in] Matched employee:', employee ? employee._id : null, employee ? employee.name : null);
    } else {
      employee = await Employee.findOne({
        $or: [
          { name: { $regex: new RegExp(name, 'i') } },
          { email: { $regex: new RegExp(email, 'i') } }
        ]
      });
    }
    if (!employee) {
      console.log('[Check-in] Employee not found for ID:', employeeId);
      return res.status(404).json({ error: 'Employee not found' });
    }

    const now = moment();
    const today = moment().startOf('day');
    const expectedStartTime = moment().set({ hour: 18, minute: 0, second: 0 }); // 6 PM
    
    // Check if late (more than 20 minutes after 6 PM)
    const isLate = now.isAfter(expectedStartTime.add(20, 'minutes'));
    
    // Get or create attendance record for today
    let attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today.toDate()
    });
    console.log('[Check-in] Attendance record before:', attendance);

    if (!attendance) {
      attendance = new Attendance({
        employeeId: employee._id,
        date: today.toDate(),
        checkIns: [],
        checkOuts: [],
        totalHours: 0,
        wasLate: false,
        wasAbsentYesterday: false,
        shiftEnded: false,
        shiftEndTime: null
      });
    }

    // Check if this employee's shift has ended
    if (attendance.shiftEnded) {
      return res.status(400).json({ 
        error: 'Your shift has ended for today. No more check-ins allowed.' 
      });
    }

    // Add check-in time
    attendance.checkIns.push(now.toDate());
    attendance.wasLate = isLate;
    
    await attendance.save();
    console.log('[Check-in] Attendance record after save:', attendance);

    res.json({
      success: true,
      employee: {
        name: employee.name,
        email: employee.email
      },
      checkInTime: now.format('YYYY-MM-DD HH:mm:ss'),
      isLate,
      message: isLate ? 'You are late' : 'Check-in successful'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check-out endpoint
router.post('/checkout', async (req, res) => {
  try {
    const { employeeId, name, email } = req.body;
    let employee;
    if (employeeId) {
      employee = await Employee.findOne({ employeeId: employeeId.trim().toLowerCase() });
    } else {
      employee = await Employee.findOne({
        $or: [
          { name: { $regex: new RegExp(name, 'i') } },
          { email: { $regex: new RegExp(email, 'i') } }
        ]
      });
    }
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const now = moment();
    const today = moment().startOf('day');
    
    // Get attendance record for today
    let attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today.toDate()
    });

    if (!attendance || attendance.checkIns.length === 0) {
      return res.status(400).json({ error: 'No check-in found for today' });
    }

    // Check if this employee's shift has ended
    if (attendance.shiftEnded) {
      return res.status(400).json({ 
        error: 'Your shift has ended for today. No more check-outs allowed.' 
      });
    }

    // Add check-out time
    attendance.checkOuts.push(now.toDate());
    
    // Calculate total hours for the day
    let totalHours = 0;
    const checkIns = [...attendance.checkIns];
    const checkOuts = [...attendance.checkOuts];
    
    // Sort by time
    checkIns.sort((a, b) => new Date(a) - new Date(b));
    checkOuts.sort((a, b) => new Date(a) - new Date(b));
    
    // Calculate hours for each session
    for (let i = 0; i < Math.min(checkIns.length, checkOuts.length); i++) {
      const checkIn = moment(checkIns[i]);
      const checkOut = moment(checkOuts[i]);
      totalHours += checkOut.diff(checkIn, 'hours', true);
    }
    
    attendance.totalHours = totalHours;
    await attendance.save();

    res.json({
      success: true,
      employee: {
        name: employee.name,
        email: employee.email
      },
      checkOutTime: now.format('YYYY-MM-DD HH:mm:ss'),
      totalHours: totalHours.toFixed(2),
      message: 'Check-out successful'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Time to Go endpoint - End shift for all employees (ADMIN ONLY)
router.post('/time-to-go', async (req, res) => {
  try {
    const now = moment();
    const today = moment().startOf('day');
    
    // Find all attendance records for today
    const todayAttendance = await Attendance.find({
      date: today.toDate()
    });

    if (todayAttendance.length === 0) {
      return res.status(400).json({ 
        error: 'No attendance records found for today' 
      });
    }

    // End shift for all employees
    const updatePromises = todayAttendance.map(attendance => {
      return Attendance.findByIdAndUpdate(attendance._id, {
        shiftEnded: true,
        shiftEndTime: now.toDate()
      });
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Shift ended for all employees',
      shiftEndTime: now.format('YYYY-MM-DD HH:mm:ss'),
      affectedEmployees: todayAttendance.length
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Employee Time to Go endpoint - End individual employee shift
router.post('/employee-time-to-go', async (req, res) => {
  try {
    const { employeeId, name, email } = req.body;
    let employee;
    if (employeeId) {
      employee = await Employee.findOne({ employeeId: employeeId.trim().toLowerCase() });
    } else {
      employee = await Employee.findOne({
        $or: [
          { name: { $regex: new RegExp(name, 'i') } },
          { email: { $regex: new RegExp(email, 'i') } }
        ]
      });
    }
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const now = moment();
    const today = moment().startOf('day');
    
    // Get attendance record for today
    let attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today.toDate()
    });

    if (!attendance) {
      return res.status(400).json({ 
        error: 'No attendance record found for today' 
      });
    }

    // Check if employee's shift has already ended
    if (attendance.shiftEnded) {
      return res.status(400).json({ 
        error: 'Your shift has already ended for today' 
      });
    }

    // End shift for this specific employee
    attendance.shiftEnded = true;
    attendance.shiftEndTime = now.toDate();
    await attendance.save();

    res.json({
      success: true,
      message: 'Your shift has ended successfully',
      shiftEndTime: now.format('YYYY-MM-DD HH:mm:ss'),
      employee: {
        name: employee.name,
        email: employee.email
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Shift endpoint - Open shift for all employees
router.post('/start-shift', async (req, res) => {
  try {
    const now = moment();
    const today = moment().startOf('day');
    
    // Check if there are any existing attendance records for today
    const existingAttendance = await Attendance.findOne({
      date: today.toDate()
    });

    if (existingAttendance && existingAttendance.shiftEnded) {
      // If shift was ended, reopen it
      await Attendance.updateMany(
        { date: today.toDate() },
        { 
          shiftEnded: false,
          shiftEndTime: null
        }
      );

      res.json({
        success: true,
        message: 'Shift reopened for all employees',
        shiftStartTime: now.format('YYYY-MM-DD HH:mm:ss'),
        action: 'reopened'
      });
    } else {
      // If no attendance records exist, create them for all employees
      const allEmployees = await Employee.find({});
      
      if (allEmployees.length === 0) {
        return res.status(400).json({ 
          error: 'No employees found in the system' 
        });
      }

      // Create attendance records for all employees with shift open
      const attendanceRecords = allEmployees.map(employee => ({
        employeeId: employee._id,
        date: today.toDate(),
        checkIns: [],
        checkOuts: [],
        totalHours: 0,
        wasLate: false,
        wasAbsentYesterday: false,
        shiftEnded: false,
        shiftEndTime: null
      }));

      await Attendance.insertMany(attendanceRecords);

      res.json({
        success: true,
        message: 'Shift started for all employees',
        shiftStartTime: now.format('YYYY-MM-DD HH:mm:ss'),
        affectedEmployees: allEmployees.length,
        action: 'started'
      });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get shift status for today
router.get('/shift-status', async (req, res) => {
  try {
    const today = moment().startOf('day');
    
    // Find any attendance record for today to check shift status
    const attendance = await Attendance.findOne({
      date: today.toDate()
    });

    const shiftEnded = attendance ? attendance.shiftEnded : false;
    const shiftEndTime = attendance && attendance.shiftEndTime 
      ? moment(attendance.shiftEndTime).format('YYYY-MM-DD HH:mm:ss')
      : null;

    // Check if there are any employees in the system
    const employeeCount = await Employee.countDocuments();

    res.json({
      shiftEnded,
      shiftEndTime,
      hasEmployees: employeeCount > 0,
      employeeCount,
      message: shiftEnded ? 'Shift has ended for today' : 'Shift is active'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get today's check-ins for public display
router.get('/today-checkins', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? moment(date).startOf('day') : moment().startOf('day');
    
    // Get all attendance records for today
    const todayAttendance = await Attendance.find({
      date: targetDate.toDate()
    }).populate('employeeId', 'name email profilePicture employeeId');
    console.log('[TodayCheckIns] Attendance records found:', todayAttendance.length);

    // Format the data for display
    const checkIns = [];
    todayAttendance.forEach(attendance => {
      if (attendance.checkIns.length > 0) {
        // Get the latest check-in time
        const latestCheckIn = moment(Math.max(...attendance.checkIns.map(c => new Date(c))));
        
        checkIns.push({
          employee: {
            _id: attendance.employeeId._id,
            employeeId: attendance.employeeId.employeeId,
            name: attendance.employeeId.name,
            email: attendance.employeeId.email,
            profilePicture: attendance.employeeId.profilePicture
          },
          checkInTime: latestCheckIn.format('YYYY-MM-DD HH:mm:ss'),
          isLate: attendance.wasLate,
          totalCheckIns: attendance.checkIns.length
        });
      }
    });

    // Sort by check-in time (earliest first)
    checkIns.sort((a, b) => moment(a.checkInTime).diff(moment(b.checkInTime)));

    res.json(checkIns);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance status for today
router.get('/status/:employeeId', async (req, res) => {
  try {
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'day').startOf('day');
    
    const attendance = await Attendance.findOne({
      employeeId: req.params.employeeId,
      date: today.toDate()
    });

    const yesterdayAttendance = await Attendance.findOne({
      employeeId: req.params.employeeId,
      date: yesterday.toDate()
    });

    const wasAbsentYesterday = !yesterdayAttendance && yesterday.day() !== 0; // Not Sunday

    res.json({
      today: attendance || null,
      wasAbsentYesterday
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance history for an employee
router.get('/history/:employeeId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = { employeeId: req.params.employeeId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: moment(startDate).startOf('day').toDate(),
        $lte: moment(endDate).endOf('day').toDate()
      };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('employeeId', 'name email');

    res.json(attendance);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get employee shift status
router.get('/employee-shift-status', async (req, res) => {
  try {
    const { name, email } = req.query;
    const today = moment().startOf('day');
    
    if (!name && !email) {
      return res.status(400).json({ 
        error: 'Name or email is required' 
      });
    }

    // Find employee by name or email
    const employee = await Employee.findOne({
      $or: [
        { name: { $regex: new RegExp(name || '', 'i') } },
        { email: { $regex: new RegExp(email || '', 'i') } }
      ]
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Get attendance record for today
    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today.toDate()
    });

    const shiftEnded = attendance ? attendance.shiftEnded : false;
    const shiftEndTime = attendance && attendance.shiftEndTime 
      ? moment(attendance.shiftEndTime).format('YYYY-MM-DD HH:mm:ss')
      : null;

    res.json({
      employee: {
        name: employee.name,
        email: employee.email
      },
      shiftEnded,
      shiftEndTime,
      message: shiftEnded ? 'Your shift has ended for today' : 'Your shift is active'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 