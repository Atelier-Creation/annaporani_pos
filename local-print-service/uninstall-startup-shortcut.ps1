$StartupDir = [Environment]::GetFolderPath("Startup")
$LauncherPath = Join-Path $StartupDir "DUCH Local Print Service.cmd"

if (Test-Path $LauncherPath) {
  Remove-Item -LiteralPath $LauncherPath -Force
  Write-Host "Removed startup launcher: $LauncherPath"
} else {
  Write-Host "Startup launcher not found."
}
