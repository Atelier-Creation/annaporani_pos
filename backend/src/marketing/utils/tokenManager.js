import axios from 'axios';
import { AdPlatformConnection } from '../models/index.js';
import { encrypt, decrypt } from '../../utils/encryption.js';

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_API_VERSION = process.env.META_API_VERSION || 'v19.0';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

/**
 * Checks if a token is expired or about to expire (within 1 hour)
 */
export const isTokenExpired = (expiresAt) => {
    if (!expiresAt) return false;
    const now = new Date();
    const expiryDate = new Date(expiresAt);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    return expiryDate <= oneHourFromNow;
};

/**
 * Gets a valid access token for a platform connection
 * Automatically refreshes if expired (for Google)
 */
export const getValidAccessToken = async (connectionId) => {
    const connection = await AdPlatformConnection.findByPk(connectionId);
    
    if (!connection) {
        throw new Error('Connection not found');
    }

    // Check if token is expired
    if (isTokenExpired(connection.token_expires_at)) {
        if (connection.platform === 'GOOGLE' && connection.encrypted_refresh_token) {
            // Refresh Google token
            return await refreshGoogleToken(connection);
        } else if (connection.platform === 'META') {
            // Meta tokens cannot be refreshed automatically
            // User needs to re-authenticate
            await connection.update({ status: 'EXPIRED' });
            throw new Error('Meta token expired. Please re-authenticate.');
        }
    }

    return decrypt(connection.encrypted_access_token);
};

/**
 * Refreshes a Google OAuth token using the refresh token
 */
const refreshGoogleToken = async (connection) => {
    try {
        const refreshToken = decrypt(connection.encrypted_refresh_token);

        const response = await axios.post('https://oauth2.googleapis.com/token', null, {
            params: {
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: 'refresh_token'
            }
        });

        const { access_token, expires_in } = response.data;
        const encryptedAccessToken = encrypt(access_token);
        const expiresAt = expires_in ? new Date(Date.now() + (expires_in * 1000)) : null;

        // Update the connection with new token
        await connection.update({
            encrypted_access_token: encryptedAccessToken,
            token_expires_at: expiresAt,
            status: 'ACTIVE'
        });

        return access_token;
    } catch (error) {
        console.error('Token refresh failed:', error?.response?.data || error.message);
        await connection.update({ status: 'EXPIRED' });
        throw new Error('Failed to refresh token. Please re-authenticate.');
    }
};

/**
 * Validates that all required OAuth environment variables are set
 */
export const validateOAuthConfig = (platform) => {
    const errors = [];

    if (platform === 'META' || platform === 'ALL') {
        if (!META_APP_ID) errors.push('META_APP_ID is not configured');
        if (!META_APP_SECRET) errors.push('META_APP_SECRET is not configured');
    }

    if (platform === 'GOOGLE' || platform === 'ALL') {
        if (!GOOGLE_CLIENT_ID) errors.push('GOOGLE_CLIENT_ID is not configured');
        if (!GOOGLE_CLIENT_SECRET) errors.push('GOOGLE_CLIENT_SECRET is not configured');
    }

    const encryptionKey = process.env.OAUTH_ENCRYPTION_KEY;
    if (!encryptionKey || encryptionKey.length !== 32) {
        errors.push('OAUTH_ENCRYPTION_KEY must be exactly 32 characters');
    }

    return {
        valid: errors.length === 0,
        errors
    };
};
