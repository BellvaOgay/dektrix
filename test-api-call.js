// Test the video-unlock API endpoint to verify transaction functionality
import fetch from 'node-fetch';

async function testVideoUnlockAPI() {
  try {
    console.log('🧪 Testing video-unlock API endpoint...');
    
    // Make a test API call to the video-unlock endpoint
    const response = await fetch('http://localhost:3001/api/video-unlock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test-user-id', // This will fail validation but should show the endpoint is working
        videoId: 'test-video-id',
        transactionHash: '0x1234567890abcdef',
        paymentMethod: 'crypto',
        amount: 100000,
        amountDisplay: '0.1 USDC'
      })
    });
    
    const result = await response.json();
    
    console.log('📊 API Response:', {
      status: response.status,
      success: result.success,
      error: result.error || 'No error'
    });
    
    if (response.status === 400 && result.error) {
      console.log('✅ API endpoint is working! (Expected validation error)');
      console.log('📋 Error message:', result.error);
    } else if (response.status === 200) {
      console.log('🎉 API endpoint successfully processed transaction!');
      console.log('📋 Response data:', result.data);
    } else {
      console.log('❌ Unexpected response from API');
    }
    
  } catch (error) {
    console.error('❌ Error testing API endpoint:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running on port 3001');
    }
  }
}

// Run the test
testVideoUnlockAPI();