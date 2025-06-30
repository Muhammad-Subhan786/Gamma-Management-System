const express = require('express');
const router = express.Router();
const moment = require('moment');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

// Get total hours worked per employee
router.get('/total-hours', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchStage = {};
    if (startDate && endDate) {
      matchStage.date = {
        $gte: moment(startDate).startOf('day').toDate(),
        $lte: moment(endDate).endOf('day').toDate()
      };
    }

    const totalHours = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$employeeId',
          totalHours: { $sum: '$totalHours' },
          totalDays: { $sum: 1 },
          lateDays: { $sum: { $cond: ['$wasLate', 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $unwind: '$employee'
      },
      {
        $project: {
          employeeId: '$_id',
          name: '$employee.name',
          email: '$employee.email',
          totalHours: { $round: ['$totalHours', 2] },
          totalDays: 1,
          lateDays: 1,
          averageHoursPerDay: { $round: [{ $divide: ['$totalHours', '$totalDays'] }, 2] }
        }
      },
      { $sort: { totalHours: -1 } }
    ]);

    res.json(totalHours);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top 3 most punctual employees
router.get('/top-punctual', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchStage = {};
    if (startDate && endDate) {
      matchStage.date = {
        $gte: moment(startDate).startOf('day').toDate(),
        $lte: moment(endDate).endOf('day').toDate()
      };
    }

    const topPunctual = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$employeeId',
          totalDays: { $sum: 1 },
          lateDays: { $sum: { $cond: ['$wasLate', 1, 0] } },
          totalHours: { $sum: '$totalHours' }
        }
      },
      {
        $addFields: {
          punctualityRate: {
            $multiply: [
              { $divide: [{ $subtract: ['$totalDays', '$lateDays'] }, '$totalDays'] },
              100
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $unwind: '$employee'
      },
      {
        $project: {
          employeeId: '$_id',
          name: '$employee.name',
          email: '$employee.email',
          punctualityRate: { $round: ['$punctualityRate', 2] },
          totalDays: 1,
          lateDays: 1,
          totalHours: { $round: ['$totalHours', 2] }
        }
      },
      { $sort: { punctualityRate: -1, totalHours: -1 } },
      { $limit: 3 }
    ]);

    res.json(topPunctual);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top 3 hardworking employees (most hours)
router.get('/top-hardworking', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchStage = {};
    if (startDate && endDate) {
      matchStage.date = {
        $gte: moment(startDate).startOf('day').toDate(),
        $lte: moment(endDate).endOf('day').toDate()
      };
    }

    const topHardworking = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$employeeId',
          totalHours: { $sum: '$totalHours' },
          totalDays: { $sum: 1 },
          averageHoursPerDay: { $avg: '$totalHours' }
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $unwind: '$employee'
      },
      {
        $project: {
          employeeId: '$_id',
          name: '$employee.name',
          email: '$employee.email',
          totalHours: { $round: ['$totalHours', 2] },
          totalDays: 1,
          averageHoursPerDay: { $round: ['$averageHoursPerDay', 2] }
        }
      },
      { $sort: { totalHours: -1 } },
      { $limit: 3 }
    ]);

    res.json(topHardworking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance summary for dashboard
router.get('/summary', async (req, res) => {
  try {
    const today = moment().startOf('day');
    const thisWeek = moment().startOf('week');
    const thisMonth = moment().startOf('month');

    // Today's attendance
    const todayAttendance = await Attendance.countDocuments({
      date: today.toDate()
    });

    // This week's total hours
    const weekHours = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: thisWeek.toDate() }
        }
      },
      {
        $group: {
          _id: null,
          totalHours: { $sum: '$totalHours' }
        }
      }
    ]);

    // This month's total hours
    const monthHours = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: thisMonth.toDate() }
        }
      },
      {
        $group: {
          _id: null,
          totalHours: { $sum: '$totalHours' }
        }
      }
    ]);

    // Total employees
    const totalEmployees = await Employee.countDocuments();

    // Late employees today
    const lateToday = await Attendance.countDocuments({
      date: today.toDate(),
      wasLate: true
    });

    res.json({
      todayAttendance,
      weekHours: weekHours[0]?.totalHours || 0,
      monthHours: monthHours[0]?.totalHours || 0,
      totalEmployees,
      lateToday
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance trends (last 7 days)
router.get('/trends', async (req, res) => {
  try {
    const last7Days = moment().subtract(6, 'days').startOf('day');
    
    const trends = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: last7Days.toDate() }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          totalHours: { $sum: '$totalHours' },
          employeeCount: { $addToSet: '$employeeId' }
        }
      },
      {
        $addFields: {
          uniqueEmployees: { $size: '$employeeCount' }
        }
      },
      {
        $project: {
          date: '$_id',
          totalHours: { $round: ['$totalHours', 2] },
          uniqueEmployees: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 