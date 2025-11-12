# Test Vercel API Endpoints
Write-Host "Testing Vercel API endpoints..."

$baseUrl = "https://dektrix.vercel.app"

Write-Host "Testing homepage..."
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/" -Method Get
    Write-Host "Home Response: $($response.StatusCode)"
    Write-Host "Has root div: $([bool]([string]$response.Content -match '<div id=\"root\"></div>'))"
} catch {
    Write-Host "Home Error: $($_.Exception.Message)"
}

# Test 1: Get profile for test user
Write-Host "Testing profile endpoint..."
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/users/actions?slug=test&slug=get-profile" -Method Get
    Write-Host "Profile API Response: $($response.StatusCode)"
    Write-Host "Content: $($response.Content)"
} catch {
    Write-Host "Profile API Error: $($_.Exception.Message)"
}

Write-Host "Creating test user..."
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/users/actions?slug=test&slug=create" -Method Post -ContentType "application/json" -Body "{}"
    Write-Host "Create User Response: $($response.StatusCode)"
    Write-Host "Content: $($response.Content)"
} catch {
    Write-Host "Create User Error: $($_.Exception.Message)"
}

Write-Host "Re-checking profile..."
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/users/actions?slug=test&slug=get-profile" -Method Get
    Write-Host "Profile API Response: $($response.StatusCode)"
    Write-Host "Content: $($response.Content)"
} catch {
    Write-Host "Profile API Error: $($_.Exception.Message)"
}

# Test 2: Health check
Write-Host "Testing health endpoint..."
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -Method Get
    Write-Host "Health API Response: $($response.StatusCode)"
    Write-Host "Content: $($response.Content)"
} catch {
    Write-Host "Health API Error: $($_.Exception.Message)"
}

Write-Host "API testing completed!"
Write-Host "Testing videos endpoint..."
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/videos?limit=1" -Method Get
    Write-Host "Videos API Response: $($response.StatusCode)"
    Write-Host "Content: $($response.Content)"
} catch {
    Write-Host "Videos API Error: $($_.Exception.Message)"
}

Write-Host "Testing episode video..."
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/videos?episode=ep5" -Method Get
    Write-Host "Episode API Response: $($response.StatusCode)"
    Write-Host "Content: $($response.Content)"
} catch {
    Write-Host "Episode API Error: $($_.Exception.Message)"
}
