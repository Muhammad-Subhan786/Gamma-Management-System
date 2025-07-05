const mongoose = require('mongoose');
require('dotenv').config();

// Local database connection (your local MongoDB)
const localMongoURI = 'mongodb://localhost:27017/employee-attendance';

// Cloud database connection (MongoDB Atlas)
const cloudMongoURI = 'mongodb+srv://msubhan6612:fICMiSbzLjPCotWF@cluster0.ilp6wrn.mongodb.net/employee-attendance?retryWrites=true&w=majority';

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

// Connect to local database
const connectLocal = async () => {
  try {
    await mongoose.connect(localMongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to LOCAL database');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ Failed to connect to local database:', error.message);
    throw error;
  }
};

// Connect to cloud database
const connectCloud = async () => {
  try {
    await mongoose.connect(cloudMongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to CLOUD database');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ Failed to connect to cloud database:', error.message);
    throw error;
  }
};

// Migrate collection function
const migrateCollection = async (LocalModel, CloudModel, collectionName) => {
  try {
    console.log(`\n🔄 Migrating ${collectionName}...`);
    
    // Get all data from local
    const localData = await LocalModel.find({});
    console.log(`   Found ${localData.length} records in local database`);
    
    if (localData.length === 0) {
      console.log(`   ⚠️  No ${collectionName} data to migrate`);
      return;
    }
    
    // Clear existing data in cloud (optional - comment out if you want to keep existing)
    const existingCount = await CloudModel.countDocuments();
    if (existingCount > 0) {
      console.log(`   Clearing ${existingCount} existing records in cloud...`);
      await CloudModel.deleteMany({});
    }
    
    // Insert data to cloud
    const result = await CloudModel.insertMany(localData);
    console.log(`   ✅ Successfully migrated ${result.length} ${collectionName} records`);
    
  } catch (error) {
    console.error(`   ❌ Error migrating ${collectionName}:`, error.message);
  }
};

// Main migration function
const migrateToCloud = async () => {
  console.log('🚀 Starting migration from LOCAL to CLOUD database...\n');
  
  try {
    // Connect to local database
    const localConnection = await connectLocal();
    
    // Get local data counts
    const localEmployeeCount = await Employee.countDocuments();
    const localAttendanceCount = await Attendance.countDocuments();
    const localShiftCount = await Shift.countDocuments();
    const localTaskCount = await Task.countDocuments();
    const localUSPSLabelCount = await USPSLabel.countDocuments();
    const localUSPSGoalCount = await USPSGoal.countDocuments();
    const localTransactionCount = await Transaction.countDocuments();
    const localVendorCount = await Vendor.countDocuments();
    const localCategoryCount = await Category.countDocuments();
    const localPaymentMethodCount = await PaymentMethod.countDocuments();
    
    console.log('\n📊 Local Database Summary:');
    console.log(`   Employees: ${localEmployeeCount}`);
    console.log(`   Attendance: ${localAttendanceCount}`);
    console.log(`   Shifts: ${localShiftCount}`);
    console.log(`   Tasks: ${localTaskCount}`);
    console.log(`   USPS Labels: ${localUSPSLabelCount}`);
    console.log(`   USPS Goals: ${localUSPSGoalCount}`);
    console.log(`   Transactions: ${localTransactionCount}`);
    console.log(`   Vendors: ${localVendorCount}`);
    console.log(`   Categories: ${localCategoryCount}`);
    console.log(`   Payment Methods: ${localPaymentMethodCount}`);
    
    // Disconnect from local
    await localConnection.close();
    console.log('\n✅ Disconnected from local database');
    
    // Connect to cloud database
    const cloudConnection = await connectCloud();
    
    // Migrate all collections
    await migrateCollection(Employee, Employee, 'employees');
    await migrateCollection(Attendance, Attendance, 'attendance');
    await migrateCollection(Shift, Shift, 'shifts');
    await migrateCollection(Task, Task, 'tasks');
    await migrateCollection(USPSLabel, USPSLabel, 'usps labels');
    await migrateCollection(USPSGoal, USPSGoal, 'usps goals');
    await migrateCollection(Transaction, Transaction, 'transactions');
    await migrateCollection(Vendor, Vendor, 'vendors');
    await migrateCollection(Category, Category, 'categories');
    await migrateCollection(PaymentMethod, PaymentMethod, 'payment methods');
    
    // Get cloud data counts after migration
    const cloudEmployeeCount = await Employee.countDocuments();
    const cloudAttendanceCount = await Attendance.countDocuments();
    const cloudShiftCount = await Shift.countDocuments();
    
    console.log('\n📊 Cloud Database Summary (After Migration):');
    console.log(`   Employees: ${cloudEmployeeCount}`);
    console.log(`   Attendance: ${cloudAttendanceCount}`);
    console.log(`   Shifts: ${cloudShiftCount}`);
    
    // Test specific employee
    const testEmployee = await Employee.findOne({ employeeId: 'uye9eldk' });
    if (testEmployee) {
      console.log(`\n✅ Test employee "uye9eldk" found in cloud: ${testEmployee.name}`);
    } else {
      console.log(`\n❌ Test employee "uye9eldk" NOT found in cloud`);
    }
    
    // Disconnect from cloud
    await cloudConnection.close();
    console.log('\n✅ Disconnected from cloud database');
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('🌐 Your Railway deployment should now work with all data!');
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  }
};

// Run migration
migrateToCloud(); 