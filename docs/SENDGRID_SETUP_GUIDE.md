# SendGrid SMTP Setup for Supabase - Step by Step

**Estimated Time**: 30 minutes
**Difficulty**: Easy
**Cost**: Free (100 emails/day)

---

## Part 1: Create SendGrid Account (10 minutes)

### Step 1: Sign Up for SendGrid

1. Go to: https://signup.sendgrid.com/
2. Click **"Start for Free"**
3. Fill in your details:
   - Email: Your email address
   - Password: Create a strong password
   - Click **"Create Account"**

4. **Email Verification**:
   - Check your inbox for verification email from SendGrid
   - Click the verification link
   - This may take 1-2 minutes

5. **Complete Profile**:
   - First Name / Last Name
   - Company Name: "GEO SEO Domination Tool" (or your company)
   - Website: https://geo-seo-domination-tool.vercel.app
   - Role: Developer
   - Click **"Next"**

6. **Tell Us About Your Email**:
   - How will you send email? **"Using an SMTP relay"**
   - Why are you sending email? **"Transactional emails"**
   - How many emails per month? **"Less than 10,000"**
   - Click **"Get Started"**

### Step 2: Create API Key

1. Once logged in, go to **Settings** (left sidebar)
2. Click **"API Keys"** under Settings
3. Click **"Create API Key"** (top right)
4. Configure the API Key:
   - **API Key Name**: `supabase-production`
   - **API Key Permissions**: Select **"Restricted Access"**
   - Under **Mail Send**, toggle ON:
     - ✅ Mail Send
     - ✅ Mail Send: Stats
   - Leave all other permissions OFF
5. Click **"Create & View"**

6. **IMPORTANT - Copy Your API Key NOW**:
   ```
   SG.xxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
   ```
   - This will only be shown ONCE
   - Copy it to a safe place (you'll need it in Step 3)
   - Click **"Done"**

### Step 3: Verify Sender Identity (Required)

SendGrid requires sender verification to prevent spam.

**Option A: Single Sender Verification (Easiest)**

1. Go to **Settings > Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Fill in the form:
   - **From Name**: `GEO-SEO Domination Tool`
   - **From Email Address**: Your email (e.g., `admin@yourdomain.com` or `your-email@gmail.com`)
   - **Reply To**: Same as From Email
   - **Company Address**: Your business address
   - **City**: Your city
   - **Country**: Your country
4. Click **"Create"**
5. **Check your email** for verification link
6. Click the verification link in the email
7. You'll see "Sender Verified" ✅

**Option B: Domain Authentication (For Custom Domains)**

If you own a domain (e.g., `yourdomain.com`):

1. Go to **Settings > Sender Authentication**
2. Click **"Authenticate Your Domain"**
3. Follow the DNS setup instructions
4. Add the CNAME records to your domain's DNS
5. Wait for DNS propagation (10-30 minutes)

---

## Part 2: Configure Supabase (10 minutes)

### Step 4: Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr
2. Click on your project: **GEO-SEO Domination Tool**
3. In the left sidebar, click **Authentication**

### Step 5: Configure SMTP Settings

1. Click **"Settings"** under Authentication
2. Scroll down to **"SMTP Settings"** section
3. Click **"Enable Custom SMTP"**
4. Fill in the SendGrid SMTP details:

```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: <paste-your-sendgrid-api-key-here>
              (The one that starts with SG.xxxx)
Sender Email: <your-verified-sender-email>
              (The email you verified in Step 3)
Sender Name: GEO-SEO Domination Tool
```

5. Click **"Save"**

### Step 6: Test SMTP Connection

1. Scroll to the bottom of the SMTP Settings
2. Click **"Send Test Email"**
3. Enter your email address
4. Click **"Send"**
5. **Check your inbox** - you should receive a test email within 1 minute
6. If received ✅ - SMTP is working!
7. If not ❌ - double-check the API key and sender email

### Step 7: Configure Email Templates

1. In the left sidebar under Authentication, click **"Email Templates"**
2. You'll see 4 templates:
   - Confirm signup
   - Invite user
   - Magic Link
   - Reset Password

**Customize "Confirm signup" template:**

Click on **"Confirm signup"** and replace with this template:

```html
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>Confirm your email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f6f9fc; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
        Welcome to GEO-SEO Domination Tool! 🚀
      </h1>
    </div>

    <!-- Body -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; line-height: 24px; color: #334155; margin: 0 0 20px;">
        Hi there,
      </p>

      <p style="font-size: 16px; line-height: 24px; color: #334155; margin: 0 0 20px;">
        Thank you for signing up! We're excited to have you on board.
        To get started, please confirm your email address by clicking the button below:
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{ .ConfirmationURL }}"
           style="background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
          Confirm Email Address
        </a>
      </div>

      <p style="font-size: 14px; line-height: 22px; color: #64748b; margin: 20px 0 0; padding: 20px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #10b981;">
        <strong>Note:</strong> If you didn't create an account, you can safely ignore this email.
      </p>

      <p style="font-size: 14px; line-height: 22px; color: #94a3b8; margin: 30px 0 0; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="{{ .ConfirmationURL }}" style="color: #10b981; word-break: break-all;">{{ .ConfirmationURL }}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 14px; color: #64748b; margin: 0 0 10px;">
        © 2025 GEO-SEO Domination Tool. All rights reserved.
      </p>
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">
        Advanced SEO Analytics Platform
      </p>
    </div>

  </div>
</body>
</html>
```

Click **"Save"**

**Optional: Customize other templates** (Magic Link, Reset Password) using similar styling.

### Step 8: Configure Redirect URLs

1. Still in **Authentication** settings
2. Scroll to **"URL Configuration"** section
3. Add these redirect URLs (one per line):

```
http://localhost:3004/auth/callback
https://geo-seo-domination-tool.vercel.app/auth/callback
https://web-app-unite-group.vercel.app/auth/callback
https://web-app-one-lemon.vercel.app/auth/callback
```

4. Add these to **"Site URL"**:

```
https://geo-seo-domination-tool.vercel.app
```

5. Click **"Save"**

---

## Part 3: Test the Setup (10 minutes)

### Step 9: Test Signup Flow

1. **Open Incognito/Private Window** in your browser
2. Navigate to: https://geo-seo-domination-tool.vercel.app/signup
3. Enter a test email (use one you have access to):
   - Email: `youremail+test1@gmail.com`
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`
4. Click **"Sign Up"**

### Step 10: Verify Email Delivery

1. **Check your inbox** (within 1-2 minutes)
2. Look for email from **GEO-SEO Domination Tool**
3. **Check spam folder** if not in inbox
4. Open the email - should see the styled template
5. Click **"Confirm Email Address"** button

### Step 11: Complete Signup

1. After clicking confirmation link, you should be redirected to the dashboard
2. You should be logged in automatically
3. Check the top-right corner - should show your email

### Step 12: Test Sign Out and Sign In

1. Click **"Sign Out"** button
2. Navigate to: https://geo-seo-domination-tool.vercel.app/login
3. Enter the same credentials:
   - Email: `youremail+test1@gmail.com`
   - Password: `TestPassword123!`
4. Click **"Sign In"**
5. Should be logged in successfully ✅

---

## Troubleshooting

### Email Not Received (Most Common Issues)

**1. Check Spam/Junk Folder**
- SendGrid emails often land in spam initially
- Mark as "Not Spam" to improve future delivery

**2. Verify Sender Email in SendGrid**
- Go to SendGrid > Settings > Sender Authentication
- Make sure sender shows "Verified" ✅
- If not, resend verification email

**3. Check SendGrid Activity**
- Go to SendGrid Dashboard
- Click **"Activity"** in left sidebar
- Look for your test email
- Status should be "Delivered" ✅
- If "Bounced" ❌ - check email address
- If "Dropped" ❌ - sender not verified

**4. API Key Permissions**
- Go to SendGrid > Settings > API Keys
- Click on your `supabase-production` key
- Make sure "Mail Send" is enabled ✅

**5. SMTP Connection Failed**
- Double-check SMTP settings in Supabase:
  - Host: `smtp.sendgrid.net` (no https://)
  - Port: `587` (not 465 or 25)
  - User: `apikey` (literally the word "apikey")
  - Password: Your actual API key starting with `SG.`

### 500 Error Still Appears

**1. Clear Browser Cache**
```
Chrome: Ctrl+Shift+Delete > Clear cached images and files
Firefox: Ctrl+Shift+Delete > Cache
Safari: Cmd+Option+E
```

**2. Check Supabase Logs**
- Go to Supabase Dashboard > Logs
- Filter by "auth"
- Look for errors related to email sending

**3. Verify Environment Variables (Vercel)**
- Go to Vercel dashboard
- Project: web-app
- Settings > Environment Variables
- Verify these are set:
  ```
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  ```

**4. Redeploy Vercel**
Sometimes cached builds cause issues:
```bash
# From terminal
cd geo-seo-domination-tool/web-app
vercel --prod
```

### Testing with Gmail

**Gmail+ Trick for Multiple Test Accounts:**

You can use the same Gmail address with `+` to create multiple test accounts:

```
youremail+test1@gmail.com
youremail+test2@gmail.com
youremail+test3@gmail.com
```

All emails go to `youremail@gmail.com`, but Supabase treats them as different accounts.

---

## Monitoring & Maintenance

### SendGrid Dashboard

**Check Email Statistics:**
1. Go to SendGrid Dashboard
2. Click **"Statistics"** in left sidebar
3. View:
   - Delivered emails
   - Open rate
   - Click rate
   - Bounces

**Set Up Alerts:**
1. Go to SendGrid > Settings > Alerts
2. Enable alerts for:
   - Bounce rate > 5%
   - Spam report rate > 0.1%
   - Daily email limit reached

### Supabase Monitoring

**Check Authentication Logs:**
1. Supabase Dashboard > Logs
2. Filter: `auth.users`
3. Monitor signup events and errors

**User Management:**
1. Supabase Dashboard > Authentication > Users
2. View all registered users
3. Manually verify users if needed
4. Delete test accounts

---

## Upgrade Path (When You Need More)

### SendGrid Free Tier Limits
- 100 emails/day
- 1 sender verification
- Basic email API

### When to Upgrade
- **More than 100 signups/day**: Upgrade to Essentials ($19.95/mo for 40,000 emails)
- **Custom domain**: Use domain authentication
- **Marketing emails**: Upgrade for email marketing features
- **Dedicated IP**: For high-volume sending (10,000+ emails/day)

### Alternative Email Providers

If SendGrid doesn't meet your needs:

**Resend** (Developer-friendly)
- Free: 3,000 emails/month
- $20/mo: 50,000 emails/month
- Great documentation

**AWS SES** (Most affordable at scale)
- $0.10 per 1,000 emails
- Requires AWS account
- More complex setup

**Mailgun** (Similar to SendGrid)
- Free: 100 emails/day
- $35/mo: 50,000 emails/month

---

## Success Checklist

- [ ] SendGrid account created ✅
- [ ] SendGrid API key generated ✅
- [ ] Sender email verified in SendGrid ✅
- [ ] SMTP configured in Supabase ✅
- [ ] Test email sent successfully ✅
- [ ] Email templates customized ✅
- [ ] Redirect URLs configured ✅
- [ ] Test signup completed ✅
- [ ] Confirmation email received ✅
- [ ] Email link clicked and verified ✅
- [ ] Sign in/out working ✅

---

## Quick Reference

### SendGrid SMTP Credentials
```
Host: smtp.sendgrid.net
Port: 587
User: apikey
Password: SG.your-api-key-here
```

### Supabase Dashboard URLs
```
Project: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr
Auth Settings: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/auth/settings
Email Templates: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/auth/templates
Users: https://supabase.com/dashboard/project/qwoggbbavikzhypzodcr/auth/users
```

### SendGrid Dashboard URLs
```
Dashboard: https://app.sendgrid.com/
API Keys: https://app.sendgrid.com/settings/api_keys
Sender Auth: https://app.sendgrid.com/settings/sender_auth
Activity: https://app.sendgrid.com/email_activity
```

---

**Setup Date**: 2025-10-04
**Estimated Completion Time**: 30 minutes
**Status**: Ready to implement
**Next Steps**: Follow Part 1, Step 1 to begin
