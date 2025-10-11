import crypto from 'crypto';

/**
 * Credential Encryption/Decryption Utility
 *
 * Uses AES-256-GCM for authenticated encryption
 * Encryption key stored in Vercel environment variable: CREDENTIALS_ENCRYPTION_KEY
 *
 * Security Features:
 * - AES-256-GCM (authenticated encryption)
 * - Unique IV (initialization vector) for each encryption
 * - Auth tag prevents tampering
 * - Key derivation from password using PBKDF2 (if needed)
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const key = process.env.CREDENTIALS_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'CREDENTIALS_ENCRYPTION_KEY not set in environment. ' +
        'Generate one with: openssl rand -base64 32'
    );
  }

  // Convert base64 key to buffer
  return Buffer.from(key, 'base64');
}

/**
 * Encrypt a string value
 *
 * @param plaintext - The value to encrypt (e.g., password, API token)
 * @returns Encrypted value in format: iv:authTag:ciphertext (all base64)
 */
export function encryptCredential(plaintext: string): string {
  try {
    const key = getEncryptionKey();

    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Combine iv:authTag:ciphertext
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error: any) {
    console.error('[Crypto] Encryption failed:', error.message);
    throw new Error(`Failed to encrypt credential: ${error.message}`);
  }
}

/**
 * Decrypt a string value
 *
 * @param encrypted - The encrypted value (format: iv:authTag:ciphertext)
 * @returns Decrypted plaintext
 */
export function decryptCredential(encrypted: string): string {
  try {
    const key = getEncryptionKey();

    // Split iv:authTag:ciphertext
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format (expected iv:authTag:ciphertext)');
    }

    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const ciphertext = parts[2];

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error: any) {
    console.error('[Crypto] Decryption failed:', error.message);
    throw new Error(`Failed to decrypt credential: ${error.message}`);
  }
}

/**
 * Encrypt all credentials in an object
 *
 * @param credentials - Object with credential fields
 * @param fieldsToEncrypt - Array of field names to encrypt
 * @returns Object with encrypted fields suffixed with _encrypted
 */
export function encryptCredentials<T extends Record<string, any>>(
  credentials: T,
  fieldsToEncrypt: (keyof T)[]
): Record<string, any> {
  const encrypted: Record<string, any> = { ...credentials };

  fieldsToEncrypt.forEach((field) => {
    const value = credentials[field];
    if (value && typeof value === 'string') {
      encrypted[`${String(field)}_encrypted`] = encryptCredential(value);
      delete encrypted[field]; // Remove plaintext
    }
  });

  return encrypted;
}

/**
 * Decrypt all encrypted credentials in an object
 *
 * @param credentials - Object with encrypted credential fields
 * @param fieldsToDecrypt - Array of encrypted field names (without _encrypted suffix)
 * @returns Object with decrypted fields
 */
export function decryptCredentials<T extends Record<string, any>>(
  credentials: T,
  fieldsToDecrypt: string[]
): Record<string, any> {
  const decrypted: Record<string, any> = { ...credentials };

  fieldsToDecrypt.forEach((field) => {
    const encryptedField = `${field}_encrypted`;
    const encryptedValue = credentials[encryptedField];

    if (encryptedValue && typeof encryptedValue === 'string') {
      try {
        decrypted[field] = decryptCredential(encryptedValue);
        delete decrypted[encryptedField]; // Remove encrypted version
      } catch (error: any) {
        console.error(`[Crypto] Failed to decrypt ${field}:`, error.message);
        // Leave encrypted field as-is if decryption fails
      }
    }
  });

  return decrypted;
}

/**
 * Generate a new encryption key (for setup)
 */
export function generateEncryptionKey(): string {
  const key = crypto.randomBytes(32); // 256 bits
  return key.toString('base64');
}

/**
 * Mask a credential for display (show first 4 chars, rest as *)
 *
 * @param credential - The credential to mask
 * @returns Masked version (e.g., "abc1****")
 */
export function maskCredential(credential: string): string {
  if (!credential || credential.length < 4) {
    return '****';
  }
  return credential.substring(0, 4) + '*'.repeat(Math.min(credential.length - 4, 12));
}

/**
 * Check if a value is encrypted (format: iv:authTag:ciphertext)
 */
export function isEncrypted(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  const parts = value.split(':');
  return parts.length === 3 && parts.every((p) => /^[A-Za-z0-9+/=]+$/.test(p));
}

/**
 * Securely compare two strings (constant time to prevent timing attacks)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Hash a credential for verification (one-way)
 * Useful for checking if credentials have changed without storing plaintext
 */
export function hashCredential(credential: string): string {
  return crypto.createHash('sha256').update(credential).digest('hex');
}

/**
 * Example usage:
 *
 * // Encrypt a password
 * const encrypted = encryptCredential('my_secure_password');
 * // Result: "dGVzdA==:dGVzdA==:Y2lwaGVydGV4dA=="
 *
 * // Decrypt it
 * const decrypted = decryptCredential(encrypted);
 * // Result: "my_secure_password"
 *
 * // Encrypt multiple fields
 * const creds = {
 *   wp_username: 'admin',
 *   wp_password: 'secret123',
 *   ftp_host: 'ftp.example.com'
 * };
 * const encrypted = encryptCredentials(creds, ['wp_password']);
 * // Result: { wp_username: 'admin', wp_password_encrypted: '...', ftp_host: '...' }
 */
