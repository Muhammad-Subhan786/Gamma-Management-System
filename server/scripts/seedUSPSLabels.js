const mongoose = require('mongoose');
const path = require('path');
const Employee = require('../models/Employee');
const USPSLabel = require('../models/USPSLabel');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/employee-attendance';

async function seedUSPSLabels() {
  await mongoose.connect(MONGO_URI);
  const employees = await Employee.find();
  if (!employees.length) {
    console.log('No employees found. Seed employees first.');
    process.exit(1);
  }

  // Remove existing labels
  await USPSLabel.deleteMany({});

  const sampleLabels = [];
  for (const employee of employees) {
    for (let i = 0; i < 100; i++) {
      const paidLabels = Math.floor(Math.random() * 10) + 1;
      const totalLabels = paidLabels + Math.floor(Math.random() * 5);
      const rate = (Math.random() * 2 + 1).toFixed(2); // $1.00 - $3.00
      const totalRevenue = (rate * paidLabels).toFixed(2);
      // Random date in the last 6 months
      const now = new Date();
      const past = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      const entryDate = new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
      sampleLabels.push({
        employeeId: employee._id,
        customerName: `Customer ${i + 1} (${employee.name})`,
        customerEmail: `customer${i + 1}.${employee.email}`,
        totalLabels,
        rate,
        paidLabels,
        totalRevenue,
        notes: 'Seeded completed label order',
        status: 'completed',
        entryDate: entryDate,
        paymentScreenshots: [],
        createdAt: entryDate,
        updatedAt: entryDate,
      });
    }
  }

  await USPSLabel.insertMany(sampleLabels);
  console.log(`Seeded ${sampleLabels.length} USPS labels for ${employees.length} employees.`);
  await mongoose.disconnect();
}

seedUSPSLabels(); 