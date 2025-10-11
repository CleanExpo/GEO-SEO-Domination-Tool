# Google My Business OAuth Setup Guide

This document explains how to configure Google My Business (GMB) OAuth credentials for the Onboarding Vitals system.

## 🔐 Security Warning

**NEVER commit OAuth tokens to Git!**

- ✅ `.env.local` is already in `.gitignore`
- ✅ Access tokens expire in ~1 hour (automatically refreshed)
- ✅ Refresh tokens are long-lived (use to get new access tokens)

## Local Development Setup

Your `.env.local` file already contains:

```bash
# Google My Business OAuth Tokens
GMB_ACCESS_TOKEN="ya29.a0..."  # Expires in ~1 hour (get from OAuth flow)
GMB_REFRESH_TOKEN="1//0xxx..." # Long-lived token (get from OAuth flow)

# OAuth Client Credentials (from Google Cloud Console)
GMB_CLIENT_ID="YOUR_CLIENT_ID.apps.googleusercontent.com"
GMB_CLIENT_SECRET="YOUR_CLIENT_SECRET"
```

## Production Deployment (Vercel)

Add these environment variables to Vercel:

### Option 1: Via Vercel Dashboard

1. Go to https://vercel.com/unite-group/geo-seo-domination-tool/settings/environment-variables
2. Add the following variables:

| Name | Value | Environments |
|------|-------|--------------|
| `GMB_CLIENT_ID` | `YOUR_CLIENT_ID.apps.googleusercontent.com` | Production, Preview, Development |
| `GMB_CLIENT_SECRET` | `YOUR_CLIENT_SECRET` | Production, Preview, Development |
| `GMB_REFRESH_TOKEN` | `YOUR_REFRESH_TOKEN` | Production, Preview, Development |

### Option 2: Via Vercel CLI

```bash
# Set each environment variable for all environments
npx vercel env add GMB_CLIENT_ID production preview development
# When prompted, paste your actual Client ID from Google Cloud Console

npx vercel env add GMB_CLIENT_SECRET production preview development
# When prompted, paste your actual Client Secret from Google Cloud Console

npx vercel env add GMB_REFRESH_TOKEN production preview development
# When prompted, paste your actual Refresh Token from OAuth flow
```

After adding, redeploy your project:

```bash
npx vercel --prod
```

## How Token Refresh Works

The system automatically handles token expiration:

1. **First Request**: Uses `GMB_ACCESS_TOKEN` if available (for manual testing)
2. **Auto-Refresh**: If no manual token, uses `GMB_REFRESH_TOKEN` to get new access token
3. **Token Caching**: Caches access token in memory until 5 minutes before expiry
4. **Automatic Renewal**: Refreshes token automatically when needed

### Service Implementation

```typescript
// services/api/google-oauth-refresh.ts
import { getGMBAccessToken } from '@/services/api/google-oauth-refresh';

// Automatically handles token refresh
const accessToken = await getGMBAccessToken();
```

### API Usage

```typescript
// app/api/onboarding/vitals/capture/route.ts
import { createGMBServiceWithRefresh } from '@/services/api/google-my-business';

// Creates GMB service with auto-refreshing token
const gmbService = await createGMBServiceWithRefresh();
const vitals = await gmbService.getBaselineVitals(locationId);
```

## Testing OAuth Flow

### Test Token Refresh Locally

```bash
# Start dev server
npm run dev

# Test vitals capture endpoint
curl -X POST http://localhost:3000/api/onboarding/vitals/capture \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "your-company-uuid",
    "options": {
      "includeGMB": true
    }
  }'
```

Check console logs for:
```
[OAuth] Refreshing access token...
[OAuth] ✓ Access token refreshed (expires in 3600s)
[GMB] Fetching baseline vitals for locations/12345...
```

## OAuth Scopes Required

Your OAuth app needs these scopes:
- `https://www.googleapis.com/auth/business.manage` - Full GMB management
- `https://www.googleapis.com/auth/businessinformation` - Read business information

## Troubleshooting

### Error: "invalid_grant" when refreshing token

**Cause**: Refresh token expired or revoked

**Solution**:
1. Re-authenticate with Google OAuth
2. Get new refresh token
3. Update `GMB_REFRESH_TOKEN` in `.env.local` and Vercel

### Error: "insufficient_permissions"

**Cause**: OAuth app doesn't have required scopes

**Solution**:
1. Go to Google Cloud Console
2. Enable "Google My Business API"
3. Update OAuth consent screen with required scopes
4. Re-authenticate to get new tokens

### Error: "Location not found"

**Cause**: `company.gmb_location_id` is missing or incorrect

**Solution**:
1. Ensure company record has `gmb_location_id` field populated
2. Format should be: `locations/12345678901234567890`
3. Get location ID via GMB API or Google Business Profile dashboard

## Getting Your GMB Location ID

If you don't have your location ID:

```typescript
// Use the GMB API to list your locations
const response = await axios.get(
  'https://mybusinessbusinessinformation.googleapis.com/v1/accounts/{accountId}/locations',
  {
    headers: { Authorization: `Bearer ${accessToken}` }
  }
);

console.log(response.data.locations);
// Find your location and copy the "name" field (e.g., "locations/12345...")
```

## Next Steps

After setting up OAuth credentials:

1. ✅ Run database migration to create `onboarding_vitals` tables
2. ✅ Test vitals capture locally with a test company
3. ✅ Deploy to Vercel with environment variables configured
4. ✅ Capture baseline vitals for your first client
5. ✅ Build UI dashboard to display captured metrics

---

**Last Updated**: January 2025
**Related PRD**: `PRD_ONBOARDING_VITALS_CHECKLIST.md`
