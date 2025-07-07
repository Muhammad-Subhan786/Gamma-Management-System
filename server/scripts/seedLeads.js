const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Employee = require('../models/Employee');
require('dotenv').config();

const sampleLeads = [
  {
    customerName: 'John Smith',
    customerPhone: '+1-555-0101',
    customerEmail: 'john.smith@email.com',
    productInterest: 'Diamond Ring',
    expectedPrice: 5000,
    status: 'new',
    source: 'Website',
    notes: 'Interested in engagement ring for anniversary',
    followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  },
  {
    customerName: 'Sarah Johnson',
    customerPhone: '+1-555-0102',
    customerEmail: 'sarah.j@email.com',
    productInterest: 'Gold Necklace',
    expectedPrice: 1200,
    status: 'contacted',
    source: 'Referral',
    notes: 'Looking for birthday gift for mother',
    followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
  },
  {
    customerName: 'Michael Brown',
    customerPhone: '+1-555-0103',
    customerEmail: 'mike.brown@email.com',
    productInterest: 'Platinum Watch',
    expectedPrice: 8000,
    status: 'qualified',
    source: 'Social Media',
    notes: 'High-value customer, ready to purchase',
    followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // 1 day from now
  },
  {
    customerName: 'Emily Davis',
    customerPhone: '+1-555-0104',
    customerEmail: 'emily.davis@email.com',
    productInterest: 'Pearl Earrings',
    expectedPrice: 800,
    status: 'proposal',
    source: 'Website',
    notes: 'Sent proposal, waiting for response',
    followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
  },
  {
    customerName: 'David Wilson',
    customerPhone: '+1-555-0105',
    customerEmail: 'david.wilson@email.com',
    productInterest: 'Sapphire Bracelet',
    expectedPrice: 2500,
    status: 'negotiation',
    source: 'Referral',
    notes: 'Negotiating price, customer wants 10% discount',
    followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // 1 day from now
  },
  {
    customerName: 'Lisa Anderson',
    customerPhone: '+1-555-0106',
    customerEmail: 'lisa.anderson@email.com',
    productInterest: 'Ruby Ring',
    expectedPrice: 3500,
    status: 'closed_won',
    source: 'Website',
    notes: 'Sale completed successfully',
    followUpDate: null
  },
  {
    customerName: 'Robert Taylor',
    customerPhone: '+1-555-0107',
    customerEmail: 'robert.taylor@email.com',
    productInterest: 'Emerald Pendant',
    expectedPrice: 1800,
    status: 'closed_lost',
    source: 'Social Media',
    notes: 'Customer chose competitor due to price',
    followUpDate: null
  },
  {
    customerName: 'Jennifer Martinez',
    customerPhone: '+1-555-0108',
    customerEmail: 'jennifer.m@email.com',
    productInterest: 'Diamond Earrings',
    expectedPrice: 4200,
    status: 'new',
    source: 'Website',
    notes: 'New inquiry, needs follow-up',
    followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
  }
];

const seedLeads = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://msubhan6612:fICMiSbzLjPCotWF@cluster0.ilp6wrn.mongodb.net/employee-attendance?retryWrites=true&w=majority';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get a sample employee to assign to leads
    const employees = await Employee.find().limit(1);
    const sampleEmployee = employees.length > 0 ? employees[0]._id : null;

    // Clear existing leads
    await Lead.deleteMany({});
    console.log('🗑️  Cleared existing leads');

    // Add employee assignment to some leads
    const leadsWithEmployees = sampleLeads.map((lead, index) => ({
      ...lead,
      assignedEmployee: index % 3 === 0 ? sampleEmployee : null // Assign every 3rd lead to an employee
    }));

    // Insert sample leads
    const insertedLeads = await Lead.insertMany(leadsWithEmployees);
    console.log(`✅ Successfully seeded ${insertedLeads.length} leads`);

    // Display summary
    const statusCounts = await Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Lead Status Summary:');
    statusCounts.forEach(status => {
      console.log(`   ${status._id}: ${status.count} leads`);
    });

    console.log('\n🎉 Lead seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding leads:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedLeads(); 