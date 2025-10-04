import crypto from 'crypto'

export interface OAuthConfig {
  clientId: string
  clientSecret: string
  authorizeUrl: string
  tokenUrl: string
  redirectUri: string
  scopes: string[]
}

export interface OAuthTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope?: string
}

export class OAuthHandler {
  private config: OAuthConfig

  constructor(config: OAuthConfig) {
    this.config = config
  }

  // Generate authorization URL
  generateAuthUrl(state?: string): string {
    const stateToken = state || this.generateState()

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      state: stateToken,
    })

    return `${this.config.authorizeUrl}?${params.toString()}`
  }

  // Generate random state for CSRF protection
  generateState(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    })

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OAuth token exchange failed: ${error.error_description || error.error}`)
    }

    return response.json()
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    })

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Token refresh failed: ${error.error_description || error.error}`)
    }

    return response.json()
  }

  // Revoke token
  async revokeToken(token: string, tokenTypeHint: 'access_token' | 'refresh_token' = 'access_token'): Promise<void> {
    const params = new URLSearchParams({
      token,
      token_type_hint: tokenTypeHint,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    })

    const response = await fetch(`${this.config.tokenUrl}/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      throw new Error('Token revocation failed')
    }
  }
}

// Pre-configured OAuth handlers for popular services
export const OAuthProviders = {
  github: (clientId: string, clientSecret: string, redirectUri: string): OAuthHandler => {
    return new OAuthHandler({
      clientId,
      clientSecret,
      authorizeUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      redirectUri,
      scopes: ['repo', 'user', 'read:org'],
    })
  },

  vercel: (clientId: string, clientSecret: string, redirectUri: string): OAuthHandler => {
    return new OAuthHandler({
      clientId,
      clientSecret,
      authorizeUrl: 'https://vercel.com/oauth/authorize',
      tokenUrl: 'https://api.vercel.com/v2/oauth/access_token',
      redirectUri,
      scopes: ['user', 'deployments'],
    })
  },

  auth0: (domain: string, clientId: string, clientSecret: string, redirectUri: string): OAuthHandler => {
    return new OAuthHandler({
      clientId,
      clientSecret,
      authorizeUrl: `https://${domain}/authorize`,
      tokenUrl: `https://${domain}/oauth/token`,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
    })
  },

  google: (clientId: string, clientSecret: string, redirectUri: string): OAuthHandler => {
    return new OAuthHandler({
      clientId,
      clientSecret,
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      redirectUri,
      scopes: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
    })
  },
}
