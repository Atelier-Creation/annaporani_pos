import * as metaService from '../service/meta.service.js';

/**
 * Test Meta Marketing API connection
 * Uses sandbox ad account and access token from environment
 */
export const testMetaConnection = async (req, res) => {
    try {
        const adAccountId = process.env.META_SANDBOX_AD_ACCOUNT_ID;
        const accessToken = process.env.META_SANDBOX_ACCESS_TOKEN;

        if (!adAccountId || !accessToken) {
            return res.sendError('Meta sandbox credentials not configured. Please set META_SANDBOX_AD_ACCOUNT_ID and META_SANDBOX_ACCESS_TOKEN in .env', 500);
        }

        const result = await metaService.testConnection(adAccountId, accessToken);

        if (result.success) {
            return res.sendSuccess(result.data, result.message);
        } else {
            return res.sendError(result.message, 500, result.error);
        }
    } catch (error) {
        console.error('Test Meta Connection Error:', error);
        return res.sendError('Failed to test Meta API connection', 500);
    }
};

/**
 * Get ad account details
 */
export const getAdAccount = async (req, res) => {
    try {
        const adAccountId = process.env.META_SANDBOX_AD_ACCOUNT_ID;
        const accessToken = process.env.META_SANDBOX_ACCESS_TOKEN;

        if (!adAccountId || !accessToken) {
            return res.sendError('Meta sandbox credentials not configured', 500);
        }

        const account = await metaService.getAdAccount(adAccountId, accessToken);
        return res.sendSuccess(account, 'Ad account retrieved successfully');
    } catch (error) {
        console.error('Get Ad Account Error:', error);
        return res.sendError(error.message || 'Failed to fetch ad account', 500);
    }
};

/**
 * Get all campaigns
 */
export const getCampaigns = async (req, res) => {
    try {
        const adAccountId = process.env.META_SANDBOX_AD_ACCOUNT_ID;
        const accessToken = process.env.META_SANDBOX_ACCESS_TOKEN;

        if (!adAccountId || !accessToken) {
            return res.sendError('Meta sandbox credentials not configured', 500);
        }

        const campaigns = await metaService.getCampaigns(adAccountId, accessToken);
        return res.sendSuccess(campaigns, 'Campaigns retrieved successfully');
    } catch (error) {
        console.error('Get Campaigns Error:', error);
        return res.sendError(error.message || 'Failed to fetch campaigns', 500);
    }
};

/**
 * Get campaign insights
 */
export const getCampaignInsights = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { date_preset, time_range } = req.query;
        const accessToken = process.env.META_SANDBOX_ACCESS_TOKEN;

        if (!accessToken) {
            return res.sendError('Meta sandbox access token not configured', 500);
        }

        const options = {};
        if (date_preset) options.date_preset = date_preset;
        if (time_range) options.time_range = JSON.parse(time_range);

        const insights = await metaService.getCampaignInsights(campaignId, accessToken, options);
        return res.sendSuccess(insights, 'Campaign insights retrieved successfully');
    } catch (error) {
        console.error('Get Campaign Insights Error:', error);
        return res.sendError(error.message || 'Failed to fetch campaign insights', 500);
    }
};

/**
 * Get ad account insights (overall performance)
 */
export const getAdAccountInsights = async (req, res) => {
    try {
        const adAccountId = process.env.META_SANDBOX_AD_ACCOUNT_ID;
        const accessToken = process.env.META_SANDBOX_ACCESS_TOKEN;
        const { date_preset, time_range } = req.query;

        if (!adAccountId || !accessToken) {
            return res.sendError('Meta sandbox credentials not configured', 500);
        }

        const options = {};
        if (date_preset) options.date_preset = date_preset;
        if (time_range) options.time_range = JSON.parse(time_range);

        const insights = await metaService.getAdAccountInsights(adAccountId, accessToken, options);
        return res.sendSuccess(insights, 'Ad account insights retrieved successfully');
    } catch (error) {
        console.error('Get Ad Account Insights Error:', error);
        return res.sendError(error.message || 'Failed to fetch ad account insights', 500);
    }
};

/**
 * Get all ad sets
 */
export const getAdSets = async (req, res) => {
    try {
        const adAccountId = process.env.META_SANDBOX_AD_ACCOUNT_ID;
        const accessToken = process.env.META_SANDBOX_ACCESS_TOKEN;

        if (!adAccountId || !accessToken) {
            return res.sendError('Meta sandbox credentials not configured', 500);
        }

        const adSets = await metaService.getAdSets(adAccountId, accessToken);
        return res.sendSuccess(adSets, 'Ad sets retrieved successfully');
    } catch (error) {
        console.error('Get Ad Sets Error:', error);
        return res.sendError(error.message || 'Failed to fetch ad sets', 500);
    }
};

/**
 * Get all ads
 */
export const getAds = async (req, res) => {
    try {
        const adAccountId = process.env.META_SANDBOX_AD_ACCOUNT_ID;
        const accessToken = process.env.META_SANDBOX_ACCESS_TOKEN;

        if (!adAccountId || !accessToken) {
            return res.sendError('Meta sandbox credentials not configured', 500);
        }

        const ads = await metaService.getAds(adAccountId, accessToken);
        return res.sendSuccess(ads, 'Ads retrieved successfully');
    } catch (error) {
        console.error('Get Ads Error:', error);
        return res.sendError(error.message || 'Failed to fetch ads', 500);
    }
};

/**
 * Create a new campaign
 */
export const createCampaign = async (req, res) => {
    try {
        const adAccountId = process.env.META_SANDBOX_AD_ACCOUNT_ID;
        const accessToken = process.env.META_SANDBOX_ACCESS_TOKEN;
        const campaignData = req.body;

        if (!adAccountId || !accessToken) {
            return res.sendError('Meta sandbox credentials not configured', 500);
        }

        if (!campaignData.name || !campaignData.objective) {
            return res.sendError('Campaign name and objective are required', 400);
        }

        const campaign = await metaService.createCampaign(adAccountId, accessToken, campaignData);
        return res.sendSuccess(campaign, 'Campaign created successfully');
    } catch (error) {
        console.error('Create Campaign Error:', error);
        return res.sendError(error.message || 'Failed to create campaign', 500);
    }
};

/**
 * Update campaign status
 */
export const updateCampaignStatus = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { status } = req.body;
        const accessToken = process.env.META_SANDBOX_ACCESS_TOKEN;

        if (!accessToken) {
            return res.sendError('Meta sandbox access token not configured', 500);
        }

        if (!status || !['ACTIVE', 'PAUSED', 'DELETED'].includes(status)) {
            return res.sendError('Valid status is required (ACTIVE, PAUSED, or DELETED)', 400);
        }

        const result = await metaService.updateCampaignStatus(campaignId, accessToken, status);
        return res.sendSuccess(result, 'Campaign status updated successfully');
    } catch (error) {
        console.error('Update Campaign Status Error:', error);
        return res.sendError(error.message || 'Failed to update campaign status', 500);
    }
};

/**
 * Get custom audiences
 */
export const getCustomAudiences = async (req, res) => {
    try {
        const adAccountId = process.env.META_SANDBOX_AD_ACCOUNT_ID;
        const accessToken = process.env.META_SANDBOX_ACCESS_TOKEN;

        if (!adAccountId || !accessToken) {
            return res.sendError('Meta sandbox credentials not configured', 500);
        }

        const audiences = await metaService.getCustomAudiences(adAccountId, accessToken);
        return res.sendSuccess(audiences, 'Custom audiences retrieved successfully');
    } catch (error) {
        console.error('Get Custom Audiences Error:', error);
        return res.sendError(error.message || 'Failed to fetch custom audiences', 500);
    }
};
