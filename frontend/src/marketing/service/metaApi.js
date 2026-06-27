import api from '../../api/api';

/**
 * Meta Marketing API Service
 * Handles all Meta (Facebook/Instagram) advertising API calls
 */

// Test Meta API connection
export const testMetaConnection = async () => {
    const response = await api.get('/marketing/meta/test');
    return response.data;
};

// Get ad account details
export const getAdAccount = async () => {
    const response = await api.get('/marketing/meta/account');
    return response.data;
};

// Get all campaigns
export const getCampaigns = async () => {
    const response = await api.get('/marketing/meta/campaigns');
    return response.data;
};

// Get campaign insights
export const getCampaignInsights = async (campaignId, datePreset = 'last_30d') => {
    const response = await api.get(`/marketing/meta/campaigns/${campaignId}/insights`, {
        params: { date_preset: datePreset }
    });
    return response.data;
};

// Get ad account insights
export const getAdAccountInsights = async (datePreset = 'last_30d') => {
    const response = await api.get('/marketing/meta/insights', {
        params: { date_preset: datePreset }
    });
    return response.data;
};

// Get all ad sets
export const getAdSets = async () => {
    const response = await api.get('/marketing/meta/adsets');
    return response.data;
};

// Get all ads
export const getAds = async () => {
    const response = await api.get('/marketing/meta/ads');
    return response.data;
};

// Create a new campaign
export const createCampaign = async (campaignData) => {
    const response = await api.post('/marketing/meta/campaigns', campaignData);
    return response.data;
};

// Update campaign status
export const updateCampaignStatus = async (campaignId, status) => {
    const response = await api.patch(`/marketing/meta/campaigns/${campaignId}/status`, { status });
    return response.data;
};

// Get custom audiences
export const getCustomAudiences = async () => {
    const response = await api.get('/marketing/meta/audiences');
    return response.data;
};

// OAuth - Initiate Meta authentication
export const initiateMetaAuth = () => {
    window.location.href = `${api.defaults.baseURL}/marketing/oauth/meta`;
};

// Disconnect Meta account
export const disconnectMeta = async (connectionId) => {
    const response = await api.post('/marketing/oauth/meta/disconnect', { connectionId });
    return response.data;
};
