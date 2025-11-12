// Test script to verify credit addition is working
import fetch from 'node-fetch';

async function testCreditAddition() {
  try {
    console.log('Testing credit addition endpoint...');
    
    // Test with amount parameter (what frontend sends)
    const testData = {
      walletAddress: '0xc7cf9ad0f49cf85c4cb8929aaf1b13f27243aff4',
      amount: 5
    };
    
    console.log('Sending request with amount parameter:', testData);
    
    const response = await fetch('http://localhost:3001/api/users/add-credits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('Success! Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testCreditAddition();