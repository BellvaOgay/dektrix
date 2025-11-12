// Test script to check Vercel API endpoints with proper headers
const testEndpoints = async () => {
  const baseUrl = 'https://dektrix-cquli3vck-bellvaogays-projects.vercel.app';
  
  console.log('Testing Vercel API endpoints with proper headers...');
  
  // Test health endpoint with proper headers
  try {
    console.log('\n1. Testing /api/health endpoint with headers...');
    const healthResponse = await fetch(`${baseUrl}/api/health`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    console.log('Health endpoint status:', healthResponse.status);
    console.log('Health endpoint headers:', Object.fromEntries(healthResponse.headers.entries()));
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
  
  // Test if this is a CORS issue by testing from browser context
  try {
    console.log('\n2. Testing OPTIONS preflight request...');
    const optionsResponse = await fetch(`${baseUrl}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log('OPTIONS status:', optionsResponse.status);
    console.log('OPTIONS headers:', Object.fromEntries(optionsResponse.headers.entries()));
  } catch (error) {
    console.log('OPTIONS error:', error.message);
  }
  
  console.log('\nAPI testing completed.');
};

testEndpoints().catch(console.error);