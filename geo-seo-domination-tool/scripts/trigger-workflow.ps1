# Trigger the Auto Merge Release (Staged) workflow via GitHub API
# Requires: gh CLI installed and authenticated

param(
    [string]$Branch = "main"
)

Write-Host "Triggering Auto Merge Release (Staged) workflow on branch: $Branch" -ForegroundColor Cyan

try {
    # Use GitHub CLI to trigger the workflow
    gh workflow run "auto-merge-release.yml" --ref $Branch

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Workflow triggered successfully!" -ForegroundColor Green
        Write-Host "View status: gh run list --workflow=auto-merge-release.yml" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Failed to trigger workflow" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    Write-Host "Make sure gh CLI is installed and authenticated: gh auth login" -ForegroundColor Yellow
    exit 1
}
