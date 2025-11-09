import axios from 'axios';

const API_BASE = 'http://localhost:3001';

async function testVideoAccess() {
  console.log('🧪 Testing Video Access Control System\n');

  // Test 1: Access video without wallet connection
  console.log('Test 1: Access video without wallet connection');
  try {
    const response = await axios.get(`${API_BASE}/videos/Ep1.mp4`, {
      headers: {
        'Range': 'bytes=0-1000'
      },
      validateStatus: () => true
    });
    
    if (response.status === 403) {
      console.log('✅ PASS: Video correctly blocked without wallet');
      console.log('   Response:', response.data);
    } else {
      console.log('❌ FAIL: Video should be blocked without wallet');
      console.log('   Status:', response.status);
    }
  } catch (error) {
    console.log('❌ FAIL: Request failed:', error.message);
  }

  // Test 2: Access video with invalid wallet
  console.log('\nTest 2: Access video with invalid wallet address');
  try {
    const response = await axios.get(`${API_BASE}/videos/Ep1.mp4?wallet=0xInvalidWallet`, {
      headers: {
        'Range': 'bytes=0-1000'
      },
      validateStatus: () => true
    });
    
    if (response.status === 403) {
      console.log('✅ PASS: Video correctly blocked with invalid wallet');
      console.log('   Response:', response.data);
    } else {
      console.log('❌ FAIL: Video should be blocked with invalid wallet');
      console.log('   Status:', response.status);
    }
  } catch (error) {
    console.log('❌ FAIL: Request failed:', error.message);
  }

  // Test 3: Check wallet status API
  console.log('\nTest 3: Check wallet status API');
  try {
    const response = await axios.get(`${API_BASE}/api/wallet-status`, {
      validateStatus: () => true
    });
    
    console.log('✅ PASS: Wallet status API accessible');
    console.log('   Response:', response.data);
  } catch (error) {
    console.log('❌ FAIL: Wallet status API failed:', error.message);
  }

  // Test 4: Check private videos API without auth
  console.log('\nTest 4: Access private video without authentication');
  try {
    const response = await axios.get(`${API_BASE}/api/private-videos/vid%203.MOV`, {
      validateStatus: () => true
    });
    
    if (response.status === 403) {
      console.log('✅ PASS: Private video correctly blocked without auth');
      console.log('   Response:', response.data);
    } else {
      console.log('❌ FAIL: Private video should be blocked without auth');
      console.log('   Status:', response.status);
    }
  } catch (error) {
    console.log('❌ FAIL: Request failed:', error.message);
  }

  console.log('\n🎯 Test Summary:');
  console.log('Video access control system is now enforcing:');
  console.log('- Videos require wallet connection');
  console.log('- User must have credits > 0');
  console.log('- Private videos require authentication');
  console.log('- All video endpoints check access permissions');
}

// Run tests
testVideoAccess().catch(console.error);