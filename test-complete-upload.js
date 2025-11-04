// Complete test script to verify video upload functionality
import fetch from 'node-fetch';

const testCreatorData = {
  wallet_address: "0x1234567890123456789012345678901234567890",
  username: "testcreator",
  bio: "Test creator for video upload testing",
  profile_image_url: "/placeholder.svg",
  socialLinks: {
    twitter: "",
    instagram: "",
    youtube: "",
    website: ""
  }
};

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

async function testCompleteUpload() {
  try {
    console.log('🧪 Starting complete video upload test...\n');
    
    // Step 1: Create a test creator
    console.log('📝 Step 1: Creating test creator...');
    console.log('Creator data:', JSON.stringify(testCreatorData, null, 2));
    
    const creatorResponse = await fetch('http://localhost:8080/api/creators', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCreatorData)
    });

    const creatorResult = await creatorResponse.json();
    console.log('Creator response status:', creatorResponse.status);
    console.log('Creator response:', JSON.stringify(creatorResult, null, 2));
    
    if (!creatorResult.success && !creatorResult.error?.includes('already exists')) {
      console.log('❌ Failed to create creator:', creatorResult.error);
      return;
    }
    
    console.log('✅ Creator ready!\n');
    
    // Step 2: Test video upload
    console.log('📹 Step 2: Testing video upload...');
    console.log('Video data:', JSON.stringify(testVideoData, null, 2));
    
    const videoResponse = await fetch('http://localhost:8080/api/videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testVideoData)
    });

    const videoResponseText = await videoResponse.text();
    console.log('Video response status:', videoResponse.status);
    console.log('Video raw response:', videoResponseText);
    
    let videoResult;
    try {
      videoResult = JSON.parse(videoResponseText);
    } catch (parseError) {
      console.log('❌ Failed to parse video response:', parseError.message);
      return;
    }
    
    console.log('Video parsed response:', JSON.stringify(videoResult, null, 2));
    
    if (videoResult.success) {
      console.log('✅ Video upload successful!');
      console.log('Video ID:', videoResult.data._id);
      console.log('Video Title:', videoResult.data.title);
      console.log('Video URL:', videoResult.data.videoUrl);
      
      // Step 3: Verify video was saved by fetching all videos
      console.log('\n🔍 Step 3: Verifying video was saved to database...');
      const getResponse = await fetch('http://localhost:8080/api/videos');
      const getResult = await getResponse.json();
      
      if (getResult.success) {
        console.log('✅ Video retrieval successful!');
        console.log('Total videos in database:', getResult.data.length);
        
        // Find our test video
        const testVideo = getResult.data.find(v => v.title === testVideoData.title);
        if (testVideo) {
          console.log('✅ Test video found in database!');
          console.log('Saved video details:');
          console.log('- ID:', testVideo._id);
          console.log('- Title:', testVideo.title);
          console.log('- Description:', testVideo.description);
          console.log('- Video URL:', testVideo.videoUrl);
          console.log('- Category:', testVideo.category);
          console.log('- Duration:', testVideo.duration);
          console.log('- Price:', testVideo.priceDisplay);
          console.log('- Creator:', testVideo.creator?.username || 'N/A');
          console.log('- Created At:', testVideo.createdAt);
          
          console.log('\n🎉 SUCCESS: Video upload and database saving is working correctly!');
        } else {
          console.log('❌ Test video not found in database');
        }
      } else {
        console.log('❌ Video retrieval failed:', getResult.error);
      }
    } else {
      console.log('❌ Video upload failed:', videoResult.error);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Full error:', error);
  }
}

testCompleteUpload();