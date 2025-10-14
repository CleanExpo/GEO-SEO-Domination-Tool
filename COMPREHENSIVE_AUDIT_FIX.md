# Comprehensive Audit 404 Fix

## 🔴 Problem Identified

You're getting **404 errors** when trying to run comprehensive audits:

```
GET /api/companies/[id]/audit/comprehensive → 404 Not Found
Error: Company not found
```

## 🎯 Root Causes

### 1. **Route Not Registered**
Next.js hasn't picked up the audit route file after it was created.

### 2. **Company Doesn't Exist**
The company IDs you're trying to audit don't exist in the database:
- `5e4fe0f2-e0cc-49b1-82ae-813d5f9068f9`
- `a307ec91-7e1c-4718-b4bd-acbe579a4259`

These look like onboarding session IDs (they have `onboarding_` prefix in logs), not actual company IDs.

---

## ✅ Solution: 3-Step Fix

### Step 1: Restart Dev Server (Fix Route Registration)

**In your PowerShell Administrator window**:

```powershell
# Press Ctrl+C to stop the server

# Wait for it to fully stop, then:
npm run dev

# Wait for: "✓ Ready in X.Xs"
```

This will re-register all API routes including the audit endpoint.

---

### Step 2: Create a Company First

You need to **create a company** before you can run an audit on it.

**Option A: Via UI (Recommended)**

1. Go to: http://localhost:3000/companies
2. Click: **"Add New Company"** button
3. Fill in:
   - **Company Name**: Disaster Recovery Queensland
   - **Website**: https://disasterrecoveryqld.au
   - **Industry**: Disaster Recovery Services
4. Click: **Save**
5. Note the company ID from the URL (e.g., `/companies/abc123`)

**Option B: Via API**

```bash
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Disaster Recovery Queensland",
    "website": "https://disasterrecoveryqld.au",
    "industry": "Disaster Recovery Services"
  }'
```

---

### Step 3: Run Audit on Valid Company

1. Go to: http://localhost:3000/companies
2. Click on your company name
3. Click: **"SEO Audit"** tab or navigate to `/companies/[id]/seo-audit`
4. Click: **"Run Comprehensive Audit"** button
5. Wait 30-60 seconds for results

---

## 🔍 How to Verify It's Working

### Check 1: Route is Registered

After restarting dev server, test the route:

```bash
curl -I http://localhost:3000/api/companies/test-id/audit/comprehensive
```

**Expected**: `404` or `405` (Method Not Allowed) - NOT blank/connection refused
**Good Sign**: Server responds (even with error)
**Bad Sign**: No response or connection error

### Check 2: Company Exists

```bash
curl http://localhost:3000/api/companies
```

**Expected**: JSON array with at least one company
**If Empty**: Create a company first (Step 2 above)

### Check 3: Audit Works

After creating a company and navigating to `/companies/[id]/seo-audit`:

1. Click **"Run Comprehensive Audit"**
2. You should see: **Loading spinner** (not immediate error)
3. After 30-60s: **Audit results display** with scores and issues

---

## 🆘 Still Getting 404?

### Debug Checklist

1. **Verify file exists**:
   ```bash
   ls app/api/companies/[id]/audit/comprehensive/route.ts
   ```
   Should show: `route.ts`

2. **Check for syntax errors**:
   ```bash
   npm run build
   ```
   Should complete without TypeScript errors

3. **Check dev server logs**:
   Look in PowerShell for:
   ```
   ○ Compiling /api/companies/[id]/audit/comprehensive ...
   ✓ Compiled /api/companies/[id]/audit/comprehensive in XXXms
   ```

4. **Force clean rebuild**:
   ```powershell
   Remove-Item -Path .next -Recurse -Force
   npm run dev
   ```

---

## 📋 Expected Audit Flow

### What Happens When You Click "Run Comprehensive Audit"

1. **Frontend sends POST** to `/api/companies/[id]/audit/comprehensive`
2. **Backend fetches company** from database
3. **Runs 6 analysis services in parallel**:
   - Lighthouse (performance, accessibility, SEO)
   - Basic SEO (meta tags, H1s, content)
   - Backlink analysis (domain authority, referring domains)
   - Keyword research (primary keyword + variations)
   - SERP analysis (competitor rankings)
   - E-E-A-T calculation (authority & trust)
4. **Calculates scores** (0-100 for each category)
5. **Generates issues** (high/medium/low impact)
6. **Identifies opportunities** (keywords, backlinks, technical)
7. **Creates AI summary** (executive overview)
8. **Saves to database** (`seo_audits` table)
9. **Returns audit ID** to frontend
10. **Frontend displays results**

**Time**: 30-60 seconds
**Output**: Full audit report with 5 category scores, issues list, opportunities, competitors, and executive summary

---

## 🎯 Common Errors & Solutions

### Error: "Company not found"
**Cause**: Company ID doesn't exist in database
**Fix**: Create company first (Step 2)

### Error: 404 on audit endpoint
**Cause**: Route not registered
**Fix**: Restart dev server (Step 1)

### Error: "Failed to run audit"
**Cause**: Missing API keys or service error
**Check**: Verify `.env.local` has:
```
GOOGLE_API_KEY=...
ANTHROPIC_API_KEY=...
QWEN_API_KEY=...
```

### Audit hangs/never completes
**Cause**: Network timeout or API rate limit
**Fix**: Check dev server logs for specific error

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ No 404 errors in browser console
2. ✅ Audit button shows loading spinner
3. ✅ Dev server logs show:
   ```
   [Comprehensive Audit] Starting for https://...
   [Comprehensive Audit] Completed in XXs
   ```
4. ✅ Page displays audit scores and results
5. ✅ Can navigate between tabs (Overview, Issues, Opportunities, Competitors)

---

## 🚀 Next Steps After Fix

Once comprehensive audit works:

1. **Run audits on multiple companies** to populate data
2. **Generate improvement tasks** (click green button on audit page)
3. **Track progress** over time with multiple audits
4. **Compare competitors** using the Competitors tab

---

**TL;DR**:
1. Restart dev server (`Ctrl+C`, then `npm run dev`)
2. Create a company at `/companies`
3. Run audit from company's SEO Audit page

The route exists, you just need to register it and use a valid company ID!
