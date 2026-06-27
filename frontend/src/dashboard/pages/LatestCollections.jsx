import React from "react";
import { Card, Table, Empty, Tag } from "antd";

const LatestCollections = ({ collections }) => {
    return (
        <Card size="small" title={<div style={{ fontWeight: 700 }}>Latest Collection</div>} extra={null} style={{ borderRadius: 12, marginTop: 12 }}>
            {collections.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center" }}>
                    <Empty description="No collections" />
                </div>
            ) : (
                <Table
                    columns={[
                        { title: "Payment ID", dataIndex: "id", key: "id", render: (t) => <strong>{t}</strong> },
                        { title: "Customer", dataIndex: "customer", key: "customer" },
                        { title: "Fulfillment status", dataIndex: "fulfillment", key: "fulfillment", render: (v) => <span style={{ display: "inline-block", padding: "6px 12px", borderRadius: 999, background: "#f3f4f6" }}>{v}</span> },
                        { title: "Collection status", dataIndex: "collectionStatus", key: "collectionStatus", render: (s) => <Tag color={s === "Collected" ? "green" : "gold"}>{s}</Tag> },
                        { title: "Total", dataIndex: "total", key: "total", align: "right", render: (t) => <b>₹{t.toLocaleString()}</b> },
                    ]}
                    dataSource={collections}
                    pagination={false}
                    size="small"
                    rowKey={(r) => r.id + r.date}
                />
            )}
        </Card>
    );
};

export default LatestCollections;