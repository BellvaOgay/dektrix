import fetch from 'node-fetch';

async function testVideoCreation() {
  console.log('Testing video creation endpoint...');
  
  const testData = {
    title: 'Test Video - ' + Date.now(),
    description: 'This is a test video to verify the creator field fix',
    videoUrl: 'https://example.com/test-video.mp4',
    thumbnail: 'https://example.com/test-thumbnail.jpg',
    duration: 120,
    category: 'ai-agents',
    price: 0,
    priceDisplay: 'Free',
    creatorWallet: '0xtest1234567890abcdef' + Date.now(),
    isFree: true
  };

  try {
    const response = await fetch('http://localhost:3001/api/videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.status === 201) {
      console.log('✅ SUCCESS: Video created successfully!');
      console.log('Video ID:', result.data._id);
    } else {
      console.log('❌ FAILED: Video creation failed');
      if (result.error) {
        console.log('Error:', result.error);
      }
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testVideoCreation();