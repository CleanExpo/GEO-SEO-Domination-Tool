# Vercel Environment Setup - Action Plan 🚀

**Created**: October 3, 2025  
**Production URL**: https://geo-seo-domination-tool.vercel.app  
**Status**: System Configured - Ready for Environment Variables

---

## 📋 Priority Checklist

### Phase 1: Critical API Keys (Required for Full Functionality)
- [ ] 1. Add OPENAI_API_KEY to Vercel
- [ ] 2. Configure Supabase Production Database
- [ ] 3. Verify deployment and test functionality

### Phase 2: Enhanced Features (Recommended)
- [ ] 4. Add SEMRUSH_API_KEY for SEO features
- [ ] 5. Add PERPLEXITY_API_KEY for enhanced search
- [ ] 6. Add FIRECRAWL_API_KEY for web scraping
- [ ] 7. Add GOOGLE_API_KEY for Google integrations

### Phase 3: Security & Notifications (Optional)
- [ ] 8. Generate and add JWT_SECRET
- [ ] 9. Generate and add SESSION_SECRET
- [ ] 10. Configure email notifications (if needed)

---

## 🎯 Phase 1: Critical Setup

### Step 1: Add OPENAI_API_KEY (HIGHEST PRIORITY)

**Method A: Via Vercel CLI (Recommended)**
```bash
# Navigate to web-app directory
cd d:/GEO_SEO_Domination-Tool/geo-seo-domination-tool/web-app

# Add OpenAI API Key for production
vercel env add OPENAI_API_KEY production

# When prompted, paste your OpenAI API key (starts with sk-...)
# Example format: sk-proj-xxxxxxxxxxxxxxxxxxxx
```

**Method B: Via Vercel Dashboard**
1. Visit: https://vercel.com/unite-group/web-app/settings/environment-variables
2. Click **"Add New"** button
3. Enter:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (get from https://platform.openai.com/api-keys)
   - **Environments**: Check ✅ Production (and Preview/Development if needed)
4. Click **"Save"**

**Verification:**
```bash
# Check if variable was added
vercel env ls

# Redeploy to apply changes
vercel --prod
```

---

### Step 2: Configure Supabase Production Database

**Get Your Supabase Credentials:**
1. Go to https://supabase.com/dashboard
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the following values:
   - `Project URL` → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public key` → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → Use as `SUPABASE_SERVICE_ROLE_KEY`
5. Go to **Settings** → **Database**
   - Copy `Connection string` → Use as `DATABASE_URL`

**Add Supabase Variables to Vercel:**

```bash
# Method 1: CLI (Interactive)
cd d:/GEO_SEO_Domination-Tool/geo-seo-domination-tool/web-app

vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste: https://your-project.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste: eyJhbGci... (anon key)

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste: eyJhbGci... (service role key)

vercel env add DATABASE_URL production
# Paste: postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres
```

**Method 2: Dashboard (Batch)**
Visit: https://vercel.com/unite-group/web-app/settings/environment-variables

Add these four variables:
| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://your-project.supabase.co | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJhbGci... | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJhbGci... (KEEP SECRET) | Production |
| `DATABASE_URL` | postgresql://postgres:... | Production |

---

### Step 3: Initialize Supabase Database Schema

**Option A: Via Supabase Dashboard**
1. Go to https://supabase.com/dashboard/project/your-project/editor
2. Click **SQL Editor**
3. Copy the contents of: `d:/GEO_SEO_Domination-Tool/geo-seo-domination-tool/web-app/supabase-schema.sql`
4. Paste into SQL Editor
5. Click **Run**

**Option B: Via CLI**
```bash
# If you have Supabase CLI installed
cd d:/GEO_SEO_Domination-Tool/geo-seo-domination-tool/web-app
supabase db push
```

---

## 🔧 Phase 2: Enhanced Features

### Step 4: Add SEMRUSH_API_KEY

**Get API Key:**
1. Go to https://www.semrush.com/api/
2. Sign in to your account
3. Navigate to API section
4. Copy your API key

**Add to Vercel:**
```bash
vercel env add SEMRUSH_API_KEY production
# Paste your SEMrush API key
```

---

### Step 5: Add PERPLEXITY_API_KEY

**Get API Key:**
1. Go to https://www.perplexity.ai/settings/api
2. Sign in to your account
3. Click "Generate API Key"
4. Copy the key (starts with pplx-)

**Add to Vercel:**
```bash
vercel env add PERPLEXITY_API_KEY production
# Paste your Perplexity API key (pplx-...)
```

---

### Step 6: Add FIRECRAWL_API_KEY

**Get API Key:**
1. Go to https://www.firecrawl.dev/
2. Sign in to your account
3. Navigate to API Keys section
4. Copy your API key (starts with fc-)

**Add to Vercel:**
```bash
vercel env add FIRECRAWL_API_KEY production
# Paste your Firecrawl API key (fc-...)
```

---

### Step 7: Add GOOGLE_API_KEY

**Get API Key:**
1. Go to https://console.cloud.google.com/
2. Create or select a project
3. Enable required APIs (Maps, Places, etc.)
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the API key

**Add to Vercel:**
```bash
vercel env add GOOGLE_API_KEY production
# Paste your Google API key
```

---

## 🔒 Phase 3: Security & Notifications

### Step 8-9: Generate and Add Security Secrets

**Generate Strong Secrets:**
```bash
# For Windows PowerShell
# Generate JWT_SECRET
$bytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::new().GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# Generate SESSION_SECRET
$bytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::new().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

**Or use this online tool:**
- https://generate-secret.vercel.app/32

**Add to Vercel:**
```bash
vercel env add JWT_SECRET production
# Paste generated secret

vercel env add SESSION_SECRET production
# Paste generated secret
```

---

### Step 10: Email Notifications (Optional)

**Using Resend (Recommended):**

1. Sign up at https://resend.com/
2. Get your API key
3. Verify your domain (or use resend.dev for testing)

**Add to Vercel:**
```bash
vercel env add EMAIL_PROVIDER production
# Type: resend

vercel env add EMAIL_API_KEY production
# Paste your Resend API key (re_...)

vercel env add EMAIL_FROM production
# Type: noreply@yourdomain.com
```

---

## ✅ Verification & Testing

### After Adding Environment Variables

**1. Trigger Redeployment:**
```bash
cd d:/GEO_SEO_Domination-Tool/geo-seo-domination-tool/web-app

# Option A: Redeploy via CLI
vercel --prod

# Option B: Push to GitHub (triggers automatic deployment)
git add .
git commit -m "Add environment variables configuration"
git push origin main
```

**2. Verify Variables Are Set:**
```bash
# List all environment variables
vercel env ls

# Or check in dashboard:
# https://vercel.com/unite-group/web-app/settings/environment-variables
```

**3. Test Production Application:**

Visit: https://geo-seo-domination-tool.vercel.app

Test these features:
- [ ] Dashboard loads successfully
- [ ] Can create/view companies
- [ ] AI features work (if OPENAI_API_KEY added)
- [ ] Database operations work (if Supabase configured)
- [ ] SEO tools accessible (if SEMRUSH_API_KEY added)

**4. Check Deployment Logs:**
```bash
# View recent deployment logs
vercel logs

# Or check in dashboard:
# https://vercel.com/unite-group/web-app/deployments
```

---

## 📝 Quick Reference Commands

```bash
# Navigate to project
cd d:/GEO_SEO_Domination-Tool/geo-seo-domination-tool/web-app

# Add environment variable
vercel env add VARIABLE_NAME production

# List all environment variables
vercel env ls

# Pull environment variables to local .env file
vercel env pull .env.local

# Deploy to production
vercel --prod

# View deployment logs
vercel logs

# Open Vercel dashboard
start https://vercel.com/unite-group/web-app
```

---

## 🎯 Recommended Order of Execution

**Minimum Required (15 minutes):**
1. Add OPENAI_API_KEY
2. Configure Supabase (4 variables)
3. Redeploy and test

**Full Setup (30 minutes):**
1. Add OPENAI_API_KEY
2. Configure Supabase (4 variables)
3. Add SEMRUSH_API_KEY
4. Add security secrets (JWT_SECRET, SESSION_SECRET)
5. Redeploy and test all features

**Complete Setup (45 minutes):**
1. All of the above, plus:
2. Add PERPLEXITY_API_KEY
3. Add FIRECRAWL_API_KEY
4. Add GOOGLE_API_KEY
5. Configure email notifications
6. Comprehensive testing

---

## 🚨 Important Notes

1. **Never commit API keys to git** - Use .gitignore for .env files
2. **Redeploy after adding variables** - Changes don't apply until redeployment
3. **Use NEXT_PUBLIC_ prefix** - Only for variables needed in browser
4. **Keep service role keys secret** - Never expose in client-side code
5. **Test in stages** - Add a few variables, test, then add more

---

## 📚 Related Documentation

- **Vercel Environment Setup**: `VERCEL_ENVIRONMENT_SETUP.md`
- **System Diagnostic**: `SYSTEM_DIAGNOSTIC_REPORT.md`
- **Supabase Setup**: `SUPABASE_SETUP.md`
- **Database Schema**: `web-app/supabase-schema.sql`

---

## ✅ Status Tracking

**Current Status:**
```
✅ Local Development: PostgreSQL + Redis running
✅ Production Deployed: https://geo-seo-domination-tool.vercel.app
✅ Basic Functionality: Company management working
⏳ Environment Variables: Awaiting configuration
```

**After Phase 1:**
```
✅ OPENAI_API_KEY: Added and tested
✅ Supabase: Configured and database initialized
✅ Full functionality: AI features + Data persistence working
```

---

**
