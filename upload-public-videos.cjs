// Script to upload all videos from public folder to MongoDB database
// Run with: node upload-public-videos.cjs

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://dekabellworld_db_user:vkzIzeolEfRVNTzg@cluster0.t2pqnic.mongodb.net/dektirk';

// Video Schema (matching the existing model)
const VideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String, required: true },
  videoUrl: { type: String, required: true },
  duration: { type: Number, required: true },
  category: {
    type: String,
    required: true,
    enum: ['AI Agents', 'DeFi', 'Blockchain', 'NFTs', 'Web3', 'Crypto', 'Smart Contracts', 'DAOs', 'Generic']
  },
  tags: [String],
  price: { type: Number, required: true },
  priceDisplay: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalViews: { type: Number, default: 0 },
  totalUnlocks: { type: Number, default: 0 },
  totalTipsEarned: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  isFree: { type: Boolean, default: false }
}, { timestamps: true });

const Video = mongoose.model('Video', VideoSchema);

// User Schema for creator
const UserSchema = new mongoose.Schema({
  username: String,
  displayName: String,
  walletAddress: String,
  fid: Number
});

const User = mongoose.model('User', UserSchema);

// Function to get video duration (mock implementation - in real scenario you'd use ffprobe)
function getVideoDuration(filename) {
  // Mock durations based on filename
  const durations = {
    'Vid1.mp4': 300, // 5 minutes
    'vid2.mp4': 240, // 4 minutes
    'Vid3.mp4': 420, // 7 minutes
    'Vid4.mp4': 480, // 8 minutes
  };
  return durations[filename] || 180; // Default 3 minutes
}

// Function to generate video metadata
function generateVideoMetadata(filename, videoPath) {
  const baseName = path.basename(filename, '.mp4');
  
  // Generate metadata based on filename
  const metadata = {
    'Vid1.mp4': {
      title: 'Introduction to DeFi Protocols',
      description: 'Learn the fundamentals of DeFi protocols and how they work in the decentralized finance ecosystem.',
      category: 'Generic',
      tags: ['DeFi', 'Protocols', 'Blockchain', 'Finance'],
      price: 100000, // 0.1 USDC
      priceDisplay: '0.1 USDC',
      difficulty: 'Beginner',
      featured: true,
      isFree: false
    },
    'vid2.mp4': {
      title: 'Smart Contract Security Best Practices',
      description: 'Essential security practices for smart contract development and deployment.',
      category: 'Generic',
      tags: ['Security', 'Smart Contracts', 'Best Practices', 'Development'],
      price: 100000, // 0.1 USDC
      priceDisplay: '0.1 USDC',
      difficulty: 'Intermediate',
      featured: false,
      isFree: false
    },
    'Vid3.mp4': {
      title: 'Advanced Blockchain Architecture',
      description: 'Deep dive into blockchain architecture, consensus mechanisms, and scalability solutions.',
      category: 'Blockchain',
      tags: ['Blockchain', 'Architecture', 'Consensus', 'Scalability'],
      price: 100000, // 0.1 USDC
      priceDisplay: '0.1 USDC',
      difficulty: 'Advanced',
      featured: true,
      isFree: false
    },
    'Vid4.mp4': {
      title: 'NFT Marketplace Development',
      description: 'Complete guide to building and deploying NFT marketplaces on blockchain networks.',
      category: 'NFTs',
      tags: ['NFTs', 'Marketplace', 'Development', 'Web3'],
      price: 100000, // 0.1 USDC
      priceDisplay: '0.1 USDC',
      difficulty: 'Advanced',
      featured: false,
      isFree: false
    }
  };

  return metadata[filename] || {
    title: `Video: ${baseName}`,
    description: `Educational video content: ${baseName}`,
    category: 'Generic',
    tags: ['Education', 'Video', 'Learning'],
    price: 100000, // 0.1 USDC default
    priceDisplay: '0.1 USDC',
    difficulty: 'Beginner',
    featured: false,
    isFree: false
  };
}

// Function to find all video files in public folder
function findVideoFiles() {
  const publicDir = path.join(__dirname, 'public');
  const videoFiles = [];

  // Check root public directory
  const rootFiles = fs.readdirSync(publicDir);
  rootFiles.forEach(file => {
    if (file.endsWith('.mp4')) {
      videoFiles.push({
        filename: file,
        path: `/${file}`,
        fullPath: path.join(publicDir, file)
      });
    }
  });

  // Check videos subdirectory
  const videosDir = path.join(publicDir, 'videos');
  if (fs.existsSync(videosDir)) {
    const videosDirFiles = fs.readdirSync(videosDir);
    videosDirFiles.forEach(file => {
      if (file.endsWith('.mp4')) {
        videoFiles.push({
          filename: file,
          path: `/videos/${file}`,
          fullPath: path.join(videosDir, file)
        });
      }
    });
  }

  return videoFiles;
}

async function uploadPublicVideos() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create or find admin user
    let adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      adminUser = new User({
        username: 'admin',
        displayName: 'Admin User',
        walletAddress: '0x1234567890123456789012345678901234567890',
        fid: 12345
      });
      try {
        await adminUser.save();
        console.log('✅ Created admin user');
      } catch (err) {
        if (err.code === 11000) {
          // User already exists, find it
          adminUser = await User.findOne({ walletAddress: '0x1234567890123456789012345678901234567890' });
          console.log('✅ Found existing admin user');
        } else {
          throw err;
        }
      }
    }

    // Find all video files
    const videoFiles = findVideoFiles();
    console.log(`📹 Found ${videoFiles.length} video files in public folder:`);
    videoFiles.forEach(video => console.log(`   - ${video.filename} (${video.path})`));

    if (videoFiles.length === 0) {
      console.log('⚠️  No video files found in public folder');
      return;
    }

    // Prepare video data for database
    const videosToUpload = [];
    
    for (const videoFile of videoFiles) {
      // Check if video already exists in database
      const existingVideo = await Video.findOne({ videoUrl: videoFile.path });
      if (existingVideo) {
        console.log(`⏭️  Skipping ${videoFile.filename} - already exists in database`);
        continue;
      }

      const metadata = generateVideoMetadata(videoFile.filename, videoFile.path);
      const duration = getVideoDuration(videoFile.filename);

      const videoData = {
        title: metadata.title,
        description: metadata.description,
        thumbnail: '/placeholder.svg', // Using placeholder for now
        videoUrl: videoFile.path,
        duration: duration,
        category: metadata.category,
        tags: metadata.tags,
        price: metadata.price,
        priceDisplay: metadata.priceDisplay,
        difficulty: metadata.difficulty,
        creator: adminUser._id,
        featured: metadata.featured,
        isFree: metadata.isFree
      };

      videosToUpload.push(videoData);
    }

    if (videosToUpload.length === 0) {
      console.log('ℹ️  All videos already exist in database');
      return;
    }

    // Insert videos into database
    const result = await Video.insertMany(videosToUpload);
    console.log(`✅ Successfully uploaded ${result.length} videos to database:`);

    // Display uploaded videos
    result.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   📁 Category: ${video.category}`);
      console.log(`   💰 Price: ${video.priceDisplay}`);
      console.log(`   🎯 Difficulty: ${video.difficulty}`);
      console.log(`   🔗 URL: ${video.videoUrl}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error uploading videos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from MongoDB');
  }
}

// Run the script
uploadPublicVideos();