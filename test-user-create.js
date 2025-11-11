import fetch from 'node-fetch';

async function testUserCreate() {
  try {
    console.log('Testing /api/users/create endpoint...');
    
    const response = await fetch('http://localhost:3001/api/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: 'test-wallet-' + Date.now(),
        userData: {
          username: 'test_user_' + Date.now(),
          displayName: 'Test User'
        }
      })
    });

    console.log('Response status:', response.status);
    
    const text = await response.text();
    console.log('Response text:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('Response JSON:', json);
      
      if (json.success && json.data) {
        console.log('✅ User created successfully!');
        console.log('User ID:', json.data._id);
        console.log('Wallet Address:', json.data.walletAddress);
        console.log('View Credits:', json.data.viewCredits);
        
        // Now test adding credits to this user
        await testAddCredits(json.data.walletAddress);
      }
      
    } catch (e) {
      console.log('Response is not valid JSON');
    }
    
  } catch (error) {
    console.error('Error testing endpoint:', error);
  }
}

async function testAddCredits(walletAddress) {
  try {
    console.log('\nTesting /api/users/add-credits for user:', walletAddress);
    
    const response = await fetch('http://localhost:3001/api/users/add-credits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: walletAddress,
        creditsToAdd: 10
      })
    });

    console.log('Add credits response status:', response.status);
    
    const text = await response.text();
    console.log('Add credits response text:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('Add credits response JSON:', json);
    } catch (e) {
      console.log('Add credits response is not valid JSON');
    }
    
  } catch (error) {
    console.error('Error testing add credits:', error);
  }
}

testUserCreate();