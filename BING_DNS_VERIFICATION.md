# Bing Webmaster DNS Verification Guide

## 🎯 What You Need to Do

Add a **CNAME record** to your domain's DNS settings to verify ownership with Bing Webmaster Tools.

### CNAME Record Details

| Field | Value |
|-------|-------|
| **Type** | CNAME |
| **Name/Host** | `a445a9e9e5294748f4eb63f79634ffeb` |
| **Value/Points to** | `verify.bing.com` |
| **TTL** | 3600 (or default) |

---

## 📋 Step-by-Step Instructions

### For Cloudflare DNS

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain (e.g., `yourdomain.com`)
3. Go to **DNS** → **Records**
4. Click **Add record**
5. Configure:
   - **Type**: `CNAME`
   - **Name**: `a445a9e9e5294748f4eb63f79634ffeb`
   - **Target**: `verify.bing.com`
   - **Proxy status**: DNS only (grey cloud ☁️)
   - **TTL**: Auto
6. Click **Save**

### For Vercel DNS

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Domains**
4. Click on your domain
5. Scroll to **DNS Records**
6. Click **Add**
7. Configure:
   - **Type**: `CNAME`
   - **Name**: `a445a9e9e5294748f4eb63f79634ffeb`
   - **Value**: `verify.bing.com`
8. Click **Add**

### For GoDaddy DNS

1. Log in to [GoDaddy Domain Manager](https://dcc.godaddy.com)
2. Find your domain and click **DNS**
3. Scroll to **Records** section
4. Click **Add New Record**
5. Configure:
   - **Type**: `CNAME`
   - **Host**: `a445a9e9e5294748f4eb63f79634ffeb`
   - **Points to**: `verify.bing.com`
   - **TTL**: 1 Hour (default)
6. Click **Save**

### For Namecheap DNS

1. Log in to [Namecheap Dashboard](https://ap.www.namecheap.com)
2. Go to **Domain List**
3. Click **Manage** next to your domain
4. Go to **Advanced DNS** tab
5. Click **Add New Record**
6. Configure:
   - **Type**: `CNAME Record`
   - **Host**: `a445a9e9e5294748f4eb63f79634ffeb`
   - **Value**: `verify.bing.com`
   - **TTL**: Automatic
7. Click **Save All Changes**

### For Google Domains

1. Go to [Google Domains](https://domains.google.com)
2. Click on your domain
3. Go to **DNS** tab
4. Scroll to **Custom resource records**
5. Configure:
   - **Name**: `a445a9e9e5294748f4eb63f79634ffeb`
   - **Type**: `CNAME`
   - **TTL**: 1H
   - **Data**: `verify.bing.com`
6. Click **Add**

### For Other DNS Providers

**General steps**:
1. Log in to your DNS provider
2. Find DNS management / DNS records section
3. Add new CNAME record:
   - **Name/Host**: `a445a9e9e5294748f4eb63f79634ffeb`
   - **Type**: `CNAME`
   - **Value/Target**: `verify.bing.com`
4. Save changes

---

## ⏱️ DNS Propagation

After adding the CNAME record:

- **Propagation time**: 5 minutes to 24 hours (typically 15-30 minutes)
- **Check status**: Use [DNS Checker](https://dnschecker.org) to verify propagation
- **Query to test**:
  ```bash
  nslookup a445a9e9e5294748f4eb63f79634ffeb.yourdomain.com
  ```

**Expected output**:
```
a445a9e9e5294748f4eb63f79634ffeb.yourdomain.com    canonical name = verify.bing.com.
```

---

## ✅ Verify in Bing Webmaster Tools

Once DNS has propagated:

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Find your site verification page
3. Click **Verify** button
4. Wait for Bing to check the CNAME record

**Verification should succeed within a few minutes.**

---

## 🚨 Troubleshooting

### Issue 1: "DNS record not found"

**Cause**: DNS hasn't propagated yet

**Solution**: Wait 30-60 minutes and try again

**Check propagation**:
```bash
dig a445a9e9e5294748f4eb63f79634ffeb.yourdomain.com CNAME
```

### Issue 2: "CNAME points to wrong target"

**Cause**: Typo in the value field

**Solution**:
- Double-check the value is exactly: `verify.bing.com`
- No trailing periods unless your DNS provider requires it
- No `http://` or `https://` prefix

### Issue 3: "Record already exists"

**Cause**: You may have added it twice

**Solution**:
- Check for duplicate CNAME records
- Delete duplicates, keep only one

### Issue 4: Verification fails after 24 hours

**Cause**: DNS provider may not support CNAME at that subdomain level

**Solution**: Use alternative verification methods:
1. **Meta tag** (easiest for Next.js)
2. **XML file** (upload to `/public` folder)
3. **HTML file** (upload to `/public` folder)

---

## 📝 Quick Verification Checklist

After adding the CNAME record:

```bash
# 1. Check if DNS record exists globally
curl "https://dns.google/resolve?name=a445a9e9e5294748f4eb63f79634ffeb.yourdomain.com&type=CNAME"

# 2. Expected JSON response:
# {
#   "Answer": [
#     {
#       "name": "a445a9e9e5294748f4eb63f79634ffeb.yourdomain.com.",
#       "type": 5,
#       "data": "verify.bing.com."
#     }
#   ]
# }

# 3. Verify in Bing Webmaster Tools
# Go to: https://www.bing.com/webmasters
# Click "Verify" button
```

---

## 🎯 After Successful Verification

Once verified, you can:

1. **Get Bing API Key**:
   - Go to Bing Webmaster Tools → Settings → API access
   - Click "Get API Key"
   - Copy the key

2. **Add to `.env.local`**:
   ```bash
   BING_WEBMASTER_API_KEY="your_api_key_here"
   ```

3. **Add to Vercel**:
   ```bash
   npx vercel env add BING_WEBMASTER_API_KEY production preview development
   ```

4. **Test Vitals Capture**:
   ```bash
   curl -X POST http://localhost:3000/api/onboarding/vitals/capture \
     -H "Content-Type: application/json" \
     -d '{"companyId": "uuid", "options": {"includeBing": true}}'
   ```

---

## 📊 What Data You'll Get

After Bing integration is complete, the vitals system captures:

- **SEO Score** (0-100)
- **Pages Indexed**
- **Crawl Errors**
- **Backlinks & Linking Domains**
- **Impressions & Clicks** (last 28 days)
- **Top Queries** (keywords)
- **Mobile Friendly Status**

**Worth 10% of overall Vitals Health Score**

---

## 🔗 Quick Links

- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [DNS Propagation Checker](https://dnschecker.org)
- [DNS Lookup Tool](https://mxtoolbox.com/SuperTool.aspx)
- [Bing API Documentation](https://learn.microsoft.com/en-us/bingwebmaster/)

---

**Verification Code**: `a445a9e9e5294748f4eb63f79634ffeb`
**Target**: `verify.bing.com`
**Record Type**: CNAME
**Status**: ⏳ Pending DNS setup
**Last Updated**: January 11, 2025
