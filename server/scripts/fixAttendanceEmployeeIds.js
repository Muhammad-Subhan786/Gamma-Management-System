const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/employee-attendance';

async function fixAttendanceEmployeeIds() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const broken = await Attendance.find({ employeeId: { $type: 'string' } });
  let fixed = 0;
  for (const att of broken) {
    const emp = await Employee.findOne({ employeeId: att.employeeId.toLowerCase() });
    if (emp) {
      att.employeeId = emp._id;
      await att.save();
      fixed++;
      console.log(`Fixed attendance ${att._id} to employee ${emp._id} (${emp.name})`);
    } else {
      console.log(`No employee found for attendance ${att._id} with employeeId string: ${att.employeeId}`);
    }
  }
  await mongoose.disconnect();
  console.log(`Done. Fixed ${fixed} attendance records.`);
}

fixAttendanceEmployeeIds().catch(err => {
  console.error(err);
  process.exit(1);
}); 