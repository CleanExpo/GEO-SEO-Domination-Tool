import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { z } from 'zod';
import crypto from 'crypto';

// Encryption configuration (use env var in production)
const ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY || 'default-encryption-key-32chars!';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

/**
 * Encrypts sensitive credentials using AES-256-CBC
 */
function encrypt(text: string): string {
  if (!text) return '';

  // Ensure key is exactly 32 bytes for AES-256
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts credentials encrypted with encrypt()
 */
function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';

  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted format');
  }

  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

const websiteCredentialsSchema = z.object({
  company_id: z.string().uuid('Valid company ID is required'),
  platform_type: z.enum(['wordpress', 'shopify', 'next', 'static', 'custom', 'react', 'vue']),
  platform_version: z.string().optional(),
  primary_access_method: z.enum([
    'wp_rest_api',
    'wp_admin',
    'ftp',
    'sftp',
    'github',
    'cpanel',
    'vercel',
    'shopify_api',
    'ssh'
  ]),

  // WordPress credentials
  wp_url: z.string().url().optional(),
  wp_username: z.string().optional(),
  wp_app_password: z.string().optional(), // Will be encrypted
  wp_password: z.string().optional(), // Will be encrypted

  // FTP/SFTP credentials
  ftp_host: z.string().optional(),
  ftp_port: z.number().int().optional(),
  ftp_username: z.string().optional(),
  ftp_password: z.string().optional(), // Will be encrypted
  ftp_root_path: z.string().default('/'),
  ftp_protocol: z.enum(['ftp', 'sftp', 'ftps']).optional(),

  // cPanel credentials
  cpanel_url: z.string().url().optional(),
  cpanel_username: z.string().optional(),
  cpanel_api_token: z.string().optional(), // Will be encrypted

  // GitHub credentials
  github_repo: z.string().optional(),
  github_token: z.string().optional(), // Will be encrypted
  github_branch: z.string().default('main'),
  github_auto_pr: z.boolean().default(true),

  // Vercel credentials
  vercel_project_id: z.string().optional(),
  vercel_token: z.string().optional(), // Will be encrypted

  // Shopify credentials
  shopify_store_url: z.string().optional(),
  shopify_access_token: z.string().optional(), // Will be encrypted
  shopify_api_version: z.string().default('2024-01'),

  // SSH credentials
  ssh_host: z.string().optional(),
  ssh_port: z.number().int().default(22),
  ssh_username: z.string().optional(),
  ssh_private_key: z.string().optional(), // Will be encrypted
  ssh_passphrase: z.string().optional(), // Will be encrypted

  // Metadata
  notes: z.string().optional(),
});

/**
 * GET /api/post-audit/api-credentials
 *
 * Retrieves website credentials for a specific company.
 *
 * Query params:
 * - company_id (required): UUID of the company
 * - decrypt (optional): Whether to decrypt sensitive fields (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const shouldDecrypt = searchParams.get('decrypt') === 'true';

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id query parameter is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('website_credentials')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API Credentials] Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Optionally decrypt sensitive fields
    let credentials = data || [];
    if (shouldDecrypt && credentials.length > 0) {
      credentials = credentials.map(cred => {
        const decrypted = { ...cred };

        // Decrypt sensitive fields
        const encryptedFields = [
          'wp_app_password_encrypted',
          'wp_password_encrypted',
          'ftp_password_encrypted',
          'cpanel_api_token_encrypted',
          'github_token_encrypted',
          'vercel_token_encrypted',
          'shopify_access_token_encrypted',
          'ssh_private_key_encrypted',
          'ssh_passphrase_encrypted'
        ];

        encryptedFields.forEach(field => {
          if (decrypted[field]) {
            try {
              const decryptedField = field.replace('_encrypted', '');
              decrypted[decryptedField] = decrypt(decrypted[field]);
            } catch (err) {
              console.error(`Failed to decrypt ${field}:`, err);
            }
          }
        });

        return decrypted;
      });
    }

    return NextResponse.json({
      credentials: credentials
    });
  } catch (error: any) {
    console.error('[API Credentials] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch credentials' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/post-audit/api-credentials
 *
 * Creates or updates website credentials for a company.
 *
 * Body: Credentials object with platform-specific fields
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = websiteCredentialsSchema.parse(body);

    const supabase = createAdminClient();

    // Encrypt sensitive fields
    const encryptedData: any = {
      ...validatedData,
      test_connection_status: 'untested',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Encrypt passwords and tokens
    if (validatedData.wp_app_password) {
      encryptedData.wp_app_password_encrypted = encrypt(validatedData.wp_app_password);
      delete encryptedData.wp_app_password;
    }

    if (validatedData.wp_password) {
      encryptedData.wp_password_encrypted = encrypt(validatedData.wp_password);
      delete encryptedData.wp_password;
    }

    if (validatedData.ftp_password) {
      encryptedData.ftp_password_encrypted = encrypt(validatedData.ftp_password);
      delete encryptedData.ftp_password;
    }

    if (validatedData.cpanel_api_token) {
      encryptedData.cpanel_api_token_encrypted = encrypt(validatedData.cpanel_api_token);
      delete encryptedData.cpanel_api_token;
    }

    if (validatedData.github_token) {
      encryptedData.github_token_encrypted = encrypt(validatedData.github_token);
      delete encryptedData.github_token;
    }

    if (validatedData.vercel_token) {
      encryptedData.vercel_token_encrypted = encrypt(validatedData.vercel_token);
      delete encryptedData.vercel_token;
    }

    if (validatedData.shopify_access_token) {
      encryptedData.shopify_access_token_encrypted = encrypt(validatedData.shopify_access_token);
      delete encryptedData.shopify_access_token;
    }

    if (validatedData.ssh_private_key) {
      encryptedData.ssh_private_key_encrypted = encrypt(validatedData.ssh_private_key);
      delete encryptedData.ssh_private_key;
    }

    if (validatedData.ssh_passphrase) {
      encryptedData.ssh_passphrase_encrypted = encrypt(validatedData.ssh_passphrase);
      delete encryptedData.ssh_passphrase;
    }

    // Check if credentials already exist
    const { data: existing } = await supabase
      .from('website_credentials')
      .select('id')
      .eq('company_id', validatedData.company_id)
      .eq('platform_type', validatedData.platform_type)
      .single();

    let result;

    if (existing) {
      // Update existing credentials
      const { data, error } = await supabase
        .from('website_credentials')
        .update(encryptedData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('[API Credentials] Update error:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Insert new credentials
      const { data, error } = await supabase
        .from('website_credentials')
        .insert([encryptedData])
        .select()
        .single();

      if (error) {
        console.error('[API Credentials] Insert error:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json(
      { credentials: result },
      { status: existing ? 200 : 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[API Credentials] Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to save credentials' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/post-audit/api-credentials
 *
 * Deletes website credentials.
 *
 * Query params:
 * - id: UUID of the credentials to delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Credentials ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('website_credentials')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API Credentials] Delete error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Credentials] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete credentials' },
      { status: 500 }
    );
  }
}
