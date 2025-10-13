import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { encryptCredential, decryptCredential } from '@/lib/crypto-credentials';

/**
 * POST /api/companies/[id]/credentials
 * 
 * Save or update website credentials for a company
 * All sensitive fields are encrypted before storage
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = id;
    const body = await request.json();

    const supabase = await createClient();

    // Verify company exists and user has access
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Encrypt sensitive fields
    const credentials: any = {
      company_id: companyId,
      platform_type: body.platform_type,
      platform_version: body.platform_version || null,
      primary_access_method: body.primary_access_method,
      notes: body.notes || null,
      test_connection_status: 'untested',
      is_active: true,
    };

    // Encrypt WordPress credentials
    if (body.wp_url) {
      credentials.wp_url = body.wp_url;
      credentials.wp_username = body.wp_username;
      
      if (body.wp_app_password) {
        credentials.wp_app_password_encrypted = encryptCredential(body.wp_app_password);
      }
      if (body.wp_password) {
        credentials.wp_password_encrypted = encryptCredential(body.wp_password);
      }
    }

    // Encrypt FTP credentials
    if (body.ftp_host) {
      credentials.ftp_host = body.ftp_host;
      credentials.ftp_port = body.ftp_port || 21;
      credentials.ftp_username = body.ftp_username;
      credentials.ftp_root_path = body.ftp_root_path || '/';
      credentials.ftp_protocol = body.ftp_protocol || 'ftp';
      
      if (body.ftp_password) {
        credentials.ftp_password_encrypted = encryptCredential(body.ftp_password);
      }
    }

    // Encrypt cPanel credentials
    if (body.cpanel_url) {
      credentials.cpanel_url = body.cpanel_url;
      credentials.cpanel_username = body.cpanel_username;
      
      if (body.cpanel_api_token) {
        credentials.cpanel_api_token_encrypted = encryptCredential(body.cpanel_api_token);
      }
    }

    // Encrypt GitHub credentials
    if (body.github_repo) {
      credentials.github_repo = body.github_repo;
      credentials.github_branch = body.github_branch || 'main';
      credentials.github_auto_pr = body.github_auto_pr ?? true;
      
      if (body.github_token) {
        credentials.github_token_encrypted = encryptCredential(body.github_token);
      }
    }

    // Encrypt Vercel credentials
    if (body.vercel_project_id) {
      credentials.vercel_project_id = body.vercel_project_id;
      
      if (body.vercel_token) {
        credentials.vercel_token_encrypted = encryptCredential(body.vercel_token);
      }
    }

    // Encrypt Shopify credentials
    if (body.shopify_store_url) {
      credentials.shopify_store_url = body.shopify_store_url;
      credentials.shopify_api_version = body.shopify_api_version || '2024-01';
      
      if (body.shopify_access_token) {
        credentials.shopify_access_token_encrypted = encryptCredential(body.shopify_access_token);
      }
    }

    // Encrypt SSH credentials
    if (body.ssh_host) {
      credentials.ssh_host = body.ssh_host;
      credentials.ssh_port = body.ssh_port || 22;
      credentials.ssh_username = body.ssh_username;
      
      if (body.ssh_private_key) {
        credentials.ssh_private_key_encrypted = encryptCredential(body.ssh_private_key);
      }
      if (body.ssh_passphrase) {
        credentials.ssh_passphrase_encrypted = encryptCredential(body.ssh_passphrase);
      }
    }

    // Check if credentials already exist for this company/platform
    const { data: existing } = await supabase
      .from('website_credentials')
      .select('id')
      .eq('company_id', companyId)
      .eq('platform_type', body.platform_type)
      .single();

    let result;

    if (existing) {
      // Update existing credentials
      const { data, error } = await supabase
        .from('website_credentials')
        .update(credentials)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new credentials
      const { data, error } = await supabase
        .from('website_credentials')
        .insert(credentials)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Log credential access
    await supabase.from('credentials_access_log').insert({
      credential_id: result.id,
      access_type: existing ? 'edit' : 'view',
      success: true,
    });

    return NextResponse.json({
      success: true,
      credential_id: result.id,
      message: existing 
        ? 'Credentials updated successfully'
        : 'Credentials saved successfully',
    });

  } catch (error: any) {
    console.error('[Credentials API] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to save credentials',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/companies/[id]/credentials
 * 
 * Retrieve website credentials for a company
 * Sensitive fields remain encrypted until explicitly decrypted
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = id;
    const { searchParams } = new URL(request.url);
    const decrypt = searchParams.get('decrypt') === 'true';

    const supabase = await createClient();

    // Fetch credentials
    const { data: credentials, error } = await supabase
      .from('website_credentials')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (error) throw error;

    if (!credentials || credentials.length === 0) {
      return NextResponse.json({
        success: true,
        credentials: [],
      });
    }

    // Optionally decrypt for display (requires explicit request)
    const result = credentials.map(cred => {
      if (!decrypt) {
        // Return without sensitive fields
        const { 
          wp_app_password_encrypted,
          wp_password_encrypted,
          ftp_password_encrypted,
          cpanel_api_token_encrypted,
          github_token_encrypted,
          vercel_token_encrypted,
          shopify_access_token_encrypted,
          ssh_private_key_encrypted,
          ssh_passphrase_encrypted,
          ...safe 
        } = cred;
        
        return {
          ...safe,
          has_wp_credentials: !!wp_app_password_encrypted || !!wp_password_encrypted,
          has_ftp_credentials: !!ftp_password_encrypted,
          has_github_credentials: !!github_token_encrypted,
          has_vercel_credentials: !!vercel_token_encrypted,
          has_shopify_credentials: !!shopify_access_token_encrypted,
          has_ssh_credentials: !!ssh_private_key_encrypted,
        };
      }

      // Decrypt sensitive fields
      return {
        ...cred,
        wp_app_password: cred.wp_app_password_encrypted 
          ? decryptCredential(cred.wp_app_password_encrypted) 
          : null,
        wp_password: cred.wp_password_encrypted 
          ? decryptCredential(cred.wp_password_encrypted) 
          : null,
        ftp_password: cred.ftp_password_encrypted 
          ? decryptCredential(cred.ftp_password_encrypted) 
          : null,
        github_token: cred.github_token_encrypted 
          ? decryptCredential(cred.github_token_encrypted) 
          : null,
        vercel_token: cred.vercel_token_encrypted 
          ? decryptCredential(cred.vercel_token_encrypted) 
          : null,
        shopify_access_token: cred.shopify_access_token_encrypted 
          ? decryptCredential(cred.shopify_access_token_encrypted) 
          : null,
        ssh_private_key: cred.ssh_private_key_encrypted 
          ? decryptCredential(cred.ssh_private_key_encrypted) 
          : null,
        ssh_passphrase: cred.ssh_passphrase_encrypted 
          ? decryptCredential(cred.ssh_passphrase_encrypted) 
          : null,
      };
    });

    // Log credential access
    if (credentials.length > 0) {
      await supabase.from('credentials_access_log').insert(
        credentials.map(cred => ({
          credential_id: cred.id,
          access_type: 'view',
          success: true,
        }))
      );
    }

    return NextResponse.json({
      success: true,
      credentials: result,
    });

  } catch (error: any) {
    console.error('[Credentials API] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve credentials',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/companies/[id]/credentials?credential_id=xxx
 * 
 * Deactivate (soft delete) credentials
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const credentialId = searchParams.get('credential_id');

    if (!credentialId) {
      return NextResponse.json(
        { error: 'credential_id required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Soft delete - mark as inactive
    const { error } = await supabase
      .from('website_credentials')
      .update({
        is_active: false,
        deactivated_reason: 'User requested deletion',
      })
      .eq('id', credentialId)
      .eq('company_id', id);

    if (error) throw error;

    // Log deletion
    await supabase.from('credentials_access_log').insert({
      credential_id: credentialId,
      access_type: 'delete',
      success: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Credentials deactivated successfully',
    });

  } catch (error: any) {
    console.error('[Credentials API] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete credentials',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
