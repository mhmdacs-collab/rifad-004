param(
  [switch]$Reset
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2.0

$ProofDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$StateFile = Join-Path $ProofDir '.field-test-state.json'
$PowerSyncCliCommit = '0eaf3629fb5f7e2ad9d0b70142004aaabab0a7a3'
$PowerSyncImage = 'journeyapps/powersync-service@sha256:0fc9f65e693c07f1206007acddb87141402c09ef20589e29a0dfe20d57ce80b6'
$AuthKey = 'ZGV2LXNoYXJlZC1zZWNyZXQtZm9yLWRlbW8tb25seS0zMmI'
$ComposeProject = 'rifad-powersync-field'

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing prerequisite: $Name"
  }
}

function Write-Utf8NoBom([string]$Path, [string]$Content) {
  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Wait-Http([string]$Url, [int]$Seconds = 120) {
  $deadline = (Get-Date).AddSeconds($Seconds)
  do {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 3
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) { return }
    } catch {
      Start-Sleep -Seconds 2
    }
  } while ((Get-Date) -lt $deadline)
  throw "Timed out waiting for $Url"
}

function Get-LanIPv4 {
  $candidate = Get-NetIPConfiguration |
    Where-Object { $_.IPv4DefaultGateway -and $_.IPv4Address } |
    ForEach-Object { $_.IPv4Address.IPAddress } |
    Where-Object { $_ -and $_ -notlike '169.254.*' -and $_ -ne '127.0.0.1' } |
    Select-Object -First 1
  if (-not $candidate) { throw 'Could not determine the Windows 11 LAN IPv4 address.' }
  return $candidate
}

Require-Command git
Require-Command docker
Require-Command node
Require-Command npm

if (-not (docker info 2>$null)) {
  throw 'Docker is installed but not running. Start Docker Desktop, then run this script again.'
}

docker compose version | Out-Host

$LanIp = Get-LanIPv4
$WorkRoot = Join-Path $env:LOCALAPPDATA 'Rifad\sync-field-proof'
$CliRoot = Join-Path $WorkRoot 'powersync-cli'
$Example = Join-Path $CliRoot 'examples\self-hosted\local-postgres-node'
$DockerDir = Join-Path $Example 'powersync\docker'
$ComposeFile = Join-Path $DockerDir 'docker-compose.yaml'

New-Item -ItemType Directory -Path $WorkRoot -Force | Out-Null

if (-not (Test-Path (Join-Path $CliRoot '.git'))) {
  Write-Host 'Cloning pinned official PowerSync CLI proof source...'
  git clone --no-checkout https://github.com/powersync-ja/powersync-cli.git $CliRoot
}

git -C $CliRoot fetch --depth 1 origin $PowerSyncCliCommit
git -C $CliRoot checkout --force $PowerSyncCliCommit

Copy-Item (Join-Path $Example '.env.example') (Join-Path $Example '.env') -Force

$dockerEnv = @"
PS_DATABASE_NAME=postgres
PS_DATABASE_PASSWORD=changeme
PS_DATABASE_PORT=5432
PS_DATABASE_USER=postgres
PS_DATA_SOURCE_URI=postgresql://postgres:changeme@pg-db:5432/postgres
PS_STORAGE_DATABASE=powersync_storage
PS_STORAGE_PASSWORD=changeme
PS_STORAGE_PORT=5433
PS_STORAGE_USER=postgres
PS_STORAGE_SOURCE_URI=postgresql://postgres:changeme@pg-storage:5433/powersync_storage
PS_CLIENT_AUTH_KEY=$AuthKey
PS_PORT=8080
"@
Write-Utf8NoBom (Join-Path $DockerDir '.env') $dockerEnv

$schemaSql = @'
CREATE TABLE IF NOT EXISTS catalog_items (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price_minor BIGINT NOT NULL,
  metadata_json TEXT
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  business_id TEXT NOT NULL UNIQUE,
  total_minor BIGINT NOT NULL,
  completed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_upload_dedupe (
  device_id TEXT NOT NULL,
  client_op_id TEXT NOT NULL,
  PRIMARY KEY (device_id, client_op_id)
);

ALTER TABLE catalog_items REPLICA IDENTITY FULL;
ALTER TABLE sales REPLICA IDENTITY FULL;
'@
Write-Utf8NoBom (Join-Path $DockerDir 'modules\database-postgres\init-scripts\00-schema.sql') $schemaSql
Write-Utf8NoBom (Join-Path $DockerDir 'modules\database-postgres\init-scripts\02-seed.sql') ''

$syncConfig = @'
config:
  edition: 3
streams:
  global:
    auto_subscribe: true
    queries:
      - SELECT * FROM catalog_items
      - SELECT * FROM sales
'@
Write-Utf8NoBom (Join-Path $Example 'powersync\sync-config.yaml') $syncConfig

$composeText = [System.IO.File]::ReadAllText($ComposeFile)
$composeText = $composeText.Replace('journeyapps/powersync-service:latest', $PowerSyncImage)
Write-Utf8NoBom $ComposeFile $composeText

if ($Reset) {
  Write-Host 'Resetting only the isolated Rifad field-proof Docker volumes...'
  docker compose -p $ComposeProject --env-file (Join-Path $DockerDir '.env') -f $ComposeFile down -v --remove-orphans 2>$null | Out-Host
}

Write-Host 'Starting PostgreSQL + PowerSync service...'
docker compose -p $ComposeProject --env-file (Join-Path $DockerDir '.env') -f $ComposeFile up -d
Wait-Http 'http://127.0.0.1:8080/probes/liveness' 150

Push-Location $ProofDir
try {
  Write-Host 'Installing pinned field-proof dependencies...'
  npm install --ignore-scripts=false
  Write-Host 'Building the browser client for the Windows 8 compatibility target...'
  npm run build
} finally {
  Pop-Location
}

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin) {
  foreach ($port in 4173, 8787, 8080) {
    $ruleName = "Rifad Sync Field Proof $port"
    if (-not (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {
      New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $port -Profile Private | Out-Null
    }
  }
} else {
  Write-Warning 'PowerShell is not running as Administrator. The Windows 8 device may be blocked by Windows Firewall. Re-run as Administrator if the second device cannot connect.'
}

$env:POWERSYNC_URL = "http://${LanIp}:8080"
$env:PG_URL = 'postgresql://postgres:changeme@127.0.0.1:5432/postgres'
$env:PS_CLIENT_AUTH_KEY = $AuthKey
$env:RIFAD_PROOF_API_PORT = '8787'
$env:RIFAD_BIND_HOST = '0.0.0.0'
$env:RIFAD_FIELD_API_URL = "http://${LanIp}:8787"
$env:RIFAD_FIELD_DEVICE_ID = 'win11-native'

Write-Host 'Starting Rifad proof API and browser client host...'
$backendProcess = Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', 'node backend.mjs' -WorkingDirectory $ProofDir -PassThru
$webProcess = Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', 'npm run dev' -WorkingDirectory $ProofDir -PassThru

$state = [ordered]@{
  backendPid = $backendProcess.Id
  webPid = $webProcess.Id
  lanIp = $LanIp
  composeProject = $ComposeProject
  composeFile = $ComposeFile
  dockerEnv = (Join-Path $DockerDir '.env')
  startedAt = (Get-Date).ToString('o')
}
Write-Utf8NoBom $StateFile ($state | ConvertTo-Json)

Wait-Http 'http://127.0.0.1:8787/health' 60
Wait-Http 'http://127.0.0.1:4173/' 60

Write-Host ''
Write-Host 'Running the automatic Windows 11 native live-service proof...' -ForegroundColor Cyan
Push-Location $ProofDir
try {
  node native-proof.mjs
  if ($LASTEXITCODE -ne 0) { throw "native-proof.mjs failed with exit code $LASTEXITCODE" }
} finally {
  Pop-Location
}

$Win11Url = "http://${LanIp}:4173/?device=win11-web"
$Win8Url = "http://${LanIp}:4173/?device=win8"

Write-Host ''
Write-Host 'FIELD KIT READY' -ForegroundColor Green
Write-Host "Windows 11 browser: $Win11Url"
Write-Host "Windows 8 second device: $Win8Url"
Write-Host "PowerSync service: http://${LanIp}:8080"
Write-Host "Rifad proof API: http://${LanIp}:8787"
Write-Host ''
Write-Host 'Keep this PowerShell/Docker session running during the two-device test.'
Write-Host 'Stop later with: .\Stop-RifadPowerSyncFieldTest.ps1'

Start-Process $Win11Url
