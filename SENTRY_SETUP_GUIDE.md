# Sentry Setup Guide for GEO-SEO Domination Tool

**Complete guide to configure Sentry error tracking**

---

## 📋 Prerequisites

- Sentry account (free tier available at https://sentry.io)
- Organization created in Sentry
- Project ready to deploy

---

## 🔐 Step 1: Create Sentry Auth Token

### Required Permissions:

When creating your Auth Token at https://sentry.io/settings/account/api/auth-tokens/:

```
✅ REQUIRED:
- project:read       ← Read project configuration
- project:write      ← Create/update projects
- event:read         ← Read error events
- event:write        ← Send error events (MOST IMPORTANT!)
- org:read          ← Read organization data

✅ RECOMMENDED:
- project:releases   ← Track deployments and releases
- event:admin        ← Full event management
- org:integrations   ← Slack/Discord notifications
- alerts:write       ← Configure alert rules

⚪ OPTIONAL:
- team:read         ← Read team data
- member:read       ← Read member info
```

### Steps:

1. Go to: https://sentry.io/settings/account/api/auth-tokens/
2. Click **"Create New Token"**
3. **Name:** `GEO-SEO Production Token`
4. **Scopes:** Select permissions above
5. Click **"Create Token"**
6. **⚠️ COPY TOKEN IMMEDIATELY** (shown only once!)

---

## 🏗️ Step 2: Create Sentry Project

1. Go to: https://sentry.io/organizations/[your-org]/projects/new/
2. **Platform:** Select **Next.js**
3. **Project Name:** `geo-seo-domination-tool`
4. **Team:** Select your team (or create one)
5. **Alert Settings:** Configure (or skip for now)
6. Click **"Create Project"**

### Get Your DSN:

After creation, you'll see:
```
NEXT_PUBLIC_SENTRY_DSN=https://[public-key]@[org-id].ingest.sentry.io/[project-id]
```

**Copy this DSN** - you'll need it for environment variables.

---

## 🔧 Step 3: Configure Environment Variables

### Local Development (`.env.local`):

Add these lines to your `.env.local` file:

```bash
# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org-id].ingest.sentry.io/[project-id]
SENTRY_AUTH_TOKEN=your_auth_token_from_step_1
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=geo-seo-domination-tool
```

**How to find values:**
- **DSN:** From project settings
- **AUTH_TOKEN:** From Step 1 (the token you created)
- **ORG:** Your organization slug (in URL: `sentry.io/organizations/[THIS-PART]`)
- **PROJECT:** `geo-seo-domination-tool` (or your project slug)

### Vercel Production:

1. Go to: https://vercel.com/[team]/geo-seo-domination-tool/settings/environment-variables
2. Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Your DSN from Step 2 | Production, Preview, Development |
| `SENTRY_AUTH_TOKEN` | Your token from Step 1 | Production, Preview |
| `SENTRY_ORG` | Your org slug | Production, Preview |
| `SENTRY_PROJECT` | `geo-seo-domination-tool` | Production, Preview |

3. Click **"Save"** for each variable

---

## 📦 Step 4: Install Sentry SDK

Run in your project directory:

```bash
npm install --save @sentry/nextjs
```

This installs:
- `@sentry/nextjs` - Next.js integration
- Automatic error tracking
- Performance monitoring
- Session replay (optional)

---

## 🚀 Step 5: Initialize Sentry

The following files have been created for you:

### Core Configuration Files:

1. **`lib/sentry-config.ts`** - Main configuration
2. **`sentry.client.config.ts`** - Client-side (browser)
3. **`sentry.server.config.ts`** - Server-side (API routes, SSR)
4. **`sentry.edge.config.ts`** - Edge runtime (middleware)

### Integration in Your App:

Add to **`app/layout.tsx`** (if not already present):

```typescript
// app/layout.tsx
import { initSentry } from '@/lib/sentry-config';

// Initialize Sentry on app load
if (typeof window !== 'undefined') {
  initSentry();
}

export default function RootLayout({ children }) {
  // ... rest of your layout
}
```

---

## 🧪 Step 6: Test Sentry Integration

### Test Error Capture:

Create a test page at **`app/sentry-test/page.tsx`**:

```typescript
'use client';

import { captureError } from '@/lib/sentry-config';

export default function SentryTest() {
  const testError = () => {
    try {
      throw new Error('Sentry test error - this is intentional!');
    } catch (error) {
      captureError(error as Error, {
        tags: { test: 'true' },
        extra: { timestamp: new Date().toISOString() },
        level: 'info',
      });
      alert('Error sent to Sentry! Check your Sentry dashboard.');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sentry Test Page</h1>
      <button
        onClick={testError}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Test Sentry Error
      </button>
    </div>
  );
}
```

### Verify in Sentry:

1. Visit: http://localhost:3000/sentry-test
2. Click "Test Sentry Error"
3. Go to: https://sentry.io/organizations/[org]/issues/
4. You should see the error appear within 10 seconds

---

## 📊 Step 7: Configure Alerts

### Recommended Alert Rules:

1. **High Error Rate Alert**
   - Condition: More than 10 errors in 1 minute
   - Action: Email + Slack notification

2. **New Issue Alert**
   - Condition: New error type appears
   - Action: Email notification

3. **Performance Alert**
   - Condition: Page load time > 3 seconds
   - Action: Email notification

### Setup Steps:

1. Go to: https://sentry.io/organizations/[org]/alerts/rules/
2. Click **"Create Alert Rule"**
3. Select condition and actions
4. Save rule

---

## 🔍 Step 8: Monitor Production

### Sentry Dashboard Features:

1. **Issues** - All errors grouped by type
2. **Performance** - Transaction performance
3. **Releases** - Track deployments
4. **Session Replay** - Watch user sessions (optional)

### Key Metrics to Watch:

- **Error Rate:** < 0.1% (target)
- **Affected Users:** Minimize
- **MTTR (Mean Time To Resolution):** < 1 hour for critical
- **Performance Score:** > 90

---

## 🛡️ Security & Privacy

### Data Sanitization (Already Configured):

The Sentry config automatically removes:
- ✅ API keys from headers
- ✅ Passwords from query strings
- ✅ Authorization tokens
- ✅ Cookie data
- ✅ Environment variable secrets

### Compliance:

- **GDPR:** User context is minimal (user ID only)
- **CCPA:** No PII collected by default
- **Session Replay:** Masks all text and media

---

## 📈 Usage Limits (Free Tier)

Sentry Free Tier includes:
- **5,000 errors/month**
- **10,000 performance units/month**
- **500 replays/month**
- **1 user**
- **90 days data retention**

### Optimize Usage:

```typescript
// Adjust sampling rates in sentry config files
tracesSampleRate: 0.1, // Only trace 10% of transactions
replaysSessionSampleRate: 0.1, // Replay 10% of sessions
replaysOnErrorSampleRate: 1.0, // Always replay errors
```

---

## 🚨 Troubleshooting

### "DSN not configured" Warning

**Problem:** Sentry not initializing

**Solution:**
1. Check `.env.local` has `NEXT_PUBLIC_SENTRY_DSN`
2. Restart dev server: `npm run dev`
3. Clear Next.js cache: `rm -rf .next`

### Errors Not Appearing in Sentry

**Problem:** Test errors not showing up

**Solutions:**
1. Check DSN is correct
2. Verify auth token has `event:write` permission
3. Check Sentry project quota (free tier limits)
4. Look for errors in browser console (Network tab)
5. Try in production mode: `npm run build && npm start`

### Too Many Errors Captured

**Problem:** Quota exceeded from noisy errors

**Solution:**
1. Add to `ignoreErrors` in `sentry.client.config.ts`
2. Lower `tracesSampleRate`
3. Filter specific error patterns

---

## 📝 Example Usage in Code

### Capture Custom Error:

```typescript
import { captureError } from '@/lib/sentry-config';

try {
  await riskyOperation();
} catch (error) {
  captureError(error as Error, {
    tags: {
      operation: 'seo-audit',
      company_id: '123',
    },
    extra: {
      url: 'https://example.com',
      audit_type: 'technical',
    },
    level: 'error',
  });

  throw error; // Re-throw if needed
}
```

### Track Performance:

```typescript
import { trackAPICall } from '@/lib/sentry-config';

const data = await trackAPICall(
  'SEMrush Keyword Research',
  () => semrush.getKeywords('local seo')
);
```

### Set User Context:

```typescript
import { setUserContext } from '@/lib/sentry-config';

// After user logs in
setUserContext({
  id: user.id,
  email: user.email,
  companyId: user.companyId,
});
```

---

## ✅ Verification Checklist

Before deploying to production:

- [ ] Sentry project created
- [ ] Auth token generated with correct permissions
- [ ] Environment variables configured (local + Vercel)
- [ ] `@sentry/nextjs` installed
- [ ] Test error sent successfully
- [ ] Error appears in Sentry dashboard
- [ ] Alert rules configured
- [ ] Team notifications set up (Slack/Email)
- [ ] Sensitive data sanitization verified
- [ ] Sample rates configured for quota management

---

## 🎯 Next Steps After Setup

1. **Deploy to Vercel** with Sentry env vars
2. **Test in production** with real errors
3. **Configure Slack integration** for alerts
4. **Set up release tracking** with Git commits
5. **Monitor error trends** weekly

---

## 📞 Support Resources

- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Sentry Discord:** https://discord.gg/sentry
- **Sentry Status:** https://status.sentry.io/

---

## 🎉 Sentry Is Ready!

Your GEO-SEO Domination Tool now has:
- ✅ **Automatic error tracking** (client + server)
- ✅ **Performance monitoring**
- ✅ **Session replay** (optional)
- ✅ **Release tracking**
- ✅ **Privacy-compliant** data handling

**Estimated Setup Time:** 15-20 minutes

**Next:** Deploy to production and monitor real errors!
