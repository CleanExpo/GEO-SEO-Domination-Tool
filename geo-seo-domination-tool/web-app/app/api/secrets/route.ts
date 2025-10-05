/**
 * Secrets Vault API Routes
 *
 * TICKET: VAULT-001
 * Endpoints for encrypted secrets management with audit logging
 *
 * Routes:
 * - GET /api/secrets - List secrets (metadata only, no values)
 * - POST /api/secrets - Create new secret
 * - GET /api/secrets/[id] - Get secret (decrypted value)
 * - PATCH /api/secrets/[id] - Update secret
 * - DELETE /api/secrets/[id] - Delete secret
 * - POST /api/secrets/[id]/rotate - Rotate secret
 */

import { NextRequest, NextResponse } from 'next/server';
import { createVault, type SecretMetadata } from '@/lib/secrets-vault';
import { createClient } from '@/lib/supabase';

/**
 * GET /api/secrets
 * List all secrets (metadata only, values masked)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') as SecretMetadata['scope'] | null;
    const scopeId = searchParams.get('scopeId');

    // Build query
    let query = supabase
      .from('secrets')
      .select('id, metadata, created_at, updated_at, version')
      .order('created_at', { ascending: false });

    // Filter by scope
    if (scope) {
      query = query.eq('metadata->>scope', scope);
    }
    if (scopeId) {
      query = query.eq('metadata->>scopeId', scopeId);
    }

    const { data: secrets, error } = await query;

    if (error) {
      throw error;
    }

    const vault = createVault();

    // Add rotation status to each secret
    const secretsWithStatus = secrets?.map((secret) => {
      const rotationStatus = vault.needsRotation({
        ...secret,
        encryptedValue: '',
        salt: '',
        metadata: secret.metadata as SecretMetadata,
        createdAt: new Date(secret.created_at),
        updatedAt: new Date(secret.updated_at),
      });

      return {
        id: secret.id,
        name: secret.metadata.name,
        description: secret.metadata.description,
        scope: secret.metadata.scope,
        scopeId: secret.metadata.scopeId,
        tags: secret.metadata.tags,
        expiresAt: secret.metadata.expiresAt,
        lastRotatedAt: secret.metadata.lastRotatedAt,
        createdAt: secret.created_at,
        updatedAt: secret.updated_at,
        version: secret.version,
        rotationStatus,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        secrets: secretsWithStatus,
        count: secretsWithStatus?.length || 0,
      },
    });
  } catch (error) {
    console.error('Secrets list error:', error);
    return NextResponse.json(
      {
        error: 'Failed to list secrets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/secrets
 * Create a new encrypted secret
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { value, metadata } = body as { value: string; metadata: SecretMetadata };

    // Validation
    if (!value || !metadata?.name) {
      return NextResponse.json(
        { error: 'Missing required fields: value, metadata.name' },
        { status: 400 }
      );
    }

    // Encrypt value
    const vault = createVault();
    const { encryptedValue, salt } = vault.encrypt(value);

    // Store in database
    const { data: secret, error: insertError } = await supabase
      .from('secrets')
      .insert({
        encrypted_value: encryptedValue,
        salt,
        metadata: {
          ...metadata,
          createdBy: user.id,
          lastRotatedAt: new Date().toISOString(),
        },
        version: 1,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Create audit log
    const auditLog = vault.createAuditLog(secret.id, 'created', user.id, {
      name: metadata.name,
      scope: metadata.scope,
    });

    await supabase.from('secret_audit_logs').insert({
      secret_id: auditLog.secretId,
      action: auditLog.action,
      user_id: auditLog.userId,
      metadata: auditLog.metadata,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: secret.id,
        name: metadata.name,
        scope: metadata.scope,
        createdAt: secret.created_at,
      },
    });
  } catch (error) {
    console.error('Secret creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create secret',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
