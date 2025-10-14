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

export function encryptCredentials(data: any): { encryptedData: string; iv: string; tag: string } {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const plaintext = JSON.stringify(data);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return { encryptedData: encrypted, iv: iv.toString('hex'), tag: tag.toString('hex') };
  } catch (error: any) {
    throw new Error(`Failed to encrypt credentials: ${error.message}`);
  }
}

export function decryptCredentials(encryptedData: string, iv: string, tag: string): any {
  try {
    const key = getEncryptionKey();
    const ivBuffer = Buffer.from(iv, 'hex');
    const tagBuffer = Buffer.from(tag, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
    decipher.setAuthTag(tagBuffer);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (error: any) {
    if (error.message.includes('auth')) {
      throw new Error('Credential authentication failed');
    }
    throw new Error(`Failed to decrypt credentials: ${error.message}`);
  }
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

export function maskSensitive(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars) return '***';
  return value.substring(0, visibleChars) + '***';
}

export function maskCredentialObject(credentials: any): any {
  const masked: any = {};
  for (const [key, value] of Object.entries(credentials)) {
    if (typeof value === 'string') {
      masked[key] = maskSensitive(value);
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskCredentialObject(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

export function testEncryption(): { success: boolean; message: string } {
  try {
    const testData = { username: 'test', password: 'test123', nested: { value: 'test' } };
    const encrypted = encryptCredentials(testData);
    const decrypted = decryptCredentials(encrypted.encryptedData, encrypted.iv, encrypted.tag);
    if (JSON.stringify(testData) !== JSON.stringify(decrypted)) {
      return { success: false, message: 'Decrypted data does not match' };
    }
    return { success: true, message: 'Encryption test passed' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Encryption test failed' };
  }
}
