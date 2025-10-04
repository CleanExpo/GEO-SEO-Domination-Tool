$ErrorActionPreference = 'Stop'
# Usage:
#   $env:GITHUB_TOKEN = 'ghp_...'
#   ./scripts/protect-branches.ps1 -Owner 'your-org' -Repo 'your-repo'
param(
  [Parameter(Mandatory=$true)][string]$Owner,
  [Parameter(Mandatory=$true)][string]$Repo
)
if (-not $env:GITHUB_TOKEN) { throw 'Set GITHUB_TOKEN env var with repo admin scope' }
$Headers = @{ Authorization = "token $($env:GITHUB_TOKEN)"; Accept = 'application/vnd.github+json' }
$Body = {
  param($contexts)
  return @{
    required_status_checks = @{ strict = $true; contexts = $contexts }
    enforce_admins = $true
    required_pull_request_reviews = @{ required_approving_review_count = 1; require_code_owner_reviews = $false; dismiss_stale_reviews = $true }
    restrictions = $null
    allow_deletions = $false
    allow_force_pushes = $false
    block_creations = $false
    required_linear_history = $true
    required_conversation_resolution = $true
    lock_branch = $false
    allow_fork_syncing = $true
  } | ConvertTo-Json -Depth 5
}
function ProtectBranch([string]$branch){
  $url = "https://api.github.com/repos/$Owner/$Repo/branches/$branch/protection"
  $contexts = @('build') # matches job name in release-pr.yml
  $json = & $Body $contexts
  Invoke-RestMethod -Method PUT -Headers $Headers -Uri $url -Body $json
  Write-Host "✓ Protected $branch"
}
ProtectBranch 'main'
ProtectBranch 'release/geo-mcp-v1'
