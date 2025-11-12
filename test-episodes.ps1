param(
  [string]$BaseUrl = "https://dektrix.vercel.app"
)

$ErrorActionPreference = 'Stop'

$resp = Invoke-WebRequest -Uri "$BaseUrl/api/videos?limit=100" -Method Get
$json = $resp.Content | ConvertFrom-Json
$titles = @()
if ($json -and $json.data) { $titles = $json.data | ForEach-Object { $_.title } }

$episodes = @('Ep1','Ep2','Ep3','Ep4','Ep5','Ep6')
foreach ($e in $episodes) {
  $present = $false
  foreach ($t in $titles) { if ($t -match $e) { $present = $true; break } }
  if ($present) {
    Write-Host ("$($e): FOUND")
  } else {
    Write-Host ("$($e): MISSING")
  }
}
Write-Host ("Total videos: " + $titles.Count)
