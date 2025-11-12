// Test script to check the new Vercel deployment
const testEndpoints = async () => {
  const baseUrl = 'https://dektrix-pfflnaae2-bellvaogays-projects.vercel.app';
  
  console.log('Testing NEW Vercel deployment endpoints...');
  
  // Test health endpoint
  try {
    console.log('\n1. Testing /api/health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    console.log('Health endpoint status:', healthResponse.status);
    if (healthResponse.ok) {
      const healthData = await healthResponse.text();
      console.log('Health response:', healthData);
    } else {
      const errorText = await healthResponse.text();
      console.log('Health error response:', errorText);
    }
  } catch (error) {
    console.log('Health endpoint error:', error.message);
  }
  
  // Test users endpoint
  try {
    console.log('\n2. Testing /api/users endpoint...');
    const usersResponse = await fetch(`${baseUrl}/api/users`);
    console.log('Users endpoint status:', usersResponse.status);
    if (usersResponse.ok) {
      const usersData = await usersResponse.text();
      console.log('Users response:', usersData);
    }
  } catch (error) {
    console.log('Users endpoint error:', error.message);
  }
  
  console.log('\nAPI testing completed.');
};

testEndpoints().catch(console.error);