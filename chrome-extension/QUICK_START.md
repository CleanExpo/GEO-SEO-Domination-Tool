# 🚀 Quick Start - Get Extension Working in 5 Minutes

## Problem: Extension Not Working?

Follow these steps **in order**:

## Step 1: Create Icon Files (REQUIRED)

**Without icons, Chrome won't load the extension!**

### Option A: Automatic (Recommended)
1. Open `chrome-extension/icons/create-icons.html` in your browser
2. It will auto-download 4 icon files
3. Move them from Downloads to `chrome-extension/icons/` folder

### Option B: Manual
Download any image and save 4 copies:
```bash
cd chrome-extension/icons
# Save any image as icon128.png, then:
copy icon128.png icon16.png
copy icon128.png icon32.png  
copy icon128.png icon48.png
```

**Verify**: You should have these 4 files:
- chrome-extension/icons/icon16.png ✓
- chrome-extension/icons/icon32.png ✓
- chrome-extension/icons/icon48.png ✓
- chrome-extension/icons/icon128.png ✓

## Step 2: Start Backend Server

```bash
# In project root (d:/GEO_SEO_Domination-Tool)
npm run dev
```

**Wait for**: "Ready on http://localhost:3000"

**Test backend works**:
- Open browser: http://localhost:3000/api/health
- Should see: `{"status":"ok",...}`

## Step 3: Load Extension in Chrome

1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select folder: `d:/GEO_SEO_Domination-Tool/chrome-extension`
5. Click "Select Folder"

**Check for errors**: If you see red error text, read the error message!

## Step 4: Verify Extension Loaded

✓ Extension appears in list as "GEO SEO AI Assistant"
✓ No red error messages
✓ Extension icon appears in Chrome toolbar (top right)

## Step 5: Test Basic Functionality

1. Click extension icon in toolbar
2. Look at the status indicator (top right)
   - **Green dot = Ready** ✓ Good!
   - **Red dot = Offline** ✗ Backend not running

If RED:
- Go back to Step 2
- Make sure `npm run dev` is running
- Check http://localhost:3000/api/health works

## Step 6: Run Test Task

1. Visit any website (e.g., https://example.com)
2. Click extension icon
3. Click "Analyze This Page" button
4. Watch for:
   - "Running..." status appears
   - Progress updates
   - Notification when complete

## Common Issues & Fixes

### "Failed to load extension"
**Cause**: Missing icon files
**Fix**: Complete Step 1 above, then click "Reload" in chrome://extensions

### Status shows "Offline"
**Cause**: Backend not running
**Fix**: 
```bash
npm run dev
```
Wait for "Ready on http://localhost:3000"

### "Failed to start task"
**Cause 1**: Backend not responding
**Fix**: Check http://localhost:3000/api/health in browser

**Cause 2**: Gemini API key not set
**Fix**: Check `.env.local` has GEMINI_KEY or GOOGLE_API_KEY

### Tasks start but never complete
**Cause**: Playwright browsers not installed
**Fix**:
```bash
npx playwright install
```

### Extension icon doesn't appear
**Cause**: Extension not pinned
**Fix**: Click puzzle icon in Chrome toolbar → Pin "GEO SEO AI Assistant"

## Debug Checklist

Run through this checklist:

- [ ] Icons folder has 4 PNG files (16, 32, 48, 128)
- [ ] Backend running: `npm run dev` 
- [ ] Backend responds: http://localhost:3000/api/health shows "ok"
- [ ] Extension loaded in chrome://extensions
- [ ] No red errors in extension list
- [ ] Developer mode is ON
- [ ] Extension icon visible in toolbar
- [ ] Clicking icon shows popup with purple gradient
- [ ] Status dot is GREEN (not red)
- [ ] Gemini API key in .env.local
- [ ] Playwright installed: `npx playwright install`

## Still Not Working?

### Check Browser Console
1. Click extension icon
2. Right-click on popup → "Inspect"
3. Look at Console tab for errors
4. Share the error messages

### Check Background Script
1. Go to chrome://extensions
2. Find "GEO SEO AI Assistant"
3. Click "service worker" link
4. Look for errors in console

### Check Backend Logs
Look at terminal running `npm run dev` for errors

## Quick Test Commands

```bash
# Test backend health
curl http://localhost:3000/api/health

# Test Gemini setup
npm run gemini:test

# Reinstall Playwright
npx playwright install --force
```

## Success! What Now?

Once working, try these:

1. **Right-click any webpage** → "Analyze Page with AI"
2. **Type custom command**: "Extract all headings from this page"
3. **Check history**: Recent tasks show in popup

## Need More Help?

See full guide: `INSTALL_GUIDE.md`

Check:
- Extension files are all present
- Backend is running and responding  
- Icon files exist
- No JavaScript errors in console
