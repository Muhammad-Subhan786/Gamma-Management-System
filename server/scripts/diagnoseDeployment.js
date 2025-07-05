const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Shift = require('../models/Shift');

const diagnoseDeployment = async () => {
  console.log('🔍 Diagnosing Railway Deployment...\n');

  // Check MongoDB connection
  console.log('1. Checking MongoDB Connection...');
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://msubhan6612:fICMiSbzLjPCotWF@cluster0.ilp6wrn.mongodb.net/employee-attendance?retryWrites=true&w=majority';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port}`);
  } catch (error) {
    console.log('❌ MongoDB connection failed:');
    console.log(`   Error: ${error.message}`);
    return;
  }

  // Check Employee data
  console.log('\n2. Checking Employee Data...');
  try {
    const employeeCount = await Employee.countDocuments();
    console.log(`✅ Found ${employeeCount} employees in database`);
    
    if (employeeCount > 0) {
      const sampleEmployee = await Employee.findOne().select('name email employeeId');
      console.log(`   Sample employee: ${sampleEmployee.name} (${sampleEmployee.email}) - ID: ${sampleEmployee.employeeId}`);
    }
  } catch (error) {
    console.log('❌ Error checking employees:');
    console.log(`   Error: ${error.message}`);
  }

  // Check Shift data
  console.log('\n3. Checking Shift Data...');
  try {
    const shiftCount = await Shift.countDocuments();
    console.log(`✅ Found ${shiftCount} shifts in database`);
    
    if (shiftCount > 0) {
      const sampleShift = await Shift.findOne().select('name isActive');
      console.log(`   Sample shift: ${sampleShift.name} (Active: ${sampleShift.isActive})`);
    }
  } catch (error) {
    console.log('❌ Error checking shifts:');
    console.log(`   Error: ${error.message}`);
  }

  // Check specific employee ID
  console.log('\n4. Checking Specific Employee ID...');
  try {
    const testEmployeeId = 'uye9eldk';
    const employee = await Employee.findOne({ employeeId: testEmployeeId });
    
    if (employee) {
      console.log(`✅ Employee ID "${testEmployeeId}" found:`);
      console.log(`   Name: ${employee.name}`);
      console.log(`   Email: ${employee.email}`);
      console.log(`   Role: ${employee.role}`);
      console.log(`   Active: ${employee.isActive}`);
    } else {
      console.log(`❌ Employee ID "${testEmployeeId}" not found`);
      
      // Show available employee IDs
      const employees = await Employee.find().select('employeeId name').limit(5);
      console.log('   Available employee IDs:');
      employees.forEach(emp => {
        console.log(`     - ${emp.employeeId} (${emp.name})`);
      });
    }
  } catch (error) {
    console.log('❌ Error checking specific employee:');
    console.log(`   Error: ${error.message}`);
  }

  // Check environment variables
  console.log('\n5. Checking Environment Variables...');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`   PORT: ${process.env.PORT || 'not set'}`);
  console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? 'set' : 'not set'}`);
  console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'set' : 'not set'}`);

  // Check server status
  console.log('\n6. Server Status...');
  console.log(`   Process ID: ${process.pid}`);
  console.log(`   Platform: ${process.platform}`);
  console.log(`   Node Version: ${process.version}`);
  console.log(`   Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);

  console.log('\n🎯 Diagnosis Complete!');
  
  // Disconnect from database
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
};

// Run diagnosis
diagnoseDeployment().catch(console.error); 