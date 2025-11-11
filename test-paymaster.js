// Test script to verify paymaster service configuration
console.log('Testing Paymaster Service Configuration:');

// Check environment variables
const env = process.env;

console.log('Environment Variables:');
console.log('VITE_USDC_TESTNET_ADDRESS:', env.VITE_USDC_TESTNET_ADDRESS || 'Not set (using default)');
console.log('VITE_CREDITS_RECEIVER_ADDRESS:', env.VITE_CREDITS_RECEIVER_ADDRESS || 'Not set (using default)');

// Default addresses from paymaster service
const defaultUSDCAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const defaultReceiverAddress = '0x50d2C99358c9d3671869b75ceEE269f2F393E179';

const usdcAddress = env.VITE_USDC_TESTNET_ADDRESS || defaultUSDCAddress;
const receiverAddress = env.VITE_CREDITS_RECEIVER_ADDRESS || defaultReceiverAddress;

console.log('\nFinal Configuration:');
console.log('USDC Contract Address:', usdcAddress);
console.log('Receiver Address:', receiverAddress);

// Validate addresses are proper Ethereum addresses
function isValidEthereumAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

console.log('\nAddress Validation:');
console.log('USDC Address Valid:', isValidEthereumAddress(usdcAddress));
console.log('Receiver Address Valid:', isValidEthereumAddress(receiverAddress));

if (isValidEthereumAddress(usdcAddress) && isValidEthereumAddress(receiverAddress)) {
  console.log('✅ Paymaster service configuration is valid!');
} else {
  console.log('❌ Paymaster service configuration has invalid addresses!');
}

console.log('\nTo test the actual paymaster functionality:');
console.log('1. Ensure your wallet is connected to the correct network (Base Sepolia)');
console.log('2. Make sure you have sufficient USDC tokens for payments');
console.log('3. The paymaster service will handle gasless transactions');