const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Employee = require('../models/Employee');
const Lead = require('../models/Lead');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://msubhan6612:fICMiSbzLjPCotWF@cluster0.ilp6wrn.mongodb.net/employee-attendance?retryWrites=true&w=majority';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedEnhancedData = async () => {
  try {
    console.log('🚀 Starting enhanced data seeding...');

    // Get existing employees for assignment
    const employees = await Employee.find().limit(5);
    if (employees.length === 0) {
      console.log('⚠️  No employees found. Please seed employees first.');
      return;
    }

    // Sample lead sources
    const leadSources = ['tiktok', 'meta_ads', 'whatsapp', 'referral', 'website'];
    
    // Sample products for orders
    const sampleProducts = [
      { name: 'Gold Ring', description: '18K Gold Ring', price: 25000 },
      { name: 'Diamond Necklace', description: 'Diamond Pendant Necklace', price: 45000 },
      { name: 'Silver Bracelet', description: '925 Silver Bracelet', price: 8000 },
      { name: 'Pearl Earrings', description: 'Freshwater Pearl Earrings', price: 12000 },
      { name: 'Platinum Ring', description: 'Platinum Wedding Ring', price: 35000 }
    ];

    // Create enhanced leads with scoring
    console.log('📝 Creating enhanced leads...');
    const leads = [];
    for (let i = 1; i <= 20; i++) {
      const hasValidAddress = Math.random() > 0.3;
      const hasBudget = Math.random() > 0.4;
      const hasTimeline = Math.random() > 0.5;
      const isReadyToOrder = Math.random() > 0.6;
      
      const lead = new Lead({
        customerName: `Customer ${i}`,
        customerPhone: `+92${300000000 + i}`,
        customerEmail: `customer${i}@example.com`,
        customerAddress: hasValidAddress ? `Address ${i}, City ${i}, Pakistan` : '',
        productInterest: sampleProducts[Math.floor(Math.random() * sampleProducts.length)].name,
        expectedPrice: hasBudget ? sampleProducts[Math.floor(Math.random() * sampleProducts.length)].price : 0,
        advanceAmount: isReadyToOrder ? Math.floor(Math.random() * 5000) + 1000 : 0,
        assignedEmployee: employees[Math.floor(Math.random() * employees.length)]._id,
        status: isReadyToOrder ? 'ready_to_order' : Math.random() > 0.5 ? 'qualified' : 'new',
        source: leadSources[Math.floor(Math.random() * leadSources.length)],
        notes: `Sample lead ${i} with enhanced features`,
        followUpDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        hasValidAddress,
        hasBudget,
        hasTimeline,
        isReadyToOrder,
        qualificationNotes: `Lead ${i} qualification notes`
      });
      
      leads.push(await lead.save());
    }
    console.log(`✅ Created ${leads.length} enhanced leads`);

    // Create orders with delivery tracking
    console.log('📦 Creating orders with delivery tracking...');
    const orders = [];
    for (let i = 1; i <= 15; i++) {
      const product = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const advanceAmount = Math.floor(Math.random() * product.price * 0.3);
      
      const order = new Order({
        customerName: `Order Customer ${i}`,
        customerPhone: `+92${310000000 + i}`,
        customerEmail: `order${i}@example.com`,
        customerAddress: `Order Address ${i}, City ${i}, Pakistan`,
        products: [{
          name: product.name,
          description: product.description,
          quantity: quantity,
          price: product.price,
          totalPrice: product.price * quantity
        }],
        subtotal: product.price * quantity,
        advanceAmount: advanceAmount,
        remainingAmount: (product.price * quantity) - advanceAmount,
        totalAmount: product.price * quantity,
        status: ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered'][Math.floor(Math.random() * 5)],
        deliveryStatus: ['not_started', 'in_progress', 'out_for_delivery', 'delivered'][Math.floor(Math.random() * 4)],
        trackingNumber: `TRK${Date.now()}${i}`,
        courierName: ['TCS', 'M&P', 'Leopards', 'DHL'][Math.floor(Math.random() * 4)],
        estimatedDelivery: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        assignedEmployee: employees[Math.floor(Math.random() * employees.length)]._id,
        leadId: leads[Math.floor(Math.random() * leads.length)]._id,
        priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
        notes: `Sample order ${i} notes`,
        specialInstructions: `Special instructions for order ${i}`,
        orderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        revenueGenerated: product.price * quantity,
        costOfGoods: product.price * quantity * 0.6,
        profit: product.price * quantity * 0.4
      });
      
      orders.push(await order.save());
    }
    console.log(`✅ Created ${orders.length} orders with delivery tracking`);

    // Create transactions with validation and approval workflow
    console.log('💰 Creating transactions with validation workflow...');
    const transactions = [];
    for (let i = 1; i <= 25; i++) {
      const amount = Math.floor(Math.random() * 50000) + 1000;
      const requiresApproval = amount > 50000;
      
      const transaction = new Transaction({
        transactionType: ['income', 'expense', 'advance', 'refund'][Math.floor(Math.random() * 4)],
        amount: amount,
        currency: 'PKR',
        source: ['order_payment', 'advance_payment', 'full_payment', 'refund'][Math.floor(Math.random() * 4)],
        orderId: orders[Math.floor(Math.random() * orders.length)]._id,
        leadId: leads[Math.floor(Math.random() * leads.length)]._id,
        customerName: `Transaction Customer ${i}`,
        customerPhone: `+92${320000000 + i}`,
        paymentMethod: ['cash', 'bank_transfer', 'easypaisa', 'jazz_cash'][Math.floor(Math.random() * 4)],
        description: `Sample transaction ${i} description`,
        notes: `Notes for transaction ${i}`,
        receiptNumber: `RCPT${Date.now()}${i}`,
        requiresApproval: requiresApproval,
        approvalAmount: requiresApproval ? amount : null,
        status: requiresApproval ? 'pending_approval' : 'completed',
        recordedBy: employees[Math.floor(Math.random() * employees.length)]._id,
        transactionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        validatedBy: Math.random() > 0.3 ? employees[Math.floor(Math.random() * employees.length)]._id : null,
        validatedAt: Math.random() > 0.3 ? new Date() : null,
        reconciled: Math.random() > 0.5,
        reconciledBy: Math.random() > 0.5 ? employees[Math.floor(Math.random() * employees.length)]._id : null,
        reconciledAt: Math.random() > 0.5 ? new Date() : null
      });
      
      transactions.push(await transaction.save());
    }
    console.log(`✅ Created ${transactions.length} transactions with validation workflow`);

    // Update leads with order references
    console.log('🔗 Linking leads to orders...');
    for (let i = 0; i < Math.min(leads.length, orders.length); i++) {
      if (leads[i].status === 'ready_to_order') {
        leads[i].orderCreated = true;
        leads[i].orderId = orders[i]._id;
        await leads[i].save();
      }
    }

    // Update orders with lead references
    console.log('🔗 Linking orders to leads...');
    for (let i = 0; i < Math.min(orders.length, leads.length); i++) {
      orders[i].leadId = leads[i]._id;
      await orders[i].save();
    }

    console.log('🎉 Enhanced data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - ${leads.length} enhanced leads created`);
    console.log(`   - ${orders.length} orders with delivery tracking created`);
    console.log(`   - ${transactions.length} transactions with validation workflow created`);
    console.log(`   - All data linked and ready for testing`);

  } catch (error) {
    console.error('❌ Error seeding enhanced data:', error);
  }
};

const main = async () => {
  await connectDB();
  await seedEnhancedData();
  await mongoose.connection.close();
  console.log('👋 Database connection closed');
};

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { seedEnhancedData }; 