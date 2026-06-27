import React from "react";

const styles = {
    pill: { display: "inline-block", padding: "6px 12px", borderRadius: 999, fontWeight: 700, fontSize: 12 },
};

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

export default StatusTag;