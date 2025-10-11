# Google API Key Configuration - Fix Summary

## ✅ What Was Fixed

### 1. API Key Testing Script
- **File**: `scripts/test-google-apis.mjs`
- **Change**: Added dotenv with `override: true` to load `.env.local` correctly
- **Result**: Script now uses the new API key from `.env.local`

### 2. Environment File Cleanup
- **File**: `.env.local`
- **Changes**:
  - Removed duplicate `NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY` with old key
  - Updated `GEMINI_KEY` from old to new key
  - Consolidated all Google API keys to use the new key: `AIzaSyC0ZoJ4DzWNXLvA7BgdAcU9kwQuATemkc4`
  - Removed redundant duplicate lines at bottom of file

### 3. API Verification Results
✅ **Both APIs Working!**
- PageSpeed Insights API: ✅ SUCCESS (Performance Score: 100)
- Google Maps/Places API: ✅ SUCCESS

## ⚠️ Critical Issue: System Environment Variables

### The Problem
The **system environment** still has the old expired keys set:
```
GOOGLE_API_KEY=AIzaSyDStJB2YvcQ9_2PgbuUbZHJNEyNN24zZi8  [EXPIRED]
NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY=AIzaSyDStJB2YvcQ9_2PgbuUbZHJNEyNN24zZi8  [EXPIRED]
```

These system-level environment variables **override** `.env.local` when Next.js starts, so the app is still using the expired keys.

### The Solution

#### Option 1: Update Windows System Environment Variables (Recommended)
1. Press `Windows + X` → Select "System"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "User variables" or "System variables", find and UPDATE:
   - `GOOGLE_API_KEY` → `AIzaSyC0ZoJ4DzWNXLvA7BgdAcU9kwQuATemkc4`
   - `NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY` → `AIzaSyC0ZoJ4DzWNXLvA7BgdAcU9kwQuATemkc4`
5. Click "OK" to save
6. **Restart terminal** for changes to take effect
7. **Restart dev server**: `npm run dev`

#### Option 2: Remove System Environment Variables (Simpler)
If you're only using this project locally:
1. Follow steps 1-3 above
2. **Delete** both variables instead of updating them
3. The app will then use keys from `.env.local` automatically
4. Restart terminal and dev server

#### Option 3: Quick Test (Temporary)
To test immediately without restarting:
```bash
# Override system env for this terminal session only
export GOOGLE_API_KEY="AIzaSyC0ZoJ4DzWNXLvA7BgdAcU9kwQuATemkc4"
export NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY="AIzaSyC0ZoJ4DzWNXLvA7BgdAcU9kwQuATemkc4"

# Restart dev server in this terminal
npm run dev
```

## 📝 Current Configuration

### `.env.local` (Correct)
```env
GOOGLE_API_KEY="AIzaSyC0ZoJ4DzWNXLvA7BgdAcU9kwQuATemkc4"
GOOGLE_SPEED_KEY="AIzaSyC0ZoJ4DzWNXLvA7BgdAcU9kwQuATemkc4"
NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY="AIzaSyC0ZoJ4DzWNXLvA7BgdAcU9kwQuATemkc4"
GEMINI_KEY="AIzaSyC0ZoJ4DzWNXLvA7BgdAcU9kwQuATemkc4"
```

### Vercel Production (Already Correct)
```env
GOOGLE_SPEED_KEY="AIzaSyC0ZoJ4DzWNXLvA7BgdAcU9kwQuATemkc4"
```

Production deployment already has the correct key and is working.

## 🧪 Testing After Fix

Once you've updated the system environment variables:

### 1. Test API Key Script
```bash
node scripts/test-google-apis.mjs
```

Expected output:
```
✅ SUCCESS - PageSpeed Insights API is working
   Performance Score: 100

✅ SUCCESS - Google Maps/Places API is working
```

### 2. Test SEO Audit in App
1. Go to http://localhost:3000
2. Add a new client or load saved client
3. Run SEO audit on a working website (e.g., example.com)
4. Verify you get **real Lighthouse scores** instead of errors

### 3. Expected Results
- **Performance Score**: Real number (0-100)
- **SEO Score**: Real number (0-100)
- **Accessibility Score**: Real number (0-100)
- **No "API key expired" errors**

## 📂 Files Modified

1. `scripts/test-google-apis.mjs` - Added dotenv override
2. `.env.local` - Cleaned up duplicate/old keys
3. `.gitignore` - Already had `.env.local` ignored

## 🚀 Next Steps

1. **Update system environment variables** (see solutions above)
2. **Restart terminal**
3. **Restart dev server**
4. **Test audit** on a working site (example.com)
5. **Test production** deployment if needed

## 📞 If Still Not Working

If audits still fail after updating system environment variables:

1. Verify the new key is active:
   ```bash
   node scripts/test-google-apis.mjs
   ```

2. Check what Next.js is loading:
   ```bash
   # In dev server output, look for:
   - Environments: .env.local, .env.development
   ```

3. Manually override for one session:
   ```bash
   GOOGLE_API_KEY="AIzaSyC0ZoJ4DzWNXLvA7BgdAcU9kwQuATemkc4" npm run dev
   ```

4. Check Google Cloud Console:
   - Ensure PageSpeed Insights API is enabled: https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com
   - Ensure key has no IP/domain restrictions

---

**Summary**: The code is fixed and `.env.local` is correct. Only remaining task is updating the Windows system environment variables to match.
