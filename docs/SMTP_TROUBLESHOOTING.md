# SMTP Troubleshooting - Still Getting "Error sending confirmation email"

**Status**: Configuration completed but signup still failing
**Error**: 500 from Supabase - "Error sending confirmation email"

---

## Quick Diagnostic Checklist

Please verify these settings in Supabase:

### 1. Check SMTP Settings

Go to: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/auth/settings

Scroll to **"SMTP Settings"** and verify:

```
✅ Enable Custom SMTP: Should be toggled ON (blue)

SMTP Host: smtp.sendgrid.net
           (exactly as shown, no http://, no trailing slash)

SMTP Port: 587
           (must be 587, NOT 465 or 25)

SMTP User: apikey
           (literally the word "apikey", NOT your actual key)

SMTP Password: SG.xxxxxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyy
               (your actual SendGrid API key, starts with "SG.")
               (no quotes, no extra spaces)

Sender Email: [your verified email from SendGrid]
              (must EXACTLY match the verified sender in SendGrid)
              (check capitalization, no typos)

Sender Name: GEO-SEO Domination Tool
             (or any name you prefer)
```

### 2. Verify SendGrid Sender

Go to: https://app.sendgrid.com/settings/sender_auth

Check:
- [ ] You see at least one sender listed
- [ ] Status shows **"Verified"** with green checkmark ✅
- [ ] The email address EXACTLY matches what you entered in Supabase

**If NOT verified**:
1. Click "Resend verification email"
2. Check your inbox for verification link
3. Click the link
4. Wait for "Verified" status
5. Then update Supabase SMTP settings

### 3. Check SendGrid API Key Permissions

Go to: https://app.sendgrid.com/settings/api_keys

Find your key ("GEO-SEO Tool" or similar):
- [ ] Click the three dots (...) next to the key
- [ ] Click "Edit API Key"
- [ ] Under "Mail Send", verify it's **enabled** ✅
- [ ] Click "Update"

**If you can't edit it** (or forgot to save the key):
1. Delete the old key
2. Create a new one with these settings:
   - Name: `GEO-SEO-Production`
   - Access: **Restricted Access**
   - Permissions: Enable **Mail Send** ✅
3. **COPY THE NEW KEY** (starts with `SG.`)
4. Update Supabase SMTP Password with the new key

### 4. Test SMTP Connection from Supabase

**This is the CRITICAL test**:

1. Go to: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/auth/settings
2. Scroll to **SMTP Settings**
3. At the bottom, click **"Send Test Email"**
4. Enter your email address
5. Click **"Send"**

**Expected Results**:
- ✅ **Success message** appears in Supabase
- ✅ **Email received** within 1-2 minutes
- ✅ Check inbox AND spam folder

**If test email FAILS**:
- Double-check all SMTP settings above
- Verify API key is correct (starts with `SG.`)
- Verify sender email is verified in SendGrid
- Check SendGrid Activity logs (next section)

### 5. Check SendGrid Activity Logs

Go to: https://app.sendgrid.com/email_activity

Look for recent email attempts:
- **Delivered** ✅ - Email sent successfully
- **Processed** 🔄 - Email in queue, waiting to send
- **Dropped** ❌ - Sender not verified or invalid
- **Bounced** ❌ - Invalid recipient email

**If you see "Dropped"**:
- Sender email is NOT verified in SendGrid
- Go back to Step 2 and verify sender

**If you see "Bounced"**:
- Recipient email address is invalid
- Try a different email for testing

**If you see NOTHING**:
- SMTP credentials are wrong in Supabase
- API key is invalid or doesn't have Mail Send permission
- Check Steps 1 and 3

---

## Common Issues & Fixes

### Issue 1: "SMTP User should be 'apikey'"

**Problem**: You entered your actual API key as the username

**Fix**:
```
SMTP User: apikey         ← Literally the word "apikey"
SMTP Password: SG.xyz...  ← Your actual key goes here
```

### Issue 2: "Sender not verified"

**Problem**: Email address in Supabase doesn't match verified sender

**Fix**:
1. Go to: https://app.sendgrid.com/settings/sender_auth
2. Note the EXACT email address that's verified
3. Go to: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/auth/settings
4. Update "Sender Email" to match EXACTLY
5. Click Save

### Issue 3: "Connection timeout"

**Problem**: Wrong port number

**Fix**:
```
SMTP Port: 587  ← Must be 587
NOT 465 (SSL)
NOT 25 (legacy)
```

### Issue 4: "Authentication failed"

**Problem**: API key is wrong, expired, or doesn't have permissions

**Fix**:
1. Go to: https://app.sendgrid.com/settings/api_keys
2. Delete the current key
3. Create a new one:
   - Name: `supabase-new`
   - Restricted Access
   - Enable: Mail Send ✅
4. **Copy the key immediately** (shown only once!)
5. Update in Supabase SMTP Password field

### Issue 5: "Enable Custom SMTP is OFF"

**Problem**: Toggle is not enabled

**Fix**:
1. In Supabase SMTP Settings
2. Find the toggle at the top: **"Enable Custom SMTP"**
3. Click it to turn it ON (should be blue)
4. Save settings

---

## Step-by-Step Re-Configuration

If nothing works, start fresh:

### Step 1: Clear Supabase SMTP
1. Go to: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/auth/settings
2. Toggle OFF "Enable Custom SMTP"
3. Click Save

### Step 2: Create Fresh SendGrid API Key
1. Go to: https://app.sendgrid.com/settings/api_keys
2. Delete all old keys
3. Create new key:
   - Name: `supabase-fresh-2025`
   - Restricted Access
   - Mail Send: ✅ ON
   - All others: ❌ OFF
4. **Copy the key NOW** - save it in a text file

### Step 3: Verify Sender (Again)
1. Go to: https://app.sendgrid.com/settings/sender_auth
2. If no verified sender, click "Verify a Single Sender"
3. Fill form:
   - From Name: `GEO-SEO Tool`
   - From Email: Your email (e.g., `yourname@gmail.com`)
4. Click Create
5. Check inbox, click verification link
6. Wait for "Verified" ✅ status

### Step 4: Re-enter Supabase SMTP
1. Go to: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/auth/settings
2. Toggle ON "Enable Custom SMTP"
3. Enter these EXACT values:

```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [paste your new SG. key here]
Sender Email: [your verified email from Step 3]
Sender Name: GEO-SEO Tool
```

4. Click **Save**

### Step 5: Test
1. Scroll to bottom
2. Click "Send Test Email"
3. Enter your email
4. Click Send
5. Check inbox within 2 minutes

**If test succeeds** ✅:
- Try signup again: https://geo-seo-domination-tool.vercel.app/signup
- Should work now!

**If test fails** ❌:
- Take a screenshot of your SMTP settings (hide the password)
- Check SendGrid Activity logs
- Verify sender is truly verified

---

## Alternative: Disable Email Confirmation (Quick Fix)

If you can't get SMTP working and need a quick solution:

1. Go to: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/auth/settings
2. Scroll to **"Email Auth"** section
3. Find: **"Enable email confirmations"**
4. Toggle it **OFF**
5. Click **Save**

**Result**:
- ✅ Users can sign up immediately without email confirmation
- ✅ No SMTP needed
- ⚠️ Less secure (no email verification)
- ⚠️ Users can use any email (even fake ones)

**Good for**:
- Internal tools
- Testing
- MVP/prototype

**Not good for**:
- Production apps with real users
- Apps that send transactional emails
- Apps requiring verified email addresses

---

## Verification Commands

### Check if SMTP is enabled:
1. Browser DevTools (F12)
2. Network tab
3. Try signup
4. Look for request to `https://qwoggbbavikzhypzodcr.supabase.co/auth/v1/signup`
5. Check response body

**If response contains "email confirmation required"**:
- SMTP IS configured but failing
- Check SendGrid Activity logs

**If response contains "user created"**:
- Email confirmation is DISABLED
- User created successfully without email

---

## Next Steps

1. **Follow diagnostic checklist** above (Steps 1-5)
2. **Try test email** from Supabase
3. **If test succeeds**, try signup again
4. **If test fails**, follow "Step-by-Step Re-Configuration"
5. **If all fails**, consider "Disable Email Confirmation" option

---

## Support Contacts

**SendGrid Support**:
- Docs: https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api
- Support: https://support.sendgrid.com

**Supabase Support**:
- Docs: https://supabase.com/docs/guides/auth/auth-smtp
- Discord: https://discord.supabase.com

**Status Pages**:
- SendGrid: https://status.sendgrid.com
- Supabase: https://status.supabase.com

---

**Last Updated**: 2025-10-04
**Issue**: Email signup still failing after SMTP configuration
**Priority**: High
