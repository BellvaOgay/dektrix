// Comprehensive test script to check various API endpoints
const testEndpoints = async () => {
  const baseUrl = 'https://dektrix-pfflnaae2-bellvaogays-projects.vercel.app';
  
  console.log('Comprehensive API testing...');
  
  const endpoints = [
    '/api/health',
    '/api/users',
    '/api/videos',
    '/api/creators',
    '/api/categories'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting ${endpoint} endpoint...`);
      const response = await fetch(`${baseUrl}${endpoint}`);
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.text();
        console.log(`Response: ${data.substring(0, 100)}...`);
      } else {
        const errorText = await response.text();
        console.log(`Error: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  }
  
  console.log('\nComprehensive testing completed.');
};

testEndpoints().catch(console.error);