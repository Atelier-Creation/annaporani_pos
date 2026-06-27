import { execFile } from "child_process";
import express from "express";
import cors from "cors";
import fs from "fs/promises";
import os from "os";
import path from "path";

const app = express();
const port = Number(process.env.LOCAL_PRINT_PORT || 9123);
const defaultPrinter = process.env.THERMAL_PRINTER_NAME || "";

app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

const rawPrinterScript = String.raw`
param(
  [Parameter(Mandatory=$true)][string]$PrinterName,
  [Parameter(Mandatory=$true)][string]$DataPath
)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class RawPrinterHelper
{
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
  public class DOCINFOA
  {
    [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
  }

  [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
  public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);

  [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
  public static extern bool ClosePrinter(IntPtr hPrinter);

  [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
  public static extern bool StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

  [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);

  [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);

  [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);

  [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
  public static extern bool WritePrinter(IntPtr hPrinter, byte[] pBytes, Int32 dwCount, out Int32 dwWritten);

  public static void SendBytesToPrinter(string printerName, byte[] bytes)
  {
    IntPtr hPrinter;
    DOCINFOA di = new DOCINFOA();
    di.pDocName = "DUCH Thermal Receipt";
    di.pDataType = "RAW";

    if (!OpenPrinter(printerName.Normalize(), out hPrinter, IntPtr.Zero)) {
      throw new Exception("Unable to open printer: " + printerName);
    }

    try {
      if (!StartDocPrinter(hPrinter, 1, di)) throw new Exception("Unable to start print document.");
      if (!StartPagePrinter(hPrinter)) throw new Exception("Unable to start print page.");
      int written;
      if (!WritePrinter(hPrinter, bytes, bytes.Length, out written)) throw new Exception("Unable to write to printer.");
      EndPagePrinter(hPrinter);
      EndDocPrinter(hPrinter);
    }
    finally {
      ClosePrinter(hPrinter);
    }
  }
}
"@

[byte[]]$bytes = [System.IO.File]::ReadAllBytes($DataPath)
[RawPrinterHelper]::SendBytesToPrinter($PrinterName, $bytes)
`;

const runPowerShell = (args, timeout = 30000) =>
  new Promise((resolve, reject) => {
    execFile("powershell.exe", args, { windowsHide: true, timeout }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || stdout || error.message));
        return;
      }
      resolve(stdout);
    });
  });

const listPrinters = async () => {
  const output = await runPowerShell([
    "-NoProfile",
    "-Command",
    "Get-CimInstance Win32_Printer | Select-Object Name,Default | ConvertTo-Json -Compress",
  ], 15000);

  const parsed = JSON.parse(output || "[]");
  return (Array.isArray(parsed) ? parsed : [parsed]).map((printer) => ({
    name: printer.Name,
    default: Boolean(printer.Default),
  }));
};

const sendRawToPrinter = async (printerName, receiptText) => {
  if (!printerName) {
    throw new Error("Printer name is required");
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "duch-local-print-"));
  const dataPath = path.join(tempDir, "receipt.bin");
  const scriptPath = path.join(tempDir, "print.ps1");

  try {
    await fs.writeFile(dataPath, Buffer.from(receiptText, "ascii"));
    await fs.writeFile(scriptPath, rawPrinterScript, "utf8");
    await runPowerShell([
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-PrinterName",
      printerName,
      "-DataPath",
      dataPath,
    ]);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
};

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "DUCH Local Print Service", default_printer: defaultPrinter || null });
});

app.get("/printers", async (req, res) => {
  try {
    const printers = await listPrinters();
    res.json({ printers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/print", async (req, res) => {
  try {
    const printerName = req.body.printer_name || defaultPrinter;
    const receiptText = req.body.receipt_text;

    if (!receiptText) {
      return res.status(400).json({ error: "receipt_text is required" });
    }

    await sendRawToPrinter(printerName, receiptText);
    res.json({ ok: true, printer_name: printerName });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(port, "127.0.0.1", () => {
  console.log(`DUCH Local Print Service running at http://127.0.0.1:${port}`);
});
