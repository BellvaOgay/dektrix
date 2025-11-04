// Test script to verify video upload API functionality
import fetch from 'node-fetch';

const testVideoData = {
  title: "Test Video Upload",
  description: "This is a test video to verify database saving functionality",
  videoUrl: "/videos/Vid3.mp4",
  thumbnail: "/placeholder.svg",
  duration: 120,
  category: "Blockchain",
  tags: ["test", "upload"],
  price: 0,
  priceDisplay: "Free",
  difficulty: "Beginner",
  creatorWallet: "0x1234567890123456789012345678901234567890",
  featured: false,
  isFree: true
};

async function testVideoUpload() {
  try {
    console.log('Testing video upload API...');
    console.log('Sending data:', JSON.stringify(testVideoData, null, 2));
    
    const response = await fetch('http://localhost:8080/api/videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testVideoData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.log('❌ Failed to parse JSON response:', parseError.message);
      return;
    }
    
    console.log('Parsed response data:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Video upload successful!');
      console.log('Video ID:', result.data._id);
      
      // Test fetching the video back
      console.log('\nTesting video retrieval...');
      const getResponse = await fetch('http://localhost:8080/api/videos');
      const getResult = await getResponse.json();
      
      if (getResult.success) {
        console.log('✅ Video retrieval successful!');
        console.log('Total videos found:', getResult.data.length);
        
        // Find our test video
        const testVideo = getResult.data.find(v => v.title === testVideoData.title);
        if (testVideo) {
          console.log('✅ Test video found in database!');
          console.log('Saved video:', JSON.stringify(testVideo, null, 2));
        } else {
          console.log('❌ Test video not found in database');
        }
      } else {
        console.log('❌ Video retrieval failed:', getResult.error);
      }
    } else {
      console.log('❌ Video upload failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Full error:', error);
  }
}

testVideoUpload();