param(
  [string]$PrinterName = "80mm Series Printer",
  [string]$TaskName = "DUCH Local Print Service",
  [int]$Port = 9123
)

$ErrorActionPreference = "Stop"
$ServiceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$StartScript = Join-Path $ServiceDir "start-local-print-service.cmd"

function Ensure-Node {
  $node = Get-Command node -ErrorAction SilentlyContinue
  $npm = Get-Command npm -ErrorAction SilentlyContinue
  if ($node -and $npm) {
    Write-Host "Node.js found: $($node.Source)"
    return
  }

  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $winget) {
    throw "Node.js is not installed and winget is not available. Install Node.js LTS from https://nodejs.org, then run this script again."
  }

  Write-Host "Installing Node.js LTS with winget..."
  winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements

  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js install finished, but node is not available in this session. Restart PowerShell and run this script again."
  }
}

Ensure-Node

if (-not (Test-Path $StartScript)) {
  throw "Missing start script: $StartScript"
}

Write-Host "Installing local print service dependencies..."
Push-Location $ServiceDir
npm install
Pop-Location

Write-Host "Registering scheduled task: $TaskName"
$quotedScript = '"' + $StartScript + '"'
$actionArgs = "/c set THERMAL_PRINTER_NAME=$PrinterName&& set LOCAL_PRINT_PORT=$Port&& $quotedScript"
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument $actionArgs -WorkingDirectory $ServiceDir
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Days 999)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null

Write-Host "Starting local print service..."
Start-ScheduledTask -TaskName $TaskName
Start-Sleep -Seconds 3

try {
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/health" -TimeoutSec 5
  Write-Host "Local print service is running: $($health.service)"
  Write-Host "Default printer: $($health.default_printer)"
} catch {
  Write-Warning "Scheduled task was created, but health check failed. Open Task Scheduler and check '$TaskName'."
}

Write-Host "Done."
