import mongoose from 'mongoose';

async function testMongoConnection() {
  try {
    console.log('Testing MongoDB connection...');
    
    // Use the same connection logic as in your API routes
    const mongoUri = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;
    
    if (!mongoUri) {
      console.error('MongoDB URI not found in environment variables');
      return;
    }
    
    console.log('MongoDB URI found, attempting connection...');
    
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connected successfully!');
    console.log('Host:', conn.connection.host);
    
    // Test if we can access videos collection
    const db = conn.connection.db;
    const videos = await db.collection('videos').find({}).limit(5).toArray();
    console.log('Found videos:', videos.length);
    
    await mongoose.disconnect();
    console.log('Connection closed');
    
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.error('Error details:', error);
  }
}

testMongoConnection();