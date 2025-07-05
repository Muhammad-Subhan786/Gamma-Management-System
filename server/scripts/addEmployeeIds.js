const mongoose = require('mongoose');
const Employee = require('../models/Employee');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/employee-attendance', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const addEmployeeIds = async () => {
  try {
    console.log('Starting to add employeeId to existing employees...');
    
    // Get all employees that don't have employeeId
    const employees = await Employee.find({ employeeId: { $exists: false } });
    console.log(`Found ${employees.length} employees without employeeId`);
    
    if (employees.length === 0) {
      console.log('All employees already have employeeId');
      return;
    }
    
    // Update each employee to use their CNIC as employeeId
    for (const employee of employees) {
      await Employee.findByIdAndUpdate(employee._id, {
        employeeId: employee.cnic
      });
      console.log(`Updated ${employee.name} with employeeId: ${employee.cnic}`);
    }
    
    console.log('Successfully added employeeId to all employees');
    
    // Verify the updates
    const updatedEmployees = await Employee.find({});
    console.log('\nUpdated employees:');
    updatedEmployees.forEach(emp => {
      console.log(`${emp.name}: ${emp.employeeId}`);
    });
    
  } catch (error) {
    console.error('Error adding employeeId:', error);
  } finally {
    mongoose.connection.close();
  }
};

addEmployeeIds(); 