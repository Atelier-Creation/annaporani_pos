import { useState, useEffect } from 'react';
import { 
    Card, 
    Table, 
    Button, 
    Tag, 
    Space, 
    Modal, 
    Form, 
    Input, 
    Select, 
    message,
    Popconfirm,
    Tooltip,
    Statistic,
    Row,
    Col
} from 'antd';
import { 
    PlusOutlined, 
    PlayCircleOutlined, 
    PauseCircleOutlined,
    DeleteOutlined,
    ReloadOutlined,
    EyeOutlined
} from '@ant-design/icons';
import * as metaApi from '../service/metaApi';

const { Option } = Select;

const CampaignsList = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [insightsModalVisible, setInsightsModalVisible] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [campaignInsights, setCampaignInsights] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const response = await metaApi.getCampaigns();
            setCampaigns(response.data?.data || []);
        } catch (error) {
            message.error('Failed to load campaigns');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCampaign = async (values) => {
        try {
            await metaApi.createCampaign(values);
            message.success('Campaign created successfully');
            setCreateModalVisible(false);
            form.resetFields();
            loadCampaigns();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to create campaign');
        }
    };

    const handleUpdateStatus = async (campaignId, status) => {
        try {
            await metaApi.updateCampaignStatus(campaignId, status);
            message.success(`Campaign ${status.toLowerCase()} successfully`);
            loadCampaigns();
        } catch (error) {
            message.error('Failed to update campaign status');
        }
    };

    const handleViewInsights = async (campaign) => {
        setSelectedCampaign(campaign);
        setInsightsModalVisible(true);
        setCampaignInsights(null);

        try {
            const response = await metaApi.getCampaignInsights(campaign.id, 'last_30d');
            setCampaignInsights(response.data?.data?.[0] || null);
        } catch (error) {
            message.error('Failed to load campaign insights');
        }
    };

    const columns = [
        {
            title: 'Campaign Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{text}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                        ID: {record.id}
                    </div>
                </div>
            ),
        },
        {
            title: 'Objective',
            dataIndex: 'objective',
            key: 'objective',
            render: (objective) => (
                <Tag color="blue">
                    {objective?.replace('OUTCOME_', '') || 'N/A'}
                </Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const colors = {
                    ACTIVE: 'green',
                    PAUSED: 'orange',
                    DELETED: 'red',
                };
                return <Tag color={colors[status] || 'default'}>{status}</Tag>;
            },
        },
        {
            title: 'Daily Budget',
            dataIndex: 'daily_budget',
            key: 'daily_budget',
            render: (budget) => budget ? `₹${(budget / 100).toFixed(2)}` : 'N/A',
        },
        {
            title: 'Created',
            dataIndex: 'created_time',
            key: 'created_time',
            render: (time) => time ? new Date(time).toLocaleDateString() : 'N/A',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Tooltip title="View Insights">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewInsights(record)}
                        />
                    </Tooltip>
                    
                    {record.status === 'PAUSED' && (
                        <Tooltip title="Activate">
                            <Button
                                type="text"
                                icon={<PlayCircleOutlined />}
                                onClick={() => handleUpdateStatus(record.id, 'ACTIVE')}
                                style={{ color: '#52c41a' }}
                            />
                        </Tooltip>
                    )}
                    
                    {record.status === 'ACTIVE' && (
                        <Tooltip title="Pause">
                            <Button
                                type="text"
                                icon={<PauseCircleOutlined />}
                                onClick={() => handleUpdateStatus(record.id, 'PAUSED')}
                                style={{ color: '#faad14' }}
                            />
                        </Tooltip>
                    )}
                    
                    {record.status !== 'DELETED' && (
                        <Popconfirm
                            title="Are you sure you want to delete this campaign?"
                            onConfirm={() => handleUpdateStatus(record.id, 'DELETED')}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Tooltip title="Delete">
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                />
                            </Tooltip>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card
                title="Meta Campaigns"
                extra={
    <Row gutter={[8,8]}>
        <Col xs={24} sm={12}>
            <Button 
                block
                icon={<ReloadOutlined />} 
                onClick={loadCampaigns}
            >
                Refresh
            </Button>
        </Col>

        <Col xs={24} sm={12}>
            <Button
                block
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
            >
                Create Campaign
            </Button>
        </Col>
    </Row>
}
            >
                <Table
    columns={columns}
    dataSource={campaigns}
    rowKey="id"
    loading={loading}
    scroll={{ x: 900 }}
    pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} campaigns`,
    }}
/>
            </Card>

            {/* Create Campaign Modal */}
            <Modal
                title="Create New Campaign"
                open={createModalVisible}
                onCancel={() => {
                    setCreateModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateCampaign}
                >
                    <Form.Item
                        name="name"
                        label="Campaign Name"
                        rules={[{ required: true, message: 'Please enter campaign name' }]}
                    >
                        <Input placeholder="e.g., Spring Sale 2026" />
                    </Form.Item>

                    <Form.Item
                        name="objective"
                        label="Campaign Objective"
                        rules={[{ required: true, message: 'Please select objective' }]}
                    >
                        <Select placeholder="Select objective">
                            <Option value="OUTCOME_AWARENESS">Brand Awareness</Option>
                            <Option value="OUTCOME_ENGAGEMENT">Engagement</Option>
                            <Option value="OUTCOME_TRAFFIC">Traffic</Option>
                            <Option value="OUTCOME_LEADS">Lead Generation</Option>
                            <Option value="OUTCOME_SALES">Sales/Conversions</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label="Initial Status"
                        initialValue="PAUSED"
                    >
                        <Select>
                            <Option value="PAUSED">Paused (Recommended)</Option>
                            <Option value="ACTIVE">Active</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button onClick={() => {
                                setCreateModalVisible(false);
                                form.resetFields();
                            }}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Create Campaign
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Campaign Insights Modal */}
            <Modal
                title={`Campaign Insights: ${selectedCampaign?.name}`}
                open={insightsModalVisible}
                onCancel={() => {
                    setInsightsModalVisible(false);
                    setSelectedCampaign(null);
                    setCampaignInsights(null);
                }}
                footer={[
                    <Button key="close" onClick={() => setInsightsModalVisible(false)}>
                        Close
                    </Button>
                ]}
                width={800}
            >
                {campaignInsights ? (
                    <div>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} md={8}>
                                <Card>
                                    <Statistic
                                        title="Impressions"
                                        value={campaignInsights.impressions || 0}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Card>
                                    <Statistic
                                        title="Clicks"
                                        value={campaignInsights.clicks || 0}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Card>
                                    <Statistic
                                        title="Spend"
                                        value={campaignInsights.spend || 0}
                                        precision={2}
                                        prefix="₹"
                                    />
                                </Card>
                            </Col>
                        </Row>
                        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                            <Col xs={24} sm={12} md={8}>
                                <Card>
                                    <Statistic
                                        title="Reach"
                                        value={campaignInsights.reach || 0}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Card>
                                    <Statistic
                                        title="CTR"
                                        value={campaignInsights.ctr || 0}
                                        precision={2}
                                        suffix="%"
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Card>
                                    <Statistic
                                        title="CPC"
                                        value={campaignInsights.cpc || 0}
                                        precision={2}
                                        prefix="₹"
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <p>Loading insights...</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CampaignsList;
