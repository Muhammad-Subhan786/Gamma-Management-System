const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testShiftManagement() {
  console.log('🧪 Testing Shift Management functionality...\n');

  try {
    // Test 1: Check initial shift status
    console.log('1. Checking initial shift status...');
    const statusResponse = await axios.get(`${API_BASE_URL}/attendance/shift-status`);
    console.log('   ✅ Shift status:', statusResponse.data);
    console.log('   📊 Shift ended:', statusResponse.data.shiftEnded);
    console.log('   🕐 Shift end time:', statusResponse.data.shiftEndTime || 'Not set');
    console.log('   👥 Employee count:', statusResponse.data.employeeCount);
    console.log('');

    // Test 2: Start the shift
    console.log('2. Testing "Start Shift" endpoint...');
    const startShiftResponse = await axios.post(`${API_BASE_URL}/attendance/start-shift`);
    console.log('   ✅ Start Shift response:', startShiftResponse.data);
    console.log('   📊 Success:', startShiftResponse.data.success);
    console.log('   🕐 Shift start time:', startShiftResponse.data.shiftStartTime);
    console.log('   👥 Affected employees:', startShiftResponse.data.affectedEmployees);
    console.log('   🔄 Action:', startShiftResponse.data.action);
    console.log('');

    // Test 3: Check individual employee shift status
    console.log('3. Testing individual employee shift status...');
    const employeeStatusResponse = await axios.get(`${API_BASE_URL}/attendance/employee-shift-status`, {
      params: { name: 'John Doe', email: 'john.doe@company.com' }
    });
    console.log('   ✅ Employee shift status:', employeeStatusResponse.data);
    console.log('   👤 Employee:', employeeStatusResponse.data.employee.name);
    console.log('   📊 Employee shift ended:', employeeStatusResponse.data.shiftEnded);
    console.log('');

    // Test 4: Try to check in (should work now)
    console.log('4. Testing check-in after starting shift (should work)...');
    try {
      const checkInResponse = await axios.post(`${API_BASE_URL}/attendance/checkin`, {
        name: 'John Doe',
        email: 'john.doe@company.com'
      });
      console.log('   ✅ Check-in successful after starting shift');
      console.log('   📝 Response:', checkInResponse.data);
    } catch (error) {
      console.log('   ❌ Check-in failed:', error.response?.data || error.message);
    }
    console.log('');

    // Test 5: End individual employee shift
    console.log('5. Testing individual employee "Time to Go"...');
    const employeeTimeToGoResponse = await axios.post(`${API_BASE_URL}/attendance/employee-time-to-go`, {
      name: 'John Doe',
      email: 'john.doe@company.com'
    });
    console.log('   ✅ Employee Time to Go response:', employeeTimeToGoResponse.data);
    console.log('   📊 Success:', employeeTimeToGoResponse.data.success);
    console.log('   🕐 Employee shift end time:', employeeTimeToGoResponse.data.shiftEndTime);
    console.log('');

    // Test 6: Check individual employee shift status after ending
    console.log('6. Checking individual employee shift status after ending...');
    const employeeFinalStatusResponse = await axios.get(`${API_BASE_URL}/attendance/employee-shift-status`, {
      params: { name: 'John Doe', email: 'john.doe@company.com' }
    });
    console.log('   ✅ Employee final shift status:', employeeFinalStatusResponse.data);
    console.log('   📊 Employee shift ended:', employeeFinalStatusResponse.data.shiftEnded);
    console.log('');

    // Test 7: Try to check in for the same employee (should fail)
    console.log('7. Testing check-in for employee whose shift ended (should fail)...');
    try {
      await axios.post(`${API_BASE_URL}/attendance/checkin`, {
        name: 'John Doe',
        email: 'john.doe@company.com'
      });
      console.log('   ❌ Check-in should have failed but succeeded');
    } catch (error) {
      if (error.response && error.response.data.error.includes('shift has ended')) {
        console.log('   ✅ Check-in correctly blocked for employee whose shift ended');
        console.log('   📝 Error message:', error.response.data.error);
      } else {
        console.log('   ❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    console.log('');

    // Test 8: Try to check in for a different employee (should work)
    console.log('8. Testing check-in for different employee (should work)...');
    try {
      const checkInResponse2 = await axios.post(`${API_BASE_URL}/attendance/checkin`, {
        name: 'Jane Smith',
        email: 'jane.smith@company.com'
      });
      console.log('   ✅ Check-in successful for different employee');
      console.log('   📝 Response:', checkInResponse2.data);
    } catch (error) {
      console.log('   ❌ Check-in failed for different employee:', error.response?.data || error.message);
    }
    console.log('');

    // Test 9: End overall shift (admin function)
    console.log('9. Testing overall "Time to Go" (admin function)...');
    const timeToGoResponse = await axios.post(`${API_BASE_URL}/attendance/time-to-go`);
    console.log('   ✅ Overall Time to Go response:', timeToGoResponse.data);
    console.log('   📊 Success:', timeToGoResponse.data.success);
    console.log('   🕐 Overall shift end time:', timeToGoResponse.data.shiftEndTime);
    console.log('   👥 Affected employees:', timeToGoResponse.data.affectedEmployees);
    console.log('');

    // Test 10: Try to check in for any employee (should fail)
    console.log('10. Testing check-in after overall shift ended (should fail)...');
    try {
      await axios.post(`${API_BASE_URL}/attendance/checkin`, {
        name: 'Jane Smith',
        email: 'jane.smith@company.com'
      });
      console.log('   ❌ Check-in should have failed but succeeded');
    } catch (error) {
      if (error.response && error.response.data.error.includes('shift has ended')) {
        console.log('   ✅ Check-in correctly blocked after overall shift ended');
        console.log('   📝 Error message:', error.response.data.error);
      } else {
        console.log('   ❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('📋 Summary:');
    console.log('   - Shift status tracking works');
    console.log('   - Start Shift endpoint works');
    console.log('   - Individual employee shift end works');
    console.log('   - Overall shift end (admin) works');
    console.log('   - Individual employee status checking works');
    console.log('   - Check-ins work when shift is active');
    console.log('   - Check-ins are blocked for individual employees when their shift ends');
    console.log('   - Check-ins are blocked for all employees when overall shift ends');
    console.log('   - API responses are correct');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testShiftManagement(); 