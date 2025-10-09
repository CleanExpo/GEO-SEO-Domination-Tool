# Load Button Debugging Guide

**Issue:** Load button in Business Info section may not be populating form fields with saved data.

**Status:** Backend API is working correctly ✅. Added frontend debugging logs.

## Backend Verification (Already Done)

✅ `/api/onboarding/save` GET endpoint is working
✅ Database has saved records
✅ Data structure is correct (flat `ClientIntakeData` format)

**Test Results:**
```bash
$ node scripts/test-load-disaster-recovery.mjs

✅ Load endpoint is working
✅ Found saved data
   Current Step: 0
   Last Saved: 2025-10-09T23:30:04.221Z

📋 Form Data Structure:
   businessName: Disaster Recovery
   contactName: Phill McGurk
   email: phill@disasterrecovery.com.au
   phone: +61457123005
   industry: Trade Services
   address: 145 Whitehill Road Eastern Heights. Qld
```

## Frontend Debugging (Just Added)

I've added extensive console logging to [components/onboarding/ClientIntakeForm.tsx:171-228](components/onboarding/ClientIntakeForm.tsx#L171-L228).

### How to Test

1. **Deploy the changes** to production:
   ```bash
   git add components/onboarding/ClientIntakeForm.tsx
   git commit -m "debug: Add comprehensive logging to Load button functionality"
   git push
   ```

2. **Open the onboarding page** in production:
   - Go to: https://geo-seo-domination-tool.vercel.app/onboarding/new
   - Open browser console (F12)

3. **Click the "Load" button**

4. **Enter your credentials** when prompted:
   - Business Name: `Disaster Recovery ` (with trailing space!)
   - Email: `phill@disasterrecovery.com.au`

5. **Watch the console logs**. You should see:
   ```
   [Load] Attempting to load: { businessName: 'Disaster Recovery ', email: 'phill@disasterrecovery.com.au' }
   [Load] Fetching: /api/onboarding/save?businessName=...
   [Load] Response status: 200
   [Load] Response data: { found: true, formData: {...}, currentStep: 0, lastSaved: '...' }
   [Load] Data found! Setting form data: { businessName: 'Disaster Recovery ', ... }
   [Load] Current step: 0
   [Load] State updated successfully
   [Load] Finished
   ```

6. **Check the form fields** - they should now be populated with:
   - Business Name: "Disaster Recovery "
   - Industry: "Trade Services"
   - Contact Name: "Phill McGurk"
   - Email: "phill@disasterrecovery.com.au"
   - Phone: "+61457123005"
   - Address: "145 Whitehill Road Eastern Heights. Qld"

## Expected Behavior

✅ **When Load succeeds:**
- Toast notification: "Progress Loaded! Resumed from step 1 of 5. Business: Disaster Recovery "
- All form fields populated with saved data
- Console shows successful state update

❌ **If Load fails:**
- Toast shows specific error message
- Console logs the error details
- Form fields remain unchanged

## Possible Issues & Solutions

### Issue 1: "No Saved Progress" message

**Symptom:** Toast shows "No saved data found"

**Cause:** Business name or email doesn't match exactly (case-sensitive, whitespace matters)

**Solution:**
- Check exact spelling in database: `node scripts/check-saved-onboarding-table.mjs`
- Note the trailing space in "Disaster Recovery "

### Issue 2: Form fields not populating

**Symptom:** Toast says "Progress Loaded" but fields are empty

**Causes:**
1. React state not updating (check console for state update log)
2. Old data format with nested `{step1: {...}}` structure

**Solution:**
- Check console logs - should see "[Load] State updated successfully"
- Check response data structure in console - should be flat object, not nested

### Issue 3: Network error

**Symptom:** "Load Failed" with fetch error

**Cause:** API endpoint not accessible

**Solution:** Check `/api/onboarding/save` endpoint is deployed

## Database Records

Current saved records in production:

| ID | Business Name | Email | Current Step | Last Saved |
|----|---------------|-------|--------------|------------|
| 3 | Disaster Recovery | phill@disasterrecovery.com.au | 0 | 2025-10-10 09:30:04 |
| 6 | Pre-Debug Check | check@example.com | 0 | 2025-10-10 09:03:34 |
| 5 | Browser Scrape Test | scrape@example.com | 1 | 2025-10-10 07:41:36 |
| 2 | Test Business | test@example.com | 1 | 2025-10-10 07:26:00 |
| 1 | REAL FIX TEST | realfix@test.com | 1 | 2025-10-10 07:25:40 |

**Note:** Records 2, 5, and 1 have OLD data format (`{step1: {...}}`) and won't load correctly. Use Record 3 (Disaster Recovery) for testing.

## Next Steps After Testing

**If Load is working:**
1. Remove the debug console.log statements (optional - they're harmless)
2. Consider cleaning up old test records from database

**If Load is still not working:**
1. Share the console logs from browser
2. Check if React state is actually updating
3. Verify form inputs are properly bound to `formData` state

## Quick Test Script

To verify backend without browser:
```bash
node scripts/test-load-disaster-recovery.mjs
```

Expected output: ✅ Load endpoint is working with all field data shown.

---

**Files Modified:**
- `components/onboarding/ClientIntakeForm.tsx` - Added debug logging to loadSavedProgress()

**Related:**
- [TROUBLESHOOTING_CHECKLIST.md](TROUBLESHOOTING_CHECKLIST.md) - General debugging workflow
- [app/api/onboarding/save/route.ts](app/api/onboarding/save/route.ts) - Backend API handler
