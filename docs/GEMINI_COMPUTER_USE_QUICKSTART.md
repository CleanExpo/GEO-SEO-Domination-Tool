# Gemini Computer Use - Quick Start Guide

**Status:** ✅ Ready to use (Public Preview)
**Security:** 🔒 Payment blocking ENABLED (cannot be disabled)

---

## What is Gemini Computer Use?

Gemini Computer Use is Google's new AI model (released Oct 9, 2025) that can:
- ✅ Automate browser tasks by "seeing" screenshots
- ✅ Generate UI actions (click, type, scroll, navigate)
- ✅ Execute multi-step web workflows
- ✅ Analyze web pages for SEO insights

**Perfect for:**
- SEO competitor analysis
- Local pack ranking tracking
- AI search visibility monitoring
- Automated web research

---

## 🔒 Security First

This implementation includes **5 layers of payment prevention**:

1. ❌ Blocked payment domains (paypal.com, stripe.com, etc.)
2. ❌ Blocked URL patterns (/checkout, /payment, /cart, etc.)
3. ❌ Blocked keywords ("credit card", "buy now", etc.)
4. ❌ Blocked UI actions (drag_and_drop)
5. ❌ Blocked form fields (card_number, cvv, etc.)

**Result:** Zero risk of accidental payments or payment-related actions.

📖 Read the full security documentation: [NO_PAYMENTS_SECURITY.md](security/NO_PAYMENTS_SECURITY.md)

---

## Setup (5 Minutes)

### Step 1: Get API Key

Visit [Google AI Studio](https://aistudio.google.com/) and:
1. Sign in with Google
2. Click **"Get API Key"**
3. Create new API key
4. Copy the key (starts with `AIza...`)

### Step 2: Add to Environment Variables

Your API key is already configured in `.env.local`:

```env
GEMINI_API_KEY=AIzaSyDStJB2YvcQ9_2PgbuUbZHJNEyNN24zZi8
```

✅ **You're good to go!** (We're using your existing Google API key)

If you want to use a different key, update `.env.local`:

```env
GEMINI_API_KEY=your_new_api_key_here
```

### Step 3: Install Playwright Browsers

Playwright needs browser binaries installed:

```bash
npx playwright install
```

This downloads Chromium, Firefox, and WebKit browsers (~300MB).

**That's it! You're ready to use Gemini Computer Use.**

---

## Quick Test

Verify your setup is working:

```bash
npm run gemini:test
```

This will:
- ✅ Check API key
- ✅ Initialize browser
- ✅ Run safe test task
- ✅ Verify payment blocking

**Expected output:**
```
======================================================================
GEMINI COMPUTER USE - SETUP VERIFICATION TEST
======================================================================

📋 Step 1: Checking API Key...
✅ API Key found: AIzaSyDStJ...

📋 Step 2: Initializing Gemini Computer Use Service...
✅ Service initialized successfully

📋 Step 3: Testing with safe task (Google Homepage)...
✅ Safe task completed successfully

📋 Step 4: Testing PAYMENT BLOCKING security...
✅ SECURITY PASSED: Payment page was correctly blocked

📋 Step 5: Cleaning up...
✅ Cleanup complete

🎉 Setup verification complete!
```

---

## Example Scripts

### 1. Competitor Analysis

Analyze a competitor's website for SEO insights:

```bash
npm run gemini:competitor
```

**What it does:**
- Visits competitor URL
- Extracts H1, H2, H3 headings
- Identifies main topic/focus
- Counts service offerings
- Checks for blog/resources section
- Notes call-to-action buttons

**Customize:** Edit [scripts/examples/gemini-seo-competitor-analysis.ts](../scripts/examples/gemini-seo-competitor-analysis.ts)

### 2. Local Pack Tracking

Track Google Maps local pack rankings:

```bash
npm run gemini:local-pack
```

**What it does:**
- Searches keyword on Google Maps
- Extracts top 3 local pack results
- Captures business names, ratings, reviews
- Records addresses

**Customize:** Edit [scripts/examples/gemini-local-pack-tracking.ts](../scripts/examples/gemini-local-pack-tracking.ts)

### 3. AI Search Visibility

Check citations in AI search engines (Perplexity, ChatGPT, etc.):

```bash
npm run gemini:ai-search
```

**What it does:**
- Queries Perplexity AI
- Checks if your domain is cited
- Extracts citation position and context
- Counts total citations

**Customize:** Edit [scripts/examples/gemini-ai-search-visibility.ts](../scripts/examples/gemini-ai-search-visibility.ts)

---

## Usage

### TypeScript/JavaScript

```typescript
import { GeminiComputerUseService } from './services/api/gemini-computer-use';

// Initialize
const service = new GeminiComputerUseService({
  apiKey: process.env.GEMINI_API_KEY!,
  headless: false, // Show browser (true to hide)
  timeout: 30000,
});

await service.initialize();

// Execute task
const result = await service.executeTask({
  description: 'Your automation task description',
  startUrl: 'https://example.com',
  maxSteps: 10,
});

// Check results
if (result.success) {
  console.log('Task completed!', result.steps);
} else {
  console.error('Task failed:', result.error);
  if (result.blockedReason) {
    console.log('Blocked:', result.blockedReason);
  }
}

// Cleanup
await service.cleanup();
```

### API Routes (Next.js)

```typescript
// app/api/gemini-automation/route.ts
import { GeminiComputerUseService } from '@/services/api/gemini-computer-use';

export async function POST(req: Request) {
  const { task, url } = await req.json();

  const service = new GeminiComputerUseService({
    apiKey: process.env.GEMINI_API_KEY!,
    headless: true,
  });

  try {
    await service.initialize();
    const result = await service.executeTask({
      description: task,
      startUrl: url,
      maxSteps: 15,
    });
    await service.cleanup();

    return Response.json(result);
  } catch (error: any) {
    await service.cleanup();
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

---

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run gemini:test` | Verify setup and test security |
| `npm run gemini:competitor` | Run competitor analysis example |
| `npm run gemini:local-pack` | Run local pack tracking example |
| `npm run gemini:ai-search` | Run AI search visibility example |

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google AI API key | Required |
| `GEMINI_COMPUTER_USE_MODEL` | Model ID | `gemini-2.5-computer-use-preview-10-2025` |
| `GEMINI_HEADLESS` | Hide browser window | `false` |
| `GEMINI_TIMEOUT` | Request timeout (ms) | `30000` |
| `GEMINI_ALLOW_PAYMENTS` | **HARDCODED TO FALSE** | `false` |

### Service Options

```typescript
const service = new GeminiComputerUseService({
  apiKey: 'your-key',      // Required
  headless: true,          // Hide browser (default: false)
  timeout: 60000,          // Request timeout (default: 30000)
  allowPayments: false,    // CANNOT BE CHANGED (always false)
});
```

---

## Best Practices

### ✅ Do This

1. **Start with small tasks** - Test with 3-5 steps before complex workflows
2. **Use headless: false during development** - See what the browser is doing
3. **Set reasonable maxSteps** - Prevent infinite loops (typically 10-20 steps)
4. **Check result.blockedReason** - Understand why tasks were blocked
5. **Always cleanup** - Call `await service.cleanup()` to close browser

### ❌ Avoid This

1. **Don't skip cleanup** - Browsers will keep running in background
2. **Don't override allowPayments** - It's hardcoded to false for your safety
3. **Don't run on production data** - Test in dev/staging environments first
4. **Don't ignore blocked warnings** - They indicate security or safety issues
5. **Don't set maxSteps too high** - Can consume excessive API quota

---

## Troubleshooting

### "API Key not found"

**Solution:** Verify `.env.local` has `GEMINI_API_KEY` set.

```bash
cat .env.local | grep GEMINI_API_KEY
```

### "Browser not initialized"

**Solution:** Install Playwright browsers.

```bash
npx playwright install
```

### "Task blocked: Payment-related"

**Solution:** This is correct behavior! The security layer prevented a payment action. Review the blocked URL/content and adjust your task if needed.

### Playwright errors on Windows

**Solution:** Install browser dependencies.

```bash
npx playwright install-deps
```

### API rate limits

**Solution:** Google AI Studio has rate limits. Upgrade to Vertex AI for higher quotas.

---

## Use Cases for GEO-SEO Tool

### 1. **Automated Competitor Audits**
- Extract competitor page structure
- Analyze meta tags and headings
- Identify content gaps
- Track website changes over time

### 2. **Local Pack Monitoring**
- Track local rankings automatically
- Monitor competitor ratings/reviews
- Calculate Share of Local Voice (SoLV)
- Detect new competitors entering market

### 3. **AI Search Visibility**
- Track citations in Perplexity, ChatGPT, Claude
- Monitor domain authority in AI responses
- Identify AI search ranking factors
- Measure AI visibility score

### 4. **Technical SEO Audits**
- Automated accessibility testing
- Mobile responsiveness checks
- Page speed monitoring
- Broken link detection

---

## Next Steps

1. ✅ **Run the test:** `npm run gemini:test`
2. 📖 **Read security docs:** [NO_PAYMENTS_SECURITY.md](security/NO_PAYMENTS_SECURITY.md)
3. 🔧 **Try examples:** Run competitor analysis, local pack tracking, AI search
4. 💡 **Customize tasks:** Edit example scripts for your specific needs
5. 🚀 **Integrate:** Add to Next.js API routes or job scheduler

---

## Resources

- **Official Docs:** [Google AI Computer Use](https://ai.google.dev/gemini-api/docs/computer-use)
- **Research Summary:** [GEMINI_2.5_COMPUTER_USE_RESEARCH.md](research/GEMINI_2.5_COMPUTER_USE_RESEARCH.md)
- **Security Details:** [NO_PAYMENTS_SECURITY.md](security/NO_PAYMENTS_SECURITY.md)
- **Setup Guide:** [GEMINI_COMPUTER_USE_SETUP.md](setup/GEMINI_COMPUTER_USE_SETUP.md)

---

## Support

If you encounter issues:

1. Check this guide first
2. Review error messages carefully
3. Verify API key is valid at [Google AI Studio](https://aistudio.google.com/)
4. Check Playwright installation: `npx playwright --version`

**Your system is ready for automated SEO research! 🚀**
