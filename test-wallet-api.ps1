param(
  [string]$BaseUrl = "http://localhost:3001",
  [string]$Wallet = "0xA1b2c3D4e5F6078901234567890abcDEF1234567"
)

$ErrorActionPreference = 'Stop'

Write-Host "Create user..."
$createBody = @{ walletAddress = $Wallet; userData = @{ username = 'tester' } } | ConvertTo-Json
$create = Invoke-RestMethod -Uri "$BaseUrl/api/users/create" -Method Post -ContentType 'application/json' -Body $createBody
$create | ConvertTo-Json -Depth 5

Write-Host "Get user..."
$get = Invoke-RestMethod -Uri "$BaseUrl/api/users/$Wallet" -Method Get
$get | ConvertTo-Json -Depth 5

Write-Host "Add credits..."
$addBody = @{ walletAddress = $Wallet; creditsToAdd = 5 } | ConvertTo-Json
$add = Invoke-RestMethod -Uri "$BaseUrl/api/users/add-credits" -Method Post -ContentType 'application/json' -Body $addBody
$add | ConvertTo-Json -Depth 5
