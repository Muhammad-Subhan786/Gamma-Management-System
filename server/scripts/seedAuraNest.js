const mongoose = require('mongoose');
const Category = require('../models/Category');
const PaymentMethod = require('../models/PaymentMethod');
const Vendor = require('../models/Vendor');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/employee-attendance', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedAuraNest = async () => {
  try {
    console.log('Starting Aura Nest data seeding...');
    
    // Clear existing data
    await Category.deleteMany({});
    await PaymentMethod.deleteMany({});
    await Vendor.deleteMany({});
    console.log('Cleared existing Aura Nest data');
    
    // Seed Categories
    const categories = [
      // Income Categories
      { name: 'Sales', type: 'income', description: 'Product sales revenue' },
      { name: 'TCS', type: 'income', description: 'Courier service fees' },
      { name: 'Other Income', type: 'income', description: 'Miscellaneous income' },
      
      // Expense Categories
      { name: 'Ads', type: 'expense', description: 'Marketing and advertising expenses' },
      { name: 'Salary', type: 'expense', description: 'Employee salary payments' },
      { name: 'Supplier', type: 'expense', description: 'Jewellery supplier payments' },
      { name: 'Shipping', type: 'expense', description: 'Courier and shipping costs' },
      { name: 'Rent', type: 'expense', description: 'Office/store rent' },
      { name: 'Utilities', type: 'expense', description: 'Electricity, water, internet' },
      { name: 'Packaging', type: 'expense', description: 'Product packaging materials' },
      { name: 'Maintenance', type: 'expense', description: 'Equipment and facility maintenance' },
      { name: 'Other Expenses', type: 'expense', description: 'Miscellaneous expenses' }
    ];
    
    await Category.insertMany(categories);
    console.log(`Inserted ${categories.length} categories`);
    
    // Seed Payment Methods
    const paymentMethods = [
      { name: 'Jazz Cash', description: 'Mobile payment through Jazz Cash' },
      { name: 'Alfalah', description: 'Bank transfer through Alfalah Bank' },
      { name: 'Cash', description: 'Cash payment' },
      { name: 'By Hand', description: 'Hand delivery payment' },
      { name: 'EasyPaisa', description: 'Mobile payment through EasyPaisa' },
      { name: 'Bank Transfer', description: 'General bank transfer' },
      { name: 'Credit Card', description: 'Credit card payment' },
      { name: 'Debit Card', description: 'Debit card payment' }
    ];
    
    await PaymentMethod.insertMany(paymentMethods);
    console.log(`Inserted ${paymentMethods.length} payment methods`);
    
    // Seed Vendors
    const vendors = [
      {
        name: 'Meta Ads',
        type: 'service_provider',
        contactPerson: 'Meta Support',
        phone: '+1-650-543-4800',
        email: 'support@meta.com',
        address: 'Meta Platforms, Inc., Menlo Park, CA',
        notes: 'Facebook/Meta advertising platform'
      },
      {
        name: 'TCS',
        type: 'courier',
        contactPerson: 'TCS Support',
        phone: '+92-21-111-123-456',
        email: 'support@tcs.com.pk',
        address: 'TCS Head Office, Karachi, Pakistan',
        notes: 'Courier service provider'
      },
      {
        name: 'Jewellery Supplier 1',
        type: 'supplier',
        contactPerson: 'Ahmed Khan',
        phone: '+92-300-1234567',
        email: 'ahmed@jewellerysupplier.com',
        address: 'Jewellery Market, Karachi',
        bankDetails: {
          accountNumber: '1234567890',
          bankName: 'HBL',
          branchCode: 'HBL001'
        },
        notes: 'Gold jewellery supplier'
      },
      {
        name: 'Jewellery Supplier 2',
        type: 'supplier',
        contactPerson: 'Fatima Ali',
        phone: '+92-301-2345678',
        email: 'fatima@silversupplier.com',
        address: 'Silver Market, Lahore',
        bankDetails: {
          accountNumber: '0987654321',
          bankName: 'UBL',
          branchCode: 'UBL001'
        },
        notes: 'Silver jewellery supplier'
      },
      {
        name: 'Packaging Supplier',
        type: 'supplier',
        contactPerson: 'Usman Ahmed',
        phone: '+92-302-3456789',
        email: 'usman@packaging.com',
        address: 'Industrial Area, Karachi',
        notes: 'Jewellery packaging materials'
      }
    ];
    
    await Vendor.insertMany(vendors);
    console.log(`Inserted ${vendors.length} vendors`);
    
    console.log('Aura Nest data seeding completed successfully!');
    
    // Display seeded data
    console.log('\nSeeded Categories:');
    const seededCategories = await Category.find({});
    seededCategories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.type})`);
    });
    
    console.log('\nSeeded Payment Methods:');
    const seededPaymentMethods = await PaymentMethod.find({});
    seededPaymentMethods.forEach(pm => {
      console.log(`- ${pm.name}`);
    });
    
    console.log('\nSeeded Vendors:');
    const seededVendors = await Vendor.find({});
    seededVendors.forEach(vendor => {
      console.log(`- ${vendor.name} (${vendor.type})`);
    });
    
  } catch (error) {
    console.error('Error seeding Aura Nest data:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedAuraNest(); 