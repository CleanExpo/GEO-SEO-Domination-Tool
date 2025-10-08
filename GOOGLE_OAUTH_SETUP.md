# Google OAuth 2.0 Client ID Setup Guide

## Overview
OAuth Client ID is needed for "Sign in with Google" functionality in your GEO-SEO tool.

## Step 1: Configure OAuth Consent Screen

Before creating OAuth credentials, you need to set up the consent screen.

### 1.1 Go to OAuth Consent Screen
https://console.cloud.google.com/apis/credentials/consent

### 1.2 Choose User Type
- **Internal**: Only for Google Workspace users in your organization
- **External**: For anyone with a Google account (recommended)

Select **External** → Click **CREATE**

### 1.3 App Information
Fill in these required fields:

**App name**: `GEO-SEO Domination Tool`

**User support email**: Your email address (e.g., `phill@disasterrecovery.com.au`)

**App logo** (optional): Upload your company logo (120x120px)

**Application home page** (optional): `https://geo-seo-domination-tool.vercel.app`

**Application privacy policy link** (optional): `https://geo-seo-domination-tool.vercel.app/privacy`

**Application terms of service link** (optional): `https://geo-seo-domination-tool.vercel.app/terms`

**Authorized domains**:
```
vercel.app
disasterrecovery.com.au
```

**Developer contact information**: Your email (e.g., `phill@disasterrecovery.com.au`)

Click **SAVE AND CONTINUE**

### 1.4 Scopes
Click **ADD OR REMOVE SCOPES**

Select these scopes:
- ✅ `../auth/userinfo.email` - See your primary Google Account email address
- ✅ `../auth/userinfo.profile` - See your personal info, including any personal info you've made publicly available
- ✅ `openid` - Associate you with your personal info on Google

Click **UPDATE** → **SAVE AND CONTINUE**

### 1.5 Test Users (if using External)
Add your email address as a test user while in development:
- Click **+ ADD USERS**
- Enter your email: `phill@disasterrecovery.com.au`
- Click **ADD**
- Click **SAVE AND CONTINUE**

### 1.6 Summary
Review and click **BACK TO DASHBOARD**

## Step 2: Create OAuth Client ID

### 2.1 Go to Credentials
https://console.cloud.google.com/apis/credentials

### 2.2 Create OAuth Client ID
1. Click **+ CREATE CREDENTIALS**
2. Select **OAuth client ID**

### 2.3 Application Type
Select: **Web application**

### 2.4 Configure OAuth Client

**Name**: `GEO-SEO Tool - Web Client`

**Authorized JavaScript origins** (for local development and production):
```
http://localhost:3000
http://localhost:3001
https://geo-seo-domination-tool.vercel.app
https://geo-seo-domination-tool-git-main-unite-group.vercel.app
```

**Authorized redirect URIs** (for Supabase Auth callback):
```
http://localhost:3000/auth/callback
https://geo-seo-domination-tool.vercel.app/auth/callback
https://qwoggbbavikzhypzodcr.supabase.co/auth/v1/callback
```

### 2.5 Create
Click **CREATE**

### 2.6 Copy Credentials
A modal will appear with your credentials:

**Your Client ID**: `123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`

**Your Client Secret**: `GOCSPX-abcdefghijklmnopqrstuvwx`

⚠️ **IMPORTANT**: Copy both values immediately! You won't be able to see the secret again.

Click **OK**

## Step 3: Update Environment Variables

### Local Development (.env.local)

Add these to your `.env.local` file:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwx

# Also keep your API key
GOOGLE_API_KEY=AIzaSy...your-api-key-here
```

### Supabase Configuration

If using Supabase for authentication:

1. Go to: https://app.supabase.com/project/qwoggbbavikzhypzodcr/auth/providers
2. Find **Google** provider
3. Click **Enable**
4. Paste your:
   - **Client ID**: `123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-abcdefghijklmnopqrstuvwx`
5. Click **Save**

### Vercel Environment Variables

```bash
# Via CLI
vercel env add GOOGLE_CLIENT_ID production
# Paste your Client ID when prompted

vercel env add GOOGLE_CLIENT_SECRET production
# Paste your Client Secret when prompted

# Redeploy
vercel --prod
```

Or via Vercel Dashboard:
1. Go to: https://vercel.com/unite-group/geo-seo-domination-tool/settings/environment-variables
2. Add `GOOGLE_CLIENT_ID` → Production → Paste Client ID → **Save**
3. Add `GOOGLE_CLIENT_SECRET` → Production → Paste Client Secret → **Save**
4. Redeploy from Deployments tab

## Step 4: Test OAuth Flow

### Local Testing
1. Start dev server: `npm run dev`
2. Go to: http://localhost:3000/auth/signin
3. Click "Sign in with Google"
4. You should see Google OAuth consent screen
5. Sign in with your Google account
6. Should redirect back to your app

### Production Testing
1. Go to: https://geo-seo-domination-tool.vercel.app/auth/signin
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify successful authentication

## What These Credentials Are Used For

### CLIENT_ID (Public - Safe to expose)
- Identifies your application to Google
- Used in frontend JavaScript
- Visible in browser requests
- Example: `123456789012-abc...xyz.apps.googleusercontent.com`

### CLIENT_SECRET (Private - NEVER expose)
- Used for server-side API calls
- Authenticates your application to Google
- **NEVER** commit to git or expose in frontend
- Example: `GOCSPX-abcdefghijklmnopqrst`

## Security Best Practices

### ✅ DO:
- Use separate OAuth clients for dev/staging/prod
- Keep Client Secret in environment variables only
- Restrict origins and redirect URIs to your domains
- Rotate secrets if exposed
- Monitor OAuth usage in Google Console

### ❌ DON'T:
- Never commit CLIENT_SECRET to git
- Don't use production credentials in development
- Don't share credentials in Slack/email/documentation
- Don't skip origin/redirect URI restrictions

## Troubleshooting

### "redirect_uri_mismatch" error
**Cause**: Your callback URL isn't in Authorized redirect URIs

**Fix**: Add the exact redirect URI to your OAuth client configuration

### "Access blocked: This app's request is invalid"
**Cause**: OAuth consent screen not configured properly

**Fix**:
1. Go to OAuth consent screen settings
2. Make sure status is "In production" or add test users
3. Verify all required fields are filled

### "invalid_client" error
**Cause**: Client ID or Secret is incorrect

**Fix**: Double-check credentials match exactly (no extra spaces)

### User sees "This app isn't verified"
**Cause**: App is in testing mode with external users

**Fix**:
- Option 1: Add users to test users list
- Option 2: Submit app for verification (for public launch)
- Option 3: Click "Advanced" → "Go to [app name] (unsafe)" during testing

## Publishing Your App (Optional)

For public launch without "unverified app" warning:

1. Complete OAuth consent screen fully
2. Add privacy policy and terms of service
3. Submit for verification:
   - https://console.cloud.google.com/apis/credentials/consent
   - Click "PUBLISH APP"
   - Click "PREPARE FOR VERIFICATION"
4. Google reviews (can take 4-6 weeks)

For internal/small user base: Keep in testing mode and add users manually.

## Monitoring

Check OAuth usage:
- https://console.cloud.google.com/apis/credentials
- Click on your OAuth client ID
- View "Authorized domains" and usage stats

---

**Need Help?**
- Google OAuth Documentation: https://developers.google.com/identity/protocols/oauth2
- Supabase Auth Guide: https://supabase.com/docs/guides/auth/social-login/auth-google
