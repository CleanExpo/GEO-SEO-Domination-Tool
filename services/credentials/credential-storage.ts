/**
 * Credential Storage Service
 *
 * Complete system for storing, retrieving, and managing encrypted credentials
 * This is the "internal mechanism" that makes the credential capture system work
 *
 * Features:
 * - AES-256-GCM encryption
 * - Automatic audit logging
 * - Platform capability tracking
 * - Validation scheduling
 * - Type-safe interfaces
 */

import { createAdminClient } from '@/lib/auth/supabase-admin';
import { encryptCredentials, decryptCredentials } from '@/lib/encryption';

// =====================================================
// Types
// =====================================================

export interface StoredCredential {
  id: string;
  companyId: string;
  platformType: string;
  platformName: string;
  encryptedData: string;
  encryptionIv: string;
  encryptionTag: string;
  credentialType: string;
  status: 'active' | 'expired' | 'revoked' | 'invalid';
  lastValidatedAt?: string;
  validationStatus?: 'valid' | 'invalid' | 'pending' | 'not_tested';
  createdAt: string;
  updatedAt: string;
}

export interface CredentialInput {
  companyId: string;
  platformType: 'website_hosting' | 'website_cms' | 'website_dns' | 'social_media' | 'google_ecosystem' | 'email_marketing' | 'crm' | 'analytics' | 'advertising' | 'review_platform';
  platformName: string;
  credentials: Record<string, any>; // The actual credentials (username, password, apiKey, etc.)
  credentialType: 'username_password' | 'api_key' | 'oauth_token' | 'ftp_credentials' | 'ssh_key' | 'access_token';
  tierRequired?: 'basic' | 'standard' | 'premium' | 'enterprise';
}

export interface RetrievedCredential {
  id: string;
  platformType: string;
  platformName: string;
  credentials: Record<string, any>; // Decrypted credentials
  status: string;
  lastValidated?: string;
  validationStatus?: string;
}

export interface AccessLogEntry {
  credentialId: string;
  accessedBy: string;
  accessType: 'read' | 'write' | 'api_call' | 'validation_test' | 'auto_action';
  accessPurpose: string;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}

// =====================================================
// Core Storage Functions
// =====================================================

/**
 * Store encrypted credentials in database
 *
 * @param input Credential data to store
 * @returns Credential ID
 */
export async function storeCredential(input: CredentialInput): Promise<string> {
  const supabase = createAdminClient();

  // 1. Encrypt credentials
  const { encryptedData, iv, tag } = encryptCredentials(input.credentials);

  // 2. Store in database
  const { data, error } = await supabase
    .from('client_credentials')
    .insert([{
      company_id: input.companyId,
      platform_type: input.platformType,
      platform_name: input.platformName,
      encrypted_data: encryptedData,
      encryption_iv: iv,
      encryption_tag: tag,
      credential_type: input.credentialType,
      tier_required: input.tierRequired || 'basic',
      status: 'active',
      validation_status: 'not_tested',
      created_by: 'onboarding_form'
    }])
    .select('id')
    .single();

  if (error) {
    console.error('[CredentialStorage] Failed to store credential:', error);
    throw new Error(`Failed to store ${input.platformName} credentials: ${error.message}`);
  }

  // 3. Log the storage action
  await logCredentialAccess({
    credentialId: data.id,
    accessedBy: 'onboarding_form',
    accessType: 'write',
    accessPurpose: `Stored ${input.platformName} credentials during onboarding`,
    success: true
  });

  console.log(`✅ [CredentialStorage] Stored ${input.platformName} credentials (ID: ${data.id})`);

  return data.id;
}

/**
 * Store multiple credentials in batch
 * Handles website access, social media, Google ecosystem credentials
 *
 * @param companyId Company UUID
 * @param websiteAccess Website hosting/CMS/FTP/DNS credentials
 * @param socialMedia Social media platform credentials
 * @param googleEcosystem Google service credentials
 * @returns Array of credential IDs
 */
export async function storeOnboardingCredentials(
  companyId: string,
  websiteAccess?: any,
  socialMedia?: any,
  googleEcosystem?: any,
  marketingTools?: any,
  advertising?: any
): Promise<string[]> {
  const credentialIds: string[] = [];

  console.log(`📦 [CredentialStorage] Storing credentials for company ${companyId}...`);

  // Process Website Access credentials
  if (websiteAccess) {
    if (websiteAccess.hasHostingAccess && websiteAccess.hostingUsername && websiteAccess.hostingPassword) {
      const id = await storeCredential({
        companyId,
        platformType: 'website_hosting',
        platformName: websiteAccess.hostingProvider || 'Unknown Hosting Provider',
        credentials: {
          provider: websiteAccess.hostingProvider,
          controlPanel: websiteAccess.hostingControlPanel,
          url: websiteAccess.hostingUrl,
          username: websiteAccess.hostingUsername,
          password: websiteAccess.hostingPassword
        },
        credentialType: 'username_password'
      });
      credentialIds.push(id);
    }

    if (websiteAccess.hasCmsAccess && websiteAccess.cmsUsername && websiteAccess.cmsPassword) {
      const id = await storeCredential({
        companyId,
        platformType: 'website_cms',
        platformName: websiteAccess.cmsType || 'CMS',
        credentials: {
          cmsType: websiteAccess.cmsType,
          version: websiteAccess.cmsVersion,
          adminUrl: websiteAccess.cmsAdminUrl,
          username: websiteAccess.cmsUsername,
          password: websiteAccess.cmsPassword
        },
        credentialType: 'username_password'
      });
      credentialIds.push(id);
    }

    if (websiteAccess.hasFtpAccess && websiteAccess.ftpUsername && websiteAccess.ftpPassword) {
      const id = await storeCredential({
        companyId,
        platformType: 'website_hosting',
        platformName: 'FTP Access',
        credentials: {
          host: websiteAccess.ftpHost,
          port: websiteAccess.ftpPort,
          protocol: websiteAccess.ftpProtocol,
          username: websiteAccess.ftpUsername,
          password: websiteAccess.ftpPassword
        },
        credentialType: 'ftp_credentials'
      });
      credentialIds.push(id);
    }

    if (websiteAccess.hasDnsAccess && websiteAccess.dnsUsername && websiteAccess.dnsPassword) {
      const id = await storeCredential({
        companyId,
        platformType: 'website_dns',
        platformName: websiteAccess.dnsProvider || 'DNS Provider',
        credentials: {
          provider: websiteAccess.dnsProvider,
          username: websiteAccess.dnsUsername,
          password: websiteAccess.dnsPassword
        },
        credentialType: 'username_password'
      });
      credentialIds.push(id);
    }

    if (websiteAccess.hasDatabaseAccess && websiteAccess.dbUsername && websiteAccess.dbPassword) {
      const id = await storeCredential({
        companyId,
        platformType: 'analytics', // Using analytics as closest match
        platformName: `Database (${websiteAccess.dbType || 'Unknown'})`,
        credentials: {
          dbType: websiteAccess.dbType,
          host: websiteAccess.dbHost,
          port: websiteAccess.dbPort,
          name: websiteAccess.dbName,
          username: websiteAccess.dbUsername,
          password: websiteAccess.dbPassword
        },
        credentialType: 'username_password'
      });
      credentialIds.push(id);
    }
  }

  // Process Social Media credentials
  if (socialMedia) {
    const platforms = [
      { check: 'hasFacebookBusiness', name: 'Facebook Business', fields: ['facebookAccessToken'] },
      { check: 'hasInstagramBusiness', name: 'Instagram Business', fields: ['instagramAccessToken'] },
      { check: 'hasLinkedInPage', name: 'LinkedIn', fields: ['linkedInAccessToken'] },
      { check: 'hasTwitter', name: 'Twitter', fields: ['twitterAccessToken'] },
      { check: 'hasYouTube', name: 'YouTube', fields: ['youTubeApiKey'] },
      { check: 'hasTikTok', name: 'TikTok', fields: ['tiktokAccessToken'] },
      { check: 'hasPinterest', name: 'Pinterest', fields: ['pinterestAccessToken'] }
    ];

    for (const platform of platforms) {
      if (socialMedia[platform.check]) {
        // Check if at least one required field is present
        const hasCredentials = platform.fields.some(field => socialMedia[field]);

        if (hasCredentials) {
          const id = await storeCredential({
            companyId,
            platformType: 'social_media',
            platformName: platform.name,
            credentials: Object.fromEntries(
              Object.entries(socialMedia).filter(([key]) =>
                key.toLowerCase().includes(platform.name.toLowerCase().split(' ')[0])
              )
            ),
            credentialType: 'oauth_token'
          });
          credentialIds.push(id);
        }
      }
    }
  }

  // Process Google Ecosystem credentials
  if (googleEcosystem) {
    const googleServices = [
      { check: 'hasGoogleBusinessProfile', name: 'Google Business Profile', token: 'gbpAccessToken' },
      { check: 'hasGoogleAnalytics', name: 'Google Analytics', token: 'ga4AccessToken' },
      { check: 'hasSearchConsole', name: 'Google Search Console', token: 'gscAccessToken' },
      { check: 'hasGoogleAds', name: 'Google Ads', token: 'gadsAccessToken' },
      { check: 'hasTagManager', name: 'Google Tag Manager', token: 'gtmAccessToken' }
    ];

    for (const service of googleServices) {
      if (googleEcosystem[service.check] && googleEcosystem[service.token]) {
        const id = await storeCredential({
          companyId,
          platformType: 'google_ecosystem',
          platformName: service.name,
          credentials: Object.fromEntries(
            Object.entries(googleEcosystem).filter(([key]) =>
              key.toLowerCase().includes(service.name.toLowerCase().replace(/\s+/g, ''))
            )
          ),
          credentialType: 'oauth_token'
        });
        credentialIds.push(id);
      }
    }
  }

  // Process Marketing Tools credentials
  if (marketingTools) {
    const tools = [
      { check: 'hasMailchimp', name: 'Mailchimp', fields: ['mailchimpApiKey'] },
      { check: 'hasKlaviyo', name: 'Klaviyo', fields: ['klaviyoApiKey'] },
      { check: 'hasHubspot', name: 'HubSpot', fields: ['hubspotApiKey'] },
      { check: 'hasSalesforce', name: 'Salesforce', fields: ['salesforceUsername', 'salesforcePassword'] },
      { check: 'hasCallRail', name: 'CallRail', fields: ['callRailApiKey'] },
      { check: 'hasHotjar', name: 'Hotjar', fields: ['hotjarSiteId'] }
    ];

    for (const tool of tools) {
      if (marketingTools[tool.check]) {
        const hasCredentials = tool.fields.some(field => marketingTools[field]);

        if (hasCredentials) {
          const id = await storeCredential({
            companyId,
            platformType: 'email_marketing',
            platformName: tool.name,
            credentials: Object.fromEntries(
              Object.entries(marketingTools).filter(([key]) =>
                key.toLowerCase().includes(tool.name.toLowerCase().replace(/\s+/g, ''))
              )
            ),
            credentialType: tool.name === 'Salesforce' ? 'username_password' : 'api_key'
          });
          credentialIds.push(id);
        }
      }
    }
  }

  // Process Advertising Platform credentials
  if (advertising) {
    const platforms = [
      { check: 'hasGoogleAdsManager', name: 'Google Ads Manager', fields: ['googleAdsClientId'] },
      { check: 'hasFacebookAds', name: 'Facebook Ads Manager', fields: ['facebookAdsAccessToken'] },
      { check: 'hasMicrosoftAds', name: 'Microsoft Ads', fields: ['microsoftAdsAccessToken'] }
    ];

    for (const platform of platforms) {
      if (advertising[platform.check]) {
        const hasCredentials = platform.fields.some(field => advertising[field]);

        if (hasCredentials) {
          const id = await storeCredential({
            companyId,
            platformType: 'advertising',
            platformName: platform.name,
            credentials: Object.fromEntries(
              Object.entries(advertising).filter(([key]) =>
                key.toLowerCase().includes(platform.name.toLowerCase().split(' ')[0])
              )
            ),
            credentialType: 'oauth_token'
          });
          credentialIds.push(id);
        }
      }
    }
  }

  console.log(`✅ [CredentialStorage] Stored ${credentialIds.length} credential(s) for company ${companyId}`);

  return credentialIds;
}

/**
 * Retrieve and decrypt credentials for a company
 *
 * @param companyId Company UUID
 * @param platformType Optional filter by platform type
 * @returns Array of decrypted credentials
 */
export async function getCompanyCredentials(
  companyId: string,
  platformType?: string
): Promise<RetrievedCredential[]> {
  const supabase = createAdminClient();

  // Build query
  let query = supabase
    .from('client_credentials')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'active');

  if (platformType) {
    query = query.eq('platform_type', platformType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[CredentialStorage] Failed to retrieve credentials:', error);
    throw new Error(`Failed to retrieve credentials: ${error.message}`);
  }

  if (!data || data.length === 0) {
    console.log(`⚠️  [CredentialStorage] No credentials found for company ${companyId}`);
    return [];
  }

  // Decrypt each credential
  const decryptedCredentials: RetrievedCredential[] = [];

  for (const cred of data) {
    try {
      const decrypted = decryptCredentials(
        cred.encrypted_data,
        cred.encryption_iv,
        cred.encryption_tag
      );

      decryptedCredentials.push({
        id: cred.id,
        platformType: cred.platform_type,
        platformName: cred.platform_name,
        credentials: decrypted,
        status: cred.status,
        lastValidated: cred.last_validated_at,
        validationStatus: cred.validation_status
      });

      // Log the read access
      await logCredentialAccess({
        credentialId: cred.id,
        accessedBy: 'system',
        accessType: 'read',
        accessPurpose: `Retrieved ${cred.platform_name} credentials`,
        success: true
      });

    } catch (decryptError) {
      console.error(`❌ [CredentialStorage] Failed to decrypt ${cred.platform_name}:`, decryptError);

      // Log the failed read
      await logCredentialAccess({
        credentialId: cred.id,
        accessedBy: 'system',
        accessType: 'read',
        accessPurpose: `Attempted to retrieve ${cred.platform_name} credentials`,
        success: false,
        errorMessage: decryptError instanceof Error ? decryptError.message : 'Decryption failed'
      });
    }
  }

  console.log(`✅ [CredentialStorage] Retrieved ${decryptedCredentials.length} credential(s) for company ${companyId}`);

  return decryptedCredentials;
}

/**
 * Log credential access for audit trail
 *
 * @param entry Access log entry
 */
export async function logCredentialAccess(entry: AccessLogEntry): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('credential_access_log')
    .insert([{
      credential_id: entry.credentialId,
      accessed_by: entry.accessedBy,
      access_type: entry.accessType,
      access_purpose: entry.accessPurpose,
      success: entry.success,
      error_message: entry.errorMessage,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent
    }]);

  if (error) {
    console.error('[CredentialStorage] Failed to log access:', error);
    // Don't throw - logging failure shouldn't break the main flow
  }
}

/**
 * Update credential status
 *
 * @param credentialId Credential UUID
 * @param status New status
 */
export async function updateCredentialStatus(
  credentialId: string,
  status: 'active' | 'expired' | 'revoked' | 'invalid'
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('client_credentials')
    .update({ status })
    .eq('id', credentialId);

  if (error) {
    throw new Error(`Failed to update credential status: ${error.message}`);
  }

  console.log(`✅ [CredentialStorage] Updated credential ${credentialId} status to ${status}`);
}

/**
 * Validate credentials (attempt to use them)
 * This would call the actual platform APIs to verify credentials work
 *
 * @param credentialId Credential UUID
 * @returns Validation result
 */
export async function validateCredentials(credentialId: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  // TODO: Implement actual platform-specific validation
  // For now, just mark as pending

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('client_credentials')
    .update({
      validation_status: 'pending',
      last_validated_at: new Date().toISOString()
    })
    .eq('id', credentialId);

  if (error) {
    return { valid: false, error: error.message };
  }

  return { valid: true };
}
