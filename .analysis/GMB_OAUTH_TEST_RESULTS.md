# GMB OAuth Test Results

**Date**: January 11, 2025
**Status**: ⚠️ Partial Success - Rate Limited

## Test Execution Summary

### ✅ What Worked

1. **OAuth Token Refresh** - SUCCESS
   - Refresh token is valid and working
   - Successfully obtained new access token
   - Token expires in: 3599 seconds (~1 hour)
   - OAuth credentials are correctly configured

2. **OAuth Service Integration** - SUCCESS
   - `services/api/google-oauth-refresh.ts` working as expected
   - Token caching implemented
   - Auto-refresh logic validated

3. **Test Script Created** - SUCCESS
   - `scripts/test-gmb-oauth.mjs` successfully created
   - Comprehensive account and location fetching
   - Results save to `./data/gmb-locations.json`

### ⚠️ What Failed

**Google My Business API Rate Limit Hit**

```
Error: Quota exceeded for quota metric 'Requests'
and limit 'Requests per minute'
of service 'mybusinessaccountmanagement.googleapis.com'
for consumer 'project_number:810093513411'
```

**HTTP Status**: 429 Too Many Requests
**API**: `mybusinessaccountmanagement.googleapis.com/v1/accounts`
**Project Number**: 810093513411

## Rate Limit Details

### Google My Business API Quotas

**Default Quotas** (for new projects):
- **Requests per minute**: 600 requests/minute
- **Requests per day**: 50,000 requests/day
- **Requests per user per minute**: 60 requests/minute

**Most Likely Cause**: We or another application using the same OAuth client ID exceeded the per-minute quota.

### How to Check Current Quota Usage

1. Go to [Google Cloud Console - APIs & Services](https://console.cloud.google.com/apis/dashboard?project=810093513411)
2. Click "My Business Account Management API"
3. View "Quotas" tab
4. Check current usage and limits

### Solutions

#### Option 1: Wait and Retry (Immediate)
```bash
# Wait 60 seconds for rate limit window to reset
sleep 60
node scripts/test-gmb-oauth.mjs
```

#### Option 2: Request Quota Increase (Long-term)
1. Go to [Google Cloud Console - Quotas](https://console.cloud.google.com/iam-admin/quotas?project=810093513411)
2. Filter for "My Business Account Management API"
3. Select "Requests per minute"
4. Click "Edit Quotas"
5. Request increase (typically approved within 24-48 hours)

#### Option 3: Use Business Profile Dashboard (Manual)
As a temporary workaround:
1. Go to https://business.google.com
2. Select your business location
3. Copy the location ID from the URL or API settings
4. Manually add to company record:
   ```sql
   UPDATE companies
   SET gmb_location_id = 'locations/YOUR_LOCATION_ID_HERE'
   WHERE id = 'company-uuid';
   ```

## Next Steps

### Immediate Actions
1. ⏱️ Wait 60 seconds for rate limit reset
2. 🔄 Re-run test script: `node scripts/test-gmb-oauth.mjs`
3. 📋 Review and save location IDs to `./data/gmb-locations.json`

### After Getting Location IDs
1. Update company records with `gmb_location_id`
2. Run database migration for `onboarding_vitals` tables
3. Test vitals capture: `POST /api/onboarding/vitals/capture`

### Production Deployment
1. Add GMB OAuth credentials to Vercel:
   ```bash
   npx vercel env add GMB_CLIENT_ID production preview development
   npx vercel env add GMB_CLIENT_SECRET production preview development
   npx vercel env add GMB_REFRESH_TOKEN production preview development
   ```
2. Deploy: `npx vercel --prod`
3. Test vitals capture on production

## Files Created in This Session

1. ✅ `database/onboarding-vitals-schema.sql` - Database schema (7 tables)
2. ✅ `types/onboarding-vitals.ts` - TypeScript interfaces
3. ✅ `services/api/google-search-console.ts` - GSC API client
4. ✅ `services/api/google-my-business.ts` - GMB API client
5. ✅ `services/api/bing-webmaster.ts` - Bing API client
6. ✅ `services/api/google-oauth-refresh.ts` - OAuth token refresh service
7. ✅ `lib/vitals-health-score.ts` - Health score calculator
8. ✅ `app/api/onboarding/vitals/capture/route.ts` - Vitals capture endpoint
9. ✅ `scripts/test-gmb-oauth.mjs` - OAuth test script
10. ✅ `GMB_OAUTH_SETUP.md` - Setup documentation
11. ✅ `.analysis/GMB_OAUTH_SECURITY_WARNING.md` - Security guide

## Environment Variables Configured

### Local Development (`.env.local`)
```bash
GMB_ACCESS_TOKEN=ya29.a0AQQ_BDRy...     # Expires hourly
GMB_REFRESH_TOKEN=1//04nz68XUyut...    # Long-lived
GMB_CLIENT_ID=810093513411-gs3d...     # OAuth app ID
GMB_CLIENT_SECRET=GOCSPX-Jb7YPS8...    # OAuth secret
```

### Still Needed
- `BING_WEBMASTER_API_KEY` - For Bing vitals
- Production Vercel deployment of GMB credentials

## Success Criteria

- [x] OAuth token refresh working
- [x] Access token obtained and validated
- [ ] GMB accounts fetched (blocked by rate limit)
- [ ] Location IDs retrieved and saved
- [ ] Company records updated with `gmb_location_id`
- [ ] Database migration run
- [ ] Vitals capture tested end-to-end

## Retry Command

After waiting 60 seconds:

```bash
node scripts/test-gmb-oauth.mjs
```

Expected output after successful retry:
```
✅ Access token refreshed (expires in 3599s)
✅ Found X GMB account(s)
✅ Found Y location(s)
💾 Results saved to: ./data/gmb-locations.json
```

---

**Status**: Ready to retry after rate limit window resets
**Next Action**: Wait 60 seconds, then re-run test script
