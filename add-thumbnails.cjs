const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function addThumbnails() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const videosCollection = db.collection('videos');

    // Example: Update specific videos with thumbnail URLs
    const thumbnailUpdates = [
      {
        title: 'Web3 Security Fundamentals',
        thumbnail: '/thumbnails/web3-security.jpg' // Add your thumbnail path
      },
      {
        title: 'NFT Marketplace Development', 
        thumbnail: '/thumbnails/nft-marketplace.jpg' // Add your thumbnail path
      },
      {
        title: 'Introduction to AI Agents',
        thumbnail: '/thumbnails/ai-agents.jpg' // Add your thumbnail path
      },
      {
        title: 'DeFi Fundamentals',
        thumbnail: '/thumbnails/defi-basics.jpg' // Add your thumbnail path
      }
    ];

    for (const update of thumbnailUpdates) {
      const result = await videosCollection.updateOne(
        { title: update.title },
        { $set: { thumbnail: update.thumbnail } }
      );
      
      if (result.matchedCount > 0) {
        console.log(`✅ Updated thumbnail for: ${update.title}`);
      } else {
        console.log(`⚠️  Video not found: ${update.title}`);
      }
    }

    // List all videos and their current thumbnails
    console.log('\n📋 Current video thumbnails:');
    const videos = await videosCollection.find({}).toArray();
    videos.forEach(video => {
      console.log(`- ${video.title}: ${video.thumbnail || 'No thumbnail'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

addThumbnails();