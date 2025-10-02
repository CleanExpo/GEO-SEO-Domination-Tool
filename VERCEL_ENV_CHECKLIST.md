# Vercel Environment Variables Checklist

## ✅ Required Variables (Must Have)

### **Supabase Authentication**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - Format: `https://[project-ref].supabase.co`
  - Example: `https://qwoggbbavikzhypzodcr.supabase.co`
  - **Check**: Should NOT have trailing slash

- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Format: Long JWT token starting with `eyJ`
  - **Check**: Should be the "anon" public key, not service role key

### **Database (Choose ONE method)**

**Option A: Supabase Postgres URL**
- [ ] `POSTGRES_URL` or `DATABASE_URL`
  - Format: `postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
  - **Check**: Should include password, host, port, and database name

**Option B: Individual Database Credentials**
- [ ] `DB_HOST` - Example: `db.qwoggbbavikzhypzodcr.supabase.co`
- [ ] `DB_PORT` - Usually: `5432`
- [ ] `DB_NAME` - Usually: `postgres`
- [ ] `DB_USER` - Usually: `postgres`
- [ ] `DB_PASSWORD` - Your Supabase database password

**Option C: SQLite (Local Development)**
- [ ] `SQLITE_PATH` - Path to SQLite file

---

## 🔑 API Keys (Add as needed)

### **Google Cloud APIs**
- [ ] `GOOGLE_API_KEY`
  - Purpose: General Google APIs
  - **Check**: Should be restricted to specific APIs in Google Cloud Console

- [ ] `GOOGLE_PAGESPEED_API_KEY`
  - Purpose: PageSpeed Insights API
  - **Check**: Should be restricted to PageSpeed Insights API

- [ ] `GOOGLE_SEARCH_ENGINE_ID`
  - Purpose: Custom Search API
  - Format: Alphanumeric string (e.g., `a1b2c3d4e5f6g`)

### **Third-Party APIs**
- [ ] `ANTHROPIC_API_KEY` - For Claude AI features
- [ ] `FIRECRAWL_API_KEY` - For web scraping
- [ ] `PERPLEXITY_API_KEY` - For Perplexity AI
- [ ] `SEMRUSH_API_KEY` - For SEO data
- [ ] `RESEND_API_KEY` - For email sending

### **Security & Monitoring**
- [ ] `CRON_SECRET` - Secret key for cron job authentication
- [ ] `CSRF_SECRET` - CSRF token secret
- [ ] `API_KEY` - General API authentication key

---

## 🔍 How to Verify Each Variable

### **1. Check Supabase Variables**

**NEXT_PUBLIC_SUPABASE_URL:**
```bash
# Should match your Supabase project URL
# Find it at: Supabase Dashboard → Settings → API → Project URL
```

**NEXT_PUBLIC_SUPABASE_ANON_KEY:**
```bash
# Should match your anon key
# Find it at: Supabase Dashboard → Settings → API → Project API keys → anon (public)
```

---

### **2. Check Database Connection**

**POSTGRES_URL or DATABASE_URL:**
```bash
# Format check - should include ALL of these:
postgresql://[user]:[password]@[host]:[port]/[database]

# Common issues:
❌ Missing password
❌ Wrong port (should be 6543 for pooler or 5432 for direct)
❌ Missing database name at the end
```

---

### **3. Check Google OAuth (Already in Supabase, not Vercel)**

Google OAuth credentials should be in:
- ✅ **Supabase Dashboard** → Authentication → Providers → Google
- ❌ NOT in Vercel environment variables

The Client ID and Secret go in Supabase, not Vercel!

---

### **4. Check API Key Format**

**GOOGLE_API_KEY / GOOGLE_PAGESPEED_API_KEY:**
```bash
# Format: Should look like this
AIzaSyD-1234567890abcdefGHIJKLMNOPQRSTUVW

# Common issues:
❌ Extra spaces before/after
❌ Quotes around the value
❌ Using restricted key with wrong HTTP referrers
```

---

## 🚨 Common Environment Variable Errors

### **Error: "Invalid Supabase URL"**
- **Check**: URL should NOT have trailing slash
- **Check**: URL should start with `https://`
- **Fix**: Remove any trailing `/` from the URL

### **Error: "Database connection failed"**
- **Check**: Password is correct (no typos)
- **Check**: Port is correct (5432 or 6543)
- **Check**: Using connection pooler URL from Supabase

### **Error: "API key invalid"**
- **Check**: Key is correctly copied (no extra spaces)
- **Check**: API is enabled in Google Cloud Console
- **Check**: Key restrictions allow your domain

### **Error: "redirect_uri_mismatch" (OAuth)**
- **Check**: OAuth credentials are in SUPABASE, not Vercel
- **Check**: Redirect URIs in Google Cloud match Supabase callback URL

---

## ✅ Quick Verification Steps

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Check REQUIRED variables exist:**
   - ✅ NEXT_PUBLIC_SUPABASE_URL
   - ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
   - ✅ POSTGRES_URL or DATABASE_URL

3. **Check formats:**
   - Supabase URL: No trailing slash
   - Anon key: Starts with `eyJ`
   - Database URL: Has password, host, port, database

4. **Check optional API keys:**
   - Only add if you're using that service
   - Ensure no extra spaces or quotes

5. **Redeploy after changes:**
   - Any env var changes require a redeploy
   - Go to Deployments → Latest → Redeploy

---

## 📋 Current Known Variables (from your screenshot)

Based on your Vercel screenshot, you have:
- ✅ ANTHROPIC_API_KEY
- ✅ CLIENT_ID (should be in Supabase, not Vercel!)
- ✅ CLIENT_SECRET (should be in Supabase, not Vercel!)
- ✅ FIRECRAWL_API_KEY
- ✅ GOOGLE_API_KEY
- ✅ GOOGLE_CLOUD_PROJECT_ID
- ✅ NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ PERPLEXITY_API_KEY
- ✅ SEMRUSH_API_KEY

**⚠️ ISSUE FOUND:**
- `CLIENT_ID` and `CLIENT_SECRET` should be in **Supabase**, not Vercel!
- These are OAuth credentials that Supabase needs, not your app

---

## 🔧 Fix for OAuth Issue

If Google Sign-In isn't working:

1. **Remove from Vercel** (if present):
   - CLIENT_ID
   - CLIENT_SECRET

2. **Add to Supabase instead:**
   - Go to Supabase → Authentication → Providers → Google
   - Paste Client ID and Client Secret there
   - Click Save

3. **Verify redirect URIs in Google Cloud:**
   - Should include: `https://qwoggbbavikzhypzodcr.supabase.co/auth/v1/callback`

---

## 📝 Notes

- **NEXT_PUBLIC_** prefix = Visible in browser (safe for public use)
- **No prefix** = Server-side only (keeps secrets secure)
- Always redeploy after changing environment variables
- Test in Preview environment before Production
