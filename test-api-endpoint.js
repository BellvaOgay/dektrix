// Test script to check if the API endpoint is working
import fetch from 'node-fetch';

async function testApiEndpoint() {
  try {
    console.log('Testing API endpoint: http://localhost:3001/api/videos');
    
    const response = await fetch('http://localhost:3001/api/videos');
    
    if (!response.ok) {
      console.error(`API returned status: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const result = await response.json();
    console.log('API response received successfully!');
    
    if (!result.data) {
      console.log('API response format:', JSON.stringify(result, null, 2));
      console.log(`Number of videos returned: 0 (no data field)`);
      return false;
    }
    
    console.log(`Number of videos returned: ${result.data.length}`);
    
    // Check if Ep5 is in the response
    const ep5Video = result.data.find(video => 
      video.title.includes('Ep5') || 
      video.videoUrl.includes('Ep5') ||
      video.filename?.includes('Ep5')
    );
    
    if (ep5Video) {
      console.log('✅ Ep5 found in API response:');
      console.log(`   Title: ${ep5Video.title}`);
      console.log(`   URL: ${ep5Video.videoUrl}`);
      console.log(`   Free: ${ep5Video.isFree}`);
    } else {
      console.log('❌ Ep5 NOT found in API response');
      console.log('Available videos:');
      result.data.forEach(video => {
        console.log(`   - ${video.title} (${video.videoUrl}) - Free: ${video.isFree}`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('Error testing API endpoint:', error.message);
    return false;
  }
}

testApiEndpoint().then(success => {
  if (success) {
    console.log('\n✅ API endpoint test completed successfully');
  } else {
    console.log('\n❌ API endpoint test failed');
  }
  process.exit(0);
});