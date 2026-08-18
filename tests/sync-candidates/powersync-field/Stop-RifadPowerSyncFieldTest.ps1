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

foreach ($pidValue in @($state.backendPid, $state.webPid)) {
  if ($pidValue) {
    Stop-Process -Id ([int]$pidValue) -Force -ErrorAction SilentlyContinue
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
