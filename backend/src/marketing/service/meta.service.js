import axios from 'axios';
import { decrypt } from '../../utils/encryption.js';
import { getValidAccessToken } from '../utils/tokenManager.js';

// Meta Marketing API Configuration
const META_API_VERSION = process.env.META_API_VERSION || 'v25.0';
const META_GRAPH_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

/**
 * Meta Marketing API Service
 * Implements Meta Marketing API endpoints for ad management
 * Documentation: https://developers.facebook.com/docs/marketing-api
 */

/**
 * Get Ad Account information
 * @param {string} adAccountId - Ad Account ID (e.g., "act_1251803727055038")
 * @param {string} accessToken - Access token for authentication
 */
export const getAdAccount = async (adAccountId, accessToken) => {
    try {
        // Ensure ad account ID has 'act_' prefix
        const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
        
        const response = await axios.get(`${META_GRAPH_API_BASE}/${accountId}`, {
            params: {
                access_token: accessToken,
                fields: 'id,name,account_status,currency,timezone_name,business,amount_spent,balance,spend_cap'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Get Ad Account Error:', error?.response?.data || error.message);
        throw new Error(error?.response?.data?.error?.message || 'Failed to fetch ad account');
    }
};

/**
 * Get all campaigns for an ad account
 * @param {string} adAccountId - Ad Account ID
 * @param {string} accessToken - Access token
 */
export const getCampaigns = async (adAccountId, accessToken) => {
    try {
        const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
        
        const response = await axios.get(`${META_GRAPH_API_BASE}/${accountId}/campaigns`, {
            params: {
                access_token: accessToken,
                fields: 'id,name,objective,status,daily_budget,lifetime_budget,created_time,updated_time,start_time,stop_time',
                limit: 100
            }
        });

        return response.data;
    } catch (error) {
        console.error('Get Campaigns Error:', error?.response?.data || error.message);
        throw new Error(error?.response?.data?.error?.message || 'Failed to fetch campaigns');
    }
};

/**
 * Get campaign insights (performance metrics)
 * @param {string} campaignId - Campaign ID
 * @param {string} accessToken - Access token
 * @param {object} options - Query options (date_preset, time_range, etc.)
 */
export const getCampaignInsights = async (campaignId, accessToken, options = {}) => {
    try {
        const params = {
            access_token: accessToken,
            fields: 'campaign_id,campaign_name,impressions,clicks,spend,reach,frequency,cpc,cpm,ctr,conversions,cost_per_conversion',
            date_preset: options.date_preset || 'last_30d',
            level: 'campaign'
        };

        // Add time_range if provided
        if (options.time_range) {
            params.time_range = JSON.stringify(options.time_range);
            delete params.date_preset;
        }

        const response = await axios.get(`${META_GRAPH_API_BASE}/${campaignId}/insights`, {
            params
        });

        return response.data;
    } catch (error) {
        console.error('Get Campaign Insights Error:', error?.response?.data || error.message);
        throw new Error(error?.response?.data?.error?.message || 'Failed to fetch campaign insights');
    }
};

/**
 * Get ad account insights (overall performance)
 * @param {string} adAccountId - Ad Account ID
 * @param {string} accessToken - Access token
 * @param {object} options - Query options
 */
export const getAdAccountInsights = async (adAccountId, accessToken, options = {}) => {
    try {
        const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
        
        const params = {
            access_token: accessToken,
            fields: 'impressions,clicks,spend,reach,frequency,cpc,cpm,ctr,conversions,cost_per_conversion,actions,action_values',
            date_preset: options.date_preset || 'last_30d',
            level: 'account'
        };

        if (options.time_range) {
            params.time_range = JSON.stringify(options.time_range);
            delete params.date_preset;
        }

        const response = await axios.get(`${META_GRAPH_API_BASE}/${accountId}/insights`, {
            params
        });

        return response.data;
    } catch (error) {
        console.error('Get Ad Account Insights Error:', error?.response?.data || error.message);
        throw new Error(error?.response?.data?.error?.message || 'Failed to fetch ad account insights');
    }
};

/**
 * Get all ad sets for an ad account
 * @param {string} adAccountId - Ad Account ID
 * @param {string} accessToken - Access token
 */
export const getAdSets = async (adAccountId, accessToken) => {
    try {
        const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
        
        const response = await axios.get(`${META_GRAPH_API_BASE}/${accountId}/adsets`, {
            params: {
                access_token: accessToken,
                fields: 'id,name,campaign_id,status,daily_budget,lifetime_budget,targeting,optimization_goal,billing_event,bid_amount,created_time,updated_time',
                limit: 100
            }
        });

        return response.data;
    } catch (error) {
        console.error('Get Ad Sets Error:', error?.response?.data || error.message);
        throw new Error(error?.response?.data?.error?.message || 'Failed to fetch ad sets');
    }
};

/**
 * Get all ads for an ad account
 * @param {string} adAccountId - Ad Account ID
 * @param {string} accessToken - Access token
 */
export const getAds = async (adAccountId, accessToken) => {
    try {
        const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
        
        const response = await axios.get(`${META_GRAPH_API_BASE}/${accountId}/ads`, {
            params: {
                access_token: accessToken,
                fields: 'id,name,adset_id,campaign_id,status,creative,created_time,updated_time',
                limit: 100
            }
        });

        return response.data;
    } catch (error) {
        console.error('Get Ads Error:', error?.response?.data || error.message);
        throw new Error(error?.response?.data?.error?.message || 'Failed to fetch ads');
    }
};

/**
 * Create a new campaign
 * @param {string} adAccountId - Ad Account ID
 * @param {string} accessToken - Access token
 * @param {object} campaignData - Campaign configuration
 */
export const createCampaign = async (adAccountId, accessToken, campaignData) => {
    try {
        const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
        
        const response = await axios.post(`${META_GRAPH_API_BASE}/${accountId}/campaigns`, null, {
            params: {
                access_token: accessToken,
                name: campaignData.name,
                objective: campaignData.objective, // e.g., 'OUTCOME_TRAFFIC', 'OUTCOME_SALES', 'OUTCOME_AWARENESS'
                status: campaignData.status || 'PAUSED',
                special_ad_categories: campaignData.special_ad_categories || []
            }
        });

        return response.data;
    } catch (error) {
        console.error('Create Campaign Error:', error?.response?.data || error.message);
        throw new Error(error?.response?.data?.error?.message || 'Failed to create campaign');
    }
};

/**
 * Update campaign status (pause, resume, delete)
 * @param {string} campaignId - Campaign ID
 * @param {string} accessToken - Access token
 * @param {string} status - New status ('ACTIVE', 'PAUSED', 'DELETED')
 */
export const updateCampaignStatus = async (campaignId, accessToken, status) => {
    try {
        const response = await axios.post(`${META_GRAPH_API_BASE}/${campaignId}`, null, {
            params: {
                access_token: accessToken,
                status: status
            }
        });

        return response.data;
    } catch (error) {
        console.error('Update Campaign Status Error:', error?.response?.data || error.message);
        throw new Error(error?.response?.data?.error?.message || 'Failed to update campaign status');
    }
};

/**
 * Get custom audiences for targeting
 * @param {string} adAccountId - Ad Account ID
 * @param {string} accessToken - Access token
 */
export const getCustomAudiences = async (adAccountId, accessToken) => {
    try {
        const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
        
        const response = await axios.get(`${META_GRAPH_API_BASE}/${accountId}/customaudiences`, {
            params: {
                access_token: accessToken,
                fields: 'id,name,description,subtype,approximate_count,delivery_status,operation_status',
                limit: 100
            }
        });

        return response.data;
    } catch (error) {
        console.error('Get Custom Audiences Error:', error?.response?.data || error.message);
        throw new Error(error?.response?.data?.error?.message || 'Failed to fetch custom audiences');
    }
};

/**
 * Test API connection with sandbox ad account
 * @param {string} adAccountId - Sandbox Ad Account ID
 * @param {string} accessToken - Access token
 */
export const testConnection = async (adAccountId, accessToken) => {
    try {
        const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
        
        const response = await axios.get(`${META_GRAPH_API_BASE}/${accountId}`, {
            params: {
                access_token: accessToken,
                fields: 'id,name,account_status'
            }
        });

        return {
            success: true,
            message: 'Successfully connected to Meta Marketing API',
            data: response.data
        };
    } catch (error) {
        console.error('Test Connection Error:', error?.response?.data || error.message);
        return {
            success: false,
            message: error?.response?.data?.error?.message || 'Failed to connect to Meta Marketing API',
            error: error?.response?.data
        };
    }
};
