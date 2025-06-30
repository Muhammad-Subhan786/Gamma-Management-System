const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testShiftsAPI() {
  try {
    console.log('Testing Shifts API...\n');

    // Test 1: Get all shifts
    console.log('1. Getting all shifts...');
    const shiftsResponse = await axios.get(`${API_BASE_URL}/shifts`);
    console.log(`Found ${shiftsResponse.data.length} shifts`);
    shiftsResponse.data.forEach(shift => {
      console.log(`- ${shift.name}: ${shift.startTime} - ${shift.endTime} (${shift.assignedEmployees.length} employees)`);
    });

    // Test 2: Get active shifts
    console.log('\n2. Getting active shifts...');
    const activeShiftsResponse = await axios.get(`${API_BASE_URL}/shifts/active`);
    console.log(`Found ${activeShiftsResponse.data.length} active shifts`);

    // Test 3: Get unassigned employees
    console.log('\n3. Getting unassigned employees...');
    const unassignedResponse = await axios.get(`${API_BASE_URL}/shifts/unassigned-employees`);
    console.log(`Found ${unassignedResponse.data.length} unassigned employees`);

    // Test 4: Get shift statistics
    if (shiftsResponse.data.length > 0) {
      console.log('\n4. Getting shift statistics...');
      const firstShift = shiftsResponse.data[0];
      const statsResponse = await axios.get(`${API_BASE_URL}/shifts/${firstShift._id}/stats`);
      console.log(`Stats for ${firstShift.name}:`, statsResponse.data);
    }

    console.log('\n✅ All shifts API tests passed!');
  } catch (error) {
    console.error('❌ Error testing shifts API:', error.response?.data || error.message);
  }
}

testShiftsAPI(); 