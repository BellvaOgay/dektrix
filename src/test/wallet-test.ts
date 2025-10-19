// Wallet Connection Test
// This file tests the wallet connection functionality and API integration

import { createOrGetUserByWallet, getUserByWallet } from '@/api/users';

export async function testWalletConnection() {
  console.log('🧪 Starting Wallet Connection Test...');

  try {
    // Test wallet address (example)
    const testWalletAddress = '0x1234567890123456789012345678901234567890';

    console.log('📝 Testing createOrGetUserByWallet API...');

    // Test 1: Create new user
    const createResult = await createOrGetUserByWallet(testWalletAddress, {
      username: 'test_user',
      displayName: 'Test User',
      bio: 'Test user for wallet connection'
    });

    if (createResult.success) {
      console.log('✅ User creation/retrieval successful:', {
        isNewUser: createResult.isNewUser,
        userId: createResult.data?._id,
        walletAddress: createResult.data?.walletAddress,
        username: createResult.data?.username
      });
    } else {
      console.error('❌ User creation failed:', createResult.error);
      return false;
    }

    // Test 2: Get existing user
    console.log('📝 Testing getUserByWallet API...');
    const getUserResult = await getUserByWallet(testWalletAddress);

    if (getUserResult.success) {
      console.log('✅ User retrieval successful:', {
        userId: getUserResult.data?._id,
        walletAddress: getUserResult.data?.walletAddress,
        username: getUserResult.data?.username,
        lastLoginAt: getUserResult.data?.lastLoginAt
      });
    } else {
      console.error('❌ User retrieval failed:', getUserResult.error);
      return false;
    }

    // Test 3: Test with different wallet address
    console.log('📝 Testing with different wallet address...');
    const newWalletAddress = '0x9876543210987654321098765432109876543210';

    const newUserResult = await createOrGetUserByWallet(newWalletAddress);

    if (newUserResult.success) {
      console.log('✅ New user creation successful:', {
        isNewUser: newUserResult.isNewUser,
        userId: newUserResult.data?._id,
        walletAddress: newUserResult.data?.walletAddress
      });
    } else {
      console.error('❌ New user creation failed:', newUserResult.error);
      return false;
    }

    console.log('🎉 All wallet connection tests passed!');
    return true;

  } catch (error) {
    console.error('💥 Wallet connection test failed:', error);
    return false;
  }
}

// Function to test wallet connection in browser console
export function testWalletInBrowser() {
  console.log('🌐 Testing wallet connection in browser...');
  console.log('📋 Instructions:');
  console.log('1. Open browser console (F12)');
  console.log('2. Click "Connect Wallet" button');
  console.log('3. Watch for console logs with emojis');
  console.log('4. Check for successful connection and user creation');
  console.log('');
  console.log('🔍 Look for these log patterns:');
  console.log('  🔧 Initializing Coinbase Wallet SDK...');
  console.log('  ✅ Coinbase Wallet SDK initialized successfully');
  console.log('  🚀 Starting wallet connection process...');
  console.log('  👤 Creating/fetching user for wallet: [address]');
  console.log('  ✅ User API call successful');
  console.log('');
  console.log('⚠️ If you see errors, check:');
  console.log('  - Network connection');
  console.log('  - Database connection');
  console.log('  - Wallet extension installed');
  console.log('  - Base network configuration');
}

// Export for global access in browser console
if (typeof window !== 'undefined') {
  (window as any).testWalletConnection = testWalletConnection;
  (window as any).testWalletInBrowser = testWalletInBrowser;
}