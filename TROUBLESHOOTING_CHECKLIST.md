# Troubleshooting Checklist - ALWAYS CHECK THESE FIRST

## ⚠️ CRITICAL: Before Spending Hours Debugging

**STOP AND TEST THE ACTUAL ENDPOINT FIRST!**

### 1. Test the Backend API Directly (5 minutes)

```bash
# Run this FIRST before investigating any "save not working" issues:
node scripts/test-onboarding-api.js
```

**Expected Output:**
- ✅ Status Code: 200
- ✅ Response: `{"success":true,"message":"Progress saved successfully"}`

**If you get 200 OK with success:true** → **THE BACKEND IS WORKING!**
- The issue is on the FRONTEND (React/Next.js)
- Check browser console for errors
- Check network tab in DevTools
- Don't waste time debugging the backend database!

### 2. Check if Issue is Frontend or Backend

| Symptom | Likely Location | Next Step |
|---------|----------------|-----------|
| Direct API test works (200 OK) | **Frontend** | Check browser console, network tab |
| Direct API test fails (500/400) | **Backend** | Check API route, database connection |
| Form doesn't call API at all | **Frontend** | Check form submit handler, event binding |
| API called but generic error shown | **Frontend** | Check error handling code, remove fallbacks |

### 3. Common Pitfalls (Don't Fall For These!)

#### ❌ WRONG: "User says save doesn't work" → Immediately debug backend
#### ✅ RIGHT: "User says save doesn't work" → Test API endpoint directly first

#### ❌ WRONG: Make 15+ deployments trying different fixes
#### ✅ RIGHT: Test locally, verify the actual issue, then deploy once

#### ❌ WRONG: Assume error messages are accurate
#### ✅ RIGHT: Test the endpoint directly to confirm if it's really broken

## 🔍 Investigation Priority Order

### For "Save Not Working" Issues:

1. **Test API endpoint directly** (2 min)
   ```bash
   node scripts/test-onboarding-api.js
   ```

2. **Check browser console** (2 min)
   - Open DevTools (F12)
   - Look for red errors
   - Check if API is even being called

3. **Check network tab** (2 min)
   - Is the request being sent?
   - What's the actual response?
   - Check status code and response body

4. **Only THEN debug backend** (if API test fails)
   - Check database connection
   - Check SQL queries
   - Check environment variables

## 📋 Quick Tests Available

### Backend Tests
```bash
# Test onboarding save API
node scripts/test-onboarding-api.js

# Test database connection directly
node scripts/test-db-direct.js

# Test database configuration
curl https://geo-seo-domination-tool.vercel.app/api/debug/db-config
```

### Frontend Tests
1. Open: https://geo-seo-domination-tool.vercel.app/onboarding/new
2. Open DevTools (F12) → Console tab
3. Fill in Business Name and Email
4. Click "Save"
5. Watch for:
   - Toast notification (top right)
   - Console errors (red text)
   - Network requests (Network tab)

## 🚨 Red Flags That Should Stop You

If you encounter these, STOP and reassess:

1. **"Let me try one more deployment fix..."** (after 3+ attempts)
   → You're guessing. Test locally first.

2. **"The error message says X is broken"** (but haven't verified)
   → Error messages lie. Test the actual component.

3. **"Let me debug the database queries"** (before testing API)
   → Test if API even works first!

4. **"Maybe it's a caching issue"** (without evidence)
   → Test with cache busting or incognito mode first.

5. **"Let me add more debug logging"** (without analyzing existing logs)
   → Read existing logs first, then add targeted logging.

## 📝 Debugging Notes Template

Use this template when investigating issues:

```markdown
## Issue: [Brief description]

### 1. Initial Report
- User reported: [exact words]
- Observed behavior: [what you see]
- Expected behavior: [what should happen]

### 2. Quick Tests (5 min)
- [ ] Backend API test: `node scripts/test-onboarding-api.js`
  - Result: [200 OK / 500 Error / etc]
  - Response: [paste response]

- [ ] Browser console check:
  - Errors: [list any errors]
  - Network calls: [API called? Status?]

- [ ] Direct endpoint test:
  - URL: [endpoint URL]
  - Result: [working / failing]

### 3. Root Cause
Based on tests above:
- Location: [Frontend / Backend / Database / Network]
- Actual issue: [what's really broken]
- Why it looked different: [why initial report was misleading]

### 4. Fix Applied
- File: [file changed]
- Change: [what was fixed]
- Commit: [commit hash]
```

## 🎯 Specific Case: "Save Not Working"

**Timeline of Today's Issue (2025-10-09):**

1. ❌ **Mistake:** Assumed save was broken because user reported it
2. ❌ **Mistake:** Immediately started scraping page to "find the problem"
3. ❌ **Mistake:** Analyzed HTML looking for form issues
4. ⚠️ **Should have done:** Run `node scripts/test-onboarding-api.js` FIRST
5. ✅ **Would have found:** API returns 200 OK immediately (backend works!)
6. ✅ **Would have saved:** 1+ hours of unnecessary debugging

**Actual Issue:**
- Backend API: ✅ Working perfectly
- Database: ✅ Fixed earlier in the day (lib/db.js placeholder conversion)
- Frontend: ✅ Actually working fine (showed "Progress Saved!" toast)
- Problem: ❌ None - save was already working!

## 🔄 Learning Process Integration

### Where to Record Lessons

1. **Update this file** when you discover a new pitfall
2. **Add test scripts** to `scripts/` directory for common checks
3. **Update CLAUDE.md** with new debugging patterns
4. **Create Quick Reference** in project root if needed

### Auto-Check Reminders

Before starting any "fix", run:
```bash
# Create a pre-debug checklist script
node scripts/pre-debug-check.js [issue-type]
```

This should:
1. Run relevant test scripts
2. Show last successful test results
3. Remind you to check obvious things first
4. Prevent premature debugging

## 💡 Key Principle

> **"Test, Don't Guess"**
>
> - Spend 5 minutes testing to save 5 hours debugging
> - Trust test results, not error messages
> - Verify the problem exists before fixing it
> - One targeted test beats 10 deployment attempts

## 📚 Related Documentation

- [PRODUCTION_FIX_COMPLETE_2025-10-09.md](PRODUCTION_FIX_COMPLETE_2025-10-09.md) - Backend was fixed here
- [scripts/test-onboarding-api.js](scripts/test-onboarding-api.js) - Always run this first
- [scripts/analyze-onboarding-page.mjs](scripts/analyze-onboarding-page.mjs) - Frontend analysis tool

---

**Created:** 2025-10-09 23:50 AEST
**Reason:** Wasted full day debugging "save not working" when save was already working
**Lesson:** ALWAYS TEST THE ENDPOINT DIRECTLY FIRST before assuming something is broken
