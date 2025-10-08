# FINAL FIX INSTRUCTIONS - SQLite Local Development

**Date**: October 8, 2025
**Status**: Ready for manual execution

## Critical Finding

The modified database detection code in `lib/db.ts` is **NOT being compiled** by Next.js, even after clearing `.next` multiple times. The server continues to execute the old compiled JavaScript.

## Why You're Seeing This

Next.js is somehow caching the compiled TypeScript in a way that survives `.next` deletion. This could be:
1. Windows file system locks
2. npm cache
3. Node.js module cache
4. VSCode TypeScript server cache

## SOLUTION: Complete Manual Reset

Execute these steps **EXACTLY** in PowerShell as Administrator:

### Step 1: Close Everything
```powershell
# Close ALL terminals, editors, and VS Code instances
# IMPORTANT: Close this terminal after copying these commands
```

### Step 2: Clean Restart
```powershell
# Open NEW PowerShell as Administrator
cd D:\GEO_SEO_Domination-Tool

# Kill absolutely everything
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process Code -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3

# Remove ALL caches
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $env:TEMP\next-* -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $env:LOCALAPPDATA\Microsoft\TypeScript -ErrorAction SilentlyContinue

# Clear npm cache
npm cache clean --force

Write-Host "✓ All caches cleared" -ForegroundColor Green
```

### Step 3: Verify Environment Files
```powershell
# Check that POSTGRES_URL is commented out
Get-Content .env.local | Select-String "POSTGRES_URL"
# Should show: # POSTGRES_URL=...

Get-Content .env.development | Select-String "POSTGRES_URL"
# Should show: # POSTGRES_URL=...

# Check that SQLite flags are set
Get-Content .env.local | Select-String "USE_SQLITE|FORCE_LOCAL_DB"
# Should show: USE_SQLITE=true and FORCE_LOCAL_DB=true
```

### Step 4: Start Fresh
```powershell
# Start dev server
npm run dev
```

## Expected Output

When working correctly, you should see:
```
   ▲ Next.js 15.5.4
   - Local:        http://localhost:3000

 ✓ Starting...
🔧 Using SQLite database at: D:\GEO_SEO_Domination-Tool\data\geo-seo.db
✓ Connected to SQLite database
 ✓ Ready in ~2s
```

**Key Indicator**: The line `🔧 Using SQLite database` MUST appear. If it doesn't, the old code is still running.

## Test the API

In a new PowerShell window:
```powershell
curl -X POST http://localhost:3000/api/onboarding/save `
  -H "Content-Type: application/json" `
  -d '{\"businessName\":\"Test Co\",\"email\":\"test@test.com\",\"formData\":{},\"currentStep\":1}'
```

**Expected**:
```json
{"success":true,"message":"Progress saved successfully"}
```

**If you still see "Tenant or user not found"**:
```json
{"error":"Failed to save progress","details":"Tenant or user not found"}
```

Then the TypeScript code STILL hasn't recompiled.

## ALTERNATIVE SOLUTION: Direct SQLite in API Route

If the above doesn't work, we need to bypass the database abstraction layer and use SQLite directly in the API route.

Edit `app/api/onboarding/save/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // DIRECT SQLite connection (bypass db.ts)
    const dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');
    const db = new Database(dbPath);

    const body = await request.json();
    const { businessName, email, formData, currentStep } = body;

    if (!businessName || !email) {
      return NextResponse.json(
        { error: 'Business name and email are required' },
        { status: 400 }
      );
    }

    // Check if save exists
    const existing = db.prepare(
      `SELECT id FROM saved_onboarding WHERE business_name = ? AND email = ?`
    ).get(businessName, email);

    if (existing) {
      // Update
      db.prepare(
        `UPDATE saved_onboarding
         SET form_data = ?, current_step = ?, last_saved = CURRENT_TIMESTAMP
         WHERE business_name = ? AND email = ?`
      ).run(JSON.stringify(formData), currentStep, businessName, email);
    } else {
      // Insert
      db.prepare(
        `INSERT INTO saved_onboarding (business_name, email, form_data, current_step, last_saved)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
      ).run(businessName, email, JSON.stringify(formData), currentStep);
    }

    db.close();

    return NextResponse.json({
      success: true,
      message: 'Progress saved successfully'
    });

  } catch (error: any) {
    console.error('Failed to save onboarding progress:', error);
    return NextResponse.json(
      {
        error: 'Failed to save progress',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // DIRECT SQLite connection
    const dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');
    const db = new Database(dbPath);

    const { searchParams } = new URL(request.url);
    const businessName = searchParams.get('businessName');
    const email = searchParams.get('email');

    if (!businessName || !email) {
      return NextResponse.json(
        { error: 'Business name and email are required' },
        { status: 400 }
      );
    }

    const saved = db.prepare(
      `SELECT form_data, current_step, last_saved
       FROM saved_onboarding
       WHERE business_name = ? AND email = ?`
    ).get(businessName, email) as any;

    db.close();

    if (!saved) {
      return NextResponse.json({
        found: false,
        message: 'No saved progress found'
      });
    }

    return NextResponse.json({
      found: true,
      formData: JSON.parse(saved.form_data),
      currentStep: saved.current_step,
      lastSaved: saved.last_saved
    });

  } catch (error: any) {
    console.error('Failed to load onboarding progress:', error);
    return NextResponse.json(
      {
        error: 'Failed to load progress',
        details: error.message
      },
      { status: 500 }
    );
  }
}
```

This bypasses the entire `lib/db.ts` abstraction and uses SQLite directly.

## Modified Files (Current Status)

1. **lib/db.ts** - ✅ Modified with environment detection (NOT COMPILING)
2. **.env.local** - ✅ POSTGRES_URL commented, SQLite flags added
3. **.env.development** - ✅ POSTGRES_URL commented

## Next Steps If Still Failing

1. Try the **Alternative Solution** (direct SQLite in API route)
2. Check if Windows Defender or antivirus is locking files
3. Run `npm install` to reinstall dependencies
4. Consider using **only PostgreSQL** with a local Supabase instance
5. Contact Vercel support about local development environment variable handling

## Support Files Created

- [ENVIRONMENT_FIX_SUMMARY.md](ENVIRONMENT_FIX_SUMMARY.md) - Complete fix documentation
- [ONBOARDING_SAVE_FIX.md](ONBOARDING_SAVE_FIX.md) - Original onboarding API fixes
- [CRITICAL_STATUS.md](CRITICAL_STATUS.md) - Critical status report
- [FINAL_FIX_INSTRUCTIONS.md](FINAL_FIX_INSTRUCTIONS.md) - This file

## Contact

- **Project**: geo-seo-domination-tool
- **Vercel Project ID**: prj_JxdLiaHoWpnXWEjEhXXpmo0eFBgQ
- **Working Directory**: D:\GEO_SEO_Domination-Tool
- **Production URL**: https://geo-seo-domination-tool-5v3igj2nu-unite-group.vercel.app

---

**Last Updated**: October 8, 2025, 9:10 PM
**Status**: Awaiting manual execution
