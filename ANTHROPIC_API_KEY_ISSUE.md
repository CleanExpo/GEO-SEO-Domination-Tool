# CRITICAL: Anthropic API Key Issue

**Date**: 2025-10-16
**Status**: 🔴 **BROKEN** - All AI credential assistance failing

---

## Problem

The AI Credential Assistant is returning 500 errors because **ALL three AI models are failing**:

### 1. Qwen (Primary)
```
Status: 403 AccessDenied.Unpurchased
Error: Access to model denied. Please make sure you are eligible for using the model.
Code: AccessDenied.Unpurchased
```

**Reason**: No subscription purchased for Qwen API
**Expected**: This is normal, Qwen requires subscription

---

### 2. Claude Opus (Fallback #1)
```
Status: 401 Authentication Error
Error: invalid x-api-key
Request ID: req_011CUAeRvLCmPEgpxMGfF7Va
```

**Reason**: ANTHROPIC_API_KEY is invalid
**Impact**: Cannot fall back to Claude Opus

---

### 3. Claude Sonnet 4.5 (Fallback #2)
```
Status: 401 Authentication Error
Error: invalid x-api-key
Request ID: req_011CUAeRyXwGthTqk7ZUPzhA
```

**Reason**: ANTHROPIC_API_KEY is invalid (same key as Opus)
**Impact**: Cannot fall back to Claude Sonnet 4.5

---

## Root Cause

The `ANTHROPIC_API_KEY` in `.env.local` is **invalid**. This could be due to:

1. **API key expired** - Anthropic keys can expire
2. **Payment issue** - Account may have insufficient credits
3. **Key revoked** - Key may have been manually revoked
4. **Wrong key format** - Key may be corrupted or incomplete

---

## Impact

### Affected Features
- ✅ Business lookup - **WORKING** (no AI required)
- ✅ Auto-discovery - **WORKING** (no AI required)
- ❌ **AI Credential Assistant** - **BROKEN** (all models failing)
- ❌ **Help finding credentials** - **BROKEN** (depends on AI)
- ✅ Manual credential entry - **WORKING** (no AI required)
- ✅ Save/load onboarding - **WORKING** (no AI required)

### User Experience
When users click "Help me find these" in Step 7 (API Credentials):
1. System tries Qwen → 403 (no subscription)
2. System tries Claude Opus → 401 (invalid key)
3. System tries Claude Sonnet 4.5 → 401 (invalid key)
4. **Result**: 500 error with message "All AI models failed to respond"

---

## Immediate Workaround

### Option 1: Skip AI Credential Assistant (Recommended)
Users can still complete onboarding by:
1. **Manually entering credentials** (if they know them)
2. **Skipping credential steps** (leaving them blank)
3. **Adding credentials later** in settings

**No code changes needed** - this functionality already works.

---

### Option 2: Get New Anthropic API Key

#### Step 1: Check Current Account Status
1. Visit: https://console.anthropic.com/
2. Log in with your account
3. Check "Billing" section for credits/payment status
4. Check "API Keys" section to see if key is active

#### Step 2: Generate New Key
1. Go to: https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Copy the new key (starts with `sk-ant-...`)
4. Update `.env.local`:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-your-new-key-here
   ```

#### Step 3: Verify Key Works
```bash
node scripts/test-anthropic-key.js
```

---

### Option 3: Disable AI Credential Assistant (Temporary)

If you want to prevent 500 errors while fixing the key:

**File**: `app/api/onboarding/credential-assistant/route.ts`

**Add at the top of POST function**:
```typescript
export async function POST(request: NextRequest) {
  // Temporary: Disable AI while fixing API key
  return NextResponse.json({
    error: 'AI Credential Assistant temporarily unavailable. Please enter credentials manually or skip this step.',
    code: 'TEMPORARILY_DISABLED'
  }, { status: 503 });

  // ... rest of function
}
```

**Pros**:
- Users get clear message instead of 500 error
- No confusing "All AI models failed" message
- Users know to use manual entry

**Cons**:
- Feature disabled until key fixed

---

## Testing Script

I'll create a script to test the Anthropic API key:

**File**: `scripts/test-anthropic-key.js`

```javascript
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.ANTHROPIC_API_KEY;

console.log('Testing Anthropic API Key...\n');
console.log('Key format:', apiKey?.substring(0, 10) + '...' + apiKey?.substring(apiKey.length - 10));
console.log('Key length:', apiKey?.length, '\n');

const anthropic = new Anthropic({ apiKey });

(async () => {
  try {
    console.log('Attempting to call Claude Sonnet 4.5...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Say "API key works!"' }]
    });

    console.log('✅ SUCCESS! API key is valid.');
    console.log('Response:', response.content[0].text);
    console.log('\nAPI key is working correctly.');
  } catch (error) {
    console.error('❌ FAILED! API key is invalid.\n');
    console.error('Error:', error.message);
    console.error('Status:', error.status);
    console.error('\nPlease get a new API key from: https://console.anthropic.com/settings/keys');
  }
})();
```

---

## Recommended Actions

### Immediate (Next 5 Minutes)
1. **Accept that AI Credential Assistant is temporarily broken**
2. **Users can still complete onboarding** by entering credentials manually
3. **No urgent code changes needed** - system degrades gracefully

### Short-term (Next 1-2 Hours)
1. Visit https://console.anthropic.com/ and check account status
2. Generate new API key if current one is expired/revoked
3. Update `.env.local` with new key
4. Test with `node scripts/test-anthropic-key.js`
5. Restart dev server to reload environment variables

### Long-term (Optional)
1. Consider **removing Opus fallback** (uses same key as Sonnet, redundant)
2. Add **API key validation** on startup (detect invalid keys early)
3. Implement **better error messages** in UI (don't show "500 error")
4. Add **monitoring** for API key expiration

---

## Summary

**Current State**:
- Qwen: ❌ No subscription (expected)
- Claude Opus: ❌ Invalid API key (needs fix)
- Claude Sonnet 4.5: ❌ Invalid API key (needs fix)
- AI Credential Assistant: ❌ Completely broken (all models failing)

**Impact**: Users can still complete onboarding manually, but AI assistance is unavailable.

**Fix**: Get new Anthropic API key from https://console.anthropic.com/settings/keys

**Priority**: Medium (feature broken but workaround exists)
