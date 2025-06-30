const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const moment = require('moment');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/employee-attendance', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Hash the default password
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const sampleEmployees = [
  {
    name: 'John Doe',
    email: 'john.doe@company.com',
    phone: '+1-555-0123',
    cnic: '12345-1234567-1',
    dob: new Date('1990-05-15'),
    address: '123 Main Street, City, State 12345',
    bankAccount: '1234567890',
    role: 'Software Engineer'
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    phone: '+1-555-0124',
    cnic: '12345-1234568-2',
    dob: new Date('1988-12-20'),
    address: '456 Oak Avenue, City, State 12345',
    bankAccount: '1234567891',
    role: 'Project Manager'
  },
  {
    name: 'Mike Johnson',
    email: 'mike.johnson@company.com',
    phone: '+1-555-0125',
    cnic: '12345-1234569-3',
    dob: new Date('1992-08-10'),
    address: '789 Pine Road, City, State 12345',
    bankAccount: '1234567892',
    role: 'UI/UX Designer'
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah.wilson@company.com',
    phone: '+1-555-0126',
    cnic: '12345-1234570-4',
    dob: new Date('1985-03-25'),
    address: '321 Elm Street, City, State 12345',
    bankAccount: '1234567893',
    role: 'Marketing Specialist'
  },
  {
    name: 'David Brown',
    email: 'david.brown@company.com',
    phone: '+1-555-0127',
    cnic: '12345-1234571-5',
    dob: new Date('1995-11-05'),
    address: '654 Maple Drive, City, State 12345',
    bankAccount: '1234567894',
    role: 'Data Analyst'
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    phone: '+1-555-0128',
    cnic: '12345-1234572-6',
    dob: new Date('1991-07-18'),
    address: '987 Cedar Lane, City, State 12345',
    bankAccount: '1234567895',
    role: 'HR Manager'
  },
  {
    name: 'Robert Taylor',
    email: 'robert.taylor@company.com',
    phone: '+1-555-0129',
    cnic: '12345-1234573-7',
    dob: new Date('1987-09-30'),
    address: '147 Birch Way, City, State 12345',
    bankAccount: '1234567896',
    role: 'Sales Representative'
  },
  {
    name: 'Lisa Anderson',
    email: 'lisa.anderson@company.com',
    phone: '+1-555-0130',
    cnic: '12345-1234574-8',
    dob: new Date('1993-04-12'),
    address: '258 Spruce Court, City, State 12345',
    bankAccount: '1234567897',
    role: 'Quality Assurance'
  },
  {
    name: 'James Wilson',
    email: 'james.wilson@company.com',
    phone: '+1-555-0131',
    cnic: '12345-1234575-9',
    dob: new Date('1989-01-22'),
    address: '369 Willow Place, City, State 12345',
    bankAccount: '1234567898',
    role: 'DevOps Engineer'
  },
  {
    name: 'Amanda Garcia',
    email: 'amanda.garcia@company.com',
    phone: '+1-555-0132',
    cnic: '12345-1234576-0',
    dob: new Date('1994-06-08'),
    address: '741 Aspen Circle, City, State 12345',
    bankAccount: '1234567899',
    role: 'Business Analyst'
  }
];

const generateAttendanceData = (employeeId, days = 7) => {
  const attendanceRecords = [];
  const today = moment();
  
  for (let i = 0; i < days; i++) {
    const date = moment(today).subtract(i, 'days');
    
    // Skip weekends
    if (date.day() === 0 || date.day() === 6) continue;
    
    const expectedStartTime = moment(date).set({ hour: 18, minute: 0, second: 0 }); // 6 PM
    const isLate = Math.random() > 0.7; // 30% chance of being late
    
    let checkInTime;
    if (isLate) {
      // Late check-in between 6:20 PM and 7:00 PM
      const lateMinutes = Math.floor(Math.random() * 40) + 20;
      checkInTime = moment(expectedStartTime).add(lateMinutes, 'minutes');
    } else {
      // On-time check-in between 5:45 PM and 6:20 PM
      const earlyMinutes = Math.floor(Math.random() * 35) + 15;
      checkInTime = moment(expectedStartTime).subtract(earlyMinutes, 'minutes');
    }
    
    // Check-out time between 2-4 hours after check-in
    const workHours = 2 + Math.random() * 2;
    const checkOutTime = moment(checkInTime).add(workHours, 'hours');
    
    // Randomly end some shifts
    const shiftEnded = Math.random() > 0.3; // 70% chance of shift ending
    const shiftEndTime = shiftEnded ? moment(checkOutTime).add(30, 'minutes').toDate() : null;
    
    attendanceRecords.push({
      employeeId,
      date: date.toDate(),
      checkIns: [checkInTime.toDate()],
      checkOuts: [checkOutTime.toDate()],
      totalHours: workHours,
      wasLate: isLate,
      wasAbsentYesterday: false,
      shiftEnded,
      shiftEndTime
    });
  }
  
  return attendanceRecords;
};

const seedData = async () => {
  try {
    console.log('Starting data seeding...');
    
    // Clear existing data
    await Employee.deleteMany({});
    await Attendance.deleteMany({});
    console.log('Cleared existing data');
    
    // Hash the default password
    const hashedPassword = await hashPassword('password123');
    
    // Add hashed password to all employees
    const employeesWithPassword = sampleEmployees.map(employee => ({
      ...employee,
      password: hashedPassword
    }));
    
    // Insert employees
    const employees = await Employee.insertMany(employeesWithPassword);
    console.log(`Inserted ${employees.length} employees`);
    
    // Generate and insert attendance data
    const allAttendanceRecords = [];
    employees.forEach(employee => {
      const attendanceRecords = generateAttendanceData(employee._id);
      allAttendanceRecords.push(...attendanceRecords);
    });
    
    await Attendance.insertMany(allAttendanceRecords);
    console.log(`Inserted ${allAttendanceRecords.length} attendance records`);
    
    console.log('Data seeding completed successfully!');
    console.log('Default password for all employees: password123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run the seed function
seedData(); 