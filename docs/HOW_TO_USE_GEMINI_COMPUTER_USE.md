# How to Use Gemini Computer Use - Step-by-Step Guide

**Ready to automate your SEO research?** This guide shows you exactly how to use Gemini Computer Use right now.

---

## 🎯 What Can You Automate?

- ✅ Competitor website analysis (extract headings, content, structure)
- ✅ Google Maps local pack tracking (capture top 3 rankings)
- ✅ AI search visibility (check citations in Perplexity, ChatGPT)
- ✅ Technical SEO audits (page speed, mobile view, broken links)
- ✅ Any web research task that requires browsing

**Security:** Payment blocking is ALWAYS active - zero risk of purchases.

---

## 🚀 Method 1: Run Pre-Built Examples (Fastest)

### Step 1: Test Your Setup

Verify everything works:

```bash
npm run gemini:test
```

**Expected output:**
```
✅ API Key: Configured
✅ Service: Initialized
✅ Browser: Launched
✅ Security: Payment blocking active
```

### Step 2: Run an Example

Try one of the pre-built SEO automation scripts:

#### A. Competitor Analysis
```bash
npm run gemini:competitor
```

**What it does:**
- Opens competitor website
- Extracts H1, H2, H3 headings
- Identifies main topics and services
- Checks for blog/resources
- Notes call-to-action buttons

**Customize:** Edit [scripts/examples/gemini-seo-competitor-analysis.ts](../scripts/examples/gemini-seo-competitor-analysis.ts)
- Line 46: Change task description
- Line 57: Change `startUrl: 'https://your-competitor.com'`

#### B. Local Pack Tracking
```bash
npm run gemini:local-pack
```

**What it does:**
- Searches keyword on Google Maps
- Captures top 3 local pack results
- Extracts business names, ratings, reviews
- Records addresses

**Customize:** Edit [scripts/examples/gemini-local-pack-tracking.ts](../scripts/examples/gemini-local-pack-tracking.ts)
- Line 33: Change `keyword = 'your keyword here'`
- Line 34: Change `location = 'Your City, State'`

#### C. AI Search Visibility
```bash
npm run gemini:ai-search
```

**What it does:**
- Queries Perplexity AI
- Checks if your domain is cited
- Extracts citation position and context
- Counts total citations

**Customize:** Edit [scripts/examples/gemini-ai-search-visibility.ts](../scripts/examples/gemini-ai-search-visibility.ts)
- Line 33: Change `targetDomain = 'your-domain.com'`
- Line 34: Change `searchQuery = 'your target query'`

---

## ✏️ Method 2: Customize Existing Scripts

### Step 1: Pick a Script to Modify

Let's customize the competitor analysis script:

```bash
# Open the file in your editor
code scripts/examples/gemini-seo-competitor-analysis.ts
```

### Step 2: Change the Target URL

Find this section (around line 44):

```typescript
const result = await service.executeTask({
  description: `
    Visit https://example.com (replace with competitor URL) and analyze:
    1. Extract all H1, H2, H3 headings
    2. Identify the main topic/focus of the homepage
    3. Count the number of service offerings mentioned
    4. Check if they have a blog or resources section
    5. Note any call-to-action buttons
  `,
  startUrl: 'https://example.com', // ← CHANGE THIS
  maxSteps: 10,
});
```

**Replace with your competitor:**

```typescript
const result = await service.executeTask({
  description: `
    Visit https://my-competitor.com and analyze:
    1. Extract all H1, H2, H3 headings
    2. Identify the main topic/focus of the homepage
    3. Count the number of service offerings mentioned
    4. Check if they have a blog or resources section
    5. Note any call-to-action buttons
  `,
  startUrl: 'https://my-competitor.com', // ← YOUR COMPETITOR
  maxSteps: 10,
});
```

### Step 3: Run Your Customized Script

```bash
npm run gemini:competitor
```

**Watch the magic happen:**
- Browser opens automatically
- AI navigates to your competitor's site
- Actions are logged in real-time
- Results displayed when complete

---

## 💡 Method 3: Write Your Own Automation

### Step 1: Use the Template

I've created a starter template for you:

```bash
# Edit the template
code scripts/my-seo-automation.ts
```

### Step 2: Customize the Task

Find the `CUSTOMIZE THIS SECTION` area:

```typescript
const result = await service.executeTask({
  description: `
    YOUR TASK HERE - Examples:

    - "Visit competitor.com and check if they have a blog"
    - "Search 'plumber Brisbane' on Google and tell me the top 3 results"
    - "Go to example.com and extract all their service page titles"
    - "Check if mysite.com loads correctly on mobile view"

    Replace this with your actual task!
  `,
  startUrl: 'https://example.com', // ← Change this URL
  maxSteps: 15,
});
```

**Replace with YOUR task:**

```typescript
const result = await service.executeTask({
  description: `
    Visit https://competitor.com/services and:
    1. List all service categories mentioned
    2. Check if they have pricing information visible
    3. Note any "Book Now" or "Get Quote" buttons
    4. Identify if they offer emergency services
  `,
  startUrl: 'https://competitor.com/services',
  maxSteps: 15,
});
```

### Step 3: Run Your Custom Automation

```bash
npx tsx scripts/my-seo-automation.ts
```

---

## 🎓 Understanding the Code

### Basic Structure

Every automation follows this pattern:

```typescript
import { GeminiComputerUseService, getGeminiApiKey } from '../services/api/gemini-computer-use';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function myTask() {
  // 1. Initialize the service
  const service = new GeminiComputerUseService({
    apiKey: getGeminiApiKey(),
    headless: false, // Show browser (true to hide)
  });

  try {
    // 2. Start the browser
    await service.initialize();

    // 3. Execute your task
    const result = await service.executeTask({
      description: 'What you want the AI to do',
      startUrl: 'Where to start',
      maxSteps: 15, // How many actions max
    });

    // 4. Handle results
    if (result.success) {
      console.log('Success!', result.steps);
    } else {
      console.log('Failed:', result.error);
    }

    // 5. Clean up
    await service.cleanup();
  } catch (error) {
    await service.cleanup();
  }
}

myTask();
```

### Key Parameters

**`description`** - Tell the AI what to do:
```typescript
description: `
  Visit example.com and:
  1. Extract the main heading
  2. Count how many images are on the page
  3. Check if there's a contact form
`
```

**`startUrl`** - Where to begin:
```typescript
startUrl: 'https://example.com'
```

**`maxSteps`** - Limit actions (prevents infinite loops):
```typescript
maxSteps: 15 // Typically 10-20 is good
```

**`headless`** - Show/hide browser:
```typescript
headless: false // false = show browser (good for debugging)
headless: true  // true = hide browser (faster, production)
```

---

## 📋 Common Use Cases with Code Examples

### 1. Check Competitor's Blog

```typescript
const result = await service.executeTask({
  description: `
    Visit https://competitor.com and check:
    1. Do they have a blog or resources section?
    2. If yes, how many recent articles are visible?
    3. What topics are they covering?
  `,
  startUrl: 'https://competitor.com',
  maxSteps: 10,
});
```

### 2. Extract Service Offerings

```typescript
const result = await service.executeTask({
  description: `
    Visit https://competitor.com/services and:
    1. List all service categories
    2. Note if pricing is visible
    3. Check for emergency/24-7 services
    4. Identify service area coverage
  `,
  startUrl: 'https://competitor.com/services',
  maxSteps: 12,
});
```

### 3. Google Maps Ranking Check

```typescript
const result = await service.executeTask({
  description: `
    Search "plumber Brisbane" on Google Maps and:
    1. Capture the top 3 businesses in the local pack
    2. Extract business names and star ratings
    3. Note number of reviews for each
  `,
  startUrl: 'https://www.google.com/maps',
  maxSteps: 15,
});
```

### 4. Mobile Responsiveness Test

```typescript
const result = await service.executeTask({
  description: `
    Visit https://mysite.com and check:
    1. Does the homepage load correctly?
    2. Is the navigation menu accessible?
    3. Are images properly sized for mobile?
    4. Is text readable without zooming?
  `,
  startUrl: 'https://mysite.com',
  maxSteps: 8,
});
```

### 5. AI Search Citation Check

```typescript
const result = await service.executeTask({
  description: `
    Query "best SEO tools" on Perplexity.ai and:
    1. Check if example.com is cited in the response
    2. If yes, note the citation number (#1, #2, etc.)
    3. Extract the context around the citation
  `,
  startUrl: 'https://www.perplexity.ai',
  maxSteps: 12,
});
```

---

## 🛡️ Security Notes

### Payment Blocking is ALWAYS Active

The system will BLOCK any task that involves:
- ❌ Payment pages (checkout, cart, billing)
- ❌ Credit card forms
- ❌ Purchase buttons
- ❌ Payment keywords

**Example blocked action:**
```
🚨 PAYMENT BLOCKED: URL contains payment-related domain: checkout
```

**This is GOOD** - it means your safety system is working!

### Safe vs. Unsafe Tasks

✅ **SAFE - These work perfectly:**
- Viewing public web pages
- Searching on Google/Google Maps
- Reading blog posts
- Extracting visible text and headings
- Checking page layouts
- Analyzing competitor content

❌ **BLOCKED - These will be stopped:**
- Accessing /checkout URLs
- Filling out credit card forms
- Clicking "Buy Now" buttons
- Entering payment information

---

## 🐛 Troubleshooting

### "Task failed" or "No more actions needed"

**This is normal!** Sometimes the AI completes quickly:

```
⚠️ Task failed (this may be normal for a simple observation task)
```

**What to do:**
1. Check the steps - did it accomplish what you asked?
2. Make the task more specific
3. Increase `maxSteps` if needed

### Browser doesn't open

**Install Playwright browsers:**
```bash
npx playwright install
```

### "API Key not found"

**Check your `.env.local`:**
```bash
cat .env.local | grep GEMINI_KEY
```

Should show:
```
GEMINI_KEY=AIza...
```

### Task is blocked incorrectly

**Review the blocked URL/content:**
```
🚨 Blocked: PAYMENT BLOCKED: Page contains payment keyword: "$"
```

**Solution:** Adjust blocked keywords if it's a false positive. Edit [services/api/gemini-computer-use.ts](../services/api/gemini-computer-use.ts#L50)

---

## 🎯 Quick Reference

### Commands

| Command | What it does |
|---------|--------------|
| `npm run gemini:test` | Verify setup |
| `npm run gemini:competitor` | Analyze competitor |
| `npm run gemini:local-pack` | Track local rankings |
| `npm run gemini:ai-search` | Check AI citations |
| `npx tsx scripts/my-seo-automation.ts` | Run your custom script |

### File Locations

| File | Purpose |
|------|---------|
| `scripts/my-seo-automation.ts` | Your custom automation template |
| `scripts/examples/` | Pre-built example scripts |
| `services/api/gemini-computer-use.ts` | Main service (don't edit unless you know what you're doing) |
| `.env.local` | Your API key configuration |

### Configuration Options

```typescript
const service = new GeminiComputerUseService({
  apiKey: getGeminiApiKey(),     // Auto-detects from env
  headless: false,               // true = hide browser
  timeout: 30000,                // 30 seconds per request
  allowPayments: false,          // HARDCODED - can't be changed
});
```

---

## 📚 Next Steps

1. ✅ **Start simple:** Run `npm run gemini:competitor`
2. ✏️ **Customize:** Edit the example scripts
3. 💡 **Create your own:** Use `scripts/my-seo-automation.ts`
4. 🚀 **Integrate:** Add to your Next.js API routes

### Want to learn more?

- 📖 [Quick Start Guide](GEMINI_COMPUTER_USE_QUICKSTART.md)
- 🔒 [Security Details](security/NO_PAYMENTS_SECURITY.md)
- 📊 [Research Summary](research/GEMINI_2.5_COMPUTER_USE_RESEARCH.md)

---

## ✅ Summary

**You can now:**
1. Run pre-built SEO automation scripts
2. Customize them for your competitors
3. Write your own custom automations
4. All with zero payment risk (blocking is active)

**Start with:**
```bash
npm run gemini:test        # Verify it works
npm run gemini:competitor  # Try your first automation
```

**Happy automating!** 🚀
