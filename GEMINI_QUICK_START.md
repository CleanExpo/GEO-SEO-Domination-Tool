# 🚀 Gemini Computer Use - Quick Start Guide

## ✅ Setup Complete!

Your Gemini Computer Use integration is **fully configured and ready to use**!

---

## 📋 Available Commands

### Test Your Setup
```bash
npm run gemini:test
```
Verifies API key, browser, and security settings.

### Pre-Built Examples

#### 1. Competitor Analysis
```bash
npm run gemini:competitor
```
**What it does:**
- Opens competitor website
- Extracts H1, H2, H3 headings
- Identifies main topics
- Checks for blog/resources
- Notes call-to-action buttons

**Customize:** Edit `scripts/examples/gemini-seo-competitor-analysis.ts`
- Line 57: Change `startUrl: 'https://your-competitor.com'`

#### 2. Local Pack Tracking
```bash
npm run gemini:local-pack
```
**What it does:**
- Searches keyword on Google Maps
- Captures top 3 local pack results
- Extracts business names, ratings, reviews

**Customize:** Edit `scripts/examples/gemini-local-pack-tracking.ts`
- Line 33: Change keyword
- Line 34: Change location

#### 3. AI Search Visibility
```bash
npm run gemini:ai-search
```
**What it does:**
- Queries Perplexity AI
- Checks if your domain is cited
- Extracts citation position

**Customize:** Edit `scripts/examples/gemini-ai-search-visibility.ts`
- Line 33: Change target domain
- Line 34: Change search query

#### 4. Your Custom Automation
```bash
npm run gemini:custom
```
**What it does:**
- Runs your custom SEO automation
- Template ready at `scripts/my-seo-automation.ts`

---

## 🎯 How to Customize

### Quick Customization (Existing Scripts)

1. **Pick a script to modify:**
   ```bash
   code scripts/examples/gemini-seo-competitor-analysis.ts
   ```

2. **Change the task description (line 46-57):**
   ```typescript
   const result = await service.executeTask({
     description: `
       Visit https://YOUR-COMPETITOR.com and analyze:
       1. Extract all H1, H2, H3 headings
       2. Identify the main topic/focus
       3. Count service offerings
       4. Check for blog or resources
       5. Note any call-to-action buttons
     `,
     startUrl: 'https://YOUR-COMPETITOR.com',
     maxSteps: 10,
   });
   ```

3. **Run it:**
   ```bash
   npm run gemini:competitor
   ```

### Create New Automation

1. **Edit the template:**
   ```bash
   code scripts/my-seo-automation.ts
   ```

2. **Customize the task (lines 29-44):**
   ```typescript
   const result = await service.executeTask({
     description: `
       YOUR TASK HERE - Examples:
       - "Visit competitor.com and check if they have a blog"
       - "Search 'plumber Brisbane' and get top 3 results"
       - "Go to example.com and extract service page titles"
     `,
     startUrl: 'https://example.com',
     maxSteps: 15,
   });
   ```

3. **Run it:**
   ```bash
   npm run gemini:custom
   ```

---

## 🔒 Security Features

✅ **Payment Blocking ALWAYS Active:**
- Blocks checkout/payment URLs
- Blocks credit card forms
- Blocks "Buy Now" buttons
- Cannot be disabled

⚠️ **Note:** The system may sometimes be overly cautious (like blocking Google homepage due to "$" symbol). This is intentional for safety.

---

## 🎓 What You'll See When Running

```
🚀 Starting task...
🔒 SECURITY: Payment blocking ACTIVE

🌐 Navigating to: https://example.com

--- Step 1/15 ---
🔧 Action: click_at {x: 500, y: 300}

--- Step 2/15 ---
🔧 Action: scroll_document {direction: down}

✅ Task completed successfully!
```

**Browser Window:** Opens automatically so you can watch the AI work!

---

## 💡 Common Use Cases

### Check Competitor's Blog
```typescript
description: `
  Visit https://competitor.com and check:
  1. Do they have a blog or resources section?
  2. If yes, how many recent articles?
  3. What topics are they covering?
`
```

### Extract Service Offerings
```typescript
description: `
  Visit https://competitor.com/services and:
  1. List all service categories
  2. Note if pricing is visible
  3. Check for emergency/24-7 services
`
```

### Google Maps Ranking
```typescript
description: `
  Search "plumber Brisbane" on Google Maps and:
  1. Capture top 3 businesses in local pack
  2. Extract business names and ratings
  3. Note number of reviews
`
```

### Mobile Responsiveness
```typescript
description: `
  Visit https://mysite.com and check:
  1. Does homepage load correctly?
  2. Is navigation menu accessible?
  3. Are images properly sized?
`
```

---

## 🐛 Troubleshooting

### "Task failed" or "No more actions needed"
✅ **This is normal!** Check the steps - did it accomplish what you asked?
- Make task more specific
- Increase `maxSteps` if needed

### Browser doesn't open
```bash
npx playwright install
```

### "API Key not found"
Check your `.env.local`:
```bash
cat .env.local | grep GEMINI_KEY
```

### Task blocked incorrectly
Review the blocked URL/content. If it's a false positive, you can adjust blocked keywords in `services/api/gemini-computer-use.ts` (line 50).

---

## 📚 Documentation

- **Full Guide:** `docs/HOW_TO_USE_GEMINI_COMPUTER_USE.md`
- **Security Details:** `docs/security/NO_PAYMENTS_SECURITY.md`
- **Quick Start:** You're reading it! 🎉

---

## ✨ You're All Set!

**Start with:**
```bash
npm run gemini:test          # Verify everything works
npm run gemini:competitor    # Try your first automation
```

**Happy automating!** 🚀
