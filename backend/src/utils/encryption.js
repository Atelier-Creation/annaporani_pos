import crypto from 'crypto';

// Get encryption key from env, MUST be 32 bytes (256 bits)
// For dev fallback, we use a static string, but this MUST be changed in production
const ENCRYPTION_KEY = process.env.OAUTH_ENCRYPTION_KEY || 'default_dev_key_must_change_32b_';
const ALGORITHM = 'aes-256-gcm';

if (ENCRYPTION_KEY.length !== 32) {
    console.error("CRITICAL ERROR: OAUTH_ENCRYPTION_KEY must be exactly 32 bytes long.");
}

/**
 * Encrypts a string using AES-256-GCM.
 * @param {string} text - The plaintext to encrypt.
 * @returns {string} - The encrypted string formatted as "iv:encryptedData:authTag"
 */
export const encrypt = (text) => {
    try {
        if (!text) return null;

        // Generate a random initialization vector (IV) for each encryption
        const iv = crypto.randomBytes(16);

        // Create cipher
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);

        // Encrypt data
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Get authentication tag (ensures data integrity)
        const authTag = cipher.getAuthTag().toString('hex');

        // Return format: iv:encryptedData:authTag
        return `${iv.toString('hex')}:${encrypted}:${authTag}`;
    } catch (error) {
        console.error("Encryption Error:", error);
        throw new Error("Failed to encrypt token");
    }
};

/**
 * Decrypts a string that was encrypted with encrypt()
 * @param {string} encryptedText - Formatted as "iv:encryptedData:authTag"
 * @returns {string} - The decrypted plaintext
 */
export const decrypt = (encryptedText) => {
    try {
        if (!encryptedText) return null;

        // Split the encrypted structure
        const textParts = encryptedText.split(':');
        if (textParts.length !== 3) {
            throw new Error("Invalid encrypted text format");
        }

        const iv = Buffer.from(textParts[0], 'hex');
        const encryptedData = Buffer.from(textParts[1], 'hex');
        const authTag = Buffer.from(textParts[2], 'hex');

        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        decipher.setAuthTag(authTag);

        // Decrypt data
        let decrypted = decipher.update(encryptedData, undefined, 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error("Decryption Error:", error);
        throw new Error("Failed to decrypt token. Key might have changed or data is corrupted.");
    }
};
