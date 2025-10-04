param(
  [string]$BaseUrl = 'http://localhost:8080',
  [int]$TimeoutMs = 5000
)
$ErrorActionPreference='Stop'

function Post-Uptime($payload) {
  try {
    $uri = 'http://localhost:3004/api/uptime'
    Invoke-RestMethod -Method POST -Uri $uri -ContentType 'application/json' -Body ($payload | ConvertTo-Json) | Out-Null
  } catch {}
}

$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
  $resp = Invoke-WebRequest -Uri "$BaseUrl/api/health" -TimeoutSec ([math]::Ceiling($TimeoutMs/1000)) -ErrorAction Stop
  $sw.Stop()
  Post-Uptime @{ ok = $true; ms = $sw.ElapsedMilliseconds; code = $resp.StatusCode }
  Write-Host ("[OK] UP in {0} ms (HTTP {1})" -f $sw.ElapsedMilliseconds, $resp.StatusCode) -ForegroundColor Green
  exit 0
} catch {
  $sw.Stop()
  $code = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { $null }
  Post-Uptime @{ ok = $false; ms = $sw.ElapsedMilliseconds; code = $code; err = ($_.Exception.Message) }
  Write-Host ("[FAIL] DOWN in {0} ms ({1})" -f $sw.ElapsedMilliseconds, ($_.Exception.Message)) -ForegroundColor Red
  exit 1
}
