/**
 * GMB API Client with Automatic Token Refresh
 * Provides a wrapper around GMB API calls with automatic token management
 */

import { createAdminClient } from '@/lib/auth/supabase-admin';
import { encryptToken, decryptToken } from './token-encryption';

export interface GMBIntegration {
  id: string;
  user_id: string;
  company_id?: string;
  organisation_id?: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  gmb_account_id?: string;
  gmb_account_name?: string;
  gmb_location_ids?: string[];
  gmb_locations?: any[];
  status: string;
}

export class GMBClient {
  private integration: GMBIntegration;
  private decryptedAccessToken: string;
  private decryptedRefreshToken: string;

  constructor(integration: GMBIntegration) {
    this.integration = integration;
    this.decryptedAccessToken = decryptToken(integration.access_token);
    this.decryptedRefreshToken = decryptToken(integration.refresh_token);
  }

  /**
   * Get current valid access token (refreshes if needed)
   */
  async getAccessToken(): Promise<string> {
    // Check if token is expired or will expire in next 5 minutes
    const expiresAt = new Date(this.integration.token_expires_at);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt <= fiveMinutesFromNow) {
      console.log('Token expired or expiring soon, refreshing...');
      await this.refreshAccessToken();
    }

    return this.decryptedAccessToken;
  }

  /**
   * Refresh the access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    const clientId = process.env.GMB_CLIENT_ID;
    const clientSecret = process.env.GMB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('GMB OAuth credentials not configured');
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: this.decryptedRefreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Token refresh failed:', error);
        
        // Mark integration as expired in database
        const supabase = createAdminClient();
        await supabase
          .from('gmb_integrations')
          .update({
            status: 'expired',
            last_error: error.error_description || error.error,
          })
          .eq('id', this.integration.id);

        throw new Error(`Token refresh failed: ${error.error}`);
      }

      const tokens = await response.json();
      const { access_token, expires_in } = tokens;

      // Update in-memory token
      this.decryptedAccessToken = access_token;

      // Calculate new expiry
      const newExpiresAt = new Date(Date.now() + expires_in * 1000);

      // Encrypt and update in database
      const encryptedAccessToken = encryptToken(access_token);
      
      const supabase = createAdminClient();
      await supabase
        .from('gmb_integrations')
        .update({
          access_token: encryptedAccessToken,
          token_expires_at: newExpiresAt.toISOString(),
          status: 'active',
          last_error: null,
        })
        .eq('id', this.integration.id);

      // Update local integration object
      this.integration.access_token = encryptedAccessToken;
      this.integration.token_expires_at = newExpiresAt.toISOString();
      
      console.log('Token refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw error;
    }
  }

  /**
   * Make authenticated request to GMB API
   */
  async request(url: string, options: RequestInit = {}): Promise<Response> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // If unauthorized, try refreshing token once
    if (response.status === 401) {
      console.log('Received 401, attempting token refresh...');
      await this.refreshAccessToken();
      
      const retryAccessToken = await this.getAccessToken();
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${retryAccessToken}`,
          'Content-Type': 'application/json',
        },
      });
    }

    return response;
  }

  /**
   * Get GMB accounts
   */
  async getAccounts() {
    const response = await this.request(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts'
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch accounts: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get locations for an account
   */
  async getLocations(accountId: string) {
    const response = await this.request(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch locations: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get location details
   */
  async getLocation(locationName: string) {
    const response = await this.request(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch location: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get reviews for a location
   */
  async getReviews(locationName: string) {
    const response = await this.request(
      `https://mybusiness.googleapis.com/v4/${locationName}/reviews`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch reviews: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Update location information
   */
  async updateLocation(locationName: string, updates: any) {
    const response = await this.request(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to update location: ${response.statusText}`);
    }
    
    return response.json();
  }
}

/**
 * Get GMB client for a user
 */
export async function getGMBClient(userId: string): Promise<GMBClient | null> {
  const supabase = createAdminClient();
  
  const { data: integration, error } = await supabase
    .from('gmb_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error || !integration) {
    return null;
  }

  return new GMBClient(integration);
}

/**
 * Get GMB client for a company
 */
export async function getGMBClientForCompany(companyId: string): Promise<GMBClient | null> {
  const supabase = createAdminClient();
  
  const { data: integration, error } = await supabase
    .from('gmb_integrations')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .single();

  if (error || !integration) {
    return null;
  }

  return new GMBClient(integration);
}
