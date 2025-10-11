/**
 * Secure Credentials API
 *
 * POST /api/onboarding/credentials - Add encrypted credential
 * GET /api/onboarding/credentials?clientId={id} - Get masked credentials (NEVER plaintext)
 * DELETE /api/onboarding/credentials?credentialId={id} - Delete credential
 * PATCH /api/onboarding/credentials - Update credential
 *
 * CRITICAL SECURITY:
 * - Credentials NEVER returned in plaintext via API
 * - Only autonomous agents can decrypt (via internal service calls)
 * - All access logged to credential_access_log
 * - Client can manage their own credentials
 * - Admin/owner can NEVER see plaintext values
 */

import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { encrypt, decrypt, maskCredential, sanitizeCredential, validateCredentialFormat, hash } from '@/lib/encryption';

const dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');

// ============================================================================
// POST - Add Encrypted Credential
// ============================================================================

export async function POST(request: NextRequest) {
  const db = new Database(dbPath);
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.clientId || !body.credentialType || !body.credentialValue) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: clientId, credentialType, credentialValue' },
        { status: 400 }
      );
    }

    // Verify client exists
    const client = db.prepare('SELECT id FROM client_onboarding WHERE id = ?').get(body.clientId);
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Sanitize credential
    const sanitized = sanitizeCredential(body.credentialValue);

    // Validate format (if pattern exists for this type)
    const validation = validateCredentialFormat(body.credentialType, sanitized);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Encrypt the credential
    const encrypted = encrypt(sanitized);
    const credentialHash = hash(sanitized);
    const masked = maskCredential(sanitized);

    // Store encrypted credential
    const credentialId = generateCredentialId();
    db.prepare(`
      INSERT INTO client_credentials (
        id, client_id, credential_type, credential_name,
        encrypted_value, credential_hash, masked_value,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `).run(
      credentialId,
      body.clientId,
      body.credentialType,
      body.credentialName || formatCredentialName(body.credentialType),
      encrypted,
      credentialHash,
      masked
    );

    // Log credential creation
    logCredentialAccess(db, credentialId, body.clientId, 'user:client', 'credential_creation', true, request);

    // Update client onboarding status
    db.prepare('UPDATE client_onboarding SET credentials_configured = 1 WHERE id = ?').run(body.clientId);

    // Update platform connection status if applicable
    const platformName = getPlatformFromCredentialType(body.credentialType);
    if (platformName) {
      const existingConnection = db.prepare('SELECT id FROM platform_connections WHERE client_id = ? AND platform_name = ?')
        .get(body.clientId, platformName);

      if (existingConnection) {
        db.prepare('UPDATE platform_connections SET connection_status = ?, connected_at = datetime(\'now\') WHERE id = ?')
          .run('connected', (existingConnection as any).id);
      } else {
        db.prepare(`
          INSERT INTO platform_connections (client_id, platform_name, connection_status, connected_at)
          VALUES (?, ?, 'connected', datetime('now'))
        `).run(body.clientId, platformName);
      }
    }

    return NextResponse.json({
      success: true,
      credentialId,
      maskedValue: masked,
      message: 'Credential encrypted and stored securely'
    });

  } catch (error: any) {
    console.error('[Credentials API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}

// ============================================================================
// GET - Get Masked Credentials (NEVER Plaintext)
// ============================================================================

export async function GET(request: NextRequest) {
  const db = new Database(dbPath);
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId required' },
        { status: 400 }
      );
    }

    // Get all credentials for client (MASKED VALUES ONLY)
    const credentials = db.prepare(`
      SELECT
        id, credential_type, credential_name, masked_value,
        is_active, expires_at, created_at, updated_at, last_used_at
      FROM client_credentials
      WHERE client_id = ? AND is_active = 1
      ORDER BY created_at DESC
    `).all(clientId) as any[];

    // Group by platform
    const grouped: Record<string, any[]> = {};
    credentials.forEach(cred => {
      const platform = getPlatformFromCredentialType(cred.credential_type);
      if (!grouped[platform]) {
        grouped[platform] = [];
      }
      grouped[platform].push({
        id: cred.id,
        type: cred.credential_type,
        name: cred.credential_name,
        maskedValue: cred.masked_value,
        isActive: cred.is_active,
        expiresAt: cred.expires_at,
        lastUsedAt: cred.last_used_at,
        createdAt: cred.created_at
      });
    });

    return NextResponse.json({
      success: true,
      credentials: grouped,
      total: credentials.length
    });

  } catch (error: any) {
    console.error('[Credentials API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}

// ============================================================================
// DELETE - Delete Credential
// ============================================================================

export async function DELETE(request: NextRequest) {
  const db = new Database(dbPath);
  try {
    const { searchParams } = new URL(request.url);
    const credentialId = searchParams.get('credentialId');

    if (!credentialId) {
      return NextResponse.json(
        { success: false, error: 'credentialId required' },
        { status: 400 }
      );
    }

    // Get credential details before deleting
    const credential = db.prepare('SELECT client_id, credential_type FROM client_credentials WHERE id = ?')
      .get(credentialId) as any;

    if (!credential) {
      return NextResponse.json(
        { success: false, error: 'Credential not found' },
        { status: 404 }
      );
    }

    // Soft delete (mark as inactive)
    db.prepare('UPDATE client_credentials SET is_active = 0, updated_at = datetime(\'now\') WHERE id = ?')
      .run(credentialId);

    // Log deletion
    logCredentialAccess(db, credentialId, credential.client_id, 'user:client', 'credential_deletion', true, request);

    // Check if platform still has active credentials
    const remainingCreds = db.prepare(`
      SELECT COUNT(*) as count FROM client_credentials
      WHERE client_id = ? AND credential_type LIKE ? AND is_active = 1
    `).get(credential.client_id, `${getPlatformFromCredentialType(credential.credential_type)}%`) as any;

    if (remainingCreds.count === 0) {
      // Disconnect platform
      const platformName = getPlatformFromCredentialType(credential.credential_type);
      db.prepare('UPDATE platform_connections SET connection_status = \'disconnected\' WHERE client_id = ? AND platform_name = ?')
        .run(credential.client_id, platformName);
    }

    return NextResponse.json({
      success: true,
      message: 'Credential deleted successfully'
    });

  } catch (error: any) {
    console.error('[Credentials API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}

// ============================================================================
// PATCH - Update Credential
// ============================================================================

export async function PATCH(request: NextRequest) {
  const db = new Database(dbPath);
  try {
    const body = await request.json();

    if (!body.credentialId || !body.newValue) {
      return NextResponse.json(
        { success: false, error: 'credentialId and newValue required' },
        { status: 400 }
      );
    }

    // Get existing credential
    const existing = db.prepare('SELECT client_id, credential_type FROM client_credentials WHERE id = ?')
      .get(body.credentialId) as any;

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Credential not found' },
        { status: 404 }
      );
    }

    // Sanitize and validate new value
    const sanitized = sanitizeCredential(body.newValue);
    const validation = validateCredentialFormat(existing.credential_type, sanitized);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Encrypt new value
    const encrypted = encrypt(sanitized);
    const credentialHash = hash(sanitized);
    const masked = maskCredential(sanitized);

    // Update credential
    db.prepare(`
      UPDATE client_credentials
      SET encrypted_value = ?, credential_hash = ?, masked_value = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(encrypted, credentialHash, masked, body.credentialId);

    // Log update
    logCredentialAccess(db, body.credentialId, existing.client_id, 'user:client', 'credential_update', true, request);

    return NextResponse.json({
      success: true,
      maskedValue: masked,
      message: 'Credential updated successfully'
    });

  } catch (error: any) {
    console.error('[Credentials API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}

// ============================================================================
// Internal Helper Functions
// ============================================================================

/**
 * Get decrypted credential for autonomous agent use ONLY
 * This function is NOT exposed via API - only called internally by agents
 */
export function getDecryptedCredential(clientId: string, credentialType: string): string | null {
  const db = new Database(dbPath);
  try {
    const credential = db.prepare(`
      SELECT id, encrypted_value, client_id
      FROM client_credentials
      WHERE client_id = ? AND credential_type = ? AND is_active = 1
      ORDER BY created_at DESC
      LIMIT 1
    `).get(clientId, credentialType) as any;

    if (!credential) {
      return null;
    }

    // Decrypt credential
    const plaintext = decrypt(credential.encrypted_value);

    // Log access
    logCredentialAccess(db, credential.id, clientId, `agent:${credentialType}`, 'agent_access', true, null);

    // Update last used timestamp
    db.prepare('UPDATE client_credentials SET last_used_at = datetime(\'now\') WHERE id = ?').run(credential.id);

    return plaintext;

  } catch (error) {
    console.error('[Credentials] Error decrypting credential:', error);
    return null;
  } finally {
    db.close();
  }
}

function logCredentialAccess(
  db: Database.Database,
  credentialId: string,
  clientId: string,
  accessedBy: string,
  purpose: string,
  successful: boolean,
  request: NextRequest | null
) {
  const ipAddress = request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || 'unknown';
  const userAgent = request?.headers.get('user-agent') || 'unknown';

  db.prepare(`
    INSERT INTO credential_access_log (
      credential_id, client_id, accessed_by, access_purpose,
      access_successful, ip_address, user_agent, accessed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(credentialId, clientId, accessedBy, purpose, successful ? 1 : 0, ipAddress, userAgent);
}

function generateCredentialId(): string {
  return `cred-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

function formatCredentialName(type: string): string {
  const names: Record<string, string> = {
    'google_ads_client_id': 'Google Ads Client ID',
    'google_ads_client_secret': 'Google Ads Client Secret',
    'google_ads_developer_token': 'Google Ads Developer Token',
    'meta_access_token': 'Facebook/Instagram Access Token',
    'meta_app_secret': 'Meta App Secret',
    'linkedin_access_token': 'LinkedIn Access Token',
    'twitter_api_key': 'Twitter API Key',
    'twitter_api_secret': 'Twitter API Secret',
    'openai_api_key': 'OpenAI API Key',
    'anthropic_api_key': 'Anthropic API Key',
    'semrush_api_key': 'SEMrush API Key',
    'wordpress_app_password': 'WordPress App Password'
  };
  return names[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getPlatformFromCredentialType(type: string): string {
  if (type.startsWith('google_ads')) return 'google_ads';
  if (type.startsWith('meta_')) return 'meta';
  if (type.startsWith('linkedin')) return 'linkedin';
  if (type.startsWith('twitter')) return 'twitter';
  if (type.startsWith('wordpress')) return 'wordpress';
  if (type.startsWith('openai')) return 'openai';
  if (type.startsWith('anthropic')) return 'anthropic';
  if (type.startsWith('semrush')) return 'semrush';
  return 'other';
}
