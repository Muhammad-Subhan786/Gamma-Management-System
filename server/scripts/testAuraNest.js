const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const PaymentMethod = require('../models/PaymentMethod');
const Vendor = require('../models/Vendor');
const moment = require('moment');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/employee-attendance', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testAuraNest = async () => {
  try {
    console.log('Testing Aura Nest system...');
    
    // Get existing data
    const categories = await Category.find({});
    const paymentMethods = await PaymentMethod.find({});
    const vendors = await Vendor.find({});
    
    console.log(`Found ${categories.length} categories, ${paymentMethods.length} payment methods, ${vendors.length} vendors`);
    
    // Find specific items
    const adsCategory = categories.find(c => c.name === 'Ads');
    const salaryCategory = categories.find(c => c.name === 'Salary');
    const salesCategory = categories.find(c => c.name === 'Sales');
    
    const jazzCash = paymentMethods.find(p => p.name === 'Jazz Cash');
    const alfalah = paymentMethods.find(p => p.name === 'Alfalah');
    const cash = paymentMethods.find(p => p.name === 'Cash');
    
    const metaAds = vendors.find(v => v.name === 'Meta Ads');
    const tcs = vendors.find(v => v.name === 'TCS');
    
    if (!adsCategory || !salaryCategory || !salesCategory || !jazzCash || !alfalah || !cash || !metaAds || !tcs) {
      console.log('Some required data not found. Please run seedAuraNest.js first.');
      return;
    }
    
    // Create test transactions based on your sample data
    const testTransactions = [
      {
        date: moment('2025-04-03').toDate(),
        type: 'expense',
        amount: 500,
        category: adsCategory._id,
        vendor: metaAds._id,
        paymentMethod: jazzCash._id,
        description: 'Meta Ads',
        reference: 'AD-001',
        createdBy: '507f1f77bcf86cd799439011'
      },
      {
        date: moment('2025-04-04').toDate(),
        type: 'expense',
        amount: 3000,
        category: adsCategory._id,
        vendor: metaAds._id,
        paymentMethod: jazzCash._id,
        description: 'Meta Ads',
        reference: 'AD-002',
        createdBy: '507f1f77bcf86cd799439011'
      },
      {
        date: moment('2025-04-16').toDate(),
        type: 'expense',
        amount: 10000,
        category: adsCategory._id,
        vendor: metaAds._id,
        paymentMethod: cash._id,
        description: 'Meta Ads',
        reference: 'AD-003',
        createdBy: '507f1f77bcf86cd799439011'
      },
      {
        date: moment('2025-03-28').toDate(),
        type: 'income',
        amount: 2229,
        category: salesCategory._id,
        vendor: tcs._id,
        paymentMethod: alfalah._id,
        description: 'TCS',
        reference: 'SALE-001',
        createdBy: '507f1f77bcf86cd799439011'
      },
      {
        date: moment('2025-03-28').toDate(),
        type: 'expense',
        amount: 10000,
        category: salaryCategory._id,
        paymentMethod: alfalah._id,
        description: 'Ads Up Front Salary',
        reference: 'SAL-001',
        createdBy: '507f1f77bcf86cd799439011'
      },
      {
        date: moment('2025-03-28').toDate(),
        type: 'expense',
        amount: 16000,
        category: salaryCategory._id,
        paymentMethod: jazzCash._id,
        description: 'CS Salary',
        reference: 'SAL-002',
        createdBy: '507f1f77bcf86cd799439011'
      },
      {
        date: moment('2025-03-28').toDate(),
        type: 'expense',
        amount: 34000,
        category: adsCategory._id,
        vendor: metaAds._id,
        paymentMethod: cash._id,
        description: 'Meta Ads',
        reference: 'AD-004',
        createdBy: '507f1f77bcf86cd799439011'
      }
    ];
    
    // Clear existing transactions
    await Transaction.deleteMany({});
    console.log('Cleared existing transactions');
    
    // Insert test transactions
    await Transaction.insertMany(testTransactions);
    console.log(`Inserted ${testTransactions.length} test transactions`);
    
    // Verify the data
    const totalTransactions = await Transaction.countDocuments({});
    console.log(`Total transactions in database: ${totalTransactions}`);
    
    const totalIncome = await Transaction.aggregate([
      { $match: { type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalExpense = await Transaction.aggregate([
      { $match: { type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    console.log(`Total Income: ₹${totalIncome[0]?.total || 0}`);
    console.log(`Total Expenses: ₹${totalExpense[0]?.total || 0}`);
    console.log(`Net Income: ₹${(totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0)}`);
    
    console.log('Aura Nest test completed successfully!');
    
  } catch (error) {
    console.error('Error testing Aura Nest:', error);
  } finally {
    mongoose.connection.close();
  }
};

testAuraNest(); 