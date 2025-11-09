import mongoose from 'mongoose';

async function testMongoDBConnection() {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

  if (!MONGODB_URI) {
    console.log('❌ MongoDB URI not found in environment variables');
    return;
  }

  console.log('Testing MongoDB connection...');
  console.log('Connection string:', MONGODB_URI.replace(/:[^:]*@/, ':********@')); // Hide password

  try {
    // Set connection options
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, options);
    console.log('✅ Successfully connected to MongoDB!');

    // Check if we can access the database
    const db = mongoose.connection.db;
    if (db) {
      console.log('✅ Database connection is active');

      // List collections to verify access
      const collections = await db.listCollections().toArray();
      console.log('\n📁 Available collections:');
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });

      // Check if users collection exists
      const usersCollection = collections.find(c => c.name === 'users');
      if (usersCollection) {
        console.log('✅ Users collection found');

        // Count documents in users collection
        const userCount = await mongoose.connection.collection('users').countDocuments();
        console.log(`📊 Total users: ${userCount}`);
      } else {
        console.log('ℹ️ Users collection not found (may need to create first user)');
      }
    }

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);

    if (error.name === 'MongoServerSelectionError') {
      console.log('💡 This could be due to:');
      console.log('1. Network connectivity issues');
      console.log('2. Incorrect MongoDB connection string');
      console.log('3. MongoDB Atlas IP restrictions');
      console.log('4. Authentication issues');
    }
  } finally {
    // Close the connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('\n🔌 MongoDB connection closed');
    }
  }
}

// Load environment variables
import { config } from 'dotenv';
config();

testMongoDBConnection();