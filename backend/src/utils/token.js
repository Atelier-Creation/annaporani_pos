// utils/token.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();


const JWT_SECRET = process.env.JWT_SECRET || '3540e43edf1f1ed4811552d2b0d5a9fd1b4b23b8b7f0c48c83c621ed103454a6';
const REFRESH_SECRET = process.env.REFRESH_SECRET || '7d9f2e4b1c8a3f6e0d5b2a9c4e7f1d3b8a6c2e5f9d1b4a7c0e3f6b9d2e5a8c1';
const EXPIRES_IN = '2h'; 
const REFRESH_EXPIRES_IN = '7d'; 
/*
 * Generate a JWT token with user payload
 * @param {object} payload - user data to encode in token
 * @returns {string} token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
};

export const decodeToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
};

export const decodeRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (err) {
    throw new Error("Invalid or expired refresh token");
  }
};