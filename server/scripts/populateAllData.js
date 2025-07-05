const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const USPSLabel = require('../models/USPSLabel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/employee-attendance';

function randomTime(baseHour, baseMinute, maxOffsetMinutes) {
  const date = new Date();
  date.setHours(baseHour, baseMinute, 0, 0);
  const offset = Math.floor(Math.random() * maxOffsetMinutes * 2) - maxOffsetMinutes;
  date.setMinutes(date.getMinutes() + offset);
  return new Date(date);
}

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const employees = await Employee.find();
  if (!employees.length) {
    console.log('No employees found.');
    process.exit(0);
  }
  const statuses = ['pending', 'paid', 'completed', 'cancelled'];
  const today = new Date();
  for (const emp of employees) {
    // --- Attendance ---
    const attendanceRecords = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      // 10% chance absent
      if (Math.random() < 0.1) {
        attendanceRecords.push({
          employeeId: emp._id,
          date,
          status: 'absent',
          checkInTime: null,
          checkOutTime: null,
          late: false
        });
        continue;
      }
      // 20% chance late
      const isLate = Math.random() < 0.2;
      const checkIn = randomTime(isLate ? 9 : 8, isLate ? 30 : 0, 30); // 8:00-9:30 or 9:30-10:00
      const checkOut = randomTime(17, 0, 60); // 5:00-6:30 PM
      attendanceRecords.push({
        employeeId: emp._id,
        date,
        status: 'present',
        checkInTime: checkIn,
        checkOutTime: checkOut,
        late: isLate
      });
    }
    await Attendance.insertMany(attendanceRecords);
    console.log(`Inserted 30 attendance records for employee ${emp.name}`);

    // --- Labels ---
    const labels = [];
    for (let i = 0; i < 50; i++) {
      const totalLabels = faker.number.int({ min: 1, max: 20 });
      const paidLabels = faker.number.int({ min: 0, max: totalLabels });
      const rate = faker.finance.amount({ min: 1, max: 5, dec: 2 });
      const status = faker.helpers.arrayElement(statuses);
      labels.push({
        employeeId: emp._id,
        customerName: faker.person.fullName(),
        customerEmail: faker.internet.email(),
        totalLabels,
        rate,
        paidLabels,
        notes: faker.lorem.sentence(),
        status,
        entryDate: faker.date.recent({ days: 60 }),
        paymentScreenshots: []
      });
    }
    await USPSLabel.insertMany(labels);
    console.log(`Inserted 50 labels for employee ${emp.name}`);
  }
  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 