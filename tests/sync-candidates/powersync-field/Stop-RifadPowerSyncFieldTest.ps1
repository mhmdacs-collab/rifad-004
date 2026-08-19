param(
  [switch]$RemoveData
)

$ErrorActionPreference = 'Continue'
$ProofDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$StateFile = Join-Path $ProofDir '.field-test-state.json'

if (-not (Test-Path $StateFile)) {
  Write-Warning 'No field-test state file found. Nothing to stop from this proof kit.'
  exit 0
}

$state = Get-Content -Raw $StateFile | ConvertFrom-Json

# Start-RifadPowerSyncFieldTest.ps1 launches backend/Vite through cmd.exe /k.
# Stopping only the recorded cmd.exe PID can orphan the child node.exe process,
# leaving ports 8787/4173 occupied on the next run. Kill the whole Windows
# process tree rooted at each recorded launcher PID instead.
foreach ($pidValue in @($state.backendPid, $state.webPid)) {
  if ($pidValue) {
    & taskkill.exe /PID ([string][int]$pidValue) /T /F 2>$null | Out-Null
  }
}

$composeArgs = @('compose', '-p', [string]$state.composeProject, '--env-file', [string]$state.dockerEnv, '-f', [string]$state.composeFile, 'down', '--remove-orphans')
if ($RemoveData) {
  $composeArgs += '-v'
}
& docker @composeArgs

foreach ($port in 4173, 8787, 8080) {
  $ruleName = "Rifad Sync Field Proof $port"
  Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue | Remove-NetFirewallRule -ErrorAction SilentlyContinue
}

Remove-Item $StateFile -Force -ErrorAction SilentlyContinue
Write-Host 'Rifad PowerSync field proof stopped.'
if ($RemoveData) {
  Write-Host 'The isolated proof Docker volumes were also removed.'
}
