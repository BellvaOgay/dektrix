// Test script to verify the payment system fix
import fetch from 'node-fetch';

const VERCEL_URL = 'https://dektrix-qk3b9797l-bellvaogays-projects.vercel.app';

async function testPaymentSystem() {
  console.log('🧪 Testing Payment System Fix...\n');
  
  // Test 1: Check if API endpoints are accessible
  console.log('1. Testing API endpoint accessibility:');
  try {
    const healthResponse = await fetch(`${VERCEL_URL}/api/health`);
    console.log(`   /api/health: ${healthResponse.status} ${healthResponse.statusText}`);
  } catch (error) {
    console.log('   /api/health: ❌ Not accessible');
  }

  // Test 2: Test the add-credits endpoint
  console.log('\n2. Testing add-credits endpoint:');
  try {
    const testData = {
      walletAddress: '0xTestWallet123',
      amount: 10
    };
    
    const response = await fetch(`${VERCEL_URL}/api/users/add-credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ Success:', result);
    } else {
      const error = await response.text();
      console.log('   ❌ Error:', error);
    }
  } catch (error) {
    console.log('   ❌ Network error:', error.message);
  }

  console.log('\n🎯 Payment system test completed!');
  console.log('📱 Open your app and test the "Buy Credits" button:');
  console.log('   ', VERCEL_URL);
}

testPaymentSystem().catch(console.error);