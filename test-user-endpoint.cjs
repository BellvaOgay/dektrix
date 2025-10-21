// Test script for user endpoints
const testWalletAddress = '0x1234567890123456789012345678901234567890';

async function testCreateUser() {
  console.log('🧪 Testing user creation endpoint...');
  
  try {
    const response = await fetch('http://localhost:8080/api/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: testWalletAddress,
        userData: {
          username: 'testuser',
          displayName: 'Test User'
        }
      })
    });

    const data = await response.json();
    console.log('✅ Create user response:', data);
    
    if (data.success) {
      console.log('✅ User created successfully');
      console.log('📊 User data:', {
        username: data.data.username,
        viewCredits: data.data.viewCredits,
        walletAddress: data.data.walletAddress
      });
    } else {
      console.error('❌ Failed to create user:', data.error);
    }
    
    return data.success;
  } catch (error) {
    console.error('❌ Error testing create user:', error);
    return false;
  }
}

async function testGetUser() {
  console.log('🧪 Testing get user endpoint...');
  
  try {
    const response = await fetch(`http://localhost:8080/api/users/${testWalletAddress}`);
    const data = await response.json();
    
    console.log('✅ Get user response:', data);
    
    if (data.success) {
      console.log('✅ User fetched successfully');
      console.log('📊 User data:', {
        username: data.data.username,
        viewCredits: data.data.viewCredits,
        walletAddress: data.data.walletAddress
      });
    } else {
      console.error('❌ Failed to get user:', data.error);
    }
    
    return data.success;
  } catch (error) {
    console.error('❌ Error testing get user:', error);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting user endpoint tests...\n');
  
  const createSuccess = await testCreateUser();
  console.log('\n');
  
  if (createSuccess) {
    const getSuccess = await testGetUser();
    console.log('\n');
    
    if (createSuccess && getSuccess) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('❌ Some tests failed');
    }
  } else {
    console.log('❌ Create test failed, skipping get test');
  }
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  runTests();
} else {
  // Node.js environment
  const fetch = require('node-fetch');
  runTests();
}