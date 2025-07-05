const mongoose = require('mongoose');
require('dotenv').config();

// Local MongoDB connection
const localMongoUri = 'mongodb://localhost:27017/employee-attendance';
// Cloud MongoDB connection
const cloudMongoUri = 'mongodb+srv://msubhan6612:fICMiSbzLjPCotWF@cluster0.ilp6wrn.mongodb.net/employee-attendance?retryWrites=true&w=majority';

// Import models
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Shift = require('../models/Shift');
const Task = require('../models/Task');
const USPSLabel = require('../models/USPSLabel');
const USPSGoal = require('../models/USPSGoal');
const Transaction = require('../models/Transaction');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const PaymentMethod = require('../models/PaymentMethod');
const InventoryMovement = require('../models/InventoryMovement');

async function migrateData() {
  try {
    console.log('🔄 Starting data migration to MongoDB Atlas...');
    
    // Connect to local database
    const localConnection = await mongoose.createConnection(localMongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to local MongoDB');
    
    // Connect to cloud database
    const cloudConnection = await mongoose.createConnection(cloudMongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');
    
    // Create models for local database
    const LocalEmployee = localConnection.model('Employee', Employee.schema);
    const LocalAttendance = localConnection.model('Attendance', Attendance.schema);
    const LocalShift = localConnection.model('Shift', Shift.schema);
    const LocalTask = localConnection.model('Task', Task.schema);
    const LocalUSPSLabel = localConnection.model('USPSLabel', USPSLabel.schema);
    const LocalUSPSGoal = localConnection.model('USPSGoal', USPSGoal.schema);
    const LocalTransaction = localConnection.model('Transaction', Transaction.schema);
    const LocalVendor = localConnection.model('Vendor', Vendor.schema);
    const LocalProduct = localConnection.model('Product', Product.schema);
    const LocalCategory = localConnection.model('Category', Category.schema);
    const LocalOrder = localConnection.model('Order', Order.schema);
    const LocalPaymentMethod = localConnection.model('PaymentMethod', PaymentMethod.schema);
    const LocalInventoryMovement = localConnection.model('InventoryMovement', InventoryMovement.schema);
    
    // Create models for cloud database
    const CloudEmployee = cloudConnection.model('Employee', Employee.schema);
    const CloudAttendance = cloudConnection.model('Attendance', Attendance.schema);
    const CloudShift = cloudConnection.model('Shift', Shift.schema);
    const CloudTask = cloudConnection.model('Task', Task.schema);
    const CloudUSPSLabel = cloudConnection.model('USPSLabel', USPSLabel.schema);
    const CloudUSPSGoal = cloudConnection.model('USPSGoal', USPSGoal.schema);
    const CloudTransaction = cloudConnection.model('Transaction', Transaction.schema);
    const CloudVendor = cloudConnection.model('Vendor', Vendor.schema);
    const CloudProduct = cloudConnection.model('Product', Product.schema);
    const CloudCategory = cloudConnection.model('Category', Category.schema);
    const CloudOrder = cloudConnection.model('Order', Order.schema);
    const CloudPaymentMethod = cloudConnection.model('PaymentMethod', PaymentMethod.schema);
    const CloudInventoryMovement = cloudConnection.model('InventoryMovement', InventoryMovement.schema);
    
    // Migration functions
    async function migrateCollection(localModel, cloudModel, collectionName) {
      try {
        const localData = await localModel.find({});
        if (localData.length > 0) {
          // Clear existing data in cloud
          await cloudModel.deleteMany({});
          // Insert data to cloud
          await cloudModel.insertMany(localData);
          console.log(`✅ Migrated ${localData.length} ${collectionName} records`);
        } else {
          console.log(`ℹ️  No ${collectionName} records to migrate`);
        }
      } catch (error) {
        console.error(`❌ Error migrating ${collectionName}:`, error.message);
      }
    }
    
    // Perform migrations
    console.log('\n📊 Starting collection migrations...');
    
    await migrateCollection(LocalEmployee, CloudEmployee, 'employees');
    await migrateCollection(LocalAttendance, CloudAttendance, 'attendance');
    await migrateCollection(LocalShift, CloudShift, 'shifts');
    await migrateCollection(LocalTask, CloudTask, 'tasks');
    await migrateCollection(LocalUSPSLabel, CloudUSPSLabel, 'USPS labels');
    await migrateCollection(LocalUSPSGoal, CloudUSPSGoal, 'USPS goals');
    await migrateCollection(LocalTransaction, CloudTransaction, 'transactions');
    await migrateCollection(LocalVendor, CloudVendor, 'vendors');
    await migrateCollection(LocalProduct, CloudProduct, 'products');
    await migrateCollection(LocalCategory, CloudCategory, 'categories');
    await migrateCollection(LocalOrder, CloudOrder, 'orders');
    await migrateCollection(LocalPaymentMethod, CloudPaymentMethod, 'payment methods');
    await migrateCollection(LocalInventoryMovement, CloudInventoryMovement, 'inventory movements');
    
    console.log('\n🎉 Data migration completed successfully!');
    console.log('✅ Your data is now in MongoDB Atlas cloud database');
    
    // Close connections
    await localConnection.close();
    await cloudConnection.close();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration
migrateData(); 