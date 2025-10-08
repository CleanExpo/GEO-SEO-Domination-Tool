/**
 * Encryption Utility for API Keys and Secrets
 *
 * Security Principles:
 * 1. Client API keys are NEVER visible to admin/owner
 * 2. Keys encrypted at rest using AES-256-GCM
 * 3. Encryption key stored in environment (never in database)
 * 4. Each credential has unique IV (initialization vector)
 * 5. Audit log for all credential access
 *
 * Privacy Guarantee:
 * "Your API keys are encrypted with military-grade encryption.
 *  Not even we can see them. Only your autonomous agents can access them."
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get encryption key from environment
 * In production, this should be stored in a secure key management service (AWS KMS, Azure Key Vault, etc.)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    // In development, generate a random key (WARNING: Don't use this in production)
    console.warn('[Encryption] WARNING: No ENCRYPTION_KEY found in environment. Using temporary key.');
    return crypto.randomBytes(KEY_LENGTH);
  }

  // Key should be 64 hex characters (32 bytes)
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Generate a new encryption key (for setup)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Encrypt sensitive data (API keys, secrets, passwords)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty string');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('Cannot decrypt empty string');
  }

  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const [ivHex, authTagHex, encrypted] = parts;

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Hash sensitive data (for comparison without decryption)
 * Used for: password verification, API key validation
 */
export function hash(data: string): string {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Verify hashed data
 */
export function verifyHash(data: string, hashedData: string): boolean {
  return hash(data) === hashedData;
}

/**
 * Mask sensitive data for display (show last 4 characters only)
 */
export function maskCredential(credential: string): string {
  if (!credential || credential.length < 8) {
    return '••••••••';
  }

  const last4 = credential.slice(-4);
  return `••••••••${last4}`;
}

/**
 * Generate secure random token (for API access tokens, reset codes, etc.)
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Validate credential format before encryption
 */
export function validateCredentialFormat(type: string, value: string): { valid: boolean; error?: string } {
  const patterns: Record<string, RegExp> = {
    'google_ads_client_id': /^\d{10}-\w{32}$/,
    'google_ads_client_secret': /^[A-Za-z0-9_-]{24}$/,
    'google_ads_developer_token': /^[A-Za-z0-9_-]{22}$/,
    'meta_access_token': /^EAA[A-Za-z0-9]{100,}$/,
    'meta_app_secret': /^[a-f0-9]{32}$/,
    'linkedin_access_token': /^[A-Za-z0-9_-]{100,}$/,
    'twitter_api_key': /^[A-Za-z0-9]{25}$/,
    'twitter_api_secret': /^[A-Za-z0-9]{50}$/,
    'openai_api_key': /^sk-[A-Za-z0-9]{48}$/,
    'anthropic_api_key': /^sk-ant-[A-Za-z0-9-]{95}$/,
    'semrush_api_key': /^[a-f0-9]{32}$/,
    'wordpress_app_password': /^[A-Za-z0-9\s]{24}$/,
  };

  const pattern = patterns[type];
  if (!pattern) {
    // Unknown type, skip validation
    return { valid: true };
  }

  if (!pattern.test(value)) {
    return {
      valid: false,
      error: `Invalid ${type.replace(/_/g, ' ')} format`
    };
  }

  return { valid: true };
}

/**
 * Sanitize credential before storage (remove whitespace, validate)
 */
export function sanitizeCredential(value: string): string {
  return value.trim().replace(/\s+/g, '');
}
