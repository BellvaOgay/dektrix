const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

async function fixVid4Duration() {
  if (!MONGODB_URI) {
    console.error('MongoDB URI not found in environment variables');
    return;
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('dektirk');
    const videosCollection = db.collection('videos');

    // Find Vid4 videos with undefined duration
    const vid4Videos = await videosCollection.find({
      title: { $regex: /Vid4|Web3 Security Fundamentals|NFT Marketplace Development/i }
    }).toArray();

    console.log('Found Vid4 videos:', vid4Videos.length);

    for (const video of vid4Videos) {
      console.log(`\nVideo: ${video.title}`);
      console.log(`Current duration: ${video.duration}`);
      
      if (video.duration === undefined || video.duration === null) {
        // Set a reasonable duration (4 minutes = 240 seconds)
        const newDuration = 240;
        
        await videosCollection.updateOne(
          { _id: video._id },
          { $set: { duration: newDuration } }
        );
        
        console.log(`✅ Updated duration to ${newDuration} seconds`);
      } else {
        console.log(`✅ Duration already set: ${video.duration} seconds`);
      }
    }

    console.log('\n✅ Vid4 duration fix completed');

  } catch (error) {
    console.error('Error fixing Vid4 duration:', error);
  } finally {
    await client.close();
  }
}

fixVid4Duration();