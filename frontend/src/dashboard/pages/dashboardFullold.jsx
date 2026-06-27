import React, { useEffect, useState, useMemo } from "react";
import {
    Row,
    Col,
    Card,
    Table,
    List,
    Avatar,
    Tag,
    Typography,
    Divider,
    Space,
    Input,
    Button,
    Empty,
} from "antd";
import {
    FileTextOutlined,
    DollarOutlined,
    SearchOutlined,
    RightOutlined,
    StarOutlined,
    PlusOutlined,
    MinusOutlined,
} from "@ant-design/icons";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

const { Title, Text } = Typography;

/* ---------- Dummy data (unchanged) ---------- */
const TOP_SUMMARY = [
    { id: 1, title: "To be Fulfilled", value: 56, meta: "Transactions", gradient: "linear-gradient(135deg,#ff8a00,#ff5e3a)", icon: <StarOutlined /> },
    { id: 2, title: "To be Invoiced", value: 24, meta: "Quality", gradient: "linear-gradient(135deg,#1e3a8a,#3b82f6)", icon: <StarOutlined /> },
    { id: 3, title: "Completed", value: 12, meta: "Quality", gradient: "linear-gradient(135deg,#059669,#34d399)", icon: <StarOutlined /> },
    { id: 4, title: "Monthly Collections", value: "₹30,000", meta: "Quality", gradient: "linear-gradient(135deg,#7c3aed,#a78bfa)", icon: <StarOutlined /> },
];

const LATEST_PAYMENTS = [
    { id: "S000083", customer: "Ernest Gabayan", fulfillment: "Fulfilled", status: "Paid", total: 6000, date: "01/09/2025", notes: "Delivered on time. Tracking #12345", method: "Card" },
    { id: "S000084", customer: "Ernest Gabayan", fulfillment: "Cancelled", status: "Partially Paid", total: 12000, date: "02/09/2025", notes: "Customer cancelled after payment.", method: "UPI" },
    { id: "S000085", customer: "Ernest Gabayan", fulfillment: "Partially Fulfilled", status: "Refunded", total: 200, date: "03/09/2025", notes: "Item damaged, refunded.", method: "Card" },
    { id: "S000086", customer: "Ernest Gabayan", fulfillment: "Unfulfilled", status: "Pending", total: 10, date: "04/09/2025", notes: "Awaiting stock.", method: "COD" },
    { id: "S000087", customer: "Ernest Gabayan", fulfillment: "Draft", status: "Partially Refunded", total: 3000, date: "05/09/2025", notes: "Partial refund processed.", method: "Card" },
];

const LATEST_COLLECTIONS = LATEST_PAYMENTS.map((p) => ({
    ...p,
    collectionStatus: p.status === "Paid" ? "Collected" : p.status === "Partially Paid" ? "Partially Collected" : p.status,
}));

const INCOMING_POS = [
    { id: "#PO0005", label: "Ernest Gabayan", total: 12000, color: "#f97316" }, // orange
    { id: "#PO0006", label: "Ernest Gabayan", total: 1000, color: "#10b981" },  // green
    { id: "#PO0007", label: "Ernest Gabayan", total: 200, color: "#3b82f6" },   // blue
    { id: "#PO0008", label: "Ernest Gabayan", total: 650, color: "#ef4444" },   // red
    { id: "#PO0009", label: "Ernest Gabayan", total: 10450, color: "#7c3aed" }, // indigo
];

const TOP_PRODUCTS = [
    { id: 1, name: "T-Shirt for men", price: "$50" },
    { id: 2, name: "T-Shirt for men", price: "$50" },
    { id: 3, name: "T-Shirt for men", price: "$50" },
    { id: 4, name: "Bucket hat in washed green", price: "$250" },
    { id: 5, name: "Bucket hat in washed green", price: "$250" },
    { id: 6, name: "Adidas Originals Forum 84", price: "$80" },
];

const REVENUE_DATA = [
    { date: "1", weekRevenue: 2000, monthRevenue: 8000, yearRevenue: 45000 },
    { date: "5", weekRevenue: 3000, monthRevenue: 10000, yearRevenue: 47000 },
    { date: "10", weekRevenue: 2500, monthRevenue: 12000, yearRevenue: 49000 },
    { date: "15", weekRevenue: 4000, monthRevenue: 15000, yearRevenue: 52000 },
    { date: "20", weekRevenue: 3500, monthRevenue: 17000, yearRevenue: 54000 },
    { date: "25", weekRevenue: 4500, monthRevenue: 20000, yearRevenue: 58000 },
];

/* ---------- Tiny style helpers ---------- */
const styles = {
    page: { padding: 6, minHeight: "100vh", width: "100%" },
    statGridCardWrap: { borderRadius: 14, overflow: "hidden", minHeight: 96, boxShadow: "0 10px 30px rgba(2,6,23,0.06)" },
    statInner: { padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff" },
    statLeft: { display: "flex", flexDirection: "column", gap: 6 },
    statTitle: { fontSize: 13, fontWeight: 700, opacity: 0.95 },
    statValue: { fontSize: 28, fontWeight: 900, lineHeight: 1 },
    statMeta: { fontSize: 12, opacity: 0.95 },
    statIconCircle: { width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" },
    statChevron: { width: 44, height: 44, borderRadius: 10, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" },
    roundedCard: { borderRadius: 14, boxShadow: "0 6px 18px rgba(15,23,42,0.06)" },
    pill: { display: "inline-block", padding: "6px 12px", borderRadius: 999, fontWeight: 700, fontSize: 12 },
    poRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 6px" },
    poLeft: { display: "flex", alignItems: "center", gap: 10 },
    poDot: (color) => ({ width: 12, height: 12, borderRadius: 12, background: color, display: "inline-block", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }),
};

/* ---------- Small presentational components ---------- */
const StatusTag = ({ text }) => {
    const map = {
        Paid: { bg: "#ecfdf5", fg: "#047857" },
        "Partially Paid": { bg: "#f5f3ff", fg: "#6d28d9" },
        Refunded: { bg: "#f3f4f6", fg: "#374151" },
        Pending: { bg: "#fff7ed", fg: "#b45309" },
        "Partially Refunded": { bg: "#eef2ff", fg: "#334155" },
    };
    const cfg = map[text] || { bg: "#eef2ff", fg: "#334155" };
    return <span style={{ ...styles.pill, background: cfg.bg, color: cfg.fg }}>{text}</span>;
};

const StatCard = ({ title, value, meta, gradient, icon }) => {
    return (
        <div style={{ ...styles.statGridCardWrap }}>
            <div style={{ ...styles.statInner, background: gradient }}>
                <div style={styles.statLeft}>
                    <div style={styles.statTitle}>{title}</div>
                    <div style={styles.statValue}>{value}</div>
                    <div style={styles.statMeta}>{meta}</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
                    <div style={styles.statIconCircle}><span style={{ color: "#fff" }}>{icon}</span></div>
                    <div style={styles.statChevron}><RightOutlined style={{ color: "rgba(255,255,255,0.9)" }} /></div>
                </div>
            </div>
        </div>
    );
};

/* ---------- Dashboard ---------- */
const DashboardFull = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [revenueKey, setRevenueKey] = useState("weekRevenue");

    // Latest Payments UI state:
    const [filterKey, setFilterKey] = useState("All"); // All / Open / Completed / Fulfilled
    const [searchQ, setSearchQ] = useState("");
    const [expandedRowKeys, setExpandedRowKeys] = useState([]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Filtering logic: adapt to your real data mapping
    const filteredPayments = useMemo(() => {
        const q = searchQ.trim().toLowerCase();
        return LATEST_PAYMENTS.filter((p) => {
            if (filterKey !== "All") {
                if (filterKey === "Open" && p.fulfillment === "Draft") return true;
                if (filterKey === "Completed" && p.fulfillment === "Fulfilled") return true;
                if (filterKey === "Fulfilled" && p.fulfillment === "Fulfilled") return true;
            }
            if (!q) return true;
            return p.id.toLowerCase().includes(q) || p.customer.toLowerCase().includes(q);
        });
    }, [filterKey, searchQ]);

    // Table columns for desktop view (Latest Payments)
    const paymentsColumns = [
        { title: "Payment ID", dataIndex: "id", key: "id", width: 140, render: (t) => <Text strong style={{ color: "#1d4ed8" }}>{t}</Text> },
        { title: "Customer", dataIndex: "customer", key: "customer" },
        {
            title: "Fulfillment status",
            dataIndex: "fulfillment",
            key: "fulfillment",
            render: (v) => (
                <span style={{ ...styles.pill, background: v === "Fulfilled" ? "#ecfdf5" : v === "Cancelled" ? "#fff1f2" : "#f3f4f6", color: v === "Fulfilled" ? "#047857" : v === "Cancelled" ? "#dc2626" : "#374151" }}>
                    {v}
                </span>
            ),
        },
        {
            title: "Payment status",
            dataIndex: "status",
            key: "status",
            render: (s) => <StatusTag text={s} />,
        },
        {
            title: "Total",
            dataIndex: "total",
            key: "total",
            align: "right",
            render: (t) => <b>₹{t.toLocaleString()}</b>,
        },
    ];

    // Expandable row content (small details pane)
    const expandedRowRender = (record) => {
        return (
            <div style={{ padding: 12, background: "#fbfbfb", borderRadius: 8 }}>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                    <div><Text type="secondary">Date</Text><div>{record.date}</div></div>
                    <div><Text type="secondary">Payment method</Text><div>{record.method || "N/A"}</div></div>
                    <div style={{ minWidth: 200 }}><Text type="secondary">Notes</Text><div>{record.notes || "-"}</div></div>
                </div>
            </div>
        );
    };

    // create table data with unique internal row keys (to manage expansion)
    const tableData = filteredPayments.map((r, idx) => ({ ...r, key: `${r.id}-${idx}`, _rowKey: `${r.id}-${idx}` }));

    // handle expand click
    const handleToggleExpand = (record) => {
        const key = record._rowKey;
        setExpandedRowKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    };

    // Latest Payments panel (unchanged)
    const LatestPaymentsPanel = (
        <Card size="small" title={<div style={{ fontWeight: 700 }}>Latest Payments</div>} extra={
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Input
                    placeholder="Search payment or customer"
                    prefix={<SearchOutlined />}
                    allowClear
                    size="small"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    style={{ width: 220 }}
                />
            </div>
        } style={{ borderRadius: 12 }}>
            {/* filters */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 8 }}>
                    <Button type={filterKey === "All" ? "primary" : "default"} size="small" onClick={() => setFilterKey("All")}>All</Button>
                    <Button type={filterKey === "Open" ? "primary" : "default"} size="small" onClick={() => setFilterKey("Open")}>Open</Button>
                    <Button type={filterKey === "Completed" ? "primary" : "default"} size="small" onClick={() => setFilterKey("Completed")}>Completed</Button>
                    <Button type={filterKey === "Fulfilled" ? "primary" : "default"} size="small" onClick={() => setFilterKey("Fulfilled")}>Fulfilled</Button>
                </div>

            </div>

            {/* when no rows after filters/search */}
            {tableData.length === 0 ? (
                <div style={{ padding: 28, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Empty description="No payments found" />
                </div>
            ) : (
                <Table
                    columns={paymentsColumns}
                    dataSource={tableData}
                    pagination={false}
                    size="middle"
                    rowKey={(r) => r._rowKey}
                    expandable={{
                        expandedRowRender,
                        expandedRowKeys,
                        onExpand: (expanded, record) => handleToggleExpand(record),
                        expandIcon: ({ expanded, onExpand, record }) => (
                            <span onClick={(e) => { e.stopPropagation(); onExpand(record, e); }}>
                                {expanded ? <MinusOutlined style={{ color: "#6b7280" }} /> : <PlusOutlined style={{ color: "#6b7280" }} />}
                            </span>
                        ),
                        expandIconColumnIndex: 0,
                    }}
                    onRow={(record) => ({
                        onClick: () => handleToggleExpand(record),
                    })}
                />
            )}
        </Card>
    );

    return (
        <div style={styles.page}>
            {/* Header */}
            <Row justify="space-between" align="middle">
                <Col>
                    <Title level={4} style={{ margin: 0 }}>Dashboard</Title>
                </Col>
                {/* <Col>
                    <Text type="secondary">Edit layout &nbsp; • &nbsp; Filter by year ▾</Text>
                </Col> */}
            </Row>

            {/* Top stats */}
            <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                {TOP_SUMMARY.map((s) => (
                    <Col xs={24} sm={12} md={6} key={s.id}>
                        <StatCard title={s.title} value={s.value} meta={s.meta} gradient={s.gradient} icon={s.icon} />
                    </Col>
                ))}
            </Row>

            {/* Main content (3 columns) */}
            <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
                {/* Left column */}
                <Col xs={24} lg={12}>
                    {/* Latest Payments */}
                    {LatestPaymentsPanel}

                    {/* Latest Collection */}
                    <Card size="small" title={<div style={{ fontWeight: 700 }}>Latest Collection</div>} extra={<SearchOutlined />} style={{ borderRadius: 12, marginTop: 12 }}>
                        {LATEST_COLLECTIONS.length === 0 ? (
                            <div style={{ padding: 24, textAlign: "center" }}>
                                <Empty description="No collections" />
                            </div>
                        ) : (
                            <Table
                                columns={[
                                    { title: "Payment ID", dataIndex: "id", key: "id", render: (t) => <Text strong>{t}</Text> },
                                    { title: "Customer", dataIndex: "customer", key: "customer" },
                                    { title: "Fulfillment status", dataIndex: "fulfillment", key: "fulfillment", render: (v) => <span style={{ ...styles.pill, background: "#f3f4f6" }}>{v}</span> },
                                    { title: "Collection status", dataIndex: "collectionStatus", key: "collectionStatus", render: (s) => <Tag color={s === "Collected" ? "green" : "gold"}>{s}</Tag> },
                                    { title: "Total", dataIndex: "total", key: "total", align: "right", render: (t) => <b>₹{t.toLocaleString()}</b> },
                                ]}
                                dataSource={LATEST_COLLECTIONS}
                                pagination={false}
                                size="small"
                                rowKey={(r) => r.id + r.date}
                            />
                        )}
                    </Card>
                </Col>

                {/* Middle column (UPDATED to match the image) */}
                <Col xs={24} lg={6}>
                    {/* Compact summary card: Sent orders + total cost */}
                    <Card size="small" style={{ ...styles.roundedCard, padding: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Purchase orders</div>
                                <div style={{ marginTop: 6 }}>
                                    <div style={{ fontSize: 13, color: "#6b7280" }}>Sent orders</div>
                                    <div style={{ fontWeight: 800, marginTop: 4 }}>$20</div>
                                </div>
                                <div style={{ marginTop: 10 }}>
                                    <div style={{ fontSize: 13, color: "#6b7280" }}>Total cost (USD)</div>
                                    <div style={{ fontWeight: 800, marginTop: 4 }}>₹4600</div>
                                </div>
                            </div>

                            <div style={{ textAlign: "right" }}>
                                {/* optional small icon */}
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <RightOutlined style={{ color: "#0ea5e9" }} />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Incoming purchase orders: list with colored dots and amounts on the right */}
                    <Card size="small" style={{ ...styles.roundedCard, marginTop: 12, padding: 0 }}>
                        <div style={{ padding: 14, borderBottom: "1px solid #f3f4f6" }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Incoming purchase orders</div>
                        </div>

                        <div>
                            {INCOMING_POS.map((po) => (
                                <div key={po.id} style={styles.poRow}>
                                    <div style={styles.poLeft}>
                                        <span style={styles.poDot(po.color)} />
                                        <div>
                                            <div style={{ fontWeight: 700, color: "#0b63d8" }}>{po.id}</div>
                                            <div style={{ fontSize: 12, color: "#6b7280" }}>{po.label}</div>
                                        </div>
                                    </div>

                                    <div style={{ fontWeight: 800 }}>₹{po.total.toLocaleString()}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ padding: "10px 14px", borderTop: "1px solid #f3f4f6" }}>
                            <a style={{ color: "#2563eb", fontWeight: 700 }}>View all</a>
                        </div>
                    </Card>
                </Col>

                {/* Right column */}
                <Col xs={24} lg={6}>
                    <Card size="small" style={{ ...styles.roundedCard }}>
                        <div style={{ padding: 12 }}>
                            <div style={{ fontWeight: 700, marginBottom: 10 }}>Top selling products</div>

                            {/* grid: two columns */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                {TOP_PRODUCTS.map((p, i) => (
                                    <div
                                        key={p.id}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            padding: "10px 6px",
                                            minHeight: 120,
                                            boxSizing: "border-box",
                                            background: "#fff",
                                            borderRadius: 8,
                                        }}
                                    >
                                        {/* thumbnail: replace Avatar with img src if you have real images */}
                                        <Avatar
                                            shape="square"
                                            size={56}
                                            style={{ background: "#f3f4f6", color: "#374151", marginBottom: 8 }}
                                        >
                                            {/* fallback: first letter */}
                                            {p.image ? <img src={p.image} alt={p.name} style={{ width: 56, height: 56, objectFit: "contain" }} /> : p.name.charAt(0)}
                                        </Avatar>

                                        {/* product name (blue link style) */}
                                        <a style={{ color: "#2563eb", textDecoration: "none", marginTop: 6, fontSize: 10 }}>{p.name}</a>

                                        {/* price */}
                                        <div style={{ marginTop: 6, fontWeight: 700, color: "#111827" }}>{p.price}</div>
                                    </div>
                                ))}
                            </div>

                            {/* <div style={{ marginTop: 8 }}>
                                {(() => {
                                    const rows = Math.ceil(TOP_PRODUCTS.length / 2);
                                    return Array.from({ length: rows }).map((_, r) => (
                                        <div
                                            key={r}
                                            style={{
                                                height: 1,
                                                background: "#eef2f7",
                                                margin: "8px 0",
                                                borderRadius: 1,
                                            }}
                                        />
                                    ));
                                })()}
                            </div> */}
                        </div>
                    </Card>

                    <Card size="small" style={{ ...styles.roundedCard, marginTop: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <Text type="secondary">Monthly Collections</Text>
                                <div style={{ fontSize: 20, fontWeight: 800 }}>₹30,000</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <Text type="secondary">Quality</Text>
                                <div style={{ fontSize: 12 }}>Status</div>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>



        </div>
    );
};

export default DashboardFull;
