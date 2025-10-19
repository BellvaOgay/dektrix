const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function testConnection() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('📍 URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    console.log('📊 Connection state:', mongoose.connection.readyState);
    console.log('🏷️  Database name:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    if (error.code) {
      console.error('🔢 Error code:', error.code);
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

testConnection();