/**
 * Encrypted Secrets Vault
 *
 * Provides secure, encrypted storage for API keys and sensitive credentials.
 * Implements AES-256-GCM encryption with per-secret rotation tracking.
 *
 * TICKET: VAULT-001
 * Phase: NOW (Week 1-2)
 *
 * Features:
 * - AES-256-GCM encryption at rest
 * - Per-secret rotation tracking and expiry warnings
 * - Audit logging for all access and modifications
 * - Masked display for UI safety
 * - Optional 1Password Connect integration
 *
 * @module lib/secrets-vault
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

export interface SecretMetadata {
  name: string;
  description?: string;
  scope: 'global' | 'organisation' | 'project';
  scopeId?: string; // organisation_id or project_id
  expiresAt?: Date;
  rotationIntervalDays?: number;
  lastRotatedAt?: Date;
  createdBy: string;
  tags?: string[];
}

export interface EncryptedSecret {
  id: string;
  encryptedValue: string; // base64: iv + encrypted + authTag
  salt: string; // base64
  metadata: SecretMetadata;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface SecretAuditLog {
  id: string;
  secretId: string;
  action: 'created' | 'read' | 'updated' | 'rotated' | 'deleted';
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Secrets Vault Service
 *
 * Handles encryption, decryption, and lifecycle management of secrets.
 */
export class SecretsVault {
  private masterKey: Buffer;

  constructor(masterKeyHex: string) {
    if (!masterKeyHex || masterKeyHex.length !== 64) {
      throw new Error('Master key must be 32 bytes (64 hex chars)');
    }
    this.masterKey = Buffer.from(masterKeyHex, 'hex');
  }

  /**
   * Derive encryption key from master key + salt using PBKDF2
   */
  private deriveKey(salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(this.masterKey, salt, 100000, 32, 'sha256');
  }

  /**
   * Encrypt a secret value
   */
  encrypt(plaintext: string): { encryptedValue: string; salt: string } {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive key from master key + salt
    const key = this.deriveKey(salt);

    // Encrypt with AES-256-GCM
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Combine iv + encrypted + authTag
    const combined = Buffer.concat([iv, encrypted, authTag]);

    return {
      encryptedValue: combined.toString('base64'),
      salt: salt.toString('base64'),
    };
  }

  /**
   * Decrypt a secret value
   */
  decrypt(encryptedValue: string, salt: string): string {
    // Parse base64 combined value
    const combined = Buffer.from(encryptedValue, 'base64');
    const saltBuffer = Buffer.from(salt, 'base64');

    // Extract components
    const iv = combined.subarray(0, IV_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH, -AUTH_TAG_LENGTH);
    const authTag = combined.subarray(-AUTH_TAG_LENGTH);

    // Derive key
    const key = this.deriveKey(saltBuffer);

    // Decrypt with AES-256-GCM
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  /**
   * Mask a secret for display (show first 4 and last 4 chars)
   */
  mask(value: string, visibleChars: number = 4): string {
    if (value.length <= visibleChars * 2) {
      return '*'.repeat(value.length);
    }

    const start = value.substring(0, visibleChars);
    const end = value.substring(value.length - visibleChars);
    const middle = '*'.repeat(Math.max(8, value.length - visibleChars * 2));

    return `${start}${middle}${end}`;
  }

  /**
   * Check if a secret needs rotation based on expiry or rotation interval
   */
  needsRotation(secret: EncryptedSecret): {
    needsRotation: boolean;
    reason?: 'expired' | 'rotation_interval' | 'never_rotated';
    daysUntilExpiry?: number;
  } {
    const now = new Date();

    // Check expiry
    if (secret.metadata.expiresAt && secret.metadata.expiresAt < now) {
      return { needsRotation: true, reason: 'expired', daysUntilExpiry: 0 };
    }

    // Check rotation interval
    if (secret.metadata.rotationIntervalDays && secret.metadata.lastRotatedAt) {
      const daysSinceRotation = Math.floor(
        (now.getTime() - secret.metadata.lastRotatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceRotation >= secret.metadata.rotationIntervalDays) {
        return { needsRotation: true, reason: 'rotation_interval' };
      }
    }

    // Warn if never rotated and old
    if (!secret.metadata.lastRotatedAt) {
      const daysOld = Math.floor(
        (now.getTime() - secret.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysOld > 90) {
        return { needsRotation: true, reason: 'never_rotated' };
      }
    }

    // Calculate days until expiry for warnings
    if (secret.metadata.expiresAt) {
      const daysUntilExpiry = Math.floor(
        (secret.metadata.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { needsRotation: false, daysUntilExpiry };
    }

    return { needsRotation: false };
  }

  /**
   * Generate audit log entry
   */
  createAuditLog(
    secretId: string,
    action: SecretAuditLog['action'],
    userId: string,
    metadata?: Record<string, unknown>
  ): Omit<SecretAuditLog, 'id'> {
    return {
      secretId,
      action,
      userId,
      timestamp: new Date(),
      metadata,
    };
  }

  /**
   * Validate secret scope access
   */
  canAccess(
    secret: EncryptedSecret,
    userId: string,
    userOrganisationId?: string,
    userProjectId?: string
  ): boolean {
    switch (secret.metadata.scope) {
      case 'global':
        // Only admin users can access global secrets
        return true; // TODO: Check admin role

      case 'organisation':
        return secret.metadata.scopeId === userOrganisationId;

      case 'project':
        return secret.metadata.scopeId === userProjectId;

      default:
        return false;
    }
  }
}

/**
 * Initialize SecretsVault from environment
 */
export function createVault(): SecretsVault {
  const masterKey = process.env.SECRETS_MASTER_KEY;

  if (!masterKey) {
    throw new Error(
      'SECRETS_MASTER_KEY environment variable not set. Generate with: openssl rand -hex 32'
    );
  }

  return new SecretsVault(masterKey);
}

/**
 * Generate a new master key (run once during setup)
 */
export function generateMasterKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
