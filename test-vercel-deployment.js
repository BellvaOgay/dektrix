import axios from 'axios';

async function testVercelDeployment() {
  // Test the latest deployment
  const baseUrl = 'https://dektrix-o61n3v3wq-bellvaogays-projects.vercel.app';
  
  console.log('🧪 Testing Vercel deployment...');
  console.log(`📍 Base URL: ${baseUrl}`);
  
  try {
    // Test 1: Check if the site is accessible
    console.log('\n1. Testing site accessibility...');
    const homeResponse = await axios.get(baseUrl, { timeout: 10000 });
    console.log(`✅ Home page status: ${homeResponse.status}`);
    
    // Test 2: Test wallet status API
    console.log('\n2. Testing wallet status API...');
    const walletResponse = await axios.get(`${baseUrl}/api/wallet-status`, {
      params: { walletAddress: '0x1234567890123456789012345678901234567890' },
      timeout: 10000
    });
    console.log(`✅ Wallet status API status: ${walletResponse.status}`);
    console.log(`✅ Wallet status response:`, walletResponse.data);
    
    // Test 3: Test video access control (should be blocked without auth)
    console.log('\n3. Testing video access control...');
    try {
      const videoResponse = await axios.get(`${baseUrl}/api/private-videos/test-video.mp4`, {
        timeout: 10000
      });
      console.log(`❌ Video access should be blocked but got status: ${videoResponse.status}`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Video access correctly blocked (401 Unauthorized)');
      } else {
        console.log(`❌ Unexpected error: ${error.message}`);
      }
    }
    
    // Test 4: Test with wallet authentication
    console.log('\n4. Testing video access with wallet auth...');
    try {
      const authVideoResponse = await axios.get(`${baseUrl}/api/private-videos/test-video.mp4`, {
        headers: {
          'x-wallet-address': '0x1234567890123456789012345678901234567890'
        },
        timeout: 10000
      });
      console.log(`✅ Authenticated video access status: ${authVideoResponse.status}`);
    } catch (error) {
      console.log(`❌ Authenticated video access failed: ${error.message}`);
    }
    
    console.log('\n🎉 All deployment tests completed!');
    
  } catch (error) {
    console.error('❌ Deployment test failed:', error.message);
    process.exit(1);
  }
}

testVercelDeployment();