// Quick test to verify video locking functionality
console.log('🔒 Testing Video Locking Functionality');

// Simulate the video locking logic
function testVideoLockingLogic() {
    console.log('\n🧪 Testing Video Locking Logic:');
    
    // Test case 1: No wallet connected
    const isConnected = false;
    const walletUser = null; // wallet is not connected
    const videoIsFree = false;
    const isVideoUnlocked = false;
    
    // Original buggy logic
    const oldLogic = !videoIsFree && !isVideoUnlocked && (!isConnected || walletUser?.viewCredits === 0);
    
    // Fixed logic
    const newLogic = !videoIsFree && !isVideoUnlocked && (!isConnected || (walletUser?.viewCredits ?? 0) === 0);
    
    console.log('Test Case 1 - No wallet connected:');
    console.log('  Video is free:', videoIsFree);
    console.log('  Video is unlocked:', isVideoUnlocked);
    console.log('  Wallet connected:', isConnected);
    console.log('  User view credits:', walletUser?.viewCredits);
    console.log('  Old logic result:', oldLogic, '(BUG: should be true)');
    console.log('  New logic result:', newLogic, '(FIXED: should be true)');
    console.log('  Status:', newLogic ? '✅ LOCKED (Correct)' : '❌ UNLOCKED (Incorrect)');
    
    // Test case 2: Wallet connected, 0 credits
    const isConnected2 = true;
    const walletUser2 = { viewCredits: 0 };
    const videoIsFree2 = false;
    const isVideoUnlocked2 = false;
    
    const result2 = !videoIsFree2 && !isVideoUnlocked2 && (!isConnected2 || (walletUser2?.viewCredits ?? 0) === 0);
    console.log('\nTest Case 2 - Wallet connected, 0 credits:');
    console.log('  Result:', result2, '-', result2 ? '✅ LOCKED' : '❌ UNLOCKED');
    
    // Test case 3: Wallet connected, has credits
    const walletUser3 = { viewCredits: 5 };
    const result3 = !videoIsFree2 && !isVideoUnlocked2 && (!isConnected2 || (walletUser3?.viewCredits ?? 0) === 0);
    console.log('Test Case 3 - Wallet connected, 5 credits:');
    console.log('  Result:', result3, '-', result3 ? '✅ LOCKED' : '❌ UNLOCKED');
    
    // Test case 4: Free video
    const videoIsFree4 = true;
    const result4 = !videoIsFree4 && !isVideoUnlocked2 && (!isConnected2 || (walletUser2?.viewCredits ?? 0) === 0);
    console.log('Test Case 4 - Free video:');
    console.log('  Result:', result4, '-', result4 ? '✅ LOCKED' : '❌ UNLOCKED');
    
    // Test case 5: Video already unlocked
    const isVideoUnlocked5 = true;
    const result5 = !videoIsFree2 && !isVideoUnlocked5 && (!isConnected2 || (walletUser2?.viewCredits ?? 0) === 0);
    console.log('Test Case 5 - Video already unlocked:');
    console.log('  Result:', result5, '-', result5 ? '✅ LOCKED' : '❌ UNLOCKED');
}

testVideoLockingLogic();

console.log('\n🎯 The fix ensures videos are properly locked when:');
console.log('  1. Video is not free AND');
console.log('  2. User hasn\'t unlocked it AND');
console.log('  3. (Wallet is not connected OR User has 0 credits)');