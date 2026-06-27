import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, Input, Result, Spin, message } from "antd";
import { ArrowLeftOutlined, PrinterOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import billingService from "../service/billingService";
import localPrintService from "../service/localPrintService";
import { useBranch } from "../../context/BranchContext";
import { getReceiptProfile } from "../service/receiptSettings";

const money = (value) => `Rs.${Number(value || 0).toFixed(2)}`;

const getItemName = (item) =>
  item.product?.product_name || item.product_name || item.name || "Item";

const getItemCode = (item) =>
  item.product?.product_code || item.product_code || item.barcode || "";

const normalizeBilling = (billing) => {
  if (!billing) return null;

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

  return {
    ...billing,
    billing_no: billing.billing_no || billing.bill_no || (billing.id ? `BILL-${billing.id}` : "-"),
    billing_date: billing.billing_date || new Date().toISOString(),
    customer_name: billing.customer_name || "Walk-in Customer",
    items,
    subtotal,
    discount,
    tax,
    total,
    paid,
    due: Number(billing.due_amount || Math.max(0, total - paid)),
  };
};

const getFooterTerms = (profile) =>
  String(profile.footerTerms || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const formatPayment = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const CustomerBillCopy = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [billing, setBilling] = useState(() => normalizeBilling(location.state?.billing));
  const [loading, setLoading] = useState(Boolean(id && !location.state?.billing));
  const [printedOnce, setPrintedOnce] = useState(false);
  const [directPrinting, setDirectPrinting] = useState(false);
  const [printerLoading, setPrinterLoading] = useState(false);
  const [localPrinters, setLocalPrinters] = useState([]);
  const [printerName, setPrinterName] = useState(() => localStorage.getItem("thermalPrinterName") || "");
  const { branches, selectedBranch } = useBranch();

  const autoPrint = location.state?.autoPrint || searchParams.get("print") === "1";

  const loadBilling = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await billingService.getById(id);
      setBilling(normalizeBilling(response.data || response));
    } catch (error) {
      console.error(error);
      message.error("Failed to load bill for printing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const receiptProfile = useMemo(
    () => getReceiptProfile({ branches, selectedBranch, branch: billing?.branch }),
    [branches, selectedBranch, billing?.branch]
  );
  const totals = useMemo(() => {
    const normalized = normalizeBilling(billing);
    return normalized ? { ...normalized, receiptProfile } : null;
  }, [billing, receiptProfile]);
  const footerTerms = useMemo(() => getFooterTerms(receiptProfile), [receiptProfile]);
  const totalQty = useMemo(
    () => totals?.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0,
    [totals]
  );

  useEffect(() => {
    if (!loading && totals && autoPrint && !printedOnce && id) {
      setPrintedOnce(true);
      const timer = window.setTimeout(() => localThermalPrint(), 600);
      return () => window.clearTimeout(timer);
    }
    if (!loading && totals && autoPrint && !printedOnce && !id) {
      setPrintedOnce(true);
      const timer = window.setTimeout(() => window.print(), 1000);
      return () => window.clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPrint, id, loading, printedOnce, totals]);

  const localThermalPrint = async () => {
    if (!totals) return false;

    setDirectPrinting(true);
    try {
      const trimmedPrinterName = printerName.trim();
      if (trimmedPrinterName) {
        localStorage.setItem("thermalPrinterName", trimmedPrinterName);
      }
      const usedPrinter = await localPrintService.printReceiptLocally(totals, trimmedPrinterName);
      if (usedPrinter) {
        setPrinterName(usedPrinter);
        localStorage.setItem("thermalPrinterName", usedPrinter);
      }

      message.success(`Receipt sent to ${usedPrinter || "thermal printer"}`);

      return true;
    } catch (error) {
      console.error(error);
      message.error(error.message || "Local print failed. Make sure DUCH Local Print Service is running.");
      return false;
    } finally {
      setDirectPrinting(false);
    }
  };

  const loadLocalPrinters = async () => {
    setPrinterLoading(true);
    try {
      const printers = await localPrintService.findLocalPrinters();
      setLocalPrinters(printers);
      if (!printerName && printers.length > 0) {
        const defaultPrinter = printers.find((printer) => printer.default) || printers[0];
        setPrinterName(defaultPrinter.name);
      }
      message.success("Local print service connected");
    } catch (error) {
      console.error(error);
      message.error(error.message || "Unable to connect to DUCH Local Print Service");
    } finally {
      setPrinterLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="thermal-page thermal-screen">
        <Spin tip="Preparing receipt..." />
      </div>
    );
  }

  if (!totals) {
    return (
      <div className="thermal-page thermal-screen">
        <Result
          status="warning"
          title="No billing data found"
          extra={<Button type="primary" onClick={() => navigate(-1)}>Back</Button>}
        />
      </div>
    );
  }

  return (
    <div className="thermal-page">
      <style>
        {`
          @page {
            size: 80mm 297mm;
            margin: 0;
          }

          body {
            background: #f3f4f6;
          }

          .thermal-page {
            min-height: 100vh;
            padding: 20px 12px;
            color: #111;
            font-family: "Arial", "Helvetica", sans-serif;
          }

          .thermal-screen {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .thermal-actions {
            width: 80mm;
            max-width: calc(100vw - 24px);
            margin: 0 auto 12px;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .thermal-printer-name {
            flex: 1 1 100%;
          }

          .thermal-receipt {
            width: 80mm;
            max-width: calc(100vw - 24px);
            margin: 0 auto;
            background: #fff;
            padding: 5mm 4mm;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.16);
            font-size: 11px;
            line-height: 1.28;
            color: #000;
            box-sizing: border-box;
          }

          .receipt-center { text-align: center; }
          .receipt-title { font-size: 16px; font-weight: 800; letter-spacing: 0; }
          .receipt-subtitle { font-size: 10px; margin-top: 2px; }
          .receipt-divider {
            border: 0;
            border-top: 1px dashed #111;
            margin: 7px 0;
          }
          .receipt-row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
          }
          .receipt-row span:first-child { min-width: 0; }
          .receipt-row span:last-child { white-space: nowrap; text-align: right; }
          .receipt-meta {
            display: grid;
            gap: 2px;
          }
          .receipt-table {
            width: 100%;
            border-collapse: collapse;
          }
          .receipt-table th,
          .receipt-table td {
            padding: 3px 0;
            vertical-align: top;
          }
          .receipt-table th {
            border-bottom: 1px dashed #111;
            font-size: 10px;
            text-align: left;
          }
          .receipt-table .num { text-align: right; white-space: nowrap; }
          .receipt-item-code {
            display: block;
            color: #444;
            font-size: 9px;
          }
          .receipt-total {
            font-size: 20px;
            font-weight: 800;
          }
          .receipt-bill-title {
            text-align: center;
            font-size: 13px;
            font-weight: 800;
            margin: 7px 0 5px;
          }
          .receipt-customer-grid {
            display: flex;
            flex-direction: column;
            gap: 2px;
            font-size: 11px;
          }
          .receipt-net {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 10px;
            margin-top: 8px;
          }
          .receipt-net-label {
            font-size: 16px;
            font-weight: 800;
          }
          .receipt-net-amount {
            font-size: 18px;
            font-weight: 800;
          }
          .receipt-footer {
            margin-top: 8px;
            text-align: left;
            font-size: 10px;
          }

          @media print {
            * {
              color: #000 !important;
              text-shadow: none !important;
              box-shadow: none !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            html, body, #root {
              width: 80mm;
              min-width: 80mm;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              overflow: visible !important;
            }

            .thermal-actions {
              display: none !important;
            }

            .thermal-page {
              min-height: auto;
              width: 80mm !important;
              padding: 0 !important;
              margin: 0 !important;
              background: #fff !important;
              display: block !important;
            }

            .thermal-receipt {
              display: block !important;
              width: 80mm !important;
              max-width: 80mm !important;
              margin: 0 !important;
              padding: 0.5mm 1.5mm 2mm !important;
              box-shadow: none;
              font-size: 10px;
              line-height: 1.22;
              background: #fff !important;
              box-sizing: border-box !important;
              page-break-after: auto;
            }
          }
        `}
      </style>

      <div className="thermal-actions">
        <div className="thermal-printer-name">
          <Input
            list="local-printers"
            placeholder="Printer name, for example 80mm Series Printer"
            value={printerName}
            onChange={(event) => setPrinterName(event.target.value)}
          />
          <datalist id="local-printers">
            {localPrinters.map((printer) => (
              <option key={printer.name} value={printer.name} />
            ))}
          </datalist>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Back
        </Button>
        {id && (
          <Button icon={<ReloadOutlined />} onClick={loadBilling}>
            Refresh
          </Button>
        )}
        <Button loading={printerLoading} onClick={loadLocalPrinters}>
          Find Local Printers
        </Button>
        <Button loading={directPrinting} type="primary" icon={<PrinterOutlined />} onClick={() => localThermalPrint()}>
          Print Thermal Receipt
        </Button>
        <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
          Browser Print
        </Button>
      </div>

      <section className="thermal-receipt">
        <header className="receipt-center">
          <div className="receipt-title">{receiptProfile.storeName}</div>
          {receiptProfile.addressLines.map((line) => (
            <div className="receipt-subtitle" key={line}>{line}</div>
          ))}
        </header>

        <div className="receipt-bill-title">{receiptProfile.billTitle}</div>

        <div className="receipt-customer-grid">
          <div className="receipt-row"><span>Bill No</span><span>{totals.billing_no}</span></div>
          <div className="receipt-row"><span>Date</span><span>{dayjs(totals.billing_date).format("D/M/YYYY, h:mm:ss a")}</span></div>
          <div className="receipt-row"><span>Customer</span><span>{totals.customer_name}</span></div>
          {totals.customer_phone && <div className="receipt-row"><span>Phone</span><span>{totals.customer_phone}</span></div>}
          {totals.counter_no && <div className="receipt-row"><span>Counter</span><span>{totals.counter_no}</span></div>}
          {totals.payment_method && <div className="receipt-row"><span>Payment</span><span>{formatPayment(totals.payment_method)}</span></div>}
        </div>

        <hr className="receipt-divider" />

        <table className="receipt-table">
          <thead>
            <tr>
              <th>DESCRIPTION</th>
              <th className="num">Qty</th>
              <th className="num">Rate</th>
              <th className="num">Amt</th>
            </tr>
          </thead>
          <tbody>
            {totals.items.map((item, index) => (
              <tr key={item.id || item.product_id || index}>
                <td>
                  {getItemName(item)}
                  {getItemCode(item) && <span className="receipt-item-code">{getItemCode(item)}</span>}
                </td>
                <td className="num">{Number(item.quantity || 0)}</td>
                <td className="num">{money(item.unit_price)}</td>
                <td className="num">{money(item.total_price || Number(item.quantity || 0) * Number(item.unit_price || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr className="receipt-divider" />

        {totals.tax > 0 && <div className="receipt-row"><span>Tax</span><span>{money(totals.tax)}</span></div>}
        {totals.discount > 0 && <div className="receipt-row"><span>Discount</span><span>-{Number(totals.discount).toFixed(2)}</span></div>}
        <div className="receipt-net">
          <span className="receipt-net-label">NET AMOUNT</span>
          <span className="receipt-net-amount">Rs {Number(totals.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        <hr className="receipt-divider" />
        <div className="receipt-row"><span>Total Items :</span><span>{totals.items.length}</span></div>
        <div className="receipt-row"><span>Total Qty :</span><span>{Number(totalQty).toFixed(2)}</span></div>
        {totals.discount > 0 && <div className="receipt-row"><span>Today Savings :</span><span>{money(totals.discount)}</span></div>}
        {totals.due > 0 && <div className="receipt-row"><span>Due</span><span>{money(totals.due)}</span></div>}
        {/* <div className="receipt-row"><span></span><span>{totals.created_by_name || totals.updated_by_name || "Admin"}</span></div> */}

        <hr className="receipt-divider" />

        <footer className="receipt-footer">
          {receiptProfile.footerTitle && <div>{receiptProfile.footerTitle}</div>}
          {footerTerms.map((term, index) => (
            <div key={term}>{index + 1}. {term}</div>
          ))}
        </footer>
      </section>
    </div>
  );
};

export default CustomerBillCopy;
