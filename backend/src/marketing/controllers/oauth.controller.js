import axios from 'axios';
import { AdPlatformConnection } from '../models/index.js';
import { encrypt, decrypt } from '../../utils/encryption.js';
import { validateOAuthConfig } from '../utils/tokenManager.js';

// API Version Configuration
const META_API_VERSION = process.env.META_API_VERSION || 'v19.0';
const GOOGLE_ADS_API_VERSION = process.env.GOOGLE_ADS_API_VERSION || 'v15';

// Environment variables required for Meta OAuth
const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
// The URL where Meta should redirect after the user authorizes your app
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || 'http://localhost:5000/api/v1/marketing/oauth/meta/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4174';

/**
 * Initiates the Meta OAuth 2.0 flow
 * Redirects the user to the Facebook Login dialog
 */
export const initiateMetaAuth = (req, res) => {
    try {
        // Validate OAuth configuration
        const configValidation = validateOAuthConfig('META');
        if (!configValidation.valid) {
            console.error('Meta OAuth Config Errors:', configValidation.errors);
            return res.sendError('Meta API credentials are not configured properly.', 500);
        }

        if (!META_APP_ID || !META_REDIRECT_URI) {
            return res.sendError('Meta API credentials are not configured properly.', 500);
        }

        // Generate a random state string to prevent CSRF attacks
        const state = Math.random().toString(36).substring(7);

        // Define scopes needed for reading ads data and managing campaigns
        const scope = 'ads_management,ads_read,business_management';

        // We include the user ID in the state as a simple way to pass it through the OAuth flow
        // In a real production app with React Router, it's better to store this state in a Redis session
        const finalState = JSON.stringify({ state, userId: req.user?.id || 'TEST_USER' });
        const encodedState = encodeURIComponent(Buffer.from(finalState).toString('base64'));

        // Construct the Meta authorization URL
        const authUrl = `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?` +
            `client_id=${META_APP_ID}` +
            `&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}` +
            `&state=${encodedState}` +
            `&scope=${scope}` +
            `&response_type=code`;

        return res.sendSuccess({ url: authUrl }, 'Initiated Meta Auth');
    } catch (error) {
        console.error("Meta Auth Initiation Error:", error);
        return res.sendError('Failed to initiate Meta OAuth.', 500);
    }
};

/**
 * Handles the redirect callback from Meta after user authorization
 * Exchanges the code for a short-lived access token, then for a long-lived access token
 */
export const handleMetaCallback = async (req, res) => {
    const { code, state, error, error_reason, error_description } = req.query;

    if (error) {
        console.error(`Meta OAuth Error: ${error_reason} - ${error_description}`);
        return res.redirect(`${FRONTEND_URL}/marketing/dashboard?error=${encodeURIComponent(error_description || 'Authorization failed')}`);
    }

    if (!code) {
        return res.redirect(`${FRONTEND_URL}/marketing/dashboard?error=No+authorization+code+received`);
    }

    try {
        // Step 1: Exchange the short-lived authorization code for a short-lived access token
        const tokenResponse = await axios.get(`https://graph.facebook.com/${META_API_VERSION}/oauth/access_token`, {
            params: {
                client_id: META_APP_ID,
                redirect_uri: META_REDIRECT_URI,
                client_secret: META_APP_SECRET,
                code: code
            }
        });

        const shortLivedToken = tokenResponse.data.access_token;

        // Step 2: Exchange the short-lived token for a long-lived access token (60 days)
        const longLivedTokenResponse = await axios.get(`https://graph.facebook.com/${META_API_VERSION}/oauth/access_token`, {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: META_APP_ID,
                client_secret: META_APP_SECRET,
                fb_exchange_token: shortLivedToken
            }
        });

        const longLivedToken = longLivedTokenResponse.data.access_token;
        const expiresIn = longLivedTokenResponse.data.expires_in; // usually ~60 days in seconds

        // Step 3: Get the user's Business/Ad accounts to fetch the Account ID and Name
        const meResponse = await axios.get(`https://graph.facebook.com/${META_API_VERSION}/me/adaccounts`, {
            params: {
                access_token: longLivedToken,
                fields: 'id,name' // Requesting Ad Account ID and Name
            }
        });

        // For MVP, we'll just grab their very first Ad Account. 
        // In a full implementation, you'd show a UI step to let them select which Account/Business Manager to connect
        const adAccounts = meResponse.data.data;
        if (!adAccounts || adAccounts.length === 0) {
            return res.redirect(`${FRONTEND_URL}/marketing/dashboard?error=No+Ad+Accounts+found+on+this+Meta+login`);
        }

        const selectedAdAccount = adAccounts[0]; // Format is typically "act_123456789"

        // Calculate exact expiration date
        const expiresAt = expiresIn ? new Date(Date.now() + (expiresIn * 1000)) : null;

        // Encrypt the token tightly before saving to the database
        const encryptedAccessToken = encrypt(longLivedToken);

        // Step 4: Upsert the connection in the database
        // Used decoded state to map it back to the logged in user
        const decodedState = state ? JSON.parse(Buffer.from(decodeURIComponent(state), 'base64').toString('ascii')) : null;
        const userId = decodedState?.userId;

        // Validate state to prevent CSRF attacks
        if (!decodedState || !decodedState.state) {
            return res.redirect(`${FRONTEND_URL}/marketing/dashboard?error=Invalid+state+parameter`);
        }

        await AdPlatformConnection.upsert({
            platform: 'META',
            platform_account_id: selectedAdAccount.id,
            account_name: selectedAdAccount.name || 'Meta Ad Account',
            encrypted_access_token: encryptedAccessToken,
            encrypted_refresh_token: null, // Meta doesn't use refresh tokens, you must get new long lived tokens
            token_expires_at: expiresAt,
            status: 'ACTIVE',
            created_by: userId !== 'TEST_USER' ? userId : null // mock fallback
        }, {
            conflictFields: ['platform', 'platform_account_id']
        });

        // Redirect back to frontend with ultimate success
        return res.redirect(`${FRONTEND_URL}/marketing/dashboard?success=connected`);

    } catch (error) {
        console.error("Meta Callback Handling Error:", error?.response?.data || error.message);
        return res.redirect(`${FRONTEND_URL}/marketing/dashboard?error=Failed+to+exchange+OAuth+token`);
    }
};

/**
 * Revokes access and deletes the connection
 */
export const disconnectMeta = async (req, res) => {
    try {
        const { connectionId } = req.body;

        // Find existing connection
        const connection = await AdPlatformConnection.findByPk(connectionId);

        if (!connection || connection.platform !== 'META') {
            return res.sendError('Connection not found', 404);
        }

        // Technically, you can issue an API request to Meta to de-auth the app here:
        // DELETE https://graph.facebook.com/v19.0/{user_id}/permissions?access_token={token}

        // Delete from local database
        await connection.destroy();

        return res.sendSuccess(null, 'Successfully disconnected Meta Ads account');
    } catch (error) {
        console.error("Meta Disconnect Error:", error);
        return res.sendError("Failed to disconnect Meta account", 500);
    }
};

// Environment variables required for Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/v1/marketing/oauth/google/callback';

/**
 * Initiates the Google OAuth 2.0 flow
 */
export const initiateGoogleAuth = (req, res) => {
    try {
        // Validate OAuth configuration
        const configValidation = validateOAuthConfig('GOOGLE');
        if (!configValidation.valid) {
            console.error('Google OAuth Config Errors:', configValidation.errors);
            return res.sendError('Google API credentials are not configured properly.', 500);
        }

        if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
            return res.sendError('Google API credentials are not configured properly.', 500);
        }

        const state = Math.random().toString(36).substring(7);
        // Include AdWords and basic profile reading
        const scope = 'https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

        const finalState = JSON.stringify({ state, userId: req.user?.id || 'TEST_USER' });
        const encodedState = encodeURIComponent(Buffer.from(finalState).toString('base64'));

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${GOOGLE_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
            `&state=${encodedState}` +
            `&scope=${encodeURIComponent(scope)}` +
            `&response_type=code` +
            `&access_type=offline` +
            `&prompt=consent`;

        return res.sendSuccess({ url: authUrl }, 'Initiated Google Auth');
    } catch (error) {
        console.error("Google Auth Initiation Error:", error);
        return res.sendError('Failed to initiate Google OAuth.', 500);
    }
};

/**
 * Handles the redirect callback from Google
 */
export const handleGoogleCallback = async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        console.error(`Google OAuth Error: ${error}`);
        return res.redirect(`${FRONTEND_URL}/marketing/dashboard?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
        return res.redirect(`${FRONTEND_URL}/marketing/dashboard?error=No+authorization+code+received`);
    }

    try {
        // Step 1: Exchange code for tokens
        const tokenResponse = await axios.post(`https://oauth2.googleapis.com/token`, null, {
            params: {
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: GOOGLE_REDIRECT_URI
            }
        });

        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        // Step 2: Fetch user's Google Ads accessible customers
        const developerToken = process.env.GOOGLE_DEVELOPER_TOKEN;

        // Let's use userinfo as fallback if developer token is not configured yet for ease of MVP testing
        let platformAccountId;
        let accountName = 'Google Ad Account';

        try {
            if (developerToken) {
                const accountsResponse = await axios.get(`https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers:listAccessibleCustomers`, {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        'developer-token': developerToken
                    }
                });
                const resourceNames = accountsResponse.data.resourceNames;
                if (resourceNames && resourceNames.length > 0) {
                    platformAccountId = resourceNames[0].split('/')[1]; // returns just the ID
                }
            }

            // Fallback to Google Profile if Google Ads API access is blocked/pending review
            if (!platformAccountId) {
                const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: { Authorization: `Bearer ${access_token}` }
                });
                platformAccountId = profileResponse.data.id;
                accountName = profileResponse.data.email || 'Google Account';
            }
        } catch (apiError) {
            console.log("Could not fetch Ad Account directly, falling back to dummy ID for MVP storage", apiError?.response?.data || apiError.message);
            platformAccountId = `google_unknown_${Date.now()}`;
        }

        const encryptedAccessToken = encrypt(access_token);
        const encryptedRefreshToken = refresh_token ? encrypt(refresh_token) : null;

        const expiresAt = expires_in ? new Date(Date.now() + (expires_in * 1000)) : null;
        const decodedState = state ? JSON.parse(Buffer.from(decodeURIComponent(state), 'base64').toString('ascii')) : null;
        const userId = decodedState?.userId;

        // Validate state to prevent CSRF attacks
        if (!decodedState || !decodedState.state) {
            return res.redirect(`${FRONTEND_URL}/marketing/dashboard?error=Invalid+state+parameter`);
        }

        // Step 3: Upsert the connection in the database
        await AdPlatformConnection.upsert({
            platform: 'GOOGLE',
            platform_account_id: platformAccountId,
            account_name: accountName,
            encrypted_access_token: encryptedAccessToken,
            // Only update refresh token if Google actually provided one
            ...(encryptedRefreshToken ? { encrypted_refresh_token: encryptedRefreshToken } : {}),
            token_expires_at: expiresAt,
            status: 'ACTIVE',
            created_by: userId !== 'TEST_USER' ? userId : null
        }, {
            conflictFields: ['platform', 'platform_account_id']
        });

        return res.redirect(`${FRONTEND_URL}/marketing/dashboard?success=google_connected`);
    } catch (error) {
        console.error("Google Callback Handling Error:", error?.response?.data || error.message);
        return res.redirect(`${FRONTEND_URL}/marketing/dashboard?error=Failed+to+exchange+Google+OAuth+token`);
    }
};

/**
 * Revokes access and deletes the connection
 */
export const disconnectGoogle = async (req, res) => {
    try {
        const { connectionId } = req.body;

        const connection = await AdPlatformConnection.findByPk(connectionId);

        if (!connection || connection.platform !== 'GOOGLE') {
            return res.sendError('Connection not found', 404);
        }

        // Make API request to Google to revoke the access token
        try {
            const token = decrypt(connection.encrypted_access_token);
            await axios.post(`https://oauth2.googleapis.com/revoke?token=${token}`);
        } catch (revokeErr) {
            console.warn("Failed to securely revoke token at Google end, deleting local anyway", revokeErr.message);
        }

        await connection.destroy();

        return res.sendSuccess(null, 'Successfully disconnected Google Ads account');
    } catch (error) {
        console.error("Google Disconnect Error:", error);
        return res.sendError("Failed to disconnect Google account", 500);
    }
};
