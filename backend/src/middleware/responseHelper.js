/**
 * @module responseHelper
 * @description Middleware to add standardized response methods to Express response object.
 * Adds:
 *   - res.sendSuccess(data, message?, meta?)
 *   - res.sendError(message, statusCode?, errors?, meta?)
 */

/**
 * @function responseHelper
 * @description Express middleware to extend the res object with custom response helpers.
 */
const responseHelper = (req, res, next) => {
  /**
   * Send a standardized success response.
   * @param {object} data - Main response data.
   * @param {string} [message='Success'] - Optional message.
   * @param {object|null} [meta=null] - Optional metadata (e.g., pagination).
   */
  res.sendSuccess = (data = {}, message = 'Success', meta = null) => {
    const response = {
      status: 'success',
      message,
      data,
    };

    if (meta) {
      response.meta = meta;
    }

    res.status(200).json(response);
  };

  /**
   * Send a standardized error response.
   * @param {string} message - Error message.
   * @param {number} [statusCode=500] - HTTP status code.
   * @param {object|array|null} [errors=null] - Detailed error messages or validation errors.
   * @param {object|null} [meta=null] - Optional metadata (e.g., trace ID).
   */
  res.sendError = (message = 'Internal Server Error', statusCode = 500, errors = null, meta = null) => {
    const response = {
      status: 'error',
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    if (meta) {
      response.meta = meta;
    }

    res.status(statusCode).json(response);
  };

  next();
};

export default responseHelper;



// import crypto from 'crypto';
// import dotenv from 'dotenv';

// dotenv.config();
// // Encryption configuration
// const ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
// const IV = 'abcdef9876543210abcdef9876543210'

// // Ensure key and IV are of correct length
// const key = Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32);
// const iv = Buffer.from(IV, 'hex').slice(0, 16);

// /**
//  * Encrypts data using AES-256-CBC.
//  * @param {object} data - Data to encrypt.
//  * @returns {string} Encrypted data as base64 string.
//  */
// const encryptData = (data) => {
//   const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
//   let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
//   encrypted += cipher.final('base64');
//   return encrypted;
// };

// /**
//  * Decrypts data using AES-256-CBC.
//  * @param {string} encryptedData - Encrypted data as base64 string.
//  * @returns {object} Decrypted data.
//  */
// const decryptData = (encryptedData) => {
//   const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
//   let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
//   decrypted += decipher.final('utf8');
//   return JSON.parse(decrypted);
// };

// /**
//  * @function responseHelper
//  * @description Express middleware to extend res with custom response helpers and encrypt all res.json responses.
//  */
// const responseHelper = (req, res, next) => {
//   // Store original res.json method
//   const originalJson = res.json;

//   // Override res.json to encrypt all responses
//   res.json = function (data) {
//     // const encryptedResponse = encryptData(data);
//     return originalJson.call(this, { encrypted: encryptedResponse });
//   };
  

 
//   res.sendSuccess = (data = {}, message = 'Success', meta = null) => {
//     const response = {
//       status: 'success',
//       message,
//       data,
//     };

//     if (meta) {
//       response.meta = meta;
//     }

//     res.status(200).json(response);
//   };

//   res.sendError = (message = 'Internal Server Error', statusCode = 500, errors = null, meta = null) => {
//     const response = {
//       status: 'error',
//       message,
//     };

//     if (errors) {
//       response.errors = errors;
//     }

//     if (meta) {
//       response.meta = meta;
//     }

//     res.status(statusCode).json(response);
//   };

//   next();
// };

// export const decryptResponse = (encryptedResponse) => {
//   try {
//     return decryptData(encryptedResponse);
//   } catch (error) {
//     throw new Error('Decryption failed: ' + error.message);
//   }
// };



// export const decryptRequest = (req, res, next) => {
//   try {
//     // If there's no body at all, or it's an empty object, just skip decryption
//     if (!req.body || Object.keys(req.body).length === 0) {
//       console.log("al")
//       return next();
//     }

//     const { encrypted } = req.body;
//     // If there's no `encrypted` field, assume it's already plaintext
//     if (!encrypted) {
//       return next();
//     }

//     const decrypted = decryptResponse(encrypted);
//     req.body = typeof decrypted === 'string'
//       ? JSON.parse(decrypted)
//       : decrypted;
//     console.log("decrypted", decrypted)

//     next();
//   } catch (err) {
//     console.error('🔐 Decryption middleware error:', err);
//     res.status(400).json({ message: err.message });
//   }
// };
// export default responseHelper;