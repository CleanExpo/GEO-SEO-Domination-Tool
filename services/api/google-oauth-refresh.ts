import axios from 'axios';

// Google OAuth Token Refresh Service
// Automatically refreshes expired GMB access tokens using refresh token

const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export interface OAuthTokenResponse {
  access_token: string;
  expires_in: number; // seconds (typically 3600 = 1 hour)
  scope: string;
  token_type: 'Bearer';
  refresh_token?: string; // Only returned on first auth, not on refresh
}

export class GoogleOAuthRefreshService {
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;

  // Cached access token
  private cachedAccessToken?: string;
  private tokenExpiresAt?: number; // Unix timestamp

  constructor(clientId: string, clientSecret: string, refreshToken: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.refreshToken = refreshToken;
  }

  /**
   * Get a valid access token (uses cache if not expired)
   */
  async getAccessToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if still valid (with 5 minute buffer)
    if (this.cachedAccessToken && this.tokenExpiresAt && now < this.tokenExpiresAt - 300000) {
      console.log('[OAuth] Using cached access token');
      return this.cachedAccessToken;
    }

    // Refresh token
    console.log('[OAuth] Refreshing access token...');
    const newToken = await this.refreshAccessToken();
    return newToken;
  }

  /**
   * Force refresh the access token using refresh token
   */
  async refreshAccessToken(): Promise<string> {
    try {
      const response = await axios.post<OAuthTokenResponse>(
        OAUTH_TOKEN_URL,
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, expires_in } = response.data;

      // Cache the new token
      this.cachedAccessToken = access_token;
      this.tokenExpiresAt = Date.now() + expires_in * 1000;

      console.log(`[OAuth] ✓ Access token refreshed (expires in ${expires_in}s)`);

      return access_token;
    } catch (error: any) {
      console.error('[OAuth] Token refresh failed:', error.response?.data || error.message);
      throw new Error(`OAuth refresh failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Check if the current token is expired or will expire soon
   */
  isTokenExpired(bufferSeconds: number = 300): boolean {
    if (!this.tokenExpiresAt) return true;
    return Date.now() >= this.tokenExpiresAt - bufferSeconds * 1000;
  }
}

// Singleton instance for GMB OAuth
let gmbOAuthService: GoogleOAuthRefreshService | null = null;

/**
 * Get or create the GMB OAuth service instance
 */
export function getGMBOAuthService(): GoogleOAuthRefreshService | null {
  const clientId = process.env.GMB_CLIENT_ID;
  const clientSecret = process.env.GMB_CLIENT_SECRET;
  const refreshToken = process.env.GMB_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('[OAuth] GMB OAuth credentials not configured');
    return null;
  }

  if (!gmbOAuthService) {
    gmbOAuthService = new GoogleOAuthRefreshService(clientId, clientSecret, refreshToken);
  }

  return gmbOAuthService;
}

/**
 * Get a fresh GMB access token (auto-refreshes if needed)
 */
export async function getGMBAccessToken(): Promise<string | null> {
  // First check for manually provided access token
  const manualToken = process.env.GMB_ACCESS_TOKEN;
  if (manualToken) {
    console.log('[OAuth] Using manual GMB_ACCESS_TOKEN from env');
    return manualToken;
  }

  // Otherwise use refresh token flow
  const oauthService = getGMBOAuthService();
  if (!oauthService) {
    console.error('[OAuth] Cannot get access token - OAuth credentials missing');
    return null;
  }

  try {
    return await oauthService.getAccessToken();
  } catch (error: any) {
    console.error('[OAuth] Failed to get access token:', error.message);
    return null;
  }
}
