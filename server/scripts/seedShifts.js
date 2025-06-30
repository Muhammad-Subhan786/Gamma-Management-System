const mongoose = require('mongoose');
const Shift = require('../models/Shift');
const Employee = require('../models/Employee');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/employee-attendance', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sampleShifts = [
  {
    name: 'Morning Shift',
    description: 'Early morning shift for early risers',
    startTime: '06:00',
    endTime: '14:00',
    workingHours: 8,
    daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    color: '#3B82F6',
    isActive: true
  },
  {
    name: 'Afternoon Shift',
    description: 'Standard afternoon shift',
    startTime: '14:00',
    endTime: '22:00',
    workingHours: 8,
    daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    color: '#10B981',
    isActive: true
  },
  {
    name: 'Night Shift',
    description: 'Overnight shift for night workers',
    startTime: '22:00',
    endTime: '06:00',
    workingHours: 8,
    daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    color: '#8B5CF6',
    isActive: true
  },
  {
    name: 'Weekend Shift',
    description: 'Weekend shift for weekend workers',
    startTime: '09:00',
    endTime: '17:00',
    workingHours: 8,
    daysOfWeek: ['Saturday', 'Sunday'],
    color: '#F59E0B',
    isActive: true
  }
];

const seedShifts = async () => {
  try {
    console.log('Starting shift seeding...');
    
    // Clear existing shifts
    await Shift.deleteMany({});
    console.log('Cleared existing shifts');
    
    // Insert shifts
    const shifts = await Shift.insertMany(sampleShifts);
    console.log(`Inserted ${shifts.length} shifts`);
    
    // Get some employees to assign to shifts
    const employees = await Employee.find().limit(5);
    
    if (employees.length > 0) {
      // Assign employees to shifts
      for (let i = 0; i < shifts.length && i < employees.length; i++) {
        shifts[i].assignedEmployees.push({
          employeeId: employees[i]._id,
          assignedDate: new Date()
        });
        await shifts[i].save();
      }
      console.log(`Assigned ${Math.min(shifts.length, employees.length)} employees to shifts`);
    }
    
    console.log('Shift seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding shifts:', error);
    process.exit(1);
  }
};

// Run the seed function
seedShifts(); 