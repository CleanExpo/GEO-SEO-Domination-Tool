# Google Cloud Setup Guide for GEO-SEO Domination Tool

## Overview
This guide covers setting up all necessary Google Cloud services for the GEO-SEO Domination Tool, including OAuth authentication, APIs for SEO features, and service accounts.

---

## Part 1: Create Google Cloud Project

### Step 1: Create a New Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown in the top navigation bar
3. Click **"NEW PROJECT"**
4. Enter project details:
   - **Project name**: `GEO-SEO-Domination-Tool`
   - **Organization**: Leave as default (or select your org)
   - **Location**: Leave as default
5. Click **"CREATE"**
6. Wait for project creation (usually 10-30 seconds)
7. Select the new project from the dropdown

---

## Part 2: Set Up OAuth 2.0 for Google Sign-In

### Step 1: Configure OAuth Consent Screen
1. In the left sidebar, go to **"APIs & Services" → "OAuth consent screen"**
2. Select **"External"** (unless you have Google Workspace, then you can use Internal)
3. Click **"CREATE"**

4. **App Information** page:
   - **App name**: `GEO-SEO Domination Tool`
   - **User support email**: Your email address
   - **App logo**: (Optional - can upload your logo)
   - **Application home page**: `https://your-vercel-domain.vercel.app`
   - **Application privacy policy link**: `https://your-vercel-domain.vercel.app/privacy`
   - **Application terms of service link**: `https://your-vercel-domain.vercel.app/terms`
   - **Authorized domains**: Add `vercel.app` and your custom domain if you have one
   - **Developer contact information**: Your email address
5. Click **"SAVE AND CONTINUE"**

6. **Scopes** page:
   - Click **"ADD OR REMOVE SCOPES"**
   - Select these scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Click **"UPDATE"**
   - Click **"SAVE AND CONTINUE"**

7. **Test users** page (if External):
   - Click **"ADD USERS"**
   - Add your email and any test user emails
   - Click **"ADD"**
   - Click **"SAVE AND CONTINUE"**

8. **Summary** page:
   - Review your settings
   - Click **"BACK TO DASHBOARD"**

### Step 2: Create OAuth 2.0 Credentials
1. Go to **"APIs & Services" → "Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Configure:
   - **Application type**: `Web application`
   - **Name**: `GEO-SEO Domination Web App`

4. **Authorized JavaScript origins**:
   - Click **"+ ADD URI"**
   - Add: `https://your-vercel-domain.vercel.app`
   - Add: `http://localhost:3000` (for local development)
   - Add your custom domain if you have one

5. **Authorized redirect URIs**:
   - Click **"+ ADD URI"**
   - Add: `https://your-vercel-domain.vercel.app/auth/callback`
   - Add: `http://localhost:3000/auth/callback` (for local development)
   - Add your custom domain callback if you have one

6. Click **"CREATE"**

7. **Save your credentials**:
   - A popup will show your **Client ID** and **Client Secret**
   - Copy both - you'll need them for Supabase
   - Click **"OK"**

### Step 3: Configure Supabase with Google OAuth
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **"Authentication" → "Providers"**
4. Find **"Google"** and click to expand
5. Enable Google provider
6. Paste your credentials:
   - **Client ID**: (from Google Cloud)
   - **Client Secret**: (from Google Cloud)
7. Click **"Save"**

---

## Part 3: Enable Required Google APIs

### APIs Needed for SEO Features

1. Go to **"APIs & Services" → "Library"**

2. Search and enable each of these APIs (click **"ENABLE"** for each):

   #### Core APIs:
   - **Google Search Console API**
     - Used for: Website verification, search analytics, indexing status

   - **PageSpeed Insights API**
     - Used for: Performance scoring, Core Web Vitals

   - **Custom Search API** (if using Google search data)
     - Used for: SERP analysis, competitor research

   - **Google My Business API** (now called Business Profile API)
     - Used for: Local SEO, GMB management

   - **Google Analytics Data API**
     - Used for: Traffic analysis, user behavior

   - **YouTube Data API v3** (if analyzing video content)
     - Used for: Video SEO analysis

   #### Optional but Recommended:
   - **Google Cloud Natural Language API**
     - Used for: Content analysis, entity extraction, sentiment analysis

   - **Cloud Vision API**
     - Used for: Image SEO, alt text generation

   - **Google Trends API** (via unofficial wrapper)
     - Used for: Keyword trends, seasonality

---

## Part 4: Create Service Account for API Access

### Step 1: Create Service Account
1. Go to **"IAM & Admin" → "Service Accounts"**
2. Click **"+ CREATE SERVICE ACCOUNT"**
3. Enter details:
   - **Service account name**: `geo-seo-api-service`
   - **Service account ID**: (auto-generated)
   - **Description**: `Service account for GEO-SEO Domination Tool API access`
4. Click **"CREATE AND CONTINUE"**

5. **Grant permissions**:
   - Select role: `Service Account Token Creator`
   - Click **"+ ADD ANOTHER ROLE"**
   - Select role: `Cloud Datastore User` (if using Firestore)
   - Click **"CONTINUE"**

6. **Grant users access**: Skip this (click **"DONE"**)

### Step 2: Create Service Account Key
1. Find your new service account in the list
2. Click the **3 dots** (⋮) → **"Manage keys"**
3. Click **"ADD KEY" → "Create new key"**
4. Select **"JSON"** format
5. Click **"CREATE"**
6. **Save the JSON file securely** - this is your credential file
7. ⚠️ **NEVER commit this file to Git!**

### Step 3: Add to Environment Variables
The JSON file contains credentials. You need to add them to Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these variables:

```
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=geo-seo-api-service@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----
```

Or create a single variable:
```
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
```

---

## Part 5: API Keys for Client-Side APIs

### Create API Key for PageSpeed Insights
1. Go to **"APIs & Services" → "Credentials"**
2. Click **"+ CREATE CREDENTIALS" → "API key"**
3. A popup shows your API key - **copy it**
4. Click **"RESTRICT KEY"** to secure it:
   - **Name**: `PageSpeed Insights Key`
   - **API restrictions**:
     - Select **"Restrict key"**
     - Check **"PageSpeed Insights API"**
   - **Application restrictions**:
     - Select **"HTTP referrers (web sites)"**
     - Add: `https://your-vercel-domain.vercel.app/*`
     - Add: `http://localhost:3000/*`
5. Click **"SAVE"**

### Create API Key for Custom Search (if needed)
1. Repeat steps above
2. Name: `Custom Search API Key`
3. Restrict to: **Custom Search API**
4. Add same HTTP referrers

### Add to Vercel Environment Variables
```
NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY=your-api-key
NEXT_PUBLIC_GOOGLE_CUSTOM_SEARCH_KEY=your-search-key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your-search-engine-id
```

---

## Part 6: Set Up Google Search Console

### Add Your Website
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **"Add Property"**
3. Select **"URL prefix"**
4. Enter your URL: `https://your-vercel-domain.vercel.app`
5. Click **"CONTINUE"**

### Verify Ownership
Choose a verification method:

**Option A: HTML File Upload**
1. Download the verification file
2. Upload to `/public` folder in your project
3. Deploy to Vercel
4. Click **"VERIFY"**

**Option B: Meta Tag** (Recommended)
1. Copy the meta tag provided
2. Add to your Next.js layout head section
3. Deploy to Vercel
4. Click **"VERIFY"**

**Option C: DNS Verification**
1. Copy the TXT record
2. Add to your domain DNS settings
3. Wait for propagation (5-30 minutes)
4. Click **"VERIFY"**

---

## Part 7: Set Up Google Analytics 4

### Create GA4 Property
1. Go to [Google Analytics](https://analytics.google.com/)
2. Click **"Admin"** (bottom left gear icon)
3. Click **"+ Create Property"**
4. Enter:
   - **Property name**: `GEO-SEO Domination Tool`
   - **Reporting time zone**: Your timezone
   - **Currency**: Your currency
5. Click **"Next"**
6. Fill in business details
7. Click **"Create"**
8. Accept terms

### Add Data Stream
1. Select **"Web"** as platform
2. Enter:
   - **Website URL**: `https://your-vercel-domain.vercel.app`
   - **Stream name**: `Production Web App`
3. Click **"Create stream"**
4. **Copy your Measurement ID** (format: G-XXXXXXXXXX)

### Add to Vercel Environment Variables
```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## Part 8: Enable Billing (Required for APIs)

⚠️ **Important**: Most Google Cloud APIs require billing to be enabled, even if you stay within free tier limits.

### Set Up Billing
1. Go to **"Billing"** in the left sidebar
2. Click **"LINK A BILLING ACCOUNT"**
3. Either:
   - Create a new billing account
   - Link an existing one
4. Enter payment information
5. Click **"SET ACCOUNT AND BUDGET"**

### Set Budget Alerts (Recommended)
1. Go to **"Billing" → "Budgets & alerts"**
2. Click **"CREATE BUDGET"**
3. Configure:
   - **Name**: `GEO-SEO Monthly Budget`
   - **Budget type**: `Specified amount`
   - **Target amount**: `$50` (or your limit)
   - **Alert thresholds**: `50%, 90%, 100%`
   - **Email recipients**: Your email
4. Click **"FINISH"**

---

## Part 9: Environment Variables Summary

### Add ALL these to Vercel:

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google OAuth (from Part 2)
# These go in SUPABASE dashboard, not Vercel

# Google Cloud Service Account (from Part 4)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Google API Keys (from Part 5)
NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY=your-pagespeed-key
NEXT_PUBLIC_GOOGLE_CUSTOM_SEARCH_KEY=your-search-key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your-engine-id

# Google Analytics (from Part 7)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Search Console (from Part 6)
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://your-domain.com
```

---

## Part 10: Verify Everything Works

### Test Checklist:
- [ ] Google Sign-In works on `/login` and `/signup`
- [ ] OAuth callback redirects properly
- [ ] PageSpeed API returns data
- [ ] Search Console shows your site
- [ ] Google Analytics tracks visits
- [ ] Service account can access APIs
- [ ] No billing surprises (check dashboard daily for first week)

### Common Issues:

**OAuth Error: redirect_uri_mismatch**
- Verify redirect URI in Google Cloud matches exactly: `https://your-domain.com/auth/callback`
- Check Supabase provider settings

**API Returns 403 Forbidden**
- Enable the API in Google Cloud Console
- Check billing is enabled
- Verify API key restrictions

**Service Account Permission Denied**
- Check service account has correct roles
- Verify JSON credentials are correctly formatted in env vars
- Ensure private key includes `\n` for line breaks

---

## Security Best Practices

1. ✅ **API Key Restrictions**: Always restrict keys to specific APIs and domains
2. ✅ **Service Account Keys**: Never commit JSON files to Git
3. ✅ **Environment Variables**: Use Vercel's encrypted env vars
4. ✅ **OAuth Scope**: Only request minimum necessary scopes
5. ✅ **Budget Alerts**: Set up billing alerts to prevent surprises
6. ✅ **Key Rotation**: Rotate service account keys every 90 days
7. ✅ **Monitor Usage**: Check API quotas weekly in Google Cloud Console

---

## Next Steps After Setup

1. Test Google Sign-In on your deployed site
2. Implement PageSpeed Insights in your SEO audit
3. Connect Google Search Console data
4. Set up Google Analytics event tracking
5. Build competitor analysis with Custom Search API
6. Implement local SEO with Business Profile API

---

## Quick Reference Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Search Console](https://search.google.com/search-console)
- [Google Analytics](https://analytics.google.com/)
- [API Library](https://console.cloud.google.com/apis/library)
- [Billing Dashboard](https://console.cloud.google.com/billing)
- [Supabase Dashboard](https://app.supabase.com/)
- [Vercel Dashboard](https://vercel.com/dashboard)

---

## Support

If you encounter issues:
1. Check Google Cloud Console → Logs Explorer for API errors
2. Verify environment variables are set correctly in Vercel
3. Check Supabase logs for auth issues
4. Review billing to ensure APIs are enabled
