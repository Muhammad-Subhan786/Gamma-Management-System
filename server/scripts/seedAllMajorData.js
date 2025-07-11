const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Employee = require('../models/Employee');
const USPSLabel = require('../models/USPSLabel');
const USPSGoal = require('../models/USPSGoal');
const Transaction = require('../models/Transaction');
const Shift = require('../models/Shift');
const Category = require('../models/Category');
const Vendor = require('../models/Vendor');
const PaymentMethod = require('../models/PaymentMethod');
const bcrypt = require('bcryptjs');
const Attendance = require('../models/Attendance');
const moment = require('moment');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/employee-attendance';

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // 1. Delete all data
  await Employee.deleteMany({});
  await USPSLabel.deleteMany({});
  await USPSGoal.deleteMany({});
  await Transaction.deleteMany({});
  await Shift.deleteMany({});

  // 2. Seed Employees
  const employees = [];
  const hashedPassword = await bcrypt.hash('password123', 10);
  for (let i = 0; i < 100; i++) {
    let role = 'Employee';
    if (i < 3) role = 'admin'; // First 3 are admins
    else role = faker.helpers.arrayElement(['Manager', 'Assistant', 'Operator', 'Staff']);
    employees.push({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      cnic: faker.string.numeric(13),
      dob: faker.date.birthdate({ min: 1980, max: 2005, mode: 'year' }),
      address: faker.location.streetAddress(),
      bankAccount: faker.finance.accountNumber(),
      role,
      employeeId: faker.string.alphanumeric(8).toLowerCase(),
      password: hashedPassword,
      position: faker.helpers.arrayElement(['Employee', 'Supervisor', 'Lead', 'Intern']),
      isActive: true,
    });
  }
  const createdEmployees = await Employee.insertMany(employees);
  console.log(`Seeded ${createdEmployees.length} employees.`);

  // 2b. Seed Attendance
  const allAttendanceRecords = [];
  const days = 7;
  for (const employee of createdEmployees) {
    const today = moment();
    for (let i = 0; i < days; i++) {
      const date = moment(today).subtract(i, 'days');
      if (date.day() === 0 || date.day() === 6) continue; // Skip weekends
      const expectedStartTime = moment(date).set({ hour: 18, minute: 0, second: 0 });
      const isLate = Math.random() > 0.7;
      let checkInTime;
      if (isLate) {
        const lateMinutes = Math.floor(Math.random() * 40) + 20;
        checkInTime = moment(expectedStartTime).add(lateMinutes, 'minutes');
      } else {
        const earlyMinutes = Math.floor(Math.random() * 35) + 15;
        checkInTime = moment(expectedStartTime).subtract(earlyMinutes, 'minutes');
      }
      const workHours = 2 + Math.random() * 2;
      const checkOutTime = moment(checkInTime).add(workHours, 'hours');
      const shiftEnded = Math.random() > 0.3;
      const shiftEndTime = shiftEnded ? moment(checkOutTime).add(30, 'minutes').toDate() : null;
      allAttendanceRecords.push({
        employeeId: employee._id,
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
  }
  await Attendance.insertMany(allAttendanceRecords);
  console.log(`Seeded ${allAttendanceRecords.length} attendance records.`);

  // 3. Seed USPS Labels
  const uspsLabels = [];
  for (const emp of createdEmployees) {
    for (let i = 0; i < 1; i++) { // 1 per employee, 100 total
      uspsLabels.push({
        employeeId: emp._id,
        customerName: faker.person.fullName(),
        customerEmail: faker.internet.email(),
        totalLabels: faker.number.int({ min: 1, max: 20 }),
        rate: faker.finance.amount({ min: 1, max: 5, dec: 2 }),
        paidLabels: faker.number.int({ min: 0, max: 20 }),
        notes: faker.lorem.sentence(),
        status: faker.helpers.arrayElement(['pending', 'paid', 'completed', 'cancelled']),
        entryDate: faker.date.recent({ days: 60 }),
        paymentScreenshots: []
      });
    }
  }
  await USPSLabel.insertMany(uspsLabels);
  console.log(`Seeded ${uspsLabels.length} USPS labels.`);

  // 4. Seed USPS Goals
  const uspsGoals = [];
  const currentMonth = new Date().toISOString().slice(0, 7);
  for (const emp of createdEmployees) {
    uspsGoals.push({
      employeeId: emp._id,
      month: currentMonth,
      targetLabels: faker.number.int({ min: 4000, max: 8000 }),
      targetRevenue: faker.number.int({ min: 10000, max: 30000 }),
      currentLabels: faker.number.int({ min: 0, max: 4000 }),
      currentRevenue: faker.number.int({ min: 0, max: 10000 }),
      status: 'active'
    });
  }
  await USPSGoal.insertMany(uspsGoals);
  console.log(`Seeded ${uspsGoals.length} USPS goals.`);

  // 5. Seed AuraNest Transactions (requires categories, vendors, payment methods)
  const categories = await Category.find();
  const vendors = await Vendor.find();
  const paymentMethods = await PaymentMethod.find();
  if (!categories.length || !vendors.length || !paymentMethods.length) {
    console.log('Please seed categories, vendors, and payment methods first.');
    process.exit(1);
  }
  const transactions = [];
  for (let i = 0; i < 100; i++) {
    transactions.push({
      date: faker.date.recent({ days: 60 }),
      type: faker.helpers.arrayElement(['income', 'expense']),
      amount: faker.finance.amount({ min: 100, max: 5000, dec: 0 }),
      category: faker.helpers.arrayElement(categories)._id,
      vendor: faker.helpers.arrayElement(vendors)._id,
      paymentMethod: faker.helpers.arrayElement(paymentMethods)._id,
      description: faker.lorem.sentence(),
      reference: faker.string.alphanumeric(10),
      createdBy: faker.helpers.arrayElement(createdEmployees)._id,
      isActive: true
    });
  }
  await Transaction.insertMany(transactions);
  console.log(`Seeded ${transactions.length} AuraNest transactions.`);

  // 6. Seed Shifts
  const shifts = [];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  for (let i = 0; i < 100; i++) {
    shifts.push({
      name: `Shift ${i + 1}`,
      description: faker.lorem.sentence(),
      startTime: faker.date.between({ from: '2024-01-01T06:00:00.000Z', to: '2024-01-01T10:00:00.000Z' }).toISOString().slice(11, 16),
      endTime: faker.date.between({ from: '2024-01-01T14:00:00.000Z', to: '2024-01-01T18:00:00.000Z' }).toISOString().slice(11, 16),
      workingHours: faker.number.int({ min: 4, max: 10 }),
      daysOfWeek: faker.helpers.arrayElements(daysOfWeek, faker.number.int({ min: 2, max: 7 })),
      color: faker.color.rgb(),
      isActive: faker.datatype.boolean(),
      assignedEmployees: [
        { employeeId: faker.helpers.arrayElement(createdEmployees)._id, assignedDate: faker.date.recent({ days: 60 }) }
      ]
    });
  }
  await Shift.insertMany(shifts);
  console.log(`Seeded ${shifts.length} shifts.`);

  await mongoose.disconnect();
  console.log('All major data seeded successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 