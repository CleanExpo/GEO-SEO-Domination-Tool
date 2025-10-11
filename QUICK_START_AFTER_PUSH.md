# 🚀 Quick Start Guide - Post GitHub Push

All code is now safely on GitHub! Follow these steps to get everything running.

## ✅ What's Already Done

- [x] GMB OAuth integration (8 files)
- [x] Token encryption system (AES-256-GCM)
- [x] Database migrations created
- [x] API integrations (GMB, GSC, Bing)
- [x] Onboarding vitals system
- [x] Post-audit automation framework
- [x] All credentials sanitized
- [x] Pushed to GitHub (31 files)

## 📋 Next Steps (in order)

### Step 1: Generate Encryption Keys (2 minutes)

Open PowerShell and run:

```powershell
# For GMB token encryption
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy the output

# For website credential encryption
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Copy this output too
```

Add both to your `.env.local`:

```bash
# GMB Token Encryption
TOKEN_ENCRYPTION_KEY=paste_first_key_here

# Website Credentials Encryption  
CREDENTIALS_ENCRYPTION_KEY=paste_second_key_here
```

### Step 2: Run Database Migrations (5 minutes)

Connect to your Supabase database and run these migrations:

**Option A: Via Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy and paste each migration file contents
5. Execute

**Option B: Via psql command line**

```bash
# Set your database URL
$env:DATABASE_URL = "postgresql://postgres.qwoggbbavikzhypzodcr:YOUR_PASSWORD@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres"

# Run migrations
psql $env:DATABASE_URL -f database/migrations/001_gmb_integrations.sql
psql $env:DATABASE_URL -f database/onboarding-vitals-schema.sql
psql $env:DATABASE_URL -f database/post-audit-automation-schema.sql
```

Verify migrations:
```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('gmb_integrations', 'onboarding_vitals', 'agent_tasks');
```

### Step 3: Test Locally (10 minutes)

Start your development server:
```bash
npm run dev
```

#### Test 1: GMB OAuth Flow

1. Open browser to: http://localhost:3000/api/integrations/gmb/authorize
2. Should redirect to Google OAuth consent screen
3. Approve permissions
4. Should redirect back with success message

Check console logs for:
```
✅ Access token refreshed (expires in 3600s)
✅ GMB integration connected
```

#### Test 2: Credential Encryption

Create a test file `test-encryption.ts`:

```typescript
import { encryptCredential, decryptCredential } from './lib/crypto-credentials';

// Test encryption
const testPassword = 'my_secret_password_123';
const encrypted = encryptCredential(testPassword);
console.log('Encrypted:', encrypted);

const decrypted = decryptCredential(encrypted);
console.log('Decrypted:', decrypted);
console.log('Match:', testPassword === decrypted);
```

Run it:
```bash
npx tsx test-encryption.ts
```

Expected output:
```
Encrypted: <long encrypted string>
Decrypted: my_secret_password_123
Match: true
```

#### Test 3: Check Integration Status

```bash
curl http://localhost:3000/api/integrations/gmb/status
```

Expected response (before connecting):
```json
{
  "connected": false,
  "integration": null
}
```

Expected response (after connecting):
```json
{
  "connected": true,
  "integration": {
    "status": "active",
    "account_name": "Your Business Name",
    "location_count": 1
  }
}
```

### Step 4: Deploy to Vercel (15 minutes)

Add environment variables:

```bash
# Add encryption keys
vercel env add TOKEN_ENCRYPTION_KEY production
# Paste the first key you generated

vercel env add CREDENTIALS_ENCRYPTION_KEY production  
# Paste the second key you generated

# Add GMB OAuth credentials (from Google Cloud Console)
vercel env add GMB_CLIENT_ID production
# Paste your actual client ID

vercel env add GMB_CLIENT_SECRET production
# Paste your actual client secret

# Add redirect URI
vercel env add GMB_REDIRECT_URI production
# Enter: https://your-domain.vercel.app/api/integrations/gmb/callback
```

Deploy:
```bash
vercel --prod
```

### Step 5: Update Google Cloud Console (2 minutes)

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth 2.0 Client
3. Add to "Authorized redirect URIs":
   ```
   https://your-domain.vercel.app/api/integrations/gmb/callback
   ```
4. Save

### Step 6: Test Production (5 minutes)

Visit your production site:
```
https://your-domain.vercel.app/api/integrations/gmb/authorize
```

Should work the same as local!

## 🎯 Verification Checklist

After completing all steps, verify:

- [ ] Both encryption keys generated and added to `.env.local`
- [ ] All 3 database migrations executed successfully
- [ ] GMB OAuth flow works locally (can connect your account)
- [ ] Integration status endpoint returns correct data
- [ ] Encryption/decryption test passes
- [ ] Environment variables added to Vercel
- [ ] Production deployment successful
- [ ] Google Cloud Console redirect URI updated
- [ ] Production OAuth flow works

## 📚 Documentation Reference

- **Full implementation guide:** `GMB_OAUTH_IMPLEMENTATION_COMPLETE.md`
- **OAuth setup:** `GMB_OAUTH_TOKEN_SETUP.md`
- **Bing integration:** `BING_WEBMASTER_SETUP.md`
- **API keys:** `API_KEYS_SETUP_SUMMARY.md`

## 🐛 Troubleshooting

### Error: "TOKEN_ENCRYPTION_KEY not set"

Add the key to `.env.local`:
```bash
TOKEN_ENCRYPTION_KEY=your_32_byte_hex_key
```

### Error: "redirect_uri_mismatch"

Check that:
1. `GMB_REDIRECT_URI` in `.env.local` matches exactly
2. URI is added to Google Cloud Console
3. URI includes protocol (http:// or https://)

### Error: "invalid_grant"

Refresh token expired. Re-run OAuth flow:
```
http://localhost:3000/api/integrations/gmb/authorize
```

### Migration Error: "relation already exists"

Table already exists. Safe to ignore, or use:
```sql
DROP TABLE IF EXISTS gmb_integrations CASCADE;
-- Then re-run migration
```

## 🎊 Success!

Once all verification items are checked, you have:

✅ Secure GMB OAuth integration  
✅ Encrypted credential storage  
✅ Automated vitals capture  
✅ Audit-to-task automation  
✅ Production-ready deployment  

**Total setup time:** ~40 minutes

---

**Need help?** Check the full docs in `GMB_OAUTH_IMPLEMENTATION_COMPLETE.md`

**Last Updated:** October 11, 2025
