# 🔑 Google My Business (GMB) OAuth Token Setup Guide

## Overview

The `GMB_ACCESS_TOKEN` is an OAuth 2.0 token used to access the **Google Business Profile API** (formerly My Business API). This guide covers how to obtain and manage OAuth tokens for GMB integration.

**Important**: GMB uses OAuth 2.0, NOT a simple API key. Tokens expire and need refreshing.

## Prerequisites

- Google Cloud Project with billing enabled
- Google Business Profile (formerly Google My Business)
- Business profile must be verified

## Step 1: Enable Required APIs

### 1.1 Go to Google Cloud Console
👉 https://console.cloud.google.com/apis/library

### 1.2 Enable These APIs

Enable all three GMB-related APIs:

1. **Google Business Profile API**
   - https://console.cloud.google.com/apis/library/mybusinessbusinessinformation.googleapis.com
   - Click **ENABLE**

2. **My Business Account Management API**
   - https://console.cloud.google.com/apis/library/mybusinessaccountmanagement.googleapis.com
   - Click **ENABLE**

3. **My Business Business Information API** 
   - https://console.cloud.google.com/apis/library/mybusinessbusinessinformation.googleapis.com
   - Click **ENABLE**

## Step 2: Configure OAuth Consent Screen

### 2.1 Go to OAuth Consent Screen
👉 https://console.cloud.google.com/apis/credentials/consent

### 2.2 Choose User Type
- Select **External** (unless you have Google Workspace)
- Click **CREATE**

### 2.3 Fill App Information

**App name**: `GEO-SEO Domination Tool`

**User support email**: Your email address

**App logo** (optional): Upload 120x120px logo

**Application home page**: `https://geo-seo-domination-tool.vercel.app`

**Authorized domains**:
```
vercel.app
yourdomain.com
```

**Developer contact information**: Your email

Click **SAVE AND CONTINUE**

### 2.4 Add Scopes

Click **ADD OR REMOVE SCOPES**

Add these required scopes:
- ✅ `https://www.googleapis.com/auth/business.manage` - Full GMB access
- ✅ `https://www.googleapis.com/auth/plus.business.manage` - Legacy scope (still needed)
- ✅ `../auth/userinfo.email` - User email
- ✅ `../auth/userinfo.profile` - User profile
- ✅ `openid` - OpenID Connect

Click **UPDATE** → **SAVE AND CONTINUE**

### 2.5 Add Test Users (if External)

While in development/testing mode:
- Click **+ ADD USERS**
- Add your email address
- Click **ADD** → **SAVE AND CONTINUE**

### 2.6 Review and Submit

- Review summary
- Click **BACK TO DASHBOARD**

## Step 3: Create OAuth Client ID

### 3.1 Go to Credentials
👉 https://console.cloud.google.com/apis/credentials

### 3.2 Create OAuth Client

1. Click **+ CREATE CREDENTIALS**
2. Select **OAuth client ID**
3. Choose **Web application**

### 3.3 Configure Client

**Name**: `GEO-SEO Tool - GMB Integration`

**Authorized JavaScript origins**:
```
http://localhost:3000
https://geo-seo-domination-tool.vercel.app
```

**Authorized redirect URIs**:
```
http://localhost:3000/api/auth/callback/google-business
https://geo-seo-domination-tool.vercel.app/api/auth/callback/google-business
https://developers.google.com/oauthplayground
```

Click **CREATE**

### 3.4 Save Credentials

Copy and save securely:
- **Client ID**: `810093513411-xxxxx.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxx`

## Step 4: Get OAuth Tokens

You have two options for obtaining tokens:

### Option A: Quick Test Token (OAuth Playground)

**Best for**: Testing, development, immediate use
**Lifespan**: Access token expires in 1 hour
**Effort**: 5 minutes

#### Steps:

1. **Go to OAuth Playground**
   👉 https://developers.google.com/oauthplayground/

2. **Configure Settings** (gear icon ⚙️)
   - ✅ Check "Use your own OAuth credentials"
   - Enter your **Client ID**
   - Enter your **Client Secret**
   - Close settings

3. **Select Scope**
   - In "Step 1: Select & authorize APIs"
   - Scroll to find or paste: `https://www.googleapis.com/auth/business.manage`
   - Click **Authorize APIs**

4. **Authorize**
   - Sign in with Google account that has GMB access
   - Grant permissions
   - Will redirect back to playground

5. **Exchange for Tokens**
   - In "Step 2: Exchange authorization code for tokens"
   - Click **Exchange authorization code for tokens**
   - You'll receive:
     - `access_token` - Use immediately, expires in 1 hour
     - `refresh_token` - Use to get new access tokens

6. **Copy Both Tokens**
   - Save both for your `.env` file

### Option B: Production OAuth Flow (Recommended)

**Best for**: Production, automatic token refresh
**Lifespan**: Refresh token can be long-lived
**Effort**: 1-2 hours to implement

#### Implementation Overview:

```javascript
// 1. Redirect user to Google OAuth
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
  client_id: process.env.GMB_CLIENT_ID,
  redirect_uri: 'https://yourdomain.com/api/auth/callback/google-business',
  response_type: 'code',
  scope: 'https://www.googleapis.com/auth/business.manage',
  access_type: 'offline', // Get refresh token
  prompt: 'consent' // Force consent to get refresh token
})}`;

// 2. Handle callback and exchange code for tokens
const response = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    code: authorizationCode,
    client_id: process.env.GMB_CLIENT_ID,
    client_secret: process.env.GMB_CLIENT_SECRET,
    redirect_uri: 'https://yourdomain.com/api/auth/callback/google-business',
    grant_type: 'authorization_code'
  })
});

const { access_token, refresh_token } = await response.json();

// 3. Store refresh_token securely (database)
// 4. Use access_token for API calls
```

## Step 5: Configure Environment Variables

### Local Development (.env.local)

```bash
# Google My Business OAuth Credentials
GMB_CLIENT_ID="810093513411-xxxxx.apps.googleusercontent.com"
GMB_CLIENT_SECRET="GOCSPX-xxxxx"

# OAuth Tokens (from OAuth Playground or your OAuth flow)
GMB_ACCESS_TOKEN="ya29.a0AQQ_BDRy...xxxxx"
GMB_REFRESH_TOKEN="1//04nz68XUyutp...xxxxx"

# Optional: Your GMB Account/Location IDs (for direct API calls)
GMB_ACCOUNT_ID="accounts/123456789"
GMB_LOCATION_ID="accounts/123456789/locations/987654321"
```

### Production (Vercel)

```bash
# Add via CLI
vercel env add GMB_CLIENT_ID production
vercel env add GMB_CLIENT_SECRET production
vercel env add GMB_REFRESH_TOKEN production

# Or via Vercel Dashboard:
# Settings → Environment Variables → Add each variable
```

## Step 6: Implement Token Refresh

Access tokens expire after 1 hour. Implement refresh logic:

```javascript
// lib/gmb/refresh-token.js
export async function refreshGMBAccessToken() {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GMB_CLIENT_ID,
      client_secret: process.env.GMB_CLIENT_SECRET,
      refresh_token: process.env.GMB_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Token refresh failed: ${data.error}`);
  }
  
  return data.access_token; // Valid for 1 hour
}

// Usage in API routes
const accessToken = await refreshGMBAccessToken();
// Use accessToken for GMB API calls
```

## Step 7: Test Your GMB Integration

### 7.1 Get Your Account ID

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://mybusinessaccountmanagement.googleapis.com/v1/accounts
```

Response will include your account ID(s):
```json
{
  "accounts": [{
    "name": "accounts/123456789",
    "accountName": "Your Business Name",
    "type": "PERSONAL"
  }]
}
```

### 7.2 Get Your Location(s)

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://mybusinessbusinessinformation.googleapis.com/v1/accounts/123456789/locations
```

### 7.3 Test API Call

```javascript
// Example: Fetch business locations
const response = await fetch(
  `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  }
);

const locations = await response.json();
console.log(locations);
```

## Common API Endpoints

### Account Management
```
GET /v1/accounts
GET /v1/accounts/{accountId}
```

### Location Information
```
GET /v1/accounts/{accountId}/locations
GET /v1/{locationName}
PATCH /v1/{locationName}
```

### Reviews
```
GET /v1/{locationName}/reviews
POST /v1/{locationName}/reviews/{reviewId}:updateReply
DELETE /v1/{locationName}/reviews/{reviewId}/reply
```

### Posts (Local Posts)
```
POST /v1/{locationName}/localPosts
GET /v1/{locationName}/localPosts
DELETE /v1/{locationName}/localPosts/{postId}
```

### Insights/Analytics
```
POST /v1/{locationName}/localPosts:reportInsights
GET /v1/{locationName}:fetchVerificationOptions
```

## Security Best Practices

### ✅ DO:
- Store refresh_token in secure database (encrypted)
- Use access_token for API calls (expires in 1 hour)
- Implement automatic token refresh before expiration
- Keep Client Secret in environment variables only
- Use HTTPS for all OAuth flows
- Validate tokens before use

### ❌ DON'T:
- Never commit tokens to Git
- Don't expose tokens in frontend code
- Don't share Client Secret publicly
- Don't use `NEXT_PUBLIC_` prefix for sensitive tokens
- Don't store access_token long-term (use refresh_token)

## Troubleshooting

### Issue: "Invalid OAuth credentials"

**Cause**: Client ID or Secret is incorrect

**Fix**:
- Double-check credentials from Google Cloud Console
- Ensure no extra spaces when copying
- Verify OAuth client is created for correct project

### Issue: "Invalid grant" when refreshing token

**Cause**: Refresh token is expired or revoked

**Fix**:
- User needs to re-authorize (go through OAuth flow again)
- Refresh tokens can expire if:
  - Not used for 6 months (Google policy)
  - User revoked access
  - Password changed
  - Security event

### Issue: "Insufficient permissions"

**Cause**: Missing required OAuth scopes

**Fix**:
- Ensure `business.manage` scope is included
- User must re-authorize with new scopes
- Check OAuth consent screen has all required scopes

### Issue: "Daily Limit Exceeded"

**Cause**: Hit Google's API quota limits

**Fix**:
- Check quotas in Google Cloud Console
- Request quota increase if needed
- Implement caching to reduce API calls
- Monitor usage patterns

## Rate Limits & Quotas

**Google Business Profile API Limits:**
- 100,000 requests per day (default)
- 100 requests per 100 seconds per user
- Can request increase via Google Cloud Console

**Best Practices:**
- Cache frequently accessed data
- Batch requests when possible
- Implement exponential backoff for retries
- Monitor quota usage in Cloud Console

## Token Lifecycle

```
User Authorization (One-time)
    ↓
Authorization Code
    ↓
Exchange for Tokens
    ↓
access_token (1 hour) + refresh_token (long-lived)
    ↓
Use access_token for API calls
    ↓
Token expires after 1 hour
    ↓
Use refresh_token to get new access_token
    ↓
Repeat
```

## Additional Resources

- **Google Business Profile API Documentation**: https://developers.google.com/my-business
- **OAuth 2.0 Guide**: https://developers.google.com/identity/protocols/oauth2
- **API Reference**: https://developers.google.com/my-business/reference/rest
- **OAuth Playground**: https://developers.google.com/oauthplayground/
- **GMB API Forum**: https://support.google.com/business/community

## Summary Checklist

- [x] Enable Google Business Profile APIs in Cloud Console
- [x] Configure OAuth consent screen
- [x] Create OAuth Client ID
- [x] Get access_token and refresh_token (OAuth Playground or custom flow)
- [x] Add tokens to environment variables
- [x] Implement token refresh logic
- [x] Test API integration
- [x] Deploy to production with secure token storage

---

**Status**: ✅ GMB OAuth setup complete!

**Next**: [BING_WEBMASTER_API_KEY_SETUP.md](./BING_WEBMASTER_API_KEY_SETUP.md)
