const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/employee-attendance', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const addAdminAsEmployee = async () => {
  try {
    console.log('Adding admin as employee...');
    
    // Generate unique employee ID
    const generateEmployeeId = () => {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `EMP${timestamp}${random}`;
    };

    // Admin details
    const adminData = {
      name: 'wolfthealpha',
      email: 'mdsubhan@gammatechsolutions.com',
      phone: '+1-555-0000', // dummy phone
      cnic: '00000-0000000-1', // unique dummy CNIC
      dob: new Date('1990-01-01'), // dummy DOB
      address: 'Admin Address, City, State 00000', // dummy address
      bankAccount: '0000000000', // dummy bank account
      role: 'CEO',
      employeeId: generateEmployeeId(), // Generate unique employee ID
      allowedSessions: ['usps_labels', 'tasks', 'resellers_hub'], // Grant all sessions including resellers_hub
      password: await bcrypt.hash('password123', 10) // default password
    };

    // Check if admin already exists by email or CNIC
    const existingAdmin = await Employee.findOne({ $or: [ { email: adminData.email }, { cnic: adminData.cnic } ] });

    if (existingAdmin) {
      console.log('Admin already exists, updating permissions...');
      // Update existing admin with resellers_hub permission and new email if needed
      const updatedAdmin = await Employee.findByIdAndUpdate(
        existingAdmin._id,
        {
          allowedSessions: ['usps_labels', 'tasks', 'resellers_hub'],
          name: adminData.name,
          role: adminData.role,
          email: adminData.email,
          cnic: adminData.cnic
        },
        { new: true }
      );
      
      console.log('✅ Admin updated successfully!');
      console.log('Admin ID:', updatedAdmin._id);
      console.log('Admin Name:', updatedAdmin.name);
      console.log('Admin Email:', updatedAdmin.email);
      console.log('Allowed Sessions:', updatedAdmin.allowedSessions);
      
    } else {
      console.log('Creating new admin employee...');
      
      // Create new admin employee
      const newAdmin = new Employee(adminData);
      const savedAdmin = await newAdmin.save();
      
      console.log('✅ Admin created successfully!');
      console.log('Admin ID:', savedAdmin._id);
      console.log('Admin Name:', savedAdmin.name);
      console.log('Admin Email:', savedAdmin.email);
      console.log('Allowed Sessions:', savedAdmin.allowedSessions);
    }
    
    console.log('\n🎉 Admin setup complete!');
    console.log('You can now:');
    console.log('1. Log out of the admin portal');
    console.log('2. Log back in with email: ceo@gammatechsolutions@gmail.com');
    console.log('3. The Resellers Hub tab should now be visible in USPS Labels section');
    console.log('4. You can also manage permissions in Session Management tab');
    
  } catch (error) {
    console.error('❌ Error adding admin as employee:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
addAdminAsEmployee(); 