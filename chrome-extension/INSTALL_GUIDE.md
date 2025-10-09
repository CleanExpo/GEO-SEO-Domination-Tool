# 🚀 GEO SEO AI Assistant - Chrome Extension Installation Guide

## Quick Installation (5 minutes)

### Step 1: Prepare the Extension Files

The extension is located in the `chrome-extension/` directory:

```
chrome-extension/
├── manifest.json
├── popup.html
├── popup.js
├── styles.css
├── background.js
├── content.js
└── icons/ (create this folder)
```

### Step 2: Create Icon Placeholders

Since we don't have custom icons yet, create placeholder icons:

1. Create the `icons` folder inside `chrome-extension/`:
   ```bash
   mkdir chrome-extension/icons
   ```

2. Download free icon or create placeholders at these sizes:
   - icon16.png (16x16)
   - icon32.png (32x32)
   - icon48.png (48x48)
   - icon128.png (128x128)

**Quick Option:** Use any 128x128 image and Chrome will resize it automatically. Just name it `icon128.png` and put copies as icon16.png, icon32.png, icon48.png.

### Step 3: Load Extension in Chrome

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or: Menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" switch in the top right corner

3. **Load Unpacked Extension**
   - Click "Load unpacked" button
   - Navigate to your `d:/GEO_SEO_Domination-Tool/chrome-extension/` folder
   - Click "Select Folder"

4. **Verify Installation**
   - You should see "GEO SEO AI Assistant" in the extensions list
   - The extension icon should appear in your Chrome toolbar

### Step 4: Start Your Backend Server

The extension needs your Next.js backend running:

```bash
# In your project root
npm run dev
```

The backend should be running on `http://localhost:3000`

### Step 5: Configure Extension

1. Click the extension icon in Chrome toolbar
2. Click the "Settings" button (⚙️)
3. Verify Backend URL is set to: `http://localhost:3000`
4. Enable notifications (recommended)
5. Click "Save Settings"

### Step 6: Test It Works!

1. Visit any website (e.g., https://example.com)
2. Click the extension icon
3. Click "Analyze This Page" button
4. Watch the AI analyze the page!

---

## ✨ How to Use

### Method 1: Extension Popup

1. **Click the extension icon** in Chrome toolbar
2. Type your instruction (e.g., "Analyze this page's SEO")
3. Click "Execute Task"
4. Wait for completion notification
5. View results

### Method 2: Right-Click Context Menu

Right-click anywhere on a webpage to access:
- **"Analyze Page with AI"** - Full SEO analysis
- **"Analyze Selected Text"** - (Select text first) Analyze specific content
- **"Analyze This Link"** - (Right-click a link) Compare linked page

### Method 3: Quick Action Buttons

In the extension popup:
- **"Analyze This Page"** - Pre-filled SEO analysis command
- **"Extract Data"** - Extract headings, links, images, metadata

---

## 🎯 Example Tasks

Try these instructions:

### SEO Analysis
```
Analyze this page's SEO and provide 5 specific improvement suggestions
```

### Competitor Research
```
Analyze this competitor's pricing page and extract:
1. All pricing tiers
2. Features for each tier
3. Comparison points we can use
```

### Content Extraction
```
Extract all H2 and H3 headings from this page and suggest
3 additional blog topics based on the content
```

### Link Building
```
Find all external links on this page and identify:
1. Which are dofollow
2. Which have high domain authority
3. Link building opportunities
```

### Technical SEO
```
Analyze this page for technical SEO issues:
1. Meta tags
2. Heading structure
3. Image alt texts
4. Internal linking
```

---

## 🔧 Troubleshooting

### Extension Won't Load

**Problem:** Chrome shows error when loading unpacked
**Solution:**
1. Check all files are present in chrome-extension/ folder
2. Make sure icon files exist (create placeholders if needed)
3. Verify manifest.json has no syntax errors

### "Backend Offline" Status

**Problem:** Extension shows "Offline" status
**Solution:**
1. Start your Next.js backend: `npm run dev`
2. Verify it's running on http://localhost:3000
3. Check Settings → Backend URL is correct
4. Test backend: Visit http://localhost:3000/api/health

### Tasks Not Completing

**Problem:** Task starts but never completes
**Solution:**
1. Check backend console for errors
2. Verify Gemini API key is set in `.env.local`
3. Check if Playwright browsers are installed: `npx playwright install`
4. Look at browser console (F12) for JavaScript errors

### No Notifications

**Problem:** Don't see completion notifications
**Solution:**
1. Grant Chrome notification permissions
2. Check extension Settings → Enable notifications
3. Check Chrome notification settings (chrome://settings/content/notifications)

### Right-Click Menu Not Showing

**Problem:** Context menu items don't appear
**Solution:**
1. Reload the extension (chrome://extensions → Reload button)
2. Refresh the web page you're on
3. Check background.js loaded correctly

---

## 🚀 Production Deployment

### For Production Use

1. **Update Backend URL**
   - Extension Settings → Backend URL
   - Change from `http://localhost:3000` to your production URL
   - Example: `https://your-domain.com`

2. **Package Extension**
   ```bash
   # Create a zip file of the extension
   cd chrome-extension
   zip -r geo-seo-assistant.zip . -x "*.md" -x ".*"
   ```

3. **Publish to Chrome Web Store** (Optional)
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Pay one-time $5 developer fee
   - Upload geo-seo-assistant.zip
   - Fill in store listing details
   - Submit for review

### For Team Use

1. **Share Extension Folder**
   - Zip the `chrome-extension/` folder
   - Share with team members
   - They follow the same "Load Unpacked" steps

2. **Update Backend URL**
   - All team members set Backend URL to shared server
   - Example: company internal server or cloud deployment

---

## 📊 Advanced Features

### Auto-Analyze on Page Load

1. Extension Settings → Enable "Auto-analyze pages on load"
2. Every page you visit will be automatically analyzed
3. Results saved to history

### Keyboard Shortcuts

- **Ctrl+Enter** in textarea: Execute task immediately
- **Click extension icon**: Opens popup quickly

### Task History

- Last 10 tasks automatically saved
- Click any history item to view results
- Synced across browser sessions

---

## 🎨 Customization

### Change Extension Icon

Replace files in `chrome-extension/icons/`:
- Use your own branding
- Recommended: Purple/blue gradient matching the UI
- Sizes: 16x16, 32x32, 48x48, 128x128 PNG files

### Modify Quick Actions

Edit `chrome-extension/popup.js`:

```javascript
// Around line 95-100
async function analyzeCurrentPage() {
  const instruction = `YOUR CUSTOM INSTRUCTION HERE`;
  // ...
}
```

### Add Custom Context Menu Items

Edit `chrome-extension/background.js`:

```javascript
// Around line 20
chrome.contextMenus.create({
  id: 'your-custom-action',
  title: 'Your Custom Action',
  contexts: ['page']
});
```

---

## ✅ Verification Checklist

Before using, verify:

- [ ] Extension loaded in Chrome (chrome://extensions)
- [ ] All files present (manifest.json, popup.html, etc.)
- [ ] Icon files created (even if placeholders)
- [ ] Backend server running (`npm run dev`)
- [ ] Backend accessible at http://localhost:3000
- [ ] Gemini API key configured in `.env.local`
- [ ] Playwright browsers installed
- [ ] Extension settings configured
- [ ] Test task completes successfully

---

## 🆘 Getting Help

If you encounter issues:

1. **Check Console Logs**
   - Extension popup → Right-click → Inspect
   - Look for JavaScript errors

2. **Check Background Script**
   - chrome://extensions → Background page (inspect views)
   - See background script errors

3. **Check Backend Logs**
   - Terminal running `npm run dev`
   - Look for API errors

4. **Test Gemini API**
   ```bash
   npm run gemini:test
   ```

---

## 🎉 You're Ready!

Your AI Assistant is now installed and ready to help with:
- ✅ SEO analysis on any webpage
- ✅ Competitor research
- ✅ Content extraction
- ✅ Link analysis
- ✅ Technical audits
- ✅ And anything else you can think of!

**Start by right-clicking any webpage and selecting "Analyze Page with AI"!**
