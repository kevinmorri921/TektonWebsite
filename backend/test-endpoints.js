import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';

// Test signup endpoint
const testSignup = async () => {
  console.log('\n📝 Testing SIGNUP endpoint...');
  try {
    const response = await fetch(`${API_URL}/api/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      body: JSON.stringify({
        fullname: 'Test User',
        email: 'testuser' + Date.now() + '@example.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!'
      })
    });
    
    const data = await response.json();
    console.log('✅ Response:', JSON.stringify(data, null, 2));
    console.log('Status:', response.status);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
};

// Test login endpoint
const testLogin = async () => {
  console.log('\n🔐 Testing LOGIN endpoint...');
  try {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      body: JSON.stringify({
        email: 'super_admin@tekton.com',
        password: 'SuperAdmin@2024'
      })
    });
    
    const data = await response.json();
    console.log('✅ Response:', JSON.stringify(data, null, 2));
    console.log('Status:', response.status);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
};

// Test health endpoint
const testHealth = async () => {
  console.log('\n💓 Testing HEALTH endpoint...');
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    console.log('✅ Response:', JSON.stringify(data, null, 2));
    console.log('Status:', response.status);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
};

// Run all tests
const runTests = async () => {
  console.log('🚀 Starting endpoint tests...');
  await testHealth();
  await testSignup();
  await testLogin();
  console.log('\n✅ Tests complete!');
  process.exit(0);
};

runTests();
