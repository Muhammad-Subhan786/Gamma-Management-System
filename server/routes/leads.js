const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Employee = require('../models/Employee');

// Get all leads with optional filtering
router.get('/', async (req, res) => {
  try {
    const { status, assignedEmployee, search, page = 1, limit = 50 } = req.query;
    
    const query = { isActive: true };
    
    if (status) {
      query.status = status;
    }
    
    if (assignedEmployee) {
      query.assignedEmployee = assignedEmployee;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const skip = (page - 1) * limit;
    
    const leads = await Lead.find(query)
      .populate('assignedEmployee', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Lead.countDocuments(query);
    
    res.json({
      leads,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Get lead by ID
router.get('/:id', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedEmployee', 'name');
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    res.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// Create new lead
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      productInterest,
      expectedPrice,
      assignedEmployee,
      status,
      source,
      notes,
      followUpDate
    } = req.body;
    
    // Validate required fields
    if (!customerName || !customerPhone) {
      return res.status(400).json({ error: 'Customer name and phone are required' });
    }
    
    // Validate assigned employee if provided
    if (assignedEmployee) {
      const employee = await Employee.findById(assignedEmployee);
      if (!employee) {
        return res.status(400).json({ error: 'Invalid assigned employee' });
      }
    }
    
    const lead = new Lead({
      customerName,
      customerPhone,
      customerEmail,
      productInterest,
      expectedPrice: expectedPrice ? parseFloat(expectedPrice) : undefined,
      assignedEmployee,
      status: status || 'new',
      source,
      notes,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined
    });
    
    await lead.save();
    
    const populatedLead = await Lead.findById(lead._id)
      .populate('assignedEmployee', 'name');
    
    res.status(201).json(populatedLead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// Update lead
router.put('/:id', async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      productInterest,
      expectedPrice,
      assignedEmployee,
      status,
      source,
      notes,
      followUpDate
    } = req.body;
    
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    // Validate assigned employee if provided
    if (assignedEmployee) {
      const employee = await Employee.findById(assignedEmployee);
      if (!employee) {
        return res.status(400).json({ error: 'Invalid assigned employee' });
      }
    }
    
    // Update fields
    if (customerName !== undefined) lead.customerName = customerName;
    if (customerPhone !== undefined) lead.customerPhone = customerPhone;
    if (customerEmail !== undefined) lead.customerEmail = customerEmail;
    if (productInterest !== undefined) lead.productInterest = productInterest;
    if (expectedPrice !== undefined) lead.expectedPrice = expectedPrice ? parseFloat(expectedPrice) : undefined;
    if (assignedEmployee !== undefined) lead.assignedEmployee = assignedEmployee;
    if (status !== undefined) lead.status = status;
    if (source !== undefined) lead.source = source;
    if (notes !== undefined) lead.notes = notes;
    if (followUpDate !== undefined) lead.followUpDate = followUpDate ? new Date(followUpDate) : undefined;
    
    await lead.save();
    
    const updatedLead = await Lead.findById(lead._id)
      .populate('assignedEmployee', 'name');
    
    res.json(updatedLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// Delete lead (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    lead.isActive = false;
    await lead.save();
    
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// Get lead analytics
router.get('/analytics/summary', async (req, res) => {
  try {
    const totalLeads = await Lead.countDocuments({ isActive: true });
    const wonLeads = await Lead.countDocuments({ isActive: true, status: 'closed_won' });
    const lostLeads = await Lead.countDocuments({ isActive: true, status: 'closed_lost' });
    const activeLeads = await Lead.countDocuments({ 
      isActive: true, 
      status: { $nin: ['closed_won', 'closed_lost'] } 
    });
    
    // Status distribution
    const statusDistribution = await Lead.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyTrend = await Lead.aggregate([
      { 
        $match: { 
          isActive: true, 
          createdAt: { $gte: sixMonthsAgo } 
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Top performing employees
    const topEmployees = await Lead.aggregate([
      { $match: { isActive: true, assignedEmployee: { $exists: true } } },
      {
        $group: {
          _id: '$assignedEmployee',
          totalLeads: { $sum: 1 },
          wonLeads: {
            $sum: { $cond: [{ $eq: ['$status', 'closed_won'] }, 1, 0] }
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
      { $unwind: '$employee' },
      {
        $project: {
          employeeName: '$employee.name',
          totalLeads: 1,
          wonLeads: 1,
          winRate: { $multiply: [{ $divide: ['$wonLeads', '$totalLeads'] }, 100] }
        }
      },
      { $sort: { totalLeads: -1 } },
      { $limit: 5 }
    ]);
    
    res.json({
      summary: {
        totalLeads,
        wonLeads,
        lostLeads,
        activeLeads,
        winRate: totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0
      },
      statusDistribution,
      monthlyTrend,
      topEmployees
    });
  } catch (error) {
    console.error('Error fetching lead analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router; 