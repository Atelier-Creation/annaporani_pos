// utils/password.js
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 * @param {string} plainPassword
 * @returns {Promise<string>} hashed password
 */
export const hashPassword = async (plainPassword) => {
  const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  return hash;
};

/**
 * Compare a plain text password with a hash
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>} true if match
 */
export const verifyPassword = async (plainPassword, hashedPassword) => {
  
  const match = await bcrypt.compare(plainPassword, hashedPassword);
  return match;
};


