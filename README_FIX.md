# 🚀 ONE-CLICK FIX - Start Here!

## The Easy Way (Just Double-Click!)

1. **Double-click** the file: **`FIX-AND-START.bat`**
2. That's it! The script will:
   - Kill all background processes ✓
   - Clear all caches ✓
   - Fix environment files ✓
   - Start your dev server ✓

## What To Look For

When the server starts, you should see:
```
🔧 Using SQLite database at: D:\GEO_SEO_Domination-Tool\data\geo-seo.db
✓ Connected to SQLite database
✓ Ready in 2s
```

**If you see this, it's working!** Your app will be at: http://localhost:3000

## What The Script Does

The `FIX-AND-START.bat` script automatically:

1. **Kills all node processes** (those 14 background servers)
2. **Clears ports 3000, 3001, 3002**
3. **Removes all Next.js caches** (.next, node_modules/.cache, etc.)
4. **Fixes your .env files** (comments out POSTGRES_URL if needed)
5. **Adds SQLite flags** (USE_SQLITE=true, FORCE_LOCAL_DB=true)
6. **Starts the dev server** fresh and clean

## If Something Goes Wrong

If you don't see the "Using SQLite database" message, the script didn't work. In that case:

### Option 1: Run PowerShell Script Directly
```powershell
powershell -ExecutionPolicy Bypass -File fix-everything.ps1
```

### Option 2: Manual Steps (Fallback)
```powershell
# Open PowerShell as Administrator
# Then run these commands one by one:

Get-Process node | Stop-Process -Force
Remove-Item -Recurse -Force .next
npm run dev
```

## Testing The Fix

Once the server is running, open a **new** PowerShell window and test:

```powershell
curl -X POST http://localhost:3000/api/onboarding/save `
  -H "Content-Type: application/json" `
  -d '{\"businessName\":\"Test\",\"email\":\"test@test.com\",\"formData\":{},\"currentStep\":1}'
```

**Expected response:**
```json
{"success":true,"message":"Progress saved successfully"}
```

## Files Created

- **FIX-AND-START.bat** ← Double-click this!
- **fix-everything.ps1** ← The actual PowerShell script
- **README_FIX.md** ← This file

## What This Fixes

- ✅ Kills 14+ orphaned dev server processes
- ✅ Clears Next.js compilation cache
- ✅ Fixes environment variables (POSTGRES_URL → commented out)
- ✅ Enables SQLite for local development
- ✅ Starts ONE clean dev server

## Your Vercel Production

Don't worry - your production deployment at Vercel is **not affected** by these changes. It will continue using PostgreSQL/Supabase correctly.

Production URL: https://geo-seo-domination-tool-5v3igj2nu-unite-group.vercel.app

## Need More Help?

Check these detailed docs:
- [CLEANUP_COMPLETE.md](CLEANUP_COMPLETE.md) - What happened & why
- [FINAL_FIX_INSTRUCTIONS.md](FINAL_FIX_INSTRUCTIONS.md) - Detailed technical guide
- [ENVIRONMENT_FIX_SUMMARY.md](ENVIRONMENT_FIX_SUMMARY.md) - Full analysis

---

**TL;DR: Just double-click `FIX-AND-START.bat` and you're done!** 🎉
