param(
  [ValidateSet('sqlite','postgres')]
  [string]$Target = 'sqlite',
  [string]$SqlitePath = 'database/app.db'
)
$ErrorActionPreference='Stop'

$root = Resolve-Path (Join-Path (Join-Path $PSScriptRoot '..') '..')
$backupDir = Join-Path $root 'server/backups'
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

if ($Target -eq 'sqlite') {
  $db = Join-Path $root $SqlitePath
  if (!(Test-Path $db)) { throw "SQLite file not found: $db" }
  $ts = Get-Date -Format 'yyyyMMdd-HHmmss'
  $zip = Join-Path $backupDir "sqlite-$ts.zip"
  Add-Type -AssemblyName 'System.IO.Compression.FileSystem'
  $tmp = Join-Path $env:TEMP "sqlite-backup-$ts"
  New-Item -ItemType Directory -Force -Path $tmp | Out-Null
  Copy-Item $db (Join-Path $tmp (Split-Path $db -Leaf))
  [System.IO.Compression.ZipFile]::CreateFromDirectory($tmp, $zip)
  Remove-Item $tmp -Recurse -Force
  Write-Host "✓ SQLite backup: $zip"
  exit 0
}

if ($Target -eq 'postgres') {
  $ts = Get-Date -Format 'yyyyMMdd-HHmmss'
  $out = Join-Path $backupDir "postgres-$ts.sql.gz"
  if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) { throw 'pg_dump not found in PATH' }
  $pgArgs = @('-h', ($env:PGHOST ? $env:PGHOST : 'localhost'), '-p', ($env:PGPORT ? $env:PGPORT : '5432'), '-U', ($env:PGUSER ? $env:PGUSER : 'postgres'), ($env:PGDATABASE ? $env:PGDATABASE : 'postgres'))
  $p = Start-Process -FilePath 'pg_dump' -ArgumentList $pgArgs -NoNewWindow -RedirectStandardOutput -PassThru
  $p | Wait-Process
  # Use gzip if available
  if (Get-Command gzip -ErrorAction SilentlyContinue) {
    & pg_dump @pgArgs | gzip > $out
  } else {
    $tmp = Join-Path $backupDir "postgres-$ts.sql"
    & pg_dump @pgArgs > $tmp
    Add-Type -AssemblyName 'System.IO.Compression.FileSystem'
    [System.IO.Compression.ZipFile]::CreateFromDirectory((Split-Path $tmp -Parent), "$tmp.gz")
    Remove-Item $tmp -Force
  }
  Write-Host "✓ Postgres backup: $out"
  exit 0
}
