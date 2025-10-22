require('dotenv').config();
const mongoose = require('mongoose');

// Define Video schema
const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String, required: true },
  videoUrl: { type: String, required: true },
  duration: { type: Number, required: true },
  category: { type: String, required: true },
  tags: [String],
  price: { type: Number, default: 0 },
  priceDisplay: { type: String, default: 'Free' },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isFree: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

async function checkDatabase(dbName) {
  const MONGODB_URI = `mongodb+srv://dekabellworld_db_user:vkzIzeolEfRVNTzg@cluster0.t2pqnic.mongodb.net/${dbName}`;
  
  try {
    console.log(`\n🔍 Checking database: ${dbName}`);
    console.log(`🔗 URI: ${MONGODB_URI}`);
    
    // Create a new connection for this database
    const connection = await mongoose.createConnection(MONGODB_URI);
    const Video = connection.model('Video', videoSchema);
    
    const videos = await Video.find({});
    console.log(`📊 Found ${videos.length} videos in ${dbName}:`);
    
    videos.forEach((video, index) => {
      console.log(`   ${index + 1}. ${video.title} - ${video.videoUrl}`);
    });
    
    // Check for Vid2 and Vid4 specifically
    const vid2Count = videos.filter(v => v.videoUrl && v.videoUrl.includes('Vid2')).length;
    const vid4Count = videos.filter(v => v.videoUrl && v.videoUrl.includes('Vid4')).length;
    
    console.log(`   📹 Vid2 entries: ${vid2Count}`);
    console.log(`   📹 Vid4 entries: ${vid4Count}`);
    
    await connection.close();
    
    return { dbName, videoCount: videos.length, vid2Count, vid4Count, videos };
    
  } catch (error) {
    console.error(`❌ Error checking ${dbName}:`, error.message);
    return { dbName, error: error.message };
  }
}

async function checkAllDatabases() {
  console.log('🔍 Checking multiple potential database names...');
  
  const databaseNames = [
    'dektrix',
    'dektirk', 
    'test',
    'dekabellworld',
    'production'
  ];
  
  const results = [];
  
  for (const dbName of databaseNames) {
    const result = await checkDatabase(dbName);
    results.push(result);
  }
  
  console.log('\n📊 Summary:');
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.dbName}: Error - ${result.error}`);
    } else {
      console.log(`✅ ${result.dbName}: ${result.videoCount} videos (Vid2: ${result.vid2Count}, Vid4: ${result.vid4Count})`);
    }
  });
  
  // Find databases with videos
  const dbsWithVideos = results.filter(r => !r.error && r.videoCount > 0);
  if (dbsWithVideos.length > 1) {
    console.log('\n⚠️  WARNING: Multiple databases contain videos!');
    dbsWithVideos.forEach(db => {
      console.log(`   - ${db.dbName}: ${db.videoCount} videos`);
    });
  }
}

checkAllDatabases();