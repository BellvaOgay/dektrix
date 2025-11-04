# Set Vercel Environment Variables
Write-Host "Setting Vercel environment variables..."

# Paymaster URLs
Write-Host "Setting VITE_PAYMASTER_MAINNET..."
"https://api.developer.coinbase.com/rpc/v1/base/3ArKhP2mqcMalAwMVIDrq8RimZU3Ub7b" | vercel env add VITE_PAYMASTER_MAINNET production

Write-Host "Setting VITE_PAYMASTER_TESTNET..."
"https://api.developer.coinbase.com/rpc/v1/base-sepolia/3ArKhP2mqcMalAwMVIDrq8RimZU3Ub7b" | vercel env add VITE_PAYMASTER_TESTNET production

# API Base URL (updated with actual deployment URL)
Write-Host "Setting VITE_API_BASE_URL..."
"https://dektrix-6ssohk20m-bellvaogays-projects.vercel.app" | vercel env add VITE_API_BASE_URL production

# Database
Write-Host "Setting MONGODB_URI..."
"mongodb+srv://dekabellworld_db_user:vkzIzeolEfRVNTzg@cluster0.t2pqnic.mongodb.net/dektrix" | vercel env add MONGODB_URI production

Write-Host "Setting VITE_MONGODB_URI..."
"mongodb+srv://dekabellworld_db_user:vkzIzeolEfRVNTzg@cluster0.t2pqnic.mongodb.net/dektrix" | vercel env add VITE_MONGODB_URI production

# Payment Configuration
Write-Host "Setting BASE_PAY_AMOUNT..."
"0" | vercel env add BASE_PAY_AMOUNT production

# USDC Contract Addresses
Write-Host "Setting VITE_USDC_MAINNET_ADDRESS..."
"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" | vercel env add VITE_USDC_MAINNET_ADDRESS production

Write-Host "Setting VITE_USDC_TESTNET_ADDRESS..."
"0x036CbD53842c5426634e7929541eC2318f3dCF7e" | vercel env add VITE_USDC_TESTNET_ADDRESS production

# Credits Receiver Address
Write-Host "Setting VITE_CREDITS_RECEIVER_ADDRESS..."
"0x50d2C99358c9d3671869b75ceEE269f2F393E179" | vercel env add VITE_CREDITS_RECEIVER_ADDRESS production

Write-Host "Environment variables setup complete!"