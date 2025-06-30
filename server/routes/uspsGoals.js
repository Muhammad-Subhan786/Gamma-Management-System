const express = require('express');
const router = express.Router();
const USPSGoal = require('../models/USPSGoal');
const USPSLabel = require('../models/USPSLabel');
const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');

// Middleware to verify employee token
const verifyEmployeeToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employee = await Employee.findById(decoded.employeeId);
    
    if (!employee) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.employee = employee;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get employee's current month goal
router.get('/employee/current', verifyEmployeeToken, async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    let goal = await USPSGoal.findOne({ 
      employeeId: req.employee._id, 
      month: currentMonth 
    });

    if (!goal) {
      // Create default goal if none exists
      goal = new USPSGoal({
        employeeId: req.employee._id,
        month: currentMonth,
        targetLabels: 6000, // Default target
        targetRevenue: 12000 // Default revenue target
      });
      await goal.save();
    }

    // Update current progress from labels
    await updateGoalProgress(goal._id);
    goal = await USPSGoal.findById(goal._id);

    res.json(goal);
  } catch (error) {
    console.error('Error fetching employee goal:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

// Get employee's goal history
router.get('/employee/history', verifyEmployeeToken, async (req, res) => {
  try {
    const goals = await USPSGoal.find({ employeeId: req.employee._id })
      .sort({ month: -1 })
      .limit(12); // Last 12 months
    
    res.json(goals);
  } catch (error) {
    console.error('Error fetching goal history:', error);
    res.status(500).json({ error: 'Failed to fetch goal history' });
  }
});

// Update employee's current goal
router.put('/employee/current', verifyEmployeeToken, async (req, res) => {
  try {
    const { targetLabels, targetRevenue } = req.body;
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    let goal = await USPSGoal.findOne({ 
      employeeId: req.employee._id, 
      month: currentMonth 
    });

    if (!goal) {
      goal = new USPSGoal({
        employeeId: req.employee._id,
        month: currentMonth,
        targetLabels,
        targetRevenue
      });
    } else {
      goal.targetLabels = targetLabels;
      goal.targetRevenue = targetRevenue;
    }

    await goal.save();
    await updateGoalProgress(goal._id);
    goal = await USPSGoal.findById(goal._id);

    res.json(goal);
  } catch (error) {
    console.error('Error updating employee goal:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// Admin: Get all employee goals for current month
router.get('/admin/current', async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const goals = await USPSGoal.find({ month: currentMonth })
      .populate('employeeId', 'name email position')
      .sort({ overallProgress: -1 });

    res.json(goals);
  } catch (error) {
    console.error('Error fetching admin goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Admin: Get goal analytics
router.get('/admin/analytics', async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const goals = await USPSGoal.find({ month: currentMonth })
      .populate('employeeId', 'name');

    const analytics = {
      totalEmployees: goals.length,
      averageProgress: goals.length > 0 ? 
        goals.reduce((sum, goal) => sum + goal.overallProgress, 0) / goals.length : 0,
      completedGoals: goals.filter(goal => goal.status === 'completed').length,
      activeGoals: goals.filter(goal => goal.status === 'active').length,
      overdueGoals: goals.filter(goal => goal.status === 'overdue').length,
      topPerformers: goals
        .sort((a, b) => b.overallProgress - a.overallProgress)
        .slice(0, 5)
        .map(goal => ({
          name: goal.employeeId.name,
          progress: goal.overallProgress,
          labels: goal.currentLabels,
          revenue: goal.currentRevenue
        })),
      progressDistribution: {
        excellent: goals.filter(goal => goal.overallProgress >= 100).length,
        good: goals.filter(goal => goal.overallProgress >= 75 && goal.overallProgress < 100).length,
        fair: goals.filter(goal => goal.overallProgress >= 50 && goal.overallProgress < 75).length,
        poor: goals.filter(goal => goal.overallProgress < 50).length
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching goal analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Admin: Set goal for specific employee
router.post('/admin/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, targetLabels, targetRevenue } = req.body;

    let goal = await USPSGoal.findOne({ employeeId, month });
    
    if (goal) {
      goal.targetLabels = targetLabels;
      goal.targetRevenue = targetRevenue;
    } else {
      goal = new USPSGoal({
        employeeId,
        month,
        targetLabels,
        targetRevenue
      });
    }

    await goal.save();
    await updateGoalProgress(goal._id);
    goal = await USPSGoal.findById(goal._id).populate('employeeId', 'name email position');

    res.json(goal);
  } catch (error) {
    console.error('Error setting employee goal:', error);
    res.status(500).json({ error: 'Failed to set goal' });
  }
});

// Admin: Get employee goal history
router.get('/admin/employee/:employeeId/history', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const goals = await USPSGoal.find({ employeeId })
      .sort({ month: -1 })
      .limit(12);

    res.json(goals);
  } catch (error) {
    console.error('Error fetching employee goal history:', error);
    res.status(500).json({ error: 'Failed to fetch goal history' });
  }
});

// Helper function to update goal progress
async function updateGoalProgress(goalId) {
  try {
    const goal = await USPSGoal.findById(goalId);
    if (!goal) return;

    // Calculate current month's labels and revenue
    const startDate = new Date(goal.month + '-01');
    const endDate = new Date(goal.month + '-31');
    
    const labels = await USPSLabel.find({
      employeeId: goal.employeeId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const currentLabels = labels.reduce((sum, label) => sum + label.paidLabels, 0);
    const currentRevenue = labels.reduce((sum, label) => sum + label.totalRevenue, 0);

    goal.currentLabels = currentLabels;
    goal.currentRevenue = currentRevenue;
    goal.updateStatus();
    goal.updatedAt = new Date();

    await goal.save();
  } catch (error) {
    console.error('Error updating goal progress:', error);
  }
}

// Update all goals progress (can be called periodically)
router.post('/update-progress', async (req, res) => {
  try {
    const goals = await USPSGoal.find();
    for (const goal of goals) {
      await updateGoalProgress(goal._id);
    }
    res.json({ message: 'All goals updated successfully' });
  } catch (error) {
    console.error('Error updating all goals:', error);
    res.status(500).json({ error: 'Failed to update goals' });
  }
});

module.exports = router; 