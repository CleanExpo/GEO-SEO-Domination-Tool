# 🔑 API Keys Setup Summary

## Overview

This document provides a comprehensive summary of all API keys needed for the GEO-SEO Domination Tool, their current status, and setup guides.

**Last Updated**: October 11, 2025

## 📊 API Keys Status

| API Key | Status | Type | Difficulty | Documentation |
|---------|--------|------|------------|---------------|
| `GOOGLE_SPEED_KEY` | ✅ Configured | Simple API Key | Easy | [Guide](./GOOGLE_SPEED_KEY_SETUP.md) |
| `GMB_ACCESS_TOKEN` | ✅ Obtained | OAuth 2.0 Token | Moderate | [Guide](./GMB_OAUTH_TOKEN_SETUP.md) |
| `BING_WEBMASTER_API_KEY` | ⏳ Pending | Simple API Key | Easy | [Guide](./BING_WEBMASTER_API_KEY_SETUP.md) |

## 🎯 Quick Setup Checklist

### 1. Google PageSpeed API (GOOGLE_SPEED_KEY) ✅

- [x] Google Cloud Project created
- [x] PageSpeed Insights API enabled
- [x] API key generated
- [x] Added to Vercel production environment
- [x] Tested and working

**Environment Variables:**
```bash
GOOGLE_SPEED_KEY="your-pagespeed-api-key"
```

**Documentation**: See [GOOGLE_SPEED_KEY_SETUP.md](./GOOGLE_SPEED_KEY_SETUP.md)

---

### 2. Google My Business OAuth (GMB_ACCESS_TOKEN) ✅

- [x] Google Cloud APIs enabled
- [x] OAuth consent screen configured
- [x] OAuth client ID created
- [x] Tokens obtained via OAuth Playground
- [ ] Add to production environment
- [ ] Implement token refresh logic

**Environment Variables:**
```bash
# OAuth Credentials
GMB_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GMB_CLIENT_SECRET="GOCSPX-your-client-secret"

# OAuth Tokens (from OAuth Playground)
GMB_ACCESS_TOKEN="ya29.xxxxx-your-access-token"
GMB_REFRESH_TOKEN="1//04xxxxx-your-refresh-token"

# Optional
GMB_ACCOUNT_ID="accounts/123456789"
GMB_LOCATION_ID="accounts/123456789/locations/987654321"
```

**⚠️ Important Notes:**
- Access token expires in 1 hour
- Use refresh token to get new access tokens
- Implement automatic token refresh for production

**Documentation**: See [GMB_OAUTH_TOKEN_SETUP.md](./GMB_OAUTH_TOKEN_SETUP.md)

---

### 3. Bing Webmaster API (BING_WEBMASTER_API_KEY) ⏳

- [ ] Sign in to Bing Webmaster Tools
- [ ] Add and verify website
- [ ] Generate API key
- [ ] Add to environment variables
- [ ] Test API connection

**Environment Variables:**
```bash
BING_WEBMASTER_API_KEY="your-bing-api-key"
BING_SITE_URL="https://geo-seo-domination-tool.vercel.app"
```

**Next Steps:**
1. Go to: https://www.bing.com/webmasters
2. Follow the [BING_WEBMASTER_API_KEY_SETUP.md](./BING_WEBMASTER_API_KEY_SETUP.md) guide
3. Generate and add API key

**Documentation**: See [BING_WEBMASTER_API_KEY_SETUP.md](./BING_WEBMASTER_API_KEY_SETUP.md)

---

## 🔧 Environment Variables Setup

### Local Development (.env.local)

Create or update your `.env.local` file with all API keys:

```bash
# ============================================
# GOOGLE APIs
# ============================================

# Google PageSpeed Insights API
GOOGLE_SPEED_KEY="your-pagespeed-api-key"

# Google My Business OAuth
GMB_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GMB_CLIENT_SECRET="GOCSPX-your-client-secret"
GMB_ACCESS_TOKEN="ya29.xxxxx-your-access-token"
GMB_REFRESH_TOKEN="1//04xxxxx-your-refresh-token"

# Optional GMB Account/Location IDs
GMB_ACCOUNT_ID="accounts/123456789"
GMB_LOCATION_ID="accounts/123456789/locations/987654321"

# ============================================
# BING Webmaster
# ============================================

# Bing Webmaster Tools API
BING_WEBMASTER_API_KEY="your-bing-api-key"
BING_SITE_URL="https://geo-seo-domination-tool.vercel.app"

# ============================================
# OTHER APIS (Already configured)
# ============================================

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://qwoggbbavikzhypzodcr.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Anthropic Claude
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Firecrawl
FIRECRAWL_API_KEY="your-firecrawl-api-key"

# And other existing keys...
```

### Production (Vercel)

Add each variable via Vercel CLI or Dashboard:

```bash
# Via CLI
vercel env add GOOGLE_SPEED_KEY production
vercel env add GMB_CLIENT_ID production
vercel env add GMB_CLIENT_SECRET production
vercel env add GMB_REFRESH_TOKEN production
vercel env add BING_WEBMASTER_API_KEY production
vercel env add BING_SITE_URL production
```

Or via Dashboard:
1. Go to: https://vercel.com/your-org/geo-seo-domination-tool/settings/environment-variables
2. Add each variable with appropriate environment selection
3. Redeploy to apply changes

## 🧪 Testing Your API Keys

### Test Google PageSpeed API

```bash
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&key=YOUR_API_KEY"
```

### Test GMB API

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://mybusinessaccountmanagement.googleapis.com/v1/accounts
```

### Test Bing Webmaster API

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"siteUrl":"https://your-site.com","apikey":"YOUR_API_KEY"}' \
  https://ssl.bing.com/webmaster/api.svc/json/GetUrlStatistics
```

## 📊 API Comparison

| Feature | Google PageSpeed | Google My Business | Bing Webmaster |
|---------|------------------|-------------------|----------------|
| **Auth Type** | API Key | OAuth 2.0 | API Key |
| **Token Expiry** | No expiry | 1 hour (access token) | No expiry |
| **Rate Limit** | 25K/day | 100K/day | 10K/day |
| **Setup Time** | 5 min | 15 min | 10 min |
| **Complexity** | ⭐ Easy | ⭐⭐ Moderate | ⭐ Easy |
| **Refresh Required** | ❌ No | ✅ Yes | ❌ No |

## 🔐 Security Best Practices

### ✅ DO:
- Store all API keys in environment variables
- Use `.env.local` for local development (never commit)
- Add secrets to Vercel via dashboard or CLI
- Regenerate keys if compromised
- Monitor API usage regularly
- Implement rate limiting in your code
- Use HTTPS for all API requests

### ❌ DON'T:
- Never commit API keys to Git
- Don't expose keys in client-side code
- Don't use `NEXT_PUBLIC_` prefix for sensitive keys
- Don't share keys publicly
- Don't hardcode in source files
- Don't exceed rate limits

## 🚨 Troubleshooting

### Issue: API Key Not Working

**Check:**
1. Key copied correctly (no extra spaces)
2. Key activated (some APIs need 15 min activation)
3. API enabled in Google/Bing console
4. Rate limits not exceeded
5. Correct environment variable names

### Issue: OAuth Token Expired (GMB)

**Solution:**
```javascript
// Implement token refresh
async function refreshGMBToken() {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.GMB_CLIENT_ID,
      client_secret: process.env.GMB_CLIENT_SECRET,
      refresh_token: process.env.GMB_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });
  const { access_token } = await response.json();
  return access_token;
}
```

### Issue: Rate Limit Exceeded

**Solutions:**
- Implement caching
- Add delays between requests
- Monitor usage in respective dashboards
- Request quota increase if needed

## 📈 Usage Monitoring

### Google Cloud Console
Monitor PageSpeed API usage:
👉 https://console.cloud.google.com/apis/api/pagespeedonline.googleapis.com/metrics

### Google Business Profile
Monitor GMB API usage:
👉 https://console.cloud.google.com/apis/api/mybusinessbusinessinformation.googleapis.com/metrics

### Bing Webmaster
Monitor Bing API usage:
👉 https://www.bing.com/webmasters (Dashboard)

## 📚 Additional Resources

### Official Documentation
- **Google PageSpeed API**: https://developers.google.com/speed/docs/insights/v5/get-started
- **Google Business Profile API**: https://developers.google.com/my-business
- **Bing Webmaster API**: https://docs.microsoft.com/en-us/bingwebmaster/

### Support
- **Google Cloud Support**: https://console.cloud.google.com/support
- **Bing Webmaster Help**: https://www.bing.com/webmasters/help

## 🎯 Next Steps

### Immediate Actions:
1. ✅ Google PageSpeed API - Already configured
2. ✅ GMB OAuth Tokens - Obtained, need to add to production
3. ⏳ Bing Webmaster API - Need to generate key

### Implementation Tasks:
1. Add GMB tokens to Vercel environment
2. Implement GMB token refresh logic
3. Generate and configure Bing API key
4. Test all three APIs in production
5. Implement error handling and retry logic
6. Set up monitoring and alerts
7. Document API integration in codebase

### Production Readiness:
- [ ] All API keys configured in Vercel
- [ ] Token refresh logic implemented (for GMB)
- [ ] Error handling added to all API calls
- [ ] Rate limiting implemented
- [ ] API usage monitoring set up
- [ ] Documentation updated
- [ ] Tests passing

## 📝 Summary

**Status as of October 11, 2025:**

- ✅ **GOOGLE_SPEED_KEY**: Fully configured and working
- ✅ **GMB_ACCESS_TOKEN**: Tokens obtained, ready for production deployment
- ⏳ **BING_WEBMASTER_API_KEY**: Ready to generate (follow guide)

**Total Setup Progress: 66% Complete (2/3 APIs)**

Once you obtain the Bing Webmaster API key, you'll have all three API keys configured and can fully test your SEO integrations!

---

**For detailed setup instructions, see:**
- [Google PageSpeed API Setup](./GOOGLE_SPEED_KEY_SETUP.md)
- [GMB OAuth Token Setup](./GMB_OAUTH_TOKEN_SETUP.md)
- [Bing Webmaster API Setup](./BING_WEBMASTER_API_KEY_SETUP.md)
