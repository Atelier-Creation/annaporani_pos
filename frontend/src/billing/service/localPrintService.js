const LOCAL_PRINT_URL = import.meta.env.VITE_LOCAL_PRINT_URL || "http://127.0.0.1:9123";
const lineWidth = 48;

const money = (value) => `Rs.${Number(value || 0).toFixed(2)}`;

const clean = (value = "") =>
  String(value)
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const padRow = (left, right, width = lineWidth) => {
  const safeLeft = clean(left);
  const safeRight = clean(right);
  const space = Math.max(1, width - safeLeft.length - safeRight.length);
  return `${safeLeft}${" ".repeat(space)}${safeRight}`;
};

const wrapLine = (text, width = lineWidth) => {
  const words = clean(text).split(" ").filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
};

const itemName = (item) =>
  item.product?.product_name || item.product_name || item.name || "Item";

const itemCode = (item) =>
  item.product?.product_code || item.product_code || item.barcode || "";

const getReceiptProfile = (billing) => billing.receiptProfile || {};

const getTotalQty = (items) =>
  items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

const getFooterTerms = (profile) =>
  String(profile.footerTerms || "")
    .split(/\r?\n/)
    .map((line) => clean(line))
    .filter(Boolean);

const formatDateTime = (value) => {
  const date = new Date(value || Date.now());
  const datePart = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).toLowerCase();
  return `${datePart}, ${timePart}`;
};

const formatPayment = (value) =>
  clean(String(value || "").replace(/_/g, " "))
    .replace(/\b\w/g, (char) => char.toUpperCase());

const itemAmount = (item) =>
  Number(item.total_price || Number(item.quantity || 0) * Number(item.unit_price || 0));

export const buildEscPosReceipt = (billing) => {
  const items = billing.items || billing.billing_items || [];
  const subtotal =
    Number(billing.subtotal_amount) ||
    items.reduce((sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 0), 0);
  const discount = Number(billing.discount_amount || billing.discount || 0);
  const tax =
    Number(billing.tax_amount || billing.tax || 0) ||
    items.reduce((sum, item) => sum + Number(item.tax || item.tax_amount || 0), 0);
  const total =
    Number(billing.total_amount || billing.grand_total) ||
    Math.max(0, subtotal - discount + tax);
  const paid = Number(billing.paid_amount || total);
  const due = Number(billing.due_amount || Math.max(0, total - paid));
  const profile = getReceiptProfile(billing);
  const addressLines = profile.addressLines || [];
  const footerTerms = getFooterTerms(profile);
  const phone = billing.customer_phone || billing.customer?.customer_phone || "";

  const lines = [
    "\x1B\x40",
    "\x1B\x61\x01",
    "\x1B\x45\x01" + clean(profile.storeName || "ANNAPOORANI") + "\x1B\x45\x00",
  ];

  addressLines.forEach((line) => {
    wrapLine(line).forEach((part) => lines.push(part));
  });

  lines.push(
    "",
    "\x1B\x45\x01" + clean(profile.billTitle || "TAX INVOICE") + "\x1B\x45\x00",
    "",
    "\x1B\x61\x00",
    "-".repeat(lineWidth),
    padRow("Bill No", billing.billing_no || billing.bill_no || "-"),
    padRow("Date", formatDateTime(billing.billing_date)),
    padRow("Customer", billing.customer_name || "Walk-in Customer"),
    phone ? padRow("Phone", phone) : "",
    billing.counter_no ? padRow("Counter", billing.counter_no) : "",
    billing.payment_method ? padRow("Payment", formatPayment(billing.payment_method)) : "",
    "-".repeat(lineWidth)
  );

  lines.push("DESCRIPTION                  QTY    RATE     AMT", "-".repeat(lineWidth));

  for (const item of items) {
    const qty = Number(item.quantity || 0);
    const rate = Number(item.unit_price || 0);
    const amount = itemAmount(item);
    const name = clean(itemName(item)).slice(0, 24).padEnd(24, " ");
    const qtyText = `${qty} Nos`.padStart(7, " ");
    lines.push(`${name}${qtyText}${rate.toFixed(2).padStart(8, " ")}${amount.toFixed(2).padStart(9, " ")}`);
    if (itemCode(item)) lines.push(clean(itemCode(item)).slice(0, lineWidth));
  }

  lines.push("-".repeat(lineWidth));

  if (tax > 0) lines.push(padRow("Tax", tax.toFixed(2)));
  if (discount > 0) lines.push(padRow("Discount", `-${discount.toFixed(2)}`));

  const totalText = `Rs ${Number(total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const received = Number(billing.received_amount || 0);
  const balance = Math.max(0, received - total);

  lines.push(
    "\x1B\x45\x01" + padRow("NET AMOUNT", totalText) + "\x1B\x45\x00",
    "-".repeat(lineWidth),
    "",
    padRow("Total Items :", String(items.length)),
    padRow("Total Qty :", Number(getTotalQty(items)).toFixed(2)),
    discount > 0 ? padRow("Today Savings :", money(discount)) : "",
    received > 0 ? padRow("Amount Received :", money(received)) : "",
    received > 0 ? padRow("Balance/Change :", money(balance)) : "",
    due > 0 ? padRow("Due", money(due)) : "",
    "",
    "",
  );

  if (profile.footerTitle || footerTerms.length > 0) {
    lines.push("", clean(profile.footerTitle || "Terms & Conditions:"));
    footerTerms.forEach((term, index) => lines.push(`${index + 1}. ${term}`));
  }

  lines.push(
    "\x1B\x61\x01",
    "\n\n\n",
    "\x1D\x56\x00"
  );

  return lines.join("\n");
};

const requestLocalPrintService = async (path, options = {}) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs || 12000);

  let response;
  try {
    response = await fetch(`${LOCAL_PRINT_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Local print service did not respond. Showing receipt preview.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Local print service error: ${response.status}`);
  }
  return data;
};

export const checkLocalPrintService = () => requestLocalPrintService("/health");

export const findLocalPrinters = async () => {
  const data = await requestLocalPrintService("/printers");
  return data.printers || [];
};

export const printReceiptLocally = async (billing, printerName) => {
  const receiptText = buildEscPosReceipt(billing);
  const data = await requestLocalPrintService("/print", {
    method: "POST",
    timeoutMs: 15000,
    body: JSON.stringify({
      printer_name: printerName || undefined,
      receipt_text: receiptText,
    }),
  });

  return data.printer_name;
};

export default {
  buildEscPosReceipt,
  checkLocalPrintService,
  findLocalPrinters,
  printReceiptLocally,
};
