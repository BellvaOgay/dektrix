import {
  connectDB,
  createOrUpdateUser,
  getVideos,
  createCategory,
  getCategories
} from '../api';
import User from '../models/User';
import Video from '../models/Video';
import Category from '../models/Category';
import Transaction from '../models/Transaction';

// Test database connection and basic operations
export async function testDatabaseOperations() {
  console.log('🧪 Starting database tests...');

  try {
    // Test 1: Database Connection
    console.log('\n1️⃣ Testing database connection...');
    await connectDB();
    console.log('✅ Database connected successfully');

    // Test 2: Create Category
    console.log('\n2️⃣ Testing category creation...');
    const categoryResult = await createCategory({
      name: 'Test Category',
      slug: 'test-category',
      description: 'A test category for database testing',
      icon: '🧪',
      color: '#FF6B6B',
      featured: true,
      order: 1
    });

    if (categoryResult.success) {
      console.log('✅ Category created:', categoryResult.data?.name);
    } else {
      console.log('❌ Category creation failed:', categoryResult.error);
    }

    // Test 3: Get Categories
    console.log('\n3️⃣ Testing category retrieval...');
    const categoriesResult = await getCategories();

    if (categoriesResult.success) {
      console.log(`✅ Retrieved ${categoriesResult.data?.length} categories`);
    } else {
      console.log('❌ Category retrieval failed:', categoriesResult.error);
    }

    // Test 4: Create User
    console.log('\n4️⃣ Testing user creation...');
    const userResult = await createOrUpdateUser({
      fid: 12345,
      username: 'testuser',
      displayName: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
      bio: 'A test user for database testing',
      walletAddress: '0x1234567890123456789012345678901234567890'
    });

    if (userResult.success) {
      console.log('✅ User created:', userResult.data?.username);
    } else {
      console.log('❌ User creation failed:', userResult.error);
    }

    // Test 5: Create Video
    console.log('\n5️⃣ Testing video creation...');
    if (userResult.success && categoryResult.success) {
      const video = new Video({
        title: 'Test Video',
        description: 'A test video for database testing',
        videoUrl: 'https://example.com/video.mp4',
        thumbnail: 'https://example.com/thumbnail.jpg',
        duration: 300,
        category: 'AI Agents', // Use valid enum value
        tags: ['test', 'database', 'crud'],
        price: 10000000, // 10 USDC (6 decimals)
        priceDisplay: '10 USDC',
        difficulty: 'Beginner', // Use valid enum value with correct case
        creator: userResult.data?._id,
        featured: true
      });

      await video.save();
      console.log('✅ Video created:', video.title);

      // Test 6: Get Videos
      console.log('\n6️⃣ Testing video retrieval...');
      const videosResult = await getVideos({ limit: 5 });

      if (videosResult.success) {
        console.log(`✅ Retrieved ${videosResult.data?.length} videos`);
      } else {
        console.log('❌ Video retrieval failed:', videosResult.error);
      }

      // Test 7: Create Transaction
      console.log('\n7️⃣ Testing transaction creation...');
      const transaction = new Transaction({
        user: userResult.data?._id,
        video: video._id,
        type: 'unlock',
        amount: 10000000,
        amountDisplay: '10 USDC',
        paymentMethod: 'crypto',
        transactionHash: '0xabcdef1234567890',
        status: 'completed'
      });

      await transaction.save();
      console.log('✅ Transaction created:', transaction.type);
    }

    // Test 8: Database Stats
    console.log('\n8️⃣ Testing database statistics...');
    const [userCount, videoCount, categoryCount, transactionCount] = await Promise.all([
      User.countDocuments(),
      Video.countDocuments(),
      Category.countDocuments(),
      Transaction.countDocuments()
    ]);

    console.log(`📊 Database Statistics:
    - Users: ${userCount}
    - Videos: ${videoCount}
    - Categories: ${categoryCount}
    - Transactions: ${transactionCount}`);

    console.log('\n🎉 All database tests completed successfully!');

    return {
      success: true,
      stats: {
        users: userCount,
        videos: videoCount,
        categories: categoryCount,
        transactions: transactionCount
      }
    };

  } catch (error) {
    console.error('❌ Database test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Clean up test data (optional)
export async function cleanupTestData() {
  try {
    console.log('🧹 Cleaning up test data...');

    await Promise.all([
      (User as any).deleteMany({ username: 'testuser' }),
      (Video as any).deleteMany({ title: 'Test Video' }),
      (Category as any).deleteMany({ slug: 'test-category' }),
      (Transaction as any).deleteMany({ transactionHash: '0xabcdef1234567890' })
    ]);

    console.log('✅ Test data cleaned up successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return { success: false, error };
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDatabaseOperations()
    .then(result => {
      console.log('\n📋 Test Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}