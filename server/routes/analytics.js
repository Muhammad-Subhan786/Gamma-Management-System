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

    // Today's check-ins (for graph and stats)
    const totalCheckIns = await Attendance.countDocuments({ date: today.toDate() });
    const presentToday = await Attendance.countDocuments({ date: today.toDate() });
    const late = await Attendance.countDocuments({ date: today.toDate(), wasLate: true });
    // For 'onTime', count those who checked in and were not late
    const onTime = await Attendance.countDocuments({ date: today.toDate(), wasLate: false });
    // For 'absent', count employees who have no attendance record today
    const totalEmployees = await Employee.countDocuments();
    const absent = totalEmployees - presentToday;

    // Daily data for the last 7 days (for attendance graph)
    const last7Days = moment().subtract(6, 'days').startOf('day');
    const dailyDataAgg = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: last7Days.toDate() }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          checkIns: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    // Fill missing days with 0 checkIns
    const dailyData = [];
    for (let i = 0; i < 7; i++) {
      const date = moment(last7Days).add(i, 'days').format('YYYY-MM-DD');
      const found = dailyDataAgg.find(d => d._id === date);
      dailyData.push({ date, checkIns: found ? found.checkIns : 0 });
    }
    if (dailyData.length === 0) {
      console.warn('[Analytics] /summary: dailyData is empty!');
    } else {
      console.log('[Analytics] /summary: dailyData =', JSON.stringify(dailyData));
    }
    console.log('[Analytics] /summary: Returning', {
      totalCheckIns,
      presentToday,
      onTime,
      late,
      absent,
      dailyData
    });
    res.json({
      totalCheckIns,
      presentToday,
      onTime,
      late,
      absent,
      dailyData
    });
  } catch (error) {
    console.error('[Analytics] /summary error:', error);
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