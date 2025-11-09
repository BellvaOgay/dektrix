// Simple test to check if video-unlock endpoint is working
const testData = {
  userId: "67a1b2c3d4e5f6a1b2c3d4e5", // Replace with actual user ID
  videoId: "67a1b2c3d4e5f6a1b2c3d4e6", // Replace with actual video ID
  transactionHash: "test_hash_1234567890",
  paymentMethod: "crypto",
  amount: 1000000, // 1 USDC
  amountDisplay: "1 USDC"
};

console.log('Testing video-unlock endpoint with data:');
console.log(JSON.stringify(testData, null, 2));

console.log('\nExpected credit update: 12 view credits (for 1 USDC payment)');
console.log('Expected response should include:');
console.log('- success: true');
console.log('- data.user.viewCredits: updated credit count');
console.log('- data.user.creditsAdded: 12');

console.log('\nTo test this endpoint, make a POST request to:');
console.log('http://localhost:3001/api/video-unlock');
console.log('with the above JSON data in the request body');