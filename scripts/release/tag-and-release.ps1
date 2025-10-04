$ErrorActionPreference='Stop'
param(
  [Parameter(Mandatory=$true)][string]$Repo,     # yourorg/yourrepo
  [Parameter(Mandatory=$true)][string]$Version,  # v1.0.0
  [string]$PrevTag,
  [switch]$Draft,
  [string]$Target='main'
)

function Get-GitHubToken {
  if ($env:GITHUB_TOKEN) { return $env:GITHUB_TOKEN }
  try { $val = geo secrets --get github_token 2>$null; if ($LASTEXITCODE -eq 0 -and $val) { return $val } } catch {}
  throw 'Missing GitHub token. Set GITHUB_TOKEN env or run: geo secrets --set github_token=...'
}

# Ensure clean working tree
$Status = git status --porcelain
if ($Status) { throw 'Working tree not clean. Commit or stash changes before releasing.' }

# Generate notes
& pwsh (Join-Path $PSScriptRoot 'generate-notes.ps1') -Repo $Repo -Version $Version -PrevTag $PrevTag
$NotesPath = Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..' '..')) 'docs/RELEASE_NOTES.md'
$Notes = Get-Content $NotesPath -Raw

# Create annotated tag locally
Write-Host "▶ Tagging $Version" -ForegroundColor Cyan
& git tag -a $Version -m "Release $Version" | Out-Null
& git push origin $Version | Out-Null

# Create GitHub Release
$Token = Get-GitHubToken
$Headers = @{ Authorization = "Bearer $Token"; Accept = 'application/vnd.github+json' }
$Body = @{ tag_name=$Version; target_commitish=$Target; name=$Version; body=$Notes; draft=[bool]$Draft }
$Uri = "https://api.github.com/repos/$Repo/releases"
$Resp = Invoke-RestMethod -Method Post -Uri $Uri -Headers $Headers -Body ($Body | ConvertTo-Json -Depth 5) -ContentType 'application/json'

Write-Host ("✓ Release created: " + $Resp.html_url) -ForegroundColor Green
