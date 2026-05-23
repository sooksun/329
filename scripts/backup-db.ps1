# Backup MySQL database for 329 MIS (Laragon / Windows)
param(
  [string]$BackupDir = $env:BACKUP_DIR
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env"

if (-not $BackupDir) { $BackupDir = Join-Path $root "storage\backups" }
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

function Read-EnvValue([string]$key) {
  if (-not (Test-Path $envFile)) { return $null }
  foreach ($line in Get-Content $envFile) {
    if ($line -match "^\s*$key\s*=\s*(.+)\s*$") {
      return $Matches[1].Trim().Trim('"')
    }
  }
  return $null
}

$dbUrl = Read-EnvValue "DATABASE_URL"
if (-not $dbUrl) { throw "DATABASE_URL not found in .env" }

# mysql://user:pass@host:port/dbname
if ($dbUrl -notmatch "^mysql://([^:@/]*):?([^@/]*)@([^:/]+):?(\d+)?/(.+)$") {
  throw "Unsupported DATABASE_URL format. Expected mysql://user:pass@host:port/dbname"
}

$dbUser = $Matches[1]
$dbPass = $Matches[2]
$dbHost = $Matches[3]
$dbPort = if ($Matches[4]) { $Matches[4] } else { "3306" }
$dbName = $Matches[5]

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outFile = Join-Path $BackupDir "$dbName-$timestamp.sql"

function Find-Mysqldump {
  $cmd = Get-Command mysqldump -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  $roots = @(
    $env:LARAGON_ROOT,
    "D:\laragon",
    "C:\laragon",
    (Split-Path -Parent (Split-Path -Parent $root))
  ) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique

  foreach ($laragonRoot in $roots) {
    $mysqlRoot = Join-Path $laragonRoot "bin\mysql"
    if (-not (Test-Path $mysqlRoot)) { continue }
    $found = Get-ChildItem -Path $mysqlRoot -Recurse -Filter "mysqldump.exe" -ErrorAction SilentlyContinue |
      Select-Object -First 1 -ExpandProperty FullName
    if ($found) { return $found }
  }

  throw "mysqldump not found. Add Laragon MySQL bin to PATH or set LARAGON_ROOT."
}

$mysqldump = Find-Mysqldump

$argList = @("-h", $dbHost, "-P", $dbPort, "-u", $dbUser, "--result-file=$outFile", $dbName)
if ($dbPass) { $argList = @("-h", $dbHost, "-P", $dbPort, "-u", $dbUser, "-p$dbPass", "--result-file=$outFile", $dbName) }

& $mysqldump @argList
if ($LASTEXITCODE -ne 0) { throw "mysqldump failed with exit code $LASTEXITCODE" }

Write-Host "Backup saved: $outFile"
