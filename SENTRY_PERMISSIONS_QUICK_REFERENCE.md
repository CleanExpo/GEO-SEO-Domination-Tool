# Sentry API Token - Quick Permission Reference

**For:** GEO-SEO Domination Tool Error Tracking

---

## 🔐 Required Permissions (Copy & Paste)

When creating your Sentry Auth Token, select these scopes:

```
✅ project:read
✅ project:write
✅ event:read
✅ event:write
✅ org:read
✅ project:releases
✅ event:admin
✅ org:integrations
✅ alerts:write
```

---

## 📍 Where to Create Token

**URL:** https://sentry.io/settings/account/api/auth-tokens/

**Steps:**
1. Click "Create New Token"
2. Name: `GEO-SEO Production Token`
3. Select all permissions above
4. Click "Create Token"
5. **COPY IMMEDIATELY** (shown only once!)

---

## 🔑 Environment Variables Needed

Add to `.env.local`:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org-id].ingest.sentry.io/[project-id]
SENTRY_AUTH_TOKEN=[token_from_above]
SENTRY_ORG=[your-org-slug]
SENTRY_PROJECT=geo-seo-domination-tool
```

---

## ✅ Verification

After setup, test with:

```bash
npm install
npm run dev
```

Visit: http://localhost:3000/sentry-test

---

## 📚 Full Documentation

See [SENTRY_SETUP_GUIDE.md](./SENTRY_SETUP_GUIDE.md) for complete instructions.

---

**Estimated Time:** 10 minutes
**Cost:** Free tier (5,000 errors/month)
