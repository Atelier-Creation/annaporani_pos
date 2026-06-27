import React from "react";
import { Card } from "antd";
import { RightOutlined } from "@ant-design/icons";

const styles = {
    roundedCard: { borderRadius: 14, boxShadow: "0 6px 18px rgba(15,23,42,0.06)" },
    poRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 6px" },
    poLeft: { display: "flex", alignItems: "center", gap: 10 },
    poDot: (color) => ({ width: 12, height: 12, borderRadius: 12, background: color, display: "inline-block", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }),
};

const IncomingPOs = ({ pos }) => {
    return (
        <Card size="small" style={{ ...styles.roundedCard, marginTop: 12, padding: 0 }}>
            <div style={{ padding: 14, borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Incoming purchase orders</div>
            </div>

            <div>
                {pos.map((po) => (
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
    );
};

export default IncomingPOs;