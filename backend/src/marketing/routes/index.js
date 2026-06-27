import express from 'express';

const router = express.Router();

import { initiateMetaAuth, handleMetaCallback, disconnectMeta, initiateGoogleAuth, handleGoogleCallback, disconnectGoogle } from '../controllers/oauth.controller.js';
import { getEligibleCustomers, sendWhatsAppCampaign } from '../controllers/whatsapp.controller.js';
import * as metaController from '../controllers/meta.controller.js';

// Mock endpoints for the Marketing module
router.get('/marketing/dashboard', (req, res) => {
    res.json({
        success: true,
        message: 'Marketing dashboard data',
        data: []
    });
});

// Meta OAuth Routes
router.get('/marketing/oauth/meta', initiateMetaAuth);
router.get('/marketing/oauth/meta/callback', handleMetaCallback);
router.post('/marketing/oauth/meta/disconnect', disconnectMeta);

// Google OAuth Routes
router.get('/marketing/oauth/google', initiateGoogleAuth);
router.get('/marketing/oauth/google/callback', handleGoogleCallback);
router.post('/marketing/oauth/google/disconnect', disconnectGoogle);

// Meta Marketing API Routes
router.get('/marketing/meta/test', metaController.testMetaConnection);
router.get('/marketing/meta/account', metaController.getAdAccount);
router.get('/marketing/meta/campaigns', metaController.getCampaigns);
router.get('/marketing/meta/campaigns/:campaignId/insights', metaController.getCampaignInsights);
router.get('/marketing/meta/insights', metaController.getAdAccountInsights);
router.get('/marketing/meta/adsets', metaController.getAdSets);
router.get('/marketing/meta/ads', metaController.getAds);
router.post('/marketing/meta/campaigns', metaController.createCampaign);
router.patch('/marketing/meta/campaigns/:campaignId/status', metaController.updateCampaignStatus);
router.get('/marketing/meta/audiences', metaController.getCustomAudiences);

router.get('/marketing/campaigns', (req, res) => {
    res.json({
        success: true,
        message: 'Retrieved campaigns',
        data: []
    });
});

// WhatsApp Campaign Routes
router.get('/marketing/whatsapp/customers', getEligibleCustomers);
router.post('/marketing/whatsapp/send', sendWhatsAppCampaign);

export default router;
