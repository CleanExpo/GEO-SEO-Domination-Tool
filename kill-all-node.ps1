Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
$remaining = Get-Process node -ErrorAction SilentlyContinue
if ($remaining) {
    Write-Host "Still running: $($remaining.Count) processes"
} else {
    Write-Host "All node processes killed successfully"
}
