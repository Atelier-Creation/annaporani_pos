import axios from 'axios';
import Customer from '../../billing/models/customer.model.js';
import { AdPlatformConnection } from '../models/index.js';
import { decrypt } from '../../utils/encryption.js';

export const getEligibleCustomers = async (req, res) => {
    try {
        // Fetch all active customers with a phone number
        const customers = await Customer.findAll({
            where: {
                is_active: true
            },
            attributes: ['id', 'customer_name', 'customer_phone', 'customer_email', 'city']
        });

        // Filter those who actually have a phone number (just an extra safety check)
        const eligible = customers.filter(c => c.customer_phone && c.customer_phone.trim() !== '');

        return res.sendSuccess(eligible, 'Fetched eligible customers for WhatsApp campaign');
    } catch (error) {
        console.error("Error fetching customers for WhatsApp:", error);
        return res.sendError('Failed to fetch customers', 500);
    }
};

export const sendWhatsAppCampaign = async (req, res) => {
    const { campaignName, messageTemplate, customerIds } = req.body;

    if (!campaignName || !messageTemplate || !customerIds || !Array.isArray(customerIds)) {
        return res.sendError('Missing required fields: campaignName, messageTemplate, or customerIds array', 400);
    }

    try {
        // Find selected customers
        const customers = await Customer.findAll({
            where: {
                id: customerIds,
                is_active: true
            }
        });

        if (customers.length === 0) {
            return res.sendError('No valid customers found for the provided IDs', 404);
        }

        // Try to find the user's connected Meta account for the API Token
        // In a real app, use req.user.id to filter. Using a generic approach for MVP.
        const metaConnection = await AdPlatformConnection.findOne({
            where: { platform: 'META', status: 'ACTIVE' }
        });

        // 1. You can use the Access Token from the user's Meta Login (if scopes are approved)
        // 2. OR fallback to System Environment Variables (best for MVP/Single Business)
        const accessToken = metaConnection ? decrypt(metaConnection.encrypted_access_token) : process.env.META_WHATSAPP_ACCESS_TOKEN;
        const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

        let isSimulated = true;
        if (accessToken && phoneNumberId) {
            isSimulated = false;
        }

        let successCount = 0;
        let failureCount = 0;
        const results = [];

        // Note: WhatsApp Cloud API strictly requires "Pre-Approved Templates" for business-initiated campaigns.
        // For this MVP, we assume `messageTemplate` from the frontend perfectly matches your approved template NAME in Meta.
        const templateName = messageTemplate.trim().toLowerCase().replace(/\s+/g, '_'); // typical template naming convention

        for (const customer of customers) {
            // E.164 format: WhatsApp requires country code without '+' or '00' for Cloud API
            // Example: 919876543210
            let formattedPhone = customer.customer_phone.replace(/\D/g, '');
            if (formattedPhone.length === 10) {
                formattedPhone = `91${formattedPhone}`; // Default to India if exactly 10 digits
            }

            try {
                if (!isSimulated) {
                    // Send via Meta's Official WhatsApp Cloud API
                    // Graph API v19.0
                    const response = await axios.post(
                        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
                        {
                            messaging_product: "whatsapp",
                            to: formattedPhone,
                            type: "template",
                            template: {
                                name: templateName, // e.g., "diwali_promo_01"
                                language: {
                                    code: "en_US" // matches your template language
                                },
                                components: [
                                    {
                                        type: "body",
                                        parameters: [
                                            {
                                                type: "text",
                                                text: customer.customer_name || 'Customer' // This injects into the {{1}} variable in your Meta template
                                            }
                                        ]
                                    }
                                ]
                            }
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    results.push({ id: customer.id, name: customer.customer_name, status: 'Success', messageId: response.data?.messages?.[0]?.id });
                } else {
                    // Simulate Success
                    results.push({ id: customer.id, name: customer.customer_name, status: 'Simulated Success (Meta WA credentials missing)' });
                }
                successCount++;
            } catch (err) {
                console.error(`Failed to send WA to ${formattedPhone}:`, err?.response?.data || err.message);
                results.push({ id: customer.id, name: customer.customer_name, status: 'Failed', error: err?.response?.data?.error?.message || err.message });
                failureCount++;
            }
        }

        // Optional: Save this campaign to the database so it shows up in "Campaigns List"
        // Note: For WhatsApp campaigns, we don't have a specific AdPlatformConnection so we might skip the strict connection_id constraint or use a 'WhatsApp' system connection if created

        return res.sendSuccess({
            totalProcessed: customers.length,
            successCount,
            failureCount,
            isSimulated,
            details: results
        }, `WhatsApp Campaign Execution Complete. Sent: ${successCount}.`);

    } catch (error) {
        console.error("Error running WhatsApp Campaign:", error);
        return res.sendError('Failed to execute WhatsApp Campaign', 500);
    }
};
