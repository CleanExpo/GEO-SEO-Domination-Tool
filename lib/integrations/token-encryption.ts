/**
 * Token Encryption Utilities
 * Encrypts/decrypts OAuth tokens before storing in database
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get encryption key from environment
 * In production, this should be a secure random key stored in env vars
 */
function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
  
  if (!key) {
    // For development only - generate a temporary key
    console.warn('⚠️  TOKEN_ENCRYPTION_KEY not set. Using temporary key (DO NOT USE IN PRODUCTION)');
    return crypto.randomBytes(KEY_LENGTH);
  }
  
  // Derive key from provided string
  return crypto.scryptSync(key, 'salt', KEY_LENGTH);
}

/**
 * Encrypt a token
 */
export function encryptToken(token: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine: salt + iv + tag + encrypted
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex')
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('Token encryption error:', error);
    throw new Error('Failed to encrypt token');
  }
}

/**
 * Decrypt a token
 */
export function decryptToken(encryptedToken: string): string {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedToken, 'base64');
    
    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    );
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Token decryption error:', error);
    throw new Error('Failed to decrypt token');
  }
}

/**
 * Generate a secure encryption key for .env
 * Run this once and add to your .env file
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate that encryption/decryption works
 */
export function validateEncryption(): boolean {
  try {
    const testToken = 'test-token-' + Date.now();
    const encrypted = encryptToken(testToken);
    const decrypted = decryptToken(encrypted);
    return testToken === decrypted;
  } catch {
    return false;
  }
}
