import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Alert, Spin, Empty, Tag } from 'antd';
import { 
    DollarOutlined, 
    EyeOutlined, 
    ThunderboltOutlined, 
    RiseOutlined,
    FacebookOutlined,
    ReloadOutlined,
    LinkOutlined
} from '@ant-design/icons';
import * as metaApi from '../service/metaApi';

const MarketingDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [adAccount, setAdAccount] = useState(null);
    const [insights, setInsights] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [error, setError] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Test connection first
            const testResult = await metaApi.testMetaConnection();
            setConnected(true);

            // Load ad account details
            const accountData = await metaApi.getAdAccount();
            setAdAccount(accountData.data);

            // Load campaigns
            const campaignsData = await metaApi.getCampaigns();
            setCampaigns(campaignsData.data?.data || []);

            // Load insights
            try {
                const insightsData = await metaApi.getAdAccountInsights('last_30d');
                setInsights(insightsData.data?.data?.[0] || null);
            } catch (err) {
                console.log('No insights available:', err);
            }
        } catch (err) {
            console.error('Dashboard load error:', err);
            setError(err.response?.data?.message || 'Failed to load dashboard data');
            setConnected(false);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectMeta = () => {
        metaApi.initiateMetaAuth();
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" />
                <p style={{ marginTop: 20 }}>Loading dashboard...</p>
            </div>
        );
    }

    if (error && !connected) {
        return (
            <div style={{ padding: 24 }}>
                <Alert
                    message="Meta Account Not Connected"
                    description={
                        <div>
                            <p>{error}</p>
                            <p>Connect your Meta (Facebook) account to start managing your advertising campaigns.</p>
                            <Button 
                                type="primary" 
                                icon={<FacebookOutlined />}
                                onClick={handleConnectMeta}
                                style={{ marginTop: 16 }}
                            >
                                Connect Meta Account
                            </Button>
                        </div>
                    }
                    type="warning"
                    showIcon
                />
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Marketing Dashboard</h2>
                    {adAccount && (
                        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
                            {adAccount.name} • {adAccount.currency}
                        </p>
                    )}
                </div>
                <Button 
                    icon={<ReloadOutlined />} 
                    onClick={loadDashboardData}
                >
                    Refresh
                </Button>
            </div>

            {/* Connection Status */}
            {connected && (
                <Alert
                    message="Meta Account Connected"
                    description={`Successfully connected to ${adAccount?.name || 'Meta Ads'}`}
                    type="success"
                    showIcon
                    closable
                    style={{ marginBottom: 24 }}
                />
            )}

            {/* Performance Metrics */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Total Spend (Last 30 Days)"
                            value={insights?.spend || 0}
                            precision={2}
                            prefix={<DollarOutlined />}
                            suffix={adAccount?.currency || 'INR'}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Impressions"
                            value={insights?.impressions || 0}
                            prefix={<EyeOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Clicks"
                            value={insights?.clicks || 0}
                            prefix={<ThunderboltOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="CTR"
                            value={insights?.ctr || 0}
                            precision={2}
                            suffix="%"
                            prefix={<RiseOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Additional Metrics */}
            {insights && (
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Reach"
                                value={insights.reach || 0}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="CPC"
                                value={insights.cpc || 0}
                                precision={2}
                                prefix={adAccount?.currency || 'INR'}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="CPM"
                                value={insights.cpm || 0}
                                precision={2}
                                prefix={adAccount?.currency || 'INR'}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Frequency"
                                value={insights.frequency || 0}
                                precision={2}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Active Campaigns */}
            <Card 
                title="Active Campaigns" 
                extra={
                    <Button type="link" href="/marketing/campaigns">
                        View All
                    </Button>
                }
            >
                {campaigns.length === 0 ? (
                    <Empty 
                        description="No campaigns found"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                        <Button type="primary" href="/marketing/campaigns">
                            Create Your First Campaign
                        </Button>
                    </Empty>
                ) : (
                    <div>
                        {campaigns.slice(0, 5).map((campaign) => (
                            <Card 
                                key={campaign.id}
                                size="small"
                                style={{ marginBottom: 12 }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong>{campaign.name}</strong>
                                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                            {campaign.objective?.replace('OUTCOME_', '')}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <Tag color={campaign.status === 'ACTIVE' ? 'green' : 'default'}>
                                            {campaign.status}
                                        </Tag>
                                        {campaign.daily_budget && (
                                            <div style={{ fontSize: 12, marginTop: 4 }}>
                                                Budget: {adAccount?.currency} {(campaign.daily_budget / 100).toFixed(2)}/day
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </Card>

            {/* Quick Actions */}
            <Card title="Quick Actions" style={{ marginTop: 24 }}>
                <Row gutter={[16,16]}>
  <Col xs={24} sm={12} md={8}>
    <Button type="primary" block href="/marketing/campaigns">
      Manage Campaigns
    </Button>
  </Col>

  <Col xs={24} sm={12} md={8}>
    <Button block href="/marketing/whatsapp">
      WhatsApp Campaign
    </Button>
  </Col>

  <Col xs={24} sm={12} md={8}>
    <Button block icon={<LinkOutlined />} onClick={handleConnectMeta}>
      Reconnect Account
    </Button>
  </Col>
</Row>
            </Card>
        </div>
    );
};

export default MarketingDashboard;
