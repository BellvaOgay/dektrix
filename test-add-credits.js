import fetch from 'node-fetch';

async function testAddCredits() {
  try {
    console.log('Testing /api/users/add-credits endpoint...');
    
    const response = await fetch('http://localhost:3001/api/users/add-credits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: 'test-wallet-123',
        creditsToAdd: 10
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response text:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('Response JSON:', json);
    } catch (e) {
      console.log('Response is not valid JSON');
    }
    
  } catch (error) {
    console.error('Error testing endpoint:', error);
  }
}

testAddCredits();