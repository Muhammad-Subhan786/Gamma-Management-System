const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Lead = require('../models/Lead');
const Transaction = require('../models/Transaction');
const Employee = require('../models/Employee');

// Get all orders with filters
router.get('/', async (req, res) => {
  try {
    const {
      status,
      deliveryStatus,
      assignedEmployee,
      customerPhone,
      trackingNumber,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const filter = { isActive: true };
    
    if (status) filter.status = status;
    if (deliveryStatus) filter.deliveryStatus = deliveryStatus;
    if (assignedEmployee) filter.assignedEmployee = assignedEmployee;
    if (customerPhone) filter.customerPhone = { $regex: customerPhone, $options: 'i' };
    if (trackingNumber) filter.trackingNumber = { $regex: trackingNumber, $options: 'i' };
    
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    
    const orders = await Order.find(filter)
      .populate('assignedEmployee', 'name email phone')
      .populate('leadId', 'customerName customerPhone qualificationScore')
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('assignedEmployee', 'name email phone')
      .populate('leadId', 'customerName customerPhone qualificationScore source')
      .populate('approvedBy', 'name')
      .populate('validatedBy', 'name');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    console.log('📦 Creating new order with data:', JSON.stringify(req.body, null, 2));
    
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      products,
      advanceAmount,
      assignedEmployee,
      leadId,
      priority,
      notes,
      specialInstructions
    } = req.body;

    // Validate required fields
    if (!customerName || !customerPhone || !customerAddress || !products || products.length === 0) {
      console.log('❌ Validation failed:', { customerName, customerPhone, customerAddress, productsLength: products?.length });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('✅ Validation passed, calculating totals...');

    // Calculate totals
    const subtotal = products.reduce((sum, product) => {
      return sum + (product.price * product.quantity);
    }, 0);

    console.log('💰 Calculated subtotal:', subtotal);

    const order = new Order({
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      products: products.map(product => ({
        name: product.name,
        description: product.description || '',
        quantity: product.quantity,
        price: product.price,
        totalPrice: product.price * product.quantity
      })),
      subtotal,
      advanceAmount: advanceAmount || 0,
      remainingAmount: subtotal - (advanceAmount || 0),
      totalAmount: subtotal,
      assignedEmployee,
      leadId,
      priority,
      notes,
      specialInstructions
    });

    console.log('💾 Saving order to database...');
    await order.save();
    console.log('✅ Order saved successfully with ID:', order._id);

    // Update lead if provided
    if (leadId) {
      console.log('🔗 Updating lead:', leadId);
      await Lead.findByIdAndUpdate(leadId, {
        orderCreated: true,
        orderId: order._id,
        status: 'ready_to_order'
      });
    }

    // Create transaction for advance payment if any
    if (advanceAmount && advanceAmount > 0) {
      console.log('💳 Creating advance transaction for amount:', advanceAmount);
      const transaction = new Transaction({
        transactionType: 'advance',
        amount: advanceAmount,
        source: 'advance_payment',
        orderId: order._id,
        leadId: leadId,
        customerName,
        customerPhone,
        paymentMethod: 'cash', // Default, can be updated
        description: `Advance payment for order ${order._id}`,
        recordedBy: req.user?.id || assignedEmployee || 'system' // Fallback to 'system' if no user
      });
      await transaction.save();
      console.log('✅ Advance transaction created');
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('assignedEmployee', 'name email phone')
      .populate('leadId', 'customerName customerPhone');

    console.log('🎉 Order creation completed successfully');
    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update order
router.put('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        order[key] = req.body[key];
      }
    });

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('assignedEmployee', 'name email phone')
      .populate('leadId', 'customerName customerPhone');

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update delivery status
router.patch('/:id/delivery-status', async (req, res) => {
  try {
    const { deliveryStatus, notes, trackingNumber, courierName, estimatedDelivery } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update delivery status
    await order.updateDeliveryStatus(deliveryStatus, notes);
    
    // Update additional delivery info
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courierName) order.courierName = courierName;
    if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);
    
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('assignedEmployee', 'name email phone')
      .populate('leadId', 'customerName customerPhone');

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Get order analytics
router.get('/analytics/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = { isActive: true };
    if (startDate || endDate) {
      matchStage.orderDate = {};
      if (startDate) matchStage.orderDate.$gte = new Date(startDate);
      if (endDate) matchStage.orderDate.$lte = new Date(endDate);
    }

    const analytics = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalAdvance: { $sum: '$advanceAmount' },
          totalRemaining: { $sum: '$remainingAmount' },
          totalProfit: { $sum: '$profit' },
          avgOrderValue: { $avg: '$totalAmount' },
          statusCounts: {
            $push: '$status'
          },
          deliveryStatusCounts: {
            $push: '$deliveryStatus'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalOrders: 1,
          totalRevenue: 1,
          totalAdvance: 1,
          totalRemaining: 1,
          totalProfit: 1,
          avgOrderValue: 1,
          statusBreakdown: {
            $reduce: {
              input: '$statusCounts',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $literal: {
                      $concat: ['$$this', ': ', { $toString: { $size: { $filter: { input: '$statusCounts', cond: { $eq: ['$$this', '$$this'] } } } } }]
                    }
                  }
                ]
              }
            }
          },
          deliveryBreakdown: {
            $reduce: {
              input: '$deliveryStatusCounts',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $literal: {
                      $concat: ['$$this', ': ', { $toString: { $size: { $filter: { input: '$deliveryStatusCounts', cond: { $eq: ['$$this', '$$this'] } } } } }]
                    }
                  }
                ]
              }
            }
          }
        }
      }
    ]);

    res.json(analytics[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      totalAdvance: 0,
      totalRemaining: 0,
      totalProfit: 0,
      avgOrderValue: 0,
      statusBreakdown: {},
      deliveryBreakdown: {}
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete order (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.isActive = false;
    await order.save();

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 