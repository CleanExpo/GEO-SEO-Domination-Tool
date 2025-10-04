$ErrorActionPreference='Stop'
param(
  [Parameter(Mandatory=$true)][string]$Repo,      # e.g. yourorg/yourrepo
  [Parameter(Mandatory=$true)][string]$Version,   # e.g. v1.0.0
  [string]$PrevTag                                # optional override
)

function Get-GitHubToken {
  if ($env:GITHUB_TOKEN) { return $env:GITHUB_TOKEN }
  try {
    $val = geo secrets --get github_token 2>$null
    if ($LASTEXITCODE -eq 0 -and $val) { return $val }
  } catch {}
  throw 'Missing GitHub token. Set GITHUB_TOKEN env or run: geo secrets --set github_token=...'
}

# Determine previous tag if not provided
if (-not $PrevTag) {
  try { $PrevTag = (git describe --tags --abbrev=0) } catch { $PrevTag = $null }
}

$Token = Get-GitHubToken
$Headers = @{ Authorization = "Bearer $Token"; Accept = 'application/vnd.github+json' }
$Body = @{ tag_name = $Version };
if ($PrevTag) { $Body.previous_tag_name = $PrevTag }

$Uri = "https://api.github.com/repos/$Repo/releases/generate-notes"
$Resp = Invoke-RestMethod -Method Post -Uri $Uri -Headers $Headers -Body ($Body | ConvertTo-Json) -ContentType 'application/json'

# Save to docs/RELEASE_NOTES.md
$OutFile = Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..' '..')) 'docs/RELEASE_NOTES.md'
Set-Content -Path $OutFile -Value ("# " + $Resp.name + "`n`n" + $Resp.body) -NoNewline
Write-Host "✓ Generated notes → $OutFile" -ForegroundColor Green
