// Populate each employee with 50 random USPSLabel documents
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Employee = require('../models/Employee');
const USPSLabel = require('../models/USPSLabel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/employee-attendance';

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const employees = await Employee.find();
  if (!employees.length) {
    console.log('No employees found.');
    process.exit(0);
  }
  const statuses = ['pending', 'paid', 'completed', 'cancelled'];
  for (const emp of employees) {
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
    console.log(`Inserted 50 labels for employee ${emp.name} (${emp._id})`);
  }
  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 