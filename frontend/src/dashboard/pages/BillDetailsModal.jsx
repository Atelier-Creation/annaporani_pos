import React, { useEffect, useState } from "react";
import { Modal, Button, Table, Row, Col, Card, Avatar, Tag, message, Space, Spin } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import billingService from "../../billing/service/billingService";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

function getInitials(name = "") {
    return name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function statusMeta(status = "") {
    const s = (status || "").toLowerCase();
    if (s === "paid") {
        return { color: "#16a34a", bg: "#dcfce7", textColor: "#065f46", label: "Paid" };
    }
    if (s === "pending" || s === "in progress") {
        return { color: "#d97706", bg: "#fff7ed", textColor: "#92400e", label: "Pending" };
    }
    if (s === "failed") {
        return { color: "#dc2626", bg: "#fee2e2", textColor: "#7f1d1d", label: "Failed" };
    }
    if (s === "overdue") {
        return { color: "#b91c1c", bg: "#fff1f2", textColor: "#7f1d1d", label: "Overdue" };
    }
    return { color: "#374151", bg: "#f3f4f6", textColor: "#374151", label: (status || "Unknown").toString() };
}

function getTypeLabel(type = "") {
    if (!type) return "Unknown";
    if (type === "Customer Billing") return "Mobile";
    if (type === "Casier Billing") return "Casier";
    return type;
}

const BillDetailsModal = ({ visible, onClose, billId, initialData }) => {
    const [selectedBilling, setSelectedBilling] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            // Priority 1: Use initial data immediately if available to show something
            if (initialData) {
                setSelectedBilling(initialData);
            }

            // Priority 2: Fetch fresh data if we have an ID
            if (billId) {
                fetchBillingById(billId);
            } else if (!initialData) {
                // If no ID and no initial data, show empty
                setSelectedBilling(null);
            }
        } else {
            setSelectedBilling(null);
        }
    }, [visible, billId, initialData]);

    const fetchBillingById = async (id) => {
        setLoading(true);
        try {
            console.log("Fetching bill details for ID:", id);
            const res = await billingService.getById(id);
            console.log("Bill fetch response:", res);
            // Handle response structure variations
            const payload = res?.data ? res.data : res;

            if (!payload) {
                // If API returns empty, it might be because the ID from dashboard (recent bills) 
                // doesn't match the billing ID expected by billing service or permissions issue.
                // However, if we passed the initial record, we could show that as fallback.
                throw new Error("Empty response");
            }

            // If items are missing, throw to trigger fallback search (Billing List endpoint might have them)
            if (!payload.items || payload.items.length === 0) {
                throw new Error("Items missing in detail view");
            }

            setSelectedBilling(payload);
        } catch (e) {
            console.error("Fetch billing error:", e);
            message.error(`Failed to load full details: ${e.message}`);

            // Fallback strategy: Try to find by billing_no if we have it
            if (initialData?.billing_no) {
                try {
                    console.log("Attempting fallback fetch by billing_no:", initialData.billing_no);
                    const searchRes = await billingService.getAll({ search: initialData.billing_no });
                    const found = searchRes?.data?.find(b => b.billing_no === initialData.billing_no);
                    if (found) {
                        console.log("Found bill by number:", found);
                        // If found bill has items, use it. Some list endpoints include items, some don't.
                        // If logic for list returns items, we are good.
                        // Assuming list might return items or we might need to fetch by ITS id if different?
                        // But finding it here implies usage of 'billingService.getAll'.
                        setSelectedBilling(found);
                        return;
                    }
                } catch (searchErr) {
                    console.warn("Fallback search failed:", searchErr);
                }
            }

            // Final Fallback: use initialData if available
            if (initialData) {
                console.log("Using initialData fallback", initialData);
                setSelectedBilling(initialData);
            } else {
                setSelectedBilling(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const exportInvoicePDF = () => {
        const billing = selectedBilling;
        if (!billing) return;
        const doc = new jsPDF({ unit: "pt", format: "A4" });

        doc.setFontSize(18);
        doc.text("Invoice", 40, 40);

        doc.setFontSize(12);
        doc.text(`Billing No: ${billing.billing_no || "-"}`, 40, 70);
        doc.text(`Customer: ${billing.customer_name || "-"}`, 40, 88);
        doc.text(`Date: ${billing.billing_date ? new Date(billing.billing_date).toLocaleString() : "-"}`, 40, 106);

        const head = [["Product", "Code", "Unit", "Qty", "Unit Price", "Total"]];
        const body = (billing.items || []).map((it) => [
            it.product?.product_name || "-",
            it.product?.product_code || "-",
            it.product?.unit || "-",
            it.quantity,
            `₹${it.unit_price}`,
            `₹${it.total_price}`,
        ]);

        doc.autoTable({ startY: 130, head, body, styles: { fontSize: 10 } });

        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 300;

        doc.text(`Subtotal: ₹${billing.subtotal_amount || "0.00"}`, 40, finalY);
        doc.text(`Discount: ₹${billing.discount_amount || "0.00"}`, 40, finalY + 16);
        doc.text(`Tax: ₹${billing.tax_amount || "0.00"}`, 40, finalY + 32);
        doc.setFontSize(13);
        doc.text(`Total: ₹${billing.total_amount || "0.00"}`, 40, finalY + 56);

        doc.save(`${billing.billing_no || "invoice"}.pdf`);
    };

    const itemColumns = [
        { title: "Product", key: "product_name", render: (r) => r.product?.product_name || r.product_name || "-" },
        { title: "Code", key: "product_code", render: (r) => r.product?.product_code || r.product_code || "-" },
        { title: "Unit", key: "unit", render: (r) => r.product?.unit || r.unit || "-" },
        { title: "Qty", dataIndex: "quantity", key: "quantity" },
        { title: "Unit Price", dataIndex: "unit_price", key: "unit_price", render: (v) => `₹${v}` },
        { title: "Total", dataIndex: "total_price", key: "total_price", render: (v) => `₹${v}` },
    ];

    return (
        <Modal
            style={{ top: 15, paddingTop: 0 }}
            className="invoice-modal"
            open={visible}
            title={null}
            onCancel={onClose}
            footer={[
                <Space key="modal-actions">
                    <Button icon={<DownloadOutlined />} onClick={exportInvoicePDF} disabled={!selectedBilling}>
                        Download PDF
                    </Button>
                    <Button key="close" onClick={onClose}>
                        Close
                    </Button>
                </Space>,
            ]}
            width={980}
            bodyStyle={{ maxHeight: "80vh", overflowY: "auto", padding: 0, scrollbarWidth: "none" }}
        >
            <style>
                {`
        .invoice-modal .ant-modal-content {
          padding-top: 2px !important;
        }
        .invoice-modal .ant-card-body {
          padding-top: 0px !important;
          padding-bottom: 8px !important;
        }
        `}
            </style>

            {loading ? (
                <div style={{ textAlign: "center", padding: "50px" }}>
                    <Spin size="large" />
                </div>
            ) : selectedBilling ? (
                <div style={{ padding: 10 }}>
                    <Row gutter={16}>
                        <Col xs={24} md={24}>
                            <Card size="small" bordered={false} style={{ borderRadius: 12, overflow: "hidden" }}>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 16,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                                        <Avatar
                                            size={40}
                                            style={{
                                                background: "#0ea5a4",
                                                color: "#fff",
                                                fontWeight: 800,
                                            }}
                                        >
                                            {getInitials(selectedBilling?.customer_name)}
                                        </Avatar>
                                        <div style={{ minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 800,
                                                    color: "#0f172a",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {selectedBilling?.customer_name}
                                            </div>
                                            <div style={{ color: "#6b7280", fontSize: 12 }}>
                                                Order{" "}
                                                <strong style={{ color: "#0f172a" }}>
                                                    {selectedBilling?.billing_no || "—"}
                                                </strong>
                                                {" • "}
                                                {selectedBilling?.billing_date
                                                    ? new Date(selectedBilling.billing_date).toLocaleString()
                                                    : "Date —"}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        <Tag
                                            style={{
                                                fontWeight: 800,
                                                borderRadius: 8,
                                                padding: "0 10px",
                                                background: "#eef2ff",
                                                color: "#3730a3",
                                            }}
                                        >
                                            {getTypeLabel(selectedBilling?.type)}
                                        </Tag>
                                        <Tag
                                            style={{
                                                fontWeight: 800,
                                                borderRadius: 8,
                                                padding: "0 10px",
                                                background: "#fff7ed",
                                                color: "#92400e",
                                            }}
                                        >
                                            {(selectedBilling?.payment_method || "cash").toString().toUpperCase()}
                                        </Tag>
                                        <Tag
                                            style={{
                                                fontWeight: 800,
                                                borderRadius: 8,
                                                padding: "0 10px",
                                                background: statusMeta(selectedBilling?.status).bg,
                                                color: statusMeta(selectedBilling?.status).color,
                                            }}
                                        >
                                            {statusMeta(selectedBilling?.status).label}
                                        </Tag>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    <div style={{ fontWeight: 600, marginBottom: 1 }}>Items</div>
                    <Table
                        columns={itemColumns}
                        dataSource={selectedBilling?.items || []}
                        pagination={false}
                        size="small"
                        rowKey={(r) => r.id || Math.random()}
                        locale={{ emptyText: "No items details available" }}
                    />

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                        <div style={{ width: 360 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "0px 0" }}>
                                <div style={{ color: "#6b7280" }}>Subtotal</div>
                                <div style={{ fontWeight: 700 }}>₹{selectedBilling?.subtotal_amount ?? "0.00"}</div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", padding: "0px 0" }}>
                                <div style={{ color: "#6b7280" }}>Discount</div>
                                <div style={{ fontWeight: 700 }}>₹{selectedBilling?.discount_amount ?? "0.00"}</div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", padding: "0px 0" }}>
                                <div style={{ color: "#6b7280" }}>Tax</div>
                                <div style={{ fontWeight: 700 }}>₹{selectedBilling?.tax_amount ?? "0.00"}</div>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "1px 0",
                                    background: "linear-gradient(90deg,#fef3c7,#fff7ed)",
                                    borderRadius: 8,
                                }}
                            >
                                <div style={{ fontSize: 16, fontWeight: 900 }}>Total</div>
                                <div style={{ fontSize: 18, fontWeight: 900, color: "#b45309" }}>
                                    ₹{selectedBilling?.total_amount ?? "0.00"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: "center", padding: 20 }}>
                    <div style={{ color: "red", fontWeight: "bold" }}>No details available for Bill ID: {billId}</div>
                    <div style={{ fontSize: 12, color: "#999" }}>Please check if the bill exists or try refreshing.</div>
                </div>
            )}
        </Modal>
    );
};

export default BillDetailsModal;
