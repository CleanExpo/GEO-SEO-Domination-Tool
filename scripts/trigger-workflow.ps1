$ErrorActionPreference = 'Stop'
<#!
Usage examples:
  # Quick (prompts for repo if missing)
  powershell -ExecutionPolicy Bypass -File scripts/trigger-workflow.ps1

  # Fully specified
  powershell -ExecutionPolicy Bypass -File scripts/trigger-workflow.ps1 -Repo "YOUR_ORG/YOUR_REPO" -ReleaseBranch "release/geo-mcp-v1" -TargetBranch "main"

#>
param(
  [string]$Repo,
  [string]$ReleaseBranch = 'release/geo-mcp-v1',
  [string]$TargetBranch = 'main',
  [string]$Branches = @'
feature/build-system-fix
feature/mcp-call-runner-fix
feature/mcp-server-core
feature/selective-apply-from-diff
feature/rollback-from-backups
feature/blueprint-saas-starter
feature/autolink-after-apply
feature/redis-workers-scale
feature/supabase-auth-starter
feature/role-guards-admin-ui
feature/api-role-guards
feature/oauth-providers
feature/stripe-billing-starter
feature/post-blueprint-autolink-deploy
feature/deploy-runner
feature/remote-ssh-deploy
feature/release-guardrails
feature/merge-queue
'@
)

# --- Safety: ExecutionPolicy + Unblock ---
try { Unblock-File -Path $PSCommandPath -ErrorAction SilentlyContinue } catch {}
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

# --- Prereqs: gh CLI ---
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "GitHub CLI (gh) not found. Install from https://cli.github.com and retry."; exit 1
}

# --- Repo selection ---
if (-not $Repo -or $Repo -match 'YOUR_ORG/YOUR_REPO') {
  $Repo = Read-Host -Prompt "Enter GitHub repo as ORG/REPO (e.g., myorg/myrepo)"
}

# --- Auth check ---
try {
  gh auth status -R $Repo | Out-Null
} catch {
  Write-Host "You are not logged in to GitHub CLI for $Repo. Opening login…" -ForegroundColor Yellow
  gh auth login
}

# --- Verify repo access ---
try {
  gh repo view -R $Repo 1>$null
} catch {
  Write-Error "Cannot view $Repo. Ensure the repo exists and your token has access."; exit 1
}

# --- Trim branches list ---
$branchList = ($Branches -split "`n") | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
if ($branchList.Count -eq 0) { Write-Error "No feature branches supplied."; exit 1 }

# --- Dispatch workflow ---
Write-Host "Dispatching 'Auto Merge Release (Staged)'…" -ForegroundColor Cyan
$inputs = @(
  "-f", "release_branch=$ReleaseBranch",
  "-f", "target_branch=$TargetBranch",
  "-f", "branches=$($branchList -join "`n")"
)

# Run from anywhere (no need to be in repo folder)
$proc = Start-Process gh -NoNewWindow -PassThru -Wait -ArgumentList @("workflow","run","Auto Merge Release (Staged)","-R",$Repo) + $inputs

if ($proc.ExitCode -ne 0) { Write-Error "Workflow dispatch failed (exit $($proc.ExitCode))."; exit $proc.ExitCode }

Write-Host "✓ Workflow dispatched. Open GitHub → Actions → Auto Merge Release (Staged) to monitor." -ForegroundColor Green
