# Test Vercel API Endpoints
$baseUrl = "https://dektrix-m3gzml9f8-bellvaogays-projects.vercel.app"
$wallet = "0xverceltest"

Write-Host "Testing Vercel API endpoints at: $baseUrl" -ForegroundColor Green
Write-Host "Using wallet address: $wallet" -ForegroundColor Yellow

# 1. Create/Fetch User
Write-Host "`n1. Creating/Fetching user..." -ForegroundColor Cyan
try {
    $userResponse = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/users/create" -ContentType "application/json" -Body (@{
        walletAddress = $wallet
    } | ConvertTo-Json)
    
    Write-Host "✅ User created/fetched successfully" -ForegroundColor Green
    Write-Host "User ID: $($userResponse._id)" -ForegroundColor White
    Write-Host "View Credits: $($userResponse.viewCredits)" -ForegroundColor White
    Write-Host "Is New User: $($userResponse.isNewUser)" -ForegroundColor White
    $userId = $userResponse._id
} catch {
    Write-Host "❌ Failed to create/fetch user: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Get Videos List
Write-Host "`n2. Fetching videos list..." -ForegroundColor Cyan
try {
    $videosResponse = Invoke-RestMethod -Method Get -Uri "$baseUrl/api/videos"
    Write-Host "✅ Videos fetched successfully" -ForegroundColor Green
    Write-Host "Total videos: $($videosResponse.Count)" -ForegroundColor White
    
    # Find a non-free video for testing
    $testVideo = $videosResponse | Where-Object { $_.isFree -eq $false } | Select-Object -First 1
    if ($testVideo) {
        Write-Host "Test video ID: $($testVideo._id)" -ForegroundColor White
        Write-Host "Test video title: $($testVideo.title)" -ForegroundColor White
        $videoId = $testVideo._id
    } else {
        Write-Host "⚠️ No non-free videos found for testing" -ForegroundColor Yellow
        $videoId = $videosResponse[0]._id
    }
} catch {
    Write-Host "❌ Failed to fetch videos: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Add Credits
Write-Host "`n3. Adding 5 view credits..." -ForegroundColor Cyan
try {
    $addCreditsResponse = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/users/add-credits" -ContentType "application/json" -Body (@{
        walletAddress = $wallet
        credits = 5
    } | ConvertTo-Json)
    
    Write-Host "✅ Credits added successfully" -ForegroundColor Green
    Write-Host "New credit balance: $($addCreditsResponse.viewCredits)" -ForegroundColor White
} catch {
    Write-Host "❌ Failed to add credits: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Deduct Credit
Write-Host "`n4. Deducting 1 credit for video viewing..." -ForegroundColor Cyan
try {
    $deductResponse = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/videos/deduct-credit" -ContentType "application/json" -Body (@{
        walletAddress = $wallet
        videoId = $videoId
    } | ConvertTo-Json)
    
    Write-Host "✅ Credit deducted successfully" -ForegroundColor Green
    Write-Host "Success: $($deductResponse.success)" -ForegroundColor White
    Write-Host "Remaining credits: $($deductResponse.remainingCredits)" -ForegroundColor White
    Write-Host "Transaction ID: $($deductResponse.transactionId)" -ForegroundColor White
} catch {
    Write-Host "❌ Failed to deduct credit: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Test BasePay Video Unlock
Write-Host "`n5. Testing BasePay video unlock..." -ForegroundColor Cyan
try {
    $basePayResponse = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/video-unlock" -ContentType "application/json" -Body (@{
        userId = $userId
        videoId = $videoId
        paymentMethod = "basepay"
    } | ConvertTo-Json)
    
    Write-Host "✅ BasePay unlock successful!" -ForegroundColor Green
    Write-Host "Success: $($basePayResponse.success)" -ForegroundColor White
    Write-Host "Message: $($basePayResponse.message)" -ForegroundColor White
    Write-Host "Transaction ID: $($basePayResponse.transactionId)" -ForegroundColor White
    Write-Host "Amount: $($basePayResponse.amount)" -ForegroundColor White
} catch {
    Write-Host "❌ BasePay unlock failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

Write-Host "`n🎉 Vercel API testing completed!" -ForegroundColor Green