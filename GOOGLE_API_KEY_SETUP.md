# Google Cloud API Key Setup Guide

## Step 1: Access Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Sign in with your Google account
3. Select your project (or create a new one)

## Step 2: Enable Required APIs

Your GEO-SEO tool needs these APIs enabled:

### Maps JavaScript API (for Google Maps MCP)
1. Go to: https://console.cloud.google.com/apis/library/maps-backend.googleapis.com
2. Click **Enable**

### Geocoding API (for location data)
1. Go to: https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com
2. Click **Enable**

### PageSpeed Insights API (for SEO audits)
1. Go to: https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com
2. Click **Enable**

## Step 3: Create New API Key

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **+ CREATE CREDENTIALS** at the top
3. Select **API key**
4. A popup will show your new API key - **COPY IT IMMEDIATELY**
5. Click **RESTRICT KEY** (important for security)

## Step 4: Restrict the API Key

### Application Restrictions
1. Select **HTTP referrers (web sites)**
2. Add these referrers:
   ```
   https://geo-seo-domination-tool.vercel.app/*
   https://geo-seo-domination-tool-*.vercel.app/*
   http://localhost:3000/*
   ```

### API Restrictions
1. Select **Restrict key**
2. Check these APIs:
   - ✅ Maps JavaScript API
   - ✅ Geocoding API
   - ✅ PageSpeed Insights API
   - ✅ Places API (if needed)

3. Click **SAVE**

## Step 5: Update Your Environment Variables

### Local Development (.env.local)
```bash
# Open your .env.local file and update:
GOOGLE_API_KEY=YOUR-NEW-API-KEY-HERE
NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY=YOUR-NEW-API-KEY-HERE
```

### Vercel Production

Option 1 - Via CLI:
```bash
# Remove old keys
vercel env rm GOOGLE_API_KEY production
vercel env rm NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY production

# Add new keys
vercel env add GOOGLE_API_KEY production
# Paste your new key when prompted

vercel env add NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY production
# Paste your new key when prompted

# Redeploy
vercel --prod
```

Option 2 - Via Vercel Dashboard:
1. Go to: https://vercel.com/unite-group/geo-seo-domination-tool/settings/environment-variables
2. Find `GOOGLE_API_KEY` → Click **Edit** → Replace value → **Save**
3. Find `NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY` → Click **Edit** → Replace value → **Save**
4. Go to Deployments → Click **...** on latest → **Redeploy**

## Step 6: Update MCP Configuration (Local Only)

**IMPORTANT**: The `.claude/mcp.json` file is gitignored and should NEVER be committed.

Edit `.claude/mcp.json`:
```json
{
  "mcpServers": {
    "google-maps": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-google-maps"],
      "env": {
        "GOOGLE_API_KEY": "YOUR-NEW-API-KEY-HERE"
      }
    }
  }
}
```

## Step 7: Verify Setup

### Test PageSpeed API:
```bash
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&key=YOUR-NEW-API-KEY"
```

Should return JSON with PageSpeed data.

### Test in Application:
1. Start dev server: `npm run dev`
2. Run an SEO audit
3. Check browser console for Google API errors

## Security Best Practices

### ✅ DO:
- Restrict API keys to specific APIs
- Restrict to specific domains/referrers
- Use separate keys for development and production
- Monitor usage in Google Cloud Console
- Set up billing alerts

### ❌ DON'T:
- Never commit API keys to git
- Don't use the same key across all environments
- Don't skip restrictions (always restrict!)
- Don't share keys in documentation/Slack/email

## Monitoring Usage

Check your API usage:
1. Go to: https://console.cloud.google.com/apis/dashboard
2. Select your project
3. View API usage graphs
4. Set up billing alerts if needed

## Troubleshooting

### "API key not valid" error:
- Wait 5 minutes (keys take time to propagate)
- Check restrictions match your domain
- Verify the API is enabled

### "Quota exceeded" error:
- Check: https://console.cloud.google.com/apis/dashboard
- Increase quotas or wait for daily reset
- Consider upgrading to paid tier

### "Referrer not allowed" error:
- Add your domain to HTTP referrer restrictions
- Use `http://localhost:3000/*` for local development

## Cost Information

- **PageSpeed Insights API**: Free (25,000 queries/day)
- **Geocoding API**: $5 per 1000 requests (first $200/month free)
- **Maps JavaScript API**: $7 per 1000 loads (first $200/month free)

With $200/month free credit, you can run ~40,000 SEO audits/month at no cost.

---

**Need Help?**
- Google Cloud Support: https://cloud.google.com/support
- API Documentation: https://developers.google.com/maps/documentation
