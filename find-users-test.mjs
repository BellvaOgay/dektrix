import mongoose from 'mongoose';
import User from './src/models/User.js';

async function findUsers() {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;
  if (!MONGODB_URI) {
    console.log('MongoDB URI not found in environment variables');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find().limit(5);
    console.log('Found users:');
    users.forEach(user => {
      console.log(`- ID: ${user._id}, Username: ${user.username}, Credits: ${user.viewCredits}`);
    });

    if (users.length === 0) {
      console.log('No users found in database');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

findUsers();