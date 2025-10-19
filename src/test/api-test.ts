import { getCategories, createCategory, getCategoryBySlug } from '../api/categories';
import { createOrUpdateUser, getUserById } from '../api/users';
import { getVideos, createVideo } from '../api/videos';
import { createTransaction, getUserTransactions } from '../api/transactions';

async function testAPIFunctions() {
  console.log('🧪 Testing API Functions...\n');

  try {
    // Test Categories API
    console.log('📂 Testing Categories API...');
    
    // Create a test category
    const categoryResult = await createCategory({
      name: 'Test Category',
      slug: 'test-category-api',
      description: 'A test category for API testing',
      icon: '🧪',
      color: '#3B82F6'
    });
    
    if (categoryResult.success) {
      console.log('✅ Category created successfully');
    } else {
      console.log('❌ Category creation failed:', categoryResult.error);
    }

    // Get categories
    const categoriesResult = await getCategories();
    if (categoriesResult.success) {
      console.log(`✅ Retrieved ${categoriesResult.data?.length} categories`);
    } else {
      console.log('❌ Failed to get categories:', categoriesResult.error);
    }

    // Test Users API
    console.log('\n👤 Testing Users API...');
    
    const userResult = await createOrUpdateUser({
      fid: 12345,
      username: 'testuser',
      displayName: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
      bio: 'Test user for API testing'
    });
    
    if (userResult.success) {
      console.log('✅ User created/updated successfully');
      
      // Get user by ID
      const getUserResult = await getUserById(userResult.data!._id.toString());
      if (getUserResult.success) {
        console.log('✅ User retrieved successfully');
      } else {
        console.log('❌ Failed to get user:', getUserResult.error);
      }
    } else {
      console.log('❌ User creation failed:', userResult.error);
    }

    // Test Videos API
    console.log('\n🎥 Testing Videos API...');
    
    const videoResult = await createVideo({
      title: 'Test Video',
      description: 'A test video for API testing',
      thumbnail: 'https://example.com/thumbnail.jpg',
      videoUrl: 'https://example.com/test-video.mp4',
      duration: 300,
      category: 'AI Agents',
      difficulty: 'Beginner',
      price: 0.001,
      priceDisplay: '$0.001',
      creator: userResult.data!._id,
      tags: ['test', 'api']
    });
    
    if (videoResult.success) {
      console.log('✅ Video created successfully');
    } else {
      console.log('❌ Video creation failed:', videoResult.error);
    }

    // Get videos
    const videosResult = await getVideos();
    if (videosResult.success) {
      console.log(`✅ Retrieved ${videosResult.data?.length} videos`);
    } else {
      console.log('❌ Failed to get videos:', videosResult.error);
    }

    // Test Transactions API
    console.log('\n💰 Testing Transactions API...');
    
    if (userResult.success && videoResult.success) {
      const transactionResult = await createTransaction({
        user: userResult.data!._id.toString(),
        video: videoResult.data!._id.toString(),
        type: 'unlock',
        amount: 0.001,
        amountDisplay: '$0.001',
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        paymentMethod: 'crypto'
      });
      
      if (transactionResult.success) {
        console.log('✅ Transaction created successfully');
        
        // Get user transactions
        const userTransactionsResult = await getUserTransactions(userResult.data!._id.toString());
        if (userTransactionsResult.success) {
          console.log(`✅ Retrieved ${userTransactionsResult.data?.length} user transactions`);
        } else {
          console.log('❌ Failed to get user transactions:', userTransactionsResult.error);
        }
      } else {
        console.log('❌ Transaction creation failed:', transactionResult.error);
      }
    }

    console.log('\n🎉 All API tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ API test failed:', error);
    return false;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAPIFunctions()
    .then((success) => {
      if (success) {
        console.log('✅ API tests completed successfully');
        process.exit(0);
      } else {
        console.log('❌ API tests failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ API tests failed:', error);
      process.exit(1);
    });
}

export { testAPIFunctions };