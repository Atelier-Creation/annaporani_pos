import { StarOutlined } from "@ant-design/icons";

export const TOP_SUMMARY = [
    { id: 1, title: "Total Billing", value: 56, meta: "Transactions", gradient: "linear-gradient(135deg,#ff8a00,#ff5e3a)", icon: <StarOutlined /> },
    { id: 2, title: "Total User", value: 24, meta: "Quality", gradient: "linear-gradient(135deg,#1e3a8a,#3b82f6)", icon: <StarOutlined /> },
    { id: 3, title: "Total Product", value: 12, meta: "Quality", gradient: "linear-gradient(135deg,#059669,#34d399)", icon: <StarOutlined /> },
    { id: 4, title: "Total Revenue", value: "₹30,000", meta: "Quality", gradient: "linear-gradient(135deg,#7c3aed,#a78bfa)", icon: <StarOutlined /> },
];

export const LATEST_PAYMENTS = [
    { id: "S000083", customer: "Ernest Gabayan", fulfillment: "Fulfilled", status: "Paid", total: 6000, date: "01/09/2025", notes: "Delivered on time. Tracking #12345", method: "Card" },
    { id: "S000084", customer: "Ernest Gabayan", fulfillment: "Cancelled", status: "Partially Paid", total: 12000, date: "02/09/2025", notes: "Customer cancelled after payment.", method: "UPI" },
    { id: "S000085", customer: "Ernest Gabayan", fulfillment: "Partially Fulfilled", status: "Refunded", total: 200, date: "03/09/2025", notes: "Item damaged, refunded.", method: "Card" },
    { id: "S000086", customer: "Ernest Gabayan", fulfillment: "Unfulfilled", status: "Pending", total: 10, date: "04/09/2025", notes: "Awaiting stock.", method: "COD" },
    { id: "S000087", customer: "Ernest Gabayan", fulfillment: "Draft", status: "Partially Refunded", total: 3000, date: "05/09/2025", notes: "Partial refund processed.", method: "Card" },
];

export const LATEST_COLLECTIONS = LATEST_PAYMENTS.map((p) => ({
    ...p,
    collectionStatus: p.status === "Paid" ? "Collected" : p.status === "Partially Paid" ? "Partially Collected" : p.status,
}));

export const INCOMING_POS = [
    { id: "#PO0005", label: "Ernest Gabayan", total: 12000, color: "#f97316" },
    { id: "#PO0006", label: "Ernest Gabayan", total: 1000, color: "#10b981" },
    { id: "#PO0007", label: "Ernest Gabayan", total: 200, color: "#3b82f6" },
    { id: "#PO0008", label: "Ernest Gabayan", total: 650, color: "#ef4444" },
    { id: "#PO0009", label: "Ernest Gabayan", total: 10450, color: "#7c3aed" },
];

export const TOP_PRODUCTS = [
    { id: 1, name: "T-Shirt for men", price: "₹50" },
    { id: 2, name: "T-Shirt for men", price: "₹50" },
    { id: 3, name: "T-Shirt for men", price: "₹50" },
    { id: 4, name: "Bucket hat in washed green", price: "₹250" },
    { id: 5, name: "Bucket hat in washed green", price: "₹250" },
    { id: 6, name: "Adidas Originals Forum 84", price: "₹80" },
];

export const REVENUE_DATA = [
    { date: "1", weekRevenue: 2000, monthRevenue: 8000, yearRevenue: 45000 },
    { date: "5", weekRevenue: 3000, monthRevenue: 10000, yearRevenue: 47000 },
    { date: "10", weekRevenue: 2500, monthRevenue: 12000, yearRevenue: 49000 },
    { date: "15", weekRevenue: 4000, monthRevenue: 15000, yearRevenue: 52000 },
    { date: "20", weekRevenue: 3500, monthRevenue: 17000, yearRevenue: 54000 },
    { date: "25", weekRevenue: 4500, monthRevenue: 20000, yearRevenue: 58000 },
];