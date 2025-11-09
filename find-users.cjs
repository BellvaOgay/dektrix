const mongoose = require('mongoose');
require('dotenv').config();

async function findUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check if User model exists
    const userModelNames = mongoose.modelNames();
    console.log('Available models:', userModelNames);
    
    if (userModelNames.includes('User')) {
      const User = mongoose.model('User');
      const users = await User.find().limit(5);
      
      if (users.length > 0) {
        console.log('👤 Users found:');
        users.forEach((user, index) => {
          console.log(`\nUser ${index + 1}:`);
          console.log('ID:', user._id);
          console.log('Username:', user.username);
          console.log('Display Name:', user.displayName || 'N/A');
        });
        return users[0]._id; // Return first user ID
      } else {
        console.log('❌ No users found in database');
      }
    } else {
      console.log('❌ User model not found in mongoose models');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error finding users:', error);
  }
}

findUsers();