const mongoose = require('mongoose');
const path = require('path');
const Employee = require('../models/Employee');
const USPSGoal = require('../models/USPSGoal');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/employee-attendance';

async function seedUSPSGoals() {
  await mongoose.connect(MONGO_URI);
  const employees = await Employee.find();
  if (!employees.length) {
    console.log('No employees found. Seed employees first.');
    process.exit(1);
  }

  // Remove existing goals
  await USPSGoal.deleteMany({});

  const currentMonth = new Date().toISOString().slice(0, 7);
  const sampleGoals = [];

  for (const employee of employees) {
    // Create current month goal
    const targetLabels = Math.floor(Math.random() * 4000) + 4000; // 4000-8000 labels
    const targetRevenue = targetLabels * (Math.random() * 2 + 1.5); // $1.50-$3.50 per label
    
    sampleGoals.push({
      employeeId: employee._id,
      month: currentMonth,
      targetLabels,
      targetRevenue: Math.round(targetRevenue),
      currentLabels: 0,
      currentRevenue: 0,
      status: 'active'
    });

    // Create previous month goals for history
    for (let i = 1; i <= 3; i++) {
      const prevMonth = new Date();
      prevMonth.setMonth(prevMonth.getMonth() - i);
      const monthStr = prevMonth.toISOString().slice(0, 7);
      
      const prevTargetLabels = Math.floor(Math.random() * 4000) + 4000;
      const prevTargetRevenue = prevTargetLabels * (Math.random() * 2 + 1.5);
      const prevCurrentLabels = Math.floor(Math.random() * prevTargetLabels);
      const prevCurrentRevenue = prevCurrentLabels * (Math.random() * 2 + 1.5);
      
      sampleGoals.push({
        employeeId: employee._id,
        month: monthStr,
        targetLabels: prevTargetLabels,
        targetRevenue: Math.round(prevTargetRevenue),
        currentLabels: prevCurrentLabels,
        currentRevenue: Math.round(prevCurrentRevenue),
        status: prevCurrentLabels >= prevTargetLabels ? 'completed' : 'active'
      });
    }
  }

  await USPSGoal.insertMany(sampleGoals);
  console.log(`Seeded ${sampleGoals.length} USPS goals for ${employees.length} employees.`);
  await mongoose.disconnect();
}

seedUSPSGoals(); 