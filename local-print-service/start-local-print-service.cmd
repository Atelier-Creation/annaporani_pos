@echo off
setlocal
cd /d "%~dp0"
if "%THERMAL_PRINTER_NAME%"=="" set "THERMAL_PRINTER_NAME=80mm Series Printer"
if "%LOCAL_PRINT_PORT%"=="" set "LOCAL_PRINT_PORT=9123"
npm start
