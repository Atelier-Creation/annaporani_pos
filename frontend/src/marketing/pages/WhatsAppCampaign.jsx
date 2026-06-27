import React, { useState, useEffect } from "react";
import { Table, Typography, Button, Space, Input, Card, message, Spin, Tag, Row, Col } from "antd";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { Send, Users, Smartphone, MessageSquare } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

const { Title, Text } = Typography;
const { TextArea } = Input;

const WhatsAppCampaign = () => {
    const { theme, primaryColor } = useTheme();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [campaignName, setCampaignName] = useState("");
    const [messageTemplate, setMessageTemplate] = useState("hello_world");

    useEffect(() => {
        fetchEligibleCustomers();
    }, []);

    const fetchEligibleCustomers = async () => {
        setLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
            const res = await fetch(`${API_URL}/marketing/whatsapp/customers`);
            const data = await res.json();

            if (data.success || data.status === 'success') {
                // The backend returns an array of customer objects.
                // We add a key property for Ant Design Table.
                const formatted = data.data.map(c => ({
                    ...c,
                    key: c.id
                }));
                setCustomers(formatted);
            } else {
                message.error("Failed to load eligible customers");
            }
        } catch (error) {
            console.error("Error fetching customers:", error);
            message.error("Network error fetching customers");
        } finally {
            setLoading(false);
        }
    };

    const handleSendCampaign = async () => {
        if (!campaignName.trim()) {
            return message.warning("Please enter a Campaign Name");
        }
        if (!messageTemplate.trim()) {
            return message.warning("Please enter a WhatsApp Message content");
        }
        if (selectedRowKeys.length === 0) {
            return message.warning("Please select at least one customer");
        }

        setSending(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
            const response = await fetch(`${API_URL}/marketing/whatsapp/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    campaignName,
                    messageTemplate,
                    customerIds: selectedRowKeys
                })
            });

            const data = await response.json();

            if (data.success) {
                // Determine actual vs simulated for MVP
                const isSimulated = data.data?.isSimulated;
                if (isSimulated) {
                    message.success(`Simulation Successful: Sent to ${data.data.successCount} contacts (Meta WA not configured)`);
                } else {
                    message.success(`WhatsApp Campaign "${campaignName}" launched using Meta template!`);
                }

                // Reset form optionally
                setSelectedRowKeys([]);
                setCampaignName("");
            } else {
                message.error(data.message || "Failed to launch campaign");
            }

        } catch (error) {
            console.error("Send Campaign Error:", error);
            message.error("Network error executing campaign");
        } finally {
            setSending(false);
        }
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'customer_name',
            key: 'customer_name',
            render: text => <Text strong style={{ color: theme === "dark" ? "#e5e7eb" : "inherit" }}>{text}</Text>,
        },
        {
            title: 'Phone Number',
            dataIndex: 'customer_phone',
            key: 'customer_phone',
        },
    ];

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys) => {
            setSelectedRowKeys(newSelectedRowKeys);
        },
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ padding: "24px" }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                    <Title level={2} style={{ margin: 0, color: theme === "dark" ? "#fff" : "#1f2937" }}>
                        WhatsApp Direct Campaigns
                    </Title>
                    <Text type="secondary">Send bulk personalized WhatsApp messages directly your billing customers.</Text>
                </div>
            </div>

            <Row gutter={[24, 24]}>
                {/* Left Side: Campaign Configuration */}
                <Col xs={24} lg={10}>
                    <Card
                        title={
                            <Space>
                                <MessageSquare size={18} color={primaryColor} />
                                <Text strong style={{ fontSize: "16px", color: theme === "dark" ? "#fff" : "inherit" }}>Campaign Configuration</Text>
                            </Space>
                        }
                        bordered={false}
                        style={{
                            borderRadius: "16px",
                            backgroundColor: theme === "dark" ? "#1f2937" : "#fff",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                            height: "100%"
                        }}
                    >
                        <div style={{ marginBottom: "24px" }}>
                            <Text strong style={{ display: "block", marginBottom: "8px", color: theme === "dark" ? "#D1D5DB" : "inherit" }}>Campaign Name</Text>
                            <Input
                                placeholder="e.g. Diwali Weekend Promo"
                                size="large"
                                value={campaignName}
                                onChange={(e) => setCampaignName(e.target.value)}
                                style={{ borderRadius: "8px" }}
                            />
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            <Text strong style={{ display: "block", marginBottom: "8px", color: theme === "dark" ? "#D1D5DB" : "inherit" }}>Meta Template Name</Text>
                            <Text type="secondary" style={{ display: "block", marginBottom: "8px", fontSize: "12px" }}>
                                Note: WhatsApp Cloud API requires you to use the EXACT name of a pre-approved Meta message template (e.g. <Tag color="blue">diwali_promo</Tag>).
                            </Text>
                            <Input
                                placeholder="Enter Meta Template Name..."
                                value={messageTemplate}
                                onChange={(e) => setMessageTemplate(e.target.value)}
                                style={{ borderRadius: "8px" }}
                            />
                        </div>

                        <div style={{ padding: "16px", backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "#f3f4f6", borderRadius: "12px", marginBottom: "24px" }}>
                            <Text strong style={{ display: "block", marginBottom: "8px", color: theme === "dark" ? "#D1D5DB" : "inherit" }}>Summary</Text>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <Text type="secondary">Target Audience:</Text>
                                <Text strong>{selectedRowKeys.length} Customers selected</Text>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                                <Text type="secondary">Platform:</Text>
                                <Space size={4}>
                                    <FaWhatsapp size={14} color="#25D366" />
                                    <Text strong>WhatsApp</Text>
                                </Space>
                            </div>
                        </div>

                        <Button
                            type="primary"
                            size="large"
                            icon={<Send size={18} />}
                            loading={sending}
                            onClick={handleSendCampaign}
                            style={{
                                width: "100%",
                                backgroundColor: "#25D366",
                                borderColor: "#25D366",
                                height: "48px",
                                borderRadius: "8px",
                                fontWeight: "bold"
                            }}
                        >
                            Launch WhatsApp Campaign
                        </Button>
                    </Card>
                </Col>

                {/* Right Side: Customer Selection Table */}
                <Col xs={24} lg={14}>
                    <Card
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <Space>
                                    <Users size={18} color={primaryColor} />
                                    <Text strong style={{ fontSize: "16px", color: theme === "dark" ? "#fff" : "inherit" }}>Select Target Audience</Text>
                                </Space>
                                <Space>
                                    <Button
                                        size="small"
                                        onClick={() => setSelectedRowKeys(customers.map(c => c.key))}
                                        disabled={customers.length === 0}
                                    >
                                        Select All {customers.length > 0 ? `(${customers.length})` : ''}
                                    </Button>
                                    {selectedRowKeys.length > 0 && (
                                        <Button size="small" onClick={() => setSelectedRowKeys([])}>Clear</Button>
                                    )}
                                </Space>
                            </div>
                        }
                        bordered={false}
                        style={{
                            borderRadius: "16px",
                            backgroundColor: theme === "dark" ? "#1f2937" : "#fff",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                            height: "100%"
                        }}
                    >
                        {loading ? (
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
                                <Spin size="large" />
                            </div>
                        ) : (
                            <Table
                                rowSelection={rowSelection}
                                columns={columns}
                                dataSource={customers}
                                pagination={{ pageSize: 8 }}
                                scroll={{ y: 350 }}
                                size="middle"
                            />
                        )}
                    </Card>
                </Col>
            </Row>
        </motion.div>
    );
};

export default WhatsAppCampaign;
