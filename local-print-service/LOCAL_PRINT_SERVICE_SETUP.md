# Local Thermal Printer Setup

This project uses a cloud frontend/backend plus a small local print service on each cashier computer.

## Why This Is Needed

When the app is deployed on DigitalOcean, the cloud backend cannot access a USB thermal printer connected to a shop computer. The browser also cannot silently print to a local printer.

So the setup is:

```text
Cloud frontend/backend -> cashier browser -> http://127.0.0.1:9123 -> local USB thermal printer
```

The local service runs only on the cashier computer.

## What To Deploy On DigitalOcean

Deploy these as usual:

- `frontend`
- `backend`

Do not deploy `local-print-service` to DigitalOcean. It must run on each billing/cashier Windows computer.

## Cashier Computer Requirements

- Windows computer
- Thermal printer installed in Windows
- Node.js LTS installed, or allow the installer script to install it with `winget`
- Printer name visible in Windows, for example:

```text
80mm Series Printer
```

## Install Local Print Service

Copy the `local-print-service` folder to the cashier computer.

Open PowerShell in that folder and run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\install-startup-shortcut.ps1 -PrinterName "80mm Series Printer"
```

This will:

- install Node.js LTS if missing and `winget` is available
- run `npm install`
- create a Windows Startup launcher
- start the print service immediately

The service will start automatically when the Windows user logs in.

## Verify Service

Open this URL in the cashier computer browser:

```text
http://127.0.0.1:9123/health
```

Expected result:

```json
{
  "ok": true,
  "service": "DUCH Local Print Service",
  "default_printer": "80mm Series Printer"
}
```

Check printers:

```text
http://127.0.0.1:9123/printers
```

## Configure In The Web App

In the deployed billing app:

1. Go to `Settings`.
2. Open the `Printer` tab.
3. Click `Check Service`.
4. Click `Find Local Printers`.
5. Select or type the printer name.
6. Click `Save Printer`.
7. Click `Print Test`.

The saved printer name is stored in that browser/computer only.

## Daily Use

On `/billing/add`, after products are added and the user clicks `Add Bill`:

- bill is saved to the cloud backend
- receipt is sent to the local print service
- local print service prints silently to the thermal printer
- no receipt preview page is opened

## Startup Behavior

The no-admin installer creates:

```text
%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\DUCH Local Print Service.cmd
```

This starts the service after Windows login.

If you prefer Task Scheduler, run PowerShell as Administrator:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\install-windows-task.ps1 -PrinterName "80mm Series Printer"
```

## Uninstall

Remove Startup launcher:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\uninstall-startup-shortcut.ps1
```

Remove Scheduled Task:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\uninstall-windows-task.ps1
```

## DigitalOcean Notes

Your DigitalOcean frontend must call the local print service from the user's browser:

```text
http://127.0.0.1:9123
```

This is expected. The request is made by the cashier browser, not by the cloud server.

If your frontend is served over HTTPS, some browsers may block HTTP localhost requests depending on policy. Usually `localhost` and `127.0.0.1` are allowed as secure local origins, but test this after deployment.

If needed, set the frontend env var:

```env
VITE_LOCAL_PRINT_URL=http://127.0.0.1:9123
```

Then rebuild/redeploy the frontend.

## Troubleshooting

### Print service not running

Open:

```text
http://127.0.0.1:9123/health
```

If it fails, run:

```powershell
cd path\to\local-print-service
npm start
```

### Printer not found

Open:

```text
http://127.0.0.1:9123/printers
```

Use the exact printer name shown there in Settings.

### Bill saves but does not print

Check:

- local print service is running
- printer is powered on
- printer name is saved in Settings
- Windows test page prints
- thermal printer is not paused/offline in Windows

### CORS issue

The local service allows browser requests using CORS. If the deployed app cannot connect, check browser console and firewall settings.

### Windows Firewall

The service listens only on:

```text
127.0.0.1:9123
```

It is not exposed to the network. Usually no firewall rule is needed.

## Files

- `local-print-service/server.js`
- `local-print-service/install-startup-shortcut.ps1`
- `local-print-service/install-windows-task.ps1`
- `local-print-service/start-local-print-service.cmd`
- `frontend/src/billing/service/localPrintService.js`
