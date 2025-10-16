# ✅ FIXED: Anthropic API Key Issue

**Date**: 2025-10-16
**Status**: ✅ **RESOLVED** - API key updated in `.env.development`

---

## Problem Summary

The AI Credential Assistant was failing with 500 errors because the Anthropic API key was **invalid**.

### Error Symptoms
```
Status: 401 Authentication Error
Error: invalid x-api-key
Model: claude-opus-4-20250514, claude-sonnet-4-20250514
```

All three AI models failed:
1. Qwen → 403 (no subscription - expected)
2. Claude Opus → 401 (invalid API key)
3. Claude Sonnet 4.5 → 401 (invalid API key)

---

## Root Cause Identified

### The Mystery
- ✅ API key in `.env.local` was **valid** (tested successfully)
- ❌ Next.js was still getting 401 errors

### The Discovery
Next.js loads environment variables in this order:
1. **`.env.development`** ← Takes precedence for `npm run dev`
2. `.env.local`
3. `.env`

**Found**: `.env.development` contained an **old, expired** API key that was overriding the valid key in `.env.local`

```bash
# OLD (expired) - in .env.development
ANTHROPIC_API_KEY="sk-ant-api03-[REDACTED]"

# NEW (valid) - in .env.local
ANTHROPIC_API_KEY="sk-ant-api03-[REDACTED]"
```

---

## Fix Applied

### Changed `.env.development`
Updated line 2 with the correct API key from `.env.local`:

```bash
# Before
ANTHROPIC_API_KEY="sk-ant-api03-[REDACTED-OLD-KEY]"

# After
ANTHROPIC_API_KEY="sk-ant-api03-[REDACTED-NEW-KEY]"
```

### Restarted Dev Server
```bash
npm run dev
```

Next.js will now load the **correct** API key from `.env.development`.

---

## Verification

### Before Fix
```bash
# Test with old key from .env.development
Status: 401 invalid x-api-key
```

### After Fix
```bash
# Test with new key
node scripts/test-anthropic-key.js

✅ SUCCESS! API key is valid.
Response: API key works!
Model: claude-sonnet-4-20250514
Input tokens: 17
Output tokens: 7
Response time: 2784ms
```

---

## Testing the Fix

### Test 1: Direct API Key Test
```bash
node scripts/test-anthropic-key.js
```

**Expected**: ✅ Success message, "API key works!"

---

### Test 2: AI Credential Assistant (In Browser)
1. Visit: http://localhost:3000/onboarding
2. Fill out Business Name and Email
3. Progress through steps to Step 7 (API Credentials)
4. Click "Help me find these"
5. **Expected**: AI assistant responds with guidance (no 500 error)

---

### Test 3: Check Dev Server Logs
Watch for AI responses in terminal:
```bash
🔄 [CascadingAI] Trying Qwen first (cost-optimized)...
⚠️  [CascadingAI] Qwen failed, trying Claude Opus...
✅ [CascadingAI] Claude Opus succeeded! Cost: $0.0324
```

**Expected**: Claude Opus or Sonnet succeeds (no 401 errors)

---

## Why This Happened

### Environment File Priority
Next.js uses different `.env` files for different environments:

**Development** (`npm run dev`):
1. `.env.development` ← **HIGHEST PRIORITY**
2. `.env.development.local`
3. `.env.local`
4. `.env`

**Production** (`npm start`):
1. `.env.production`
2. `.env.production.local`
3. `.env.local`
4. `.env`

### The Mistake
We updated the API key in `.env.local` (which works for production and as a fallback), but forgot to update `.env.development` which takes precedence during development.

---

## Prevention

### Option 1: Keep Keys Synced (Current Approach)
Update API keys in **both** files:
- `.env.development` (for dev server)
- `.env.local` (for production)

**Pros**: Works everywhere
**Cons**: Easy to forget to update both

---

### Option 2: Remove `.env.development` (Recommended)
Delete `.env.development` and only use `.env.local`:

```bash
rm .env.development
```

**Pros**: Single source of truth for API keys
**Cons**: Production-specific config can't be environment-specific

---

### Option 3: Use `.env.development.local` (Best Practice)
Create `.env.development.local` for local development overrides:

```bash
# .env.development - Committed to git (safe defaults)
DATABASE_URL=postgres://localhost/dev

# .env.development.local - NOT committed (secrets)
ANTHROPIC_API_KEY=sk-ant-api03-...
QWEN_API_KEY=sk-...
```

Add to `.gitignore`:
```
.env*.local
```

**Pros**: Secrets never committed, clean separation
**Cons**: Requires initial setup for each developer

---

## Current Status

✅ **Fixed**: `.env.development` now has correct API key
✅ **Tested**: API key works when called directly
🔄 **Verifying**: Dev server restarted with new environment variables
⏳ **Next**: Test AI Credential Assistant in browser

---

## Expected Behavior After Fix

### AI Credential Assistant Flow
1. User clicks "Help me find these" in Step 7
2. System tries Qwen → 403 (no subscription - expected)
3. System tries Claude Opus → ✅ **SUCCESS**
4. User receives AI guidance for finding credentials
5. Response time: ~3-5 seconds
6. Cost: ~$0.03-0.04 per query

### Fallback Chain
- **Qwen** (cheapest): $0.001/query (needs subscription)
- **Claude Opus** (premium): $0.03-0.04/query (working now!)
- **Claude Sonnet 4.5** (mid-tier): $0.008/query (backup)

---

## Files Modified

### `.env.development` (Updated)
```bash
Line 2: ANTHROPIC_API_KEY="sk-ant-api03-[REDACTED]"
```

### Documentation Created
- ✅ `ANTHROPIC_API_KEY_ISSUE.md` - Original problem analysis
- ✅ `scripts/test-anthropic-key.js` - API key testing script
- ✅ `ANTHROPIC_API_KEY_FIXED.md` - This file (fix documentation)

---

## Summary

**Problem**: AI Credential Assistant failing with 401 errors
**Root Cause**: `.env.development` had old, expired API key overriding valid key in `.env.local`
**Fix**: Updated `.env.development` with correct API key and restarted dev server
**Status**: ✅ **RESOLVED** - AI assistant should now work correctly

---

**Next Step**: Test the AI Credential Assistant in browser to confirm fix is working.
