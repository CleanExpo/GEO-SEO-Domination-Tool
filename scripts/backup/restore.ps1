$ErrorActionPreference='Stop'
param(
  [ValidateSet('sqlite','postgres')] [string]$Target = 'sqlite',
  [string]$SqlitePath = 'database/app.db',
  [Parameter(Mandatory=$true)] [string]$BackupPath
)

$root = Resolve-Path (Join-Path $PSScriptRoot '..' '..')

if ($Target -eq 'sqlite') {
  if (!(Test-Path $BackupPath)) { throw "Backup not found: $BackupPath" }
  Add-Type -AssemblyName 'System.IO.Compression.FileSystem'
  $tmp = Join-Path $env:TEMP "sqlite-restore-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
  New-Item -ItemType Directory -Force -Path $tmp | Out-Null
  [System.IO.Compression.ZipFile]::ExtractToDirectory($BackupPath, $tmp, $true)
  $db = Join-Path $root $SqlitePath
  New-Item -ItemType Directory -Force -Path (Split-Path $db -Parent) | Out-Null
  Copy-Item (Get-ChildItem $tmp | Select-Object -First 1).FullName $db -Force
  Remove-Item $tmp -Recurse -Force
  Write-Host "✓ SQLite restored → $db"
  exit 0
}

if ($Target -eq 'postgres') {
  if (!(Test-Path $BackupPath)) { throw "Backup not found: $BackupPath" }
  if (-not (Get-Command psql -ErrorAction SilentlyContinue)) { throw 'psql not found in PATH' }
  $cmd = @()
  if ($BackupPath.EndsWith('.gz')) {
    if (-not (Get-Command gzip -ErrorAction SilentlyContinue)) { throw 'gzip not found in PATH for .gz restore' }
    $cmd = @('bash','-lc',"gzip -dc '$BackupPath' | psql -h '${env:PGHOST}' -p '${env:PGPORT}' -U '${env:PGUSER}' '${env:PGDATABASE}'")
  } else {
    $cmd = @('psql','-h',($env:PGHOST),'-p',($env:PGPORT),'-U',($env:PGUSER),($env:PGDATABASE),'-f',$BackupPath)
  }
  & $cmd[0] $cmd[1..($cmd.Length-1)]
  Write-Host '✓ Postgres restore complete'
  exit 0
}
