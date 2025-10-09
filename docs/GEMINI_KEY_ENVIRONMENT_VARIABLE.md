# Gemini API Key - Environment Variable Configuration

**Updated:** October 9, 2025
**Variable Name:** `GEMINI_KEY`
**Status:** ✅ Configured in Vercel

---

## Environment Variable Setup

### Production (Vercel)

The Gemini API key is stored as `GEMINI_KEY` in Vercel Environment Variables.

**Location:** Vercel Dashboard → Project Settings → Environment Variables

✅ **Already configured** - You've added this in Vercel.

**Security:** 🔒 Keep this value secret. Never commit to Git.

### Local Development

The service will use environment variables in this priority order:

1. **`GEMINI_KEY`** (primary - matches Vercel)
2. **`GEMINI_API_KEY`** (fallback)
3. **`GOOGLE_API_KEY`** (fallback)

**Local `.env.local` file:**
```env
# Gemini Computer Use Configuration
# PRODUCTION: Set GEMINI_KEY in Vercel Environment Variables
# LOCAL: Use GOOGLE_API_KEY as fallback
GEMINI_KEY=AIzaSyDStJB2YvcQ9_2PgbuUbZHJNEyNN24zZi8
```

---

## API Key Resolution

The service includes automatic key resolution:

```typescript
export function getGeminiApiKey(): string {
  const key =
    process.env.GEMINI_KEY ||           // Priority 1: Vercel variable
    process.env.GEMINI_API_KEY ||       // Priority 2: Fallback
    process.env.GOOGLE_API_KEY;         // Priority 3: Fallback

  if (!key) {
    throw new Error('Gemini API key not found');
  }

  return key;
}
```

**Benefits:**
- ✅ Works in both Vercel (production) and local development
- ✅ Matches your Vercel environment variable name
- ✅ Provides fallback options for flexibility
- ✅ Clear error messages if key is missing

---

## Usage in Code

### TypeScript/JavaScript

```typescript
import { GeminiComputerUseService, getGeminiApiKey } from '@/services/api/gemini-computer-use';

// Option 1: Let service auto-detect key
const service = new GeminiComputerUseService({
  apiKey: getGeminiApiKey(), // Auto-detects GEMINI_KEY, GEMINI_API_KEY, or GOOGLE_API_KEY
  headless: true,
});

// Option 2: Manually specify
const service = new GeminiComputerUseService({
  apiKey: process.env.GEMINI_KEY!, // Use specific variable
  headless: true,
});
```

### Next.js API Route

```typescript
// app/api/gemini-automation/route.ts
import { GeminiComputerUseService, getGeminiApiKey } from '@/services/api/gemini-computer-use';

export async function POST(req: Request) {
  const service = new GeminiComputerUseService({
    apiKey: getGeminiApiKey(), // Auto-detects key
    headless: true,
  });

  try {
    await service.initialize();
    // ... your automation logic
  } finally {
    await service.cleanup();
  }
}
```

---

## Verification

### Test Key Resolution

Run the test script to verify the correct key is being used:

```bash
npm run gemini:test
```

**Expected output:**
```
📋 Step 1: Checking API Key...
✅ API Key found: AIzaSyDStJ...
   Source: GEMINI_KEY (primary - Vercel variable)
```

This confirms:
- ✅ Key is found
- ✅ Using `GEMINI_KEY` variable (matches Vercel)
- ✅ Service can initialize

---

## Security Best Practices

### ✅ Do This

1. **Use `GEMINI_KEY` in Vercel** - Matches your production setup
2. **Never commit API keys** - Already in `.gitignore`
3. **Rotate keys regularly** - Generate new keys periodically
4. **Use environment-specific keys** - Different keys for dev/prod
5. **Monitor API usage** - Check quota at [Google AI Studio](https://aistudio.google.com/)

### ❌ Don't Do This

1. **Don't hardcode keys** - Always use environment variables
2. **Don't commit `.env.local`** - Already in `.gitignore`
3. **Don't share keys publicly** - Keep secret
4. **Don't reuse keys** - Use dedicated key for Gemini Computer Use
5. **Don't skip validation** - Always check key is set

---

## Environment Variable Comparison

| Environment | Primary Variable | Fallback 1 | Fallback 2 |
|-------------|-----------------|------------|------------|
| **Vercel (Production)** | `GEMINI_KEY` ✅ | `GEMINI_API_KEY` | `GOOGLE_API_KEY` |
| **Local Development** | `GEMINI_KEY` ✅ | `GEMINI_API_KEY` | `GOOGLE_API_KEY` |
| **Priority Order** | 1st | 2nd | 3rd |

**Why three options?**
- Flexibility for different deployment environments
- Backward compatibility with existing configurations
- Clear migration path if variable names change

---

## Vercel Deployment

### Environment Variables in Vercel

1. Go to your Vercel project
2. Settings → Environment Variables
3. Verify `GEMINI_KEY` is set
4. Apply to: **Production**, **Preview**, **Development**

**Your setup:**
```
Variable: GEMINI_KEY
Value: [Your secret API key]
Environments: ✅ Production ✅ Preview ✅ Development
```

### Deployment Commands

```bash
# Deploy to Vercel
vercel deploy

# Verify environment variable is set
vercel env ls

# Pull environment variables to local
vercel env pull .env.local
```

---

## Troubleshooting

### "Gemini API key not found"

**Solution:** Add `GEMINI_KEY` to your environment.

**Local Development:**
```bash
# Add to .env.local
echo "GEMINI_KEY=your_api_key_here" >> .env.local
```

**Vercel:**
```bash
# Add via CLI
vercel env add GEMINI_KEY

# Or via dashboard
# Vercel → Project → Settings → Environment Variables
```

### "API key invalid"

**Solution:** Verify key is correct at [Google AI Studio](https://aistudio.google.com/).

1. Go to Google AI Studio
2. Check API key is active
3. Copy fresh key if needed
4. Update in Vercel and `.env.local`

### "Wrong key source detected"

**Solution:** Check priority order.

```bash
# Check which variables are set
env | grep -E "(GEMINI_KEY|GEMINI_API_KEY|GOOGLE_API_KEY)"

# Unset unwanted variables
unset GEMINI_API_KEY
```

---

## Migration from Old Variable Names

If you were using different variable names before:

### From `GEMINI_API_KEY`

**No changes needed** - It's already a fallback.

```env
# Old (still works)
GEMINI_API_KEY=your_key

# New (recommended - matches Vercel)
GEMINI_KEY=your_key
```

### From `GOOGLE_API_KEY`

**No changes needed** - It's already a fallback.

```env
# Old (still works)
GOOGLE_API_KEY=your_key

# New (recommended - matches Vercel)
GEMINI_KEY=your_key
```

**Recommended:** Update to `GEMINI_KEY` for consistency with Vercel.

---

## API Key Management

### Get New API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with Google account
3. Click **"Get API Key"**
4. Create new API key
5. Copy key (starts with `AIza...`)

### Rotate API Key

**Every 90 days (recommended):**

1. Generate new key at Google AI Studio
2. Update in Vercel: `GEMINI_KEY`
3. Update in `.env.local`
4. Delete old key from Google AI Studio
5. Verify deployment works

### Monitor Usage

Track your API usage at:
- [Google AI Studio Dashboard](https://aistudio.google.com/)
- Check quota limits
- Monitor request counts
- Review error rates

---

## Summary

✅ **Production (Vercel):** `GEMINI_KEY` is configured
✅ **Local Development:** Uses `GEMINI_KEY` from `.env.local`
✅ **Fallback Options:** `GEMINI_API_KEY` and `GOOGLE_API_KEY`
✅ **Auto-Detection:** `getGeminiApiKey()` helper function
✅ **Security:** Never committed to Git, kept secret

**Your Gemini API key is properly configured for both local and production environments!** 🚀

---

**Next Steps:**
1. ✅ Verify setup: `npm run gemini:test`
2. 📖 Read: [GEMINI_COMPUTER_USE_QUICKSTART.md](GEMINI_COMPUTER_USE_QUICKSTART.md)
3. 🚀 Deploy: `vercel deploy`
