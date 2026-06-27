import React, { useMemo } from "react";
import { Card, Input, Button, Table, Empty, Typography } from "antd";
import { SearchOutlined, PlusOutlined, MinusOutlined } from "@ant-design/icons";
import StatusTag from "./StatusTag";

const { Text } = Typography;

const styles = {
    pill: { display: "inline-block", padding: "6px 12px", borderRadius: 999, fontWeight: 700, fontSize: 12 },
};

const LatestPayments = ({ payments, filterKey, setFilterKey, searchQ, setSearchQ, expandedRowKeys, setExpandedRowKeys }) => {
    const filteredPayments = useMemo(() => {
        const q = searchQ.trim().toLowerCase();
        return payments.filter((p) => {
            if (filterKey !== "All") {
                if (filterKey === "Open" && p.fulfillment === "Draft") return true;
                if (filterKey === "Completed" && p.fulfillment === "Fulfilled") return true;
                if (filterKey === "Fulfilled" && p.fulfillment === "Fulfilled") return true;
            }
            if (!q) return true;
            return p.id.toLowerCase().includes(q) || p.customer.toLowerCase().includes(q);
        });
    }, [payments, filterKey, searchQ]);

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

    const tableData = filteredPayments.map((r, idx) => ({ ...r, key: `${r.id}-${idx}`, _rowKey: `${r.id}-${idx}` }));

    const handleToggleExpand = (record) => {
        const key = record._rowKey;
        setExpandedRowKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    };

    return (
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 8 }}>
                    <Button type={filterKey === "All" ? "primary" : "default"} size="small" onClick={() => setFilterKey("All")}>All</Button>
                    <Button type={filterKey === "Open" ? "primary" : "default"} size="small" onClick={() => setFilterKey("Open")}>Open</Button>
                    <Button type={filterKey === "Completed" ? "primary" : "default"} size="small" onClick={() => setFilterKey("Completed")}>Completed</Button>
                    <Button type={filterKey === "Fulfilled" ? "primary" : "default"} size="small" onClick={() => setFilterKey("Fulfilled")}>Fulfilled</Button>
                </div>
            </div>

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
};

export default LatestPayments;