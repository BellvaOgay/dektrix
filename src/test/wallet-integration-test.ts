// Wallet Integration Test
// Tests the complete wallet connection flow with user session management

import { createOrGetUserByWallet, getUserByWallet, updateWatchHistory, addPurchasedVideo } from '@/api/users';

async function testWalletIntegration() {
  console.log('🧪 Starting Wallet Integration Test...');
  
  try {
    // Test wallet addresses
    const testWallet1 = '0x1234567890123456789012345678901234567890';
    const testWallet2 = '0x9876543210987654321098765432109876543210';
    
    console.log('\n👤 Testing User Creation/Session Management...');
    
    // Test 1: Create new user with wallet
    console.log('📝 Test 1: Creating new user...');
    const newUserResult = await createOrGetUserByWallet(testWallet1, {
      username: 'wallet_user_1',
      displayName: 'Wallet User 1',
      bio: 'Test user created via wallet connection'
    });
    
    if (newUserResult.success) {
      console.log('✅ New user created:', {
        isNewUser: newUserResult.isNewUser,
        userId: newUserResult.data?._id,
        walletAddress: newUserResult.data?.walletAddress,
        username: newUserResult.data?.username,
        lastLoginAt: newUserResult.data?.lastLoginAt
      });
    } else {
      console.error('❌ New user creation failed:', newUserResult.error);
      return false;
    }
    
    // Test 2: Get existing user (should update lastLoginAt)
    console.log('📝 Test 2: Getting existing user...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    const existingUserResult = await createOrGetUserByWallet(testWallet1);
    
    if (existingUserResult.success) {
      console.log('✅ Existing user retrieved:', {
        isNewUser: existingUserResult.isNewUser,
        userId: existingUserResult.data?._id,
        walletAddress: existingUserResult.data?.walletAddress,
        lastLoginAt: existingUserResult.data?.lastLoginAt
      });
      
      // Verify it's not marked as new user
      if (existingUserResult.isNewUser === false) {
        console.log('✅ Correctly identified as existing user');
      } else {
        console.error('❌ Should not be marked as new user');
        return false;
      }
    } else {
      console.error('❌ Existing user retrieval failed:', existingUserResult.error);
      return false;
    }
    
    // Test 3: Create another user with different wallet
    console.log('📝 Test 3: Creating user with different wallet...');
    const secondUserResult = await createOrGetUserByWallet(testWallet2);
    
    if (secondUserResult.success) {
      console.log('✅ Second user created:', {
        isNewUser: secondUserResult.isNewUser,
        userId: secondUserResult.data?._id,
        walletAddress: secondUserResult.data?.walletAddress,
        username: secondUserResult.data?.username
      });
    } else {
      console.error('❌ Second user creation failed:', secondUserResult.error);
      return false;
    }
    
    // Test 4: Test getUserByWallet function
    console.log('📝 Test 4: Testing getUserByWallet...');
    const getUserResult = await getUserByWallet(testWallet1);
    
    if (getUserResult.success) {
      console.log('✅ getUserByWallet successful:', {
        userId: getUserResult.data?._id,
        walletAddress: getUserResult.data?.walletAddress,
        username: getUserResult.data?.username
      });
    } else {
      console.error('❌ getUserByWallet failed:', getUserResult.error);
      return false;
    }
    
    // Test 5: Test user functionality (watch history)
    console.log('📝 Test 5: Testing user functionality...');
    const mockVideoId = '507f1f77bcf86cd799439011'; // Mock ObjectId
    
    const watchHistoryResult = await updateWatchHistory(testWallet1, mockVideoId, 50);
    
    if (watchHistoryResult.success) {
      console.log('✅ Watch history updated successfully');
    } else {
      console.error('❌ Watch history update failed:', watchHistoryResult.error);
      return false;
    }
    
    // Test 6: Test purchased videos
    console.log('📝 Test 6: Testing purchased videos...');
    const purchaseResult = await addPurchasedVideo(testWallet1, mockVideoId);
    
    if (purchaseResult.success) {
      console.log('✅ Purchased video added successfully');
    } else {
      console.error('❌ Purchased video addition failed:', purchaseResult.error);
      return false;
    }
    
    console.log('\n🎉 All wallet integration tests passed!');
    console.log('\n📊 Test Summary:');
    console.log('  ✅ User creation with wallet address');
    console.log('  ✅ Existing user login (session management)');
    console.log('  ✅ Multiple wallet support');
    console.log('  ✅ User data retrieval');
    console.log('  ✅ User functionality (watch history)');
    console.log('  ✅ User functionality (purchased videos)');
    
    return true;
    
  } catch (error) {
    console.error('💥 Wallet integration test failed:', error);
    return false;
  }
}

// Run the test
testWalletIntegration()
  .then(success => {
    if (success) {
      console.log('\n🏆 All tests completed successfully!');
      process.exit(0);
    } else {
      console.log('\n💥 Some tests failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });