/**
 * Credential Encryption Utilities
 * AES-256-GCM encryption for secure credential storage
 * Created: October 14, 2025
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export type EncryptedPayload = {
  encryptedData: string;
  iv: string;
  tag: string;
};

export type CredentialValidationResult = {
  valid: boolean;
  error?: string;
};

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  if (keyHex.length !== KEY_LENGTH * 2) {
    throw new Error('ENCRYPTION_KEY must be 64 hexadecimal characters');
  }
  try {
    return Buffer.from(keyHex, 'hex');
  } catch (error) {
    throw new Error('ENCRYPTION_KEY must be valid hexadecimal string');
  }
}

function encryptRaw(plaintext: string): EncryptedPayload {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  } catch (error: any) {
    throw new Error(`Failed to encrypt: ${error.message}`);
  }
}

function decryptRaw(encryptedData: string, iv: string, tag: string): string {
  try {
    const key = getEncryptionKey();
    const ivBuffer = Buffer.from(iv, 'hex');
    const tagBuffer = Buffer.from(tag, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
    decipher.setAuthTag(tagBuffer);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error: any) {
    if (error.message.includes('auth')) {
      throw new Error('Credential authentication failed');
    }
    throw new Error(`Failed to decrypt: ${error.message}`);
  }
}

export function encryptCredentials(data: any): EncryptedPayload {
  return encryptRaw(JSON.stringify(data));
}

export function decryptCredentials(encryptedData: string, iv: string, tag: string): any {
  const decrypted = decryptRaw(encryptedData, iv, tag);
  try {
    return JSON.parse(decrypted);
  } catch (error: any) {
    throw new Error(`Failed to parse decrypted credentials: ${error.message}`);
  }
}

export function encrypt(plaintext: string): string {
  if (typeof plaintext !== 'string') {
    throw new Error('encrypt() expects a string value');
  }
  const { encryptedData, iv, tag } = encryptRaw(plaintext);
  return [iv, tag, encryptedData].join(':');
}

export function decrypt(payload: string): string {
  if (!payload || typeof payload !== 'string') {
    throw new Error('decrypt() expects a non-empty string payload');
  }
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format');
  }
  const [iv, tag, encryptedData] = parts;
  return decryptRaw(encryptedData, iv, tag);
}

export function hash(value: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('hash() expects a non-empty string');
  }
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

export function validateEncryptionKey(): { valid: boolean; message: string } {
  try {
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex) return { valid: false, message: 'ENCRYPTION_KEY not configured' };
    if (keyHex.length !== KEY_LENGTH * 2) return { valid: false, message: 'Invalid key length' };
    Buffer.from(keyHex, 'hex');
    return { valid: true, message: 'Encryption key is valid' };
  } catch (error) {
    return { valid: false, message: 'ENCRYPTION_KEY must be valid hexadecimal' };
  }
}

export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

export function sanitizeCredential(value: unknown): string {
  if (typeof value !== 'string') {
    if (value === undefined || value === null) {
      return '';
    }
    return String(value);
  }
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\u200b/g, '')
    .replace(/\0/g, '')
    .trim();
}

export function maskCredential(value: string, visibleChars: number = 4): string {
  const sanitized = sanitizeCredential(value);
  if (!sanitized) {
    return '***';
  }

  const prefixLength = Math.max(1, Math.min(visibleChars, sanitized.length));
  const suffixLength = sanitized.length > prefixLength + 2 ? 2 : 0;
  const prefix = sanitized.slice(0, prefixLength);
  const suffix = suffixLength ? sanitized.slice(-suffixLength) : '';
  const maskLength = Math.max(3, sanitized.length - (prefix.length + suffix.length));

  return `${prefix}${'*'.repeat(maskLength)}${suffix}`;
}

export function maskCredentialObject(credentials: any): any {
  if (!credentials || typeof credentials !== 'object') {
    return credentials;
  }

  if (Array.isArray(credentials)) {
    return credentials.map((item) =>
      typeof item === 'string' ? maskCredential(item) : maskCredentialObject(item)
    );
  }

  const masked: Record<string, any> = {};
  for (const [key, value] of Object.entries(credentials)) {
    if (typeof value === 'string') {
      masked[key] = maskCredential(value);
    } else if (value && typeof value === 'object') {
      masked[key] = maskCredentialObject(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

const credentialValidationRules: Record<string, (value: string) => CredentialValidationResult> = {
  google_ads_client_id: (value) => {
    const cleaned = value.replace(/-/g, '');
    if (/^\d{10,}$/.test(cleaned)) {
      return { valid: true };
    }
    return { valid: false, error: 'Google Ads Client ID should resemble 000-000-0000' };
  },
  google_ads_client_secret: (value) =>
    value.length >= 16
      ? { valid: true }
      : { valid: false, error: 'Google Ads client secret should be at least 16 characters' },
  google_ads_developer_token: (value) =>
    /^[A-Z0-9]{8,16}$/.test(value)
      ? { valid: true }
      : { valid: false, error: 'Developer token must be 8-16 uppercase characters or digits' },
  meta_access_token: (value) =>
    value.length >= 50
      ? { valid: true }
      : { valid: false, error: 'Meta access token looks too short' },
  meta_app_secret: (value) =>
    /^[a-f0-9]{32}$/i.test(value)
      ? { valid: true }
      : { valid: false, error: 'Meta app secret must be a 32-character hexadecimal string' },
  linkedin_access_token: (value) =>
    value.length >= 50
      ? { valid: true }
      : { valid: false, error: 'LinkedIn access token looks too short' },
  twitter_api_key: (value) =>
    /^[A-Za-z0-9]{16,25}$/.test(value)
      ? { valid: true }
      : { valid: false, error: 'Twitter API key should be 16-25 alphanumeric characters' },
  twitter_api_secret: (value) =>
    /^[A-Za-z0-9]{30,50}$/.test(value)
      ? { valid: true }
      : { valid: false, error: 'Twitter API secret should be 30-50 alphanumeric characters' },
  openai_api_key: (value) =>
    /^sk-[A-Za-z0-9]{20,}$/.test(value)
      ? { valid: true }
      : { valid: false, error: 'OpenAI key should start with sk- and be at least 24 characters' },
  anthropic_api_key: (value) =>
    /^sk-ant-[A-Za-z0-9]{20,}$/.test(value)
      ? { valid: true }
      : { valid: false, error: 'Anthropic key should start with sk-ant- and be at least 28 characters' },
  semrush_api_key: (value) =>
    /^[a-f0-9]{32}$/i.test(value)
      ? { valid: true }
      : { valid: false, error: 'SEMrush API key must be a 32-character hexadecimal string' },
  wordpress_app_password: (value) => {
    const cleaned = value.replace(/\s+/g, '');
    return /^[A-Za-z0-9]{16}$/.test(cleaned)
      ? { valid: true }
      : { valid: false, error: 'WordPress app password should be 16 characters (spaces optional)' };
  },
};

function fallbackApiKeyRule(value: string): CredentialValidationResult {
  return value.length >= 20
    ? { valid: true }
    : { valid: false, error: 'API key values should be at least 20 characters long' };
}

function fallbackTokenRule(value: string): CredentialValidationResult {
  return value.length >= 25
    ? { valid: true }
    : { valid: false, error: 'Access tokens should be at least 25 characters long' };
}

export function validateCredentialFormat(type: string, value: string): CredentialValidationResult {
  const sanitized = sanitizeCredential(value);
  if (!sanitized) {
    return { valid: false, error: 'Credential value cannot be empty' };
  }

  const rule = credentialValidationRules[type];
  if (rule) {
    return rule(sanitized);
  }

  if (type.includes('api_key')) {
    return fallbackApiKeyRule(sanitized);
  }

  if (type.includes('access_token')) {
    return fallbackTokenRule(sanitized);
  }

  return { valid: true };
}

export function testEncryption(): { success: boolean; message: string } {
  try {
    const testData = { username: 'test', password: 'test123', nested: { value: 'test' } };
    const encrypted = encryptCredentials(testData);
    const decrypted = decryptCredentials(encrypted.encryptedData, encrypted.iv, encrypted.tag);
    if (JSON.stringify(testData) !== JSON.stringify(decrypted)) {
      return { success: false, message: 'Decrypted data does not match' };
    }
    const sampleSecret = 'sample-api-key-1234567890';
    const single = encrypt(sampleSecret);
    const roundTrip = decrypt(single);
    if (roundTrip !== sampleSecret) {
      return { success: false, message: 'String encryption round-trip failed' };
    }
    return { success: true, message: 'Encryption test passed' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Encryption test failed' };
  }
}
