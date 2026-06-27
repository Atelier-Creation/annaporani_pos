# DUCH Local Print Service

This service runs on each cashier computer and prints raw ESC/POS receipts to the local Windows thermal printer.

## Setup

No-admin startup launcher:

```powershell
cd D:\Atelaier\dutch_billing\local-print-service
.\install-startup-shortcut.ps1 -PrinterName "80mm Series Printer"
```

Scheduled task installer, run PowerShell as Administrator:

```powershell
cd D:\Atelaier\dutch_billing\local-print-service
.\install-windows-task.ps1 -PrinterName "80mm Series Printer"
```

The billing web app connects to:

```text
http://127.0.0.1:9123
```

## Endpoints

- `GET /health`
- `GET /printers`
- `POST /print`

`POST /print` body:

```json
{
  "printer_name": "80mm Series Printer",
  "receipt_text": "ESC/POS text"
}
```
