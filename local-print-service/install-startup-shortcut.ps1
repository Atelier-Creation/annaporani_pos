param(
  [string]$PrinterName = "80mm Series Printer",
  [int]$Port = 9123
)

$ErrorActionPreference = "Stop"
$ServiceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$StartupDir = [Environment]::GetFolderPath("Startup")
$LauncherPath = Join-Path $StartupDir "DUCH Local Print Service.cmd"
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

Push-Location $ServiceDir
npm install
Pop-Location

@"
@echo off
set "THERMAL_PRINTER_NAME=$PrinterName"
set "LOCAL_PRINT_PORT=$Port"
call "$StartScript"
"@ | Set-Content -Path $LauncherPath -Encoding ASCII

Start-Process -FilePath $LauncherPath -WindowStyle Hidden
Start-Sleep -Seconds 3

try {
  Invoke-RestMethod -Uri "http://127.0.0.1:$Port/health" -TimeoutSec 5 | Out-Null
  Write-Host "Startup launcher installed and local print service is running."
} catch {
  Write-Warning "Startup launcher installed, but health check failed. It will try again next login."
}

Write-Host "Launcher: $LauncherPath"
