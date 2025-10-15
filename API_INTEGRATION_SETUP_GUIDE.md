# WhoisXML & Hunter.io API Integration - Setup Guide

**Status:** ✅ Keys Rotated - Ready for Secure Setup

## Quick Setup (5 Minutes)

### Step 1: Add Keys to Local Environment

Create or update your `.env.local` file (this file is gitignored and stays on your machine):

```bash
# In your project root (d:\GEO_SEO_Domination-Tool), run:

# If .env.local doesn't exist, create it:
if (!(Test-Path .env.local)) { New-Item .env.local -ItemType File }

# Add your new keys (replace YOUR_NEW_KEY with actual keys):
Add-Content .env.local "`nWHOIS_API_KEY=YOUR_NEW_WHOIS_KEY_HERE"
Add-Content .env.local "HUNTER_API_KEY=YOUR_NEW_HUNTER_KEY_HERE"
```

Or manually create/edit `.env.local` in the project root with:
```env
WHOIS_API_KEY=your_new_whois_key_here
HUNTER_API_KEY=your_new_hunter_key_here
```

### Step 2: Add Keys to Vercel (Production)

1. Go to: https://vercel.com/dashboard
2. Select your project: **GEO-SEO-Domination-Tool**
3. Go to: **Settings** → **Environment Variables**
4. Add two new variables:

   **Variable 1:**
   - Key: `WHOIS_API_KEY`
   - Value: [Your new WhoisXML key]
   - Environments: ✅ Production ✅ Preview ✅ Development
   
   **Variable 2:**
   - Key: `HUNTER_API_KEY`
   - Value: [Your new Hunter.io key]
   - Environments: ✅ Production ✅ Preview ✅ Development

5. Click **Save**
6. **Redeploy** your application to apply the new environment variables

### Step 3: Verify Setup

Test that the integrations work:

```bash
# Start development server
npm run dev

# The APIs will now be available at:
# - WhoisXML: lib/api/whois.ts
# - Hunter.io: lib/api/hunter.ts
```

## Usage Examples

### WhoisXML API - Domain Lookup

```typescript
import { lookupDomain, extractDomainInfo, isWhoisConfigured } from '@/lib/api/whois';

// Check if configured
if (!isWhoisConfigured()) {
  console.error('WHOIS_API_KEY not set');
  return;
}

// Look up a domain
try {
  const whoisData = await lookupDomain('disasterrecovery.com.au');
  const info = extractDomainInfo(whoisData);
  
  console.log('Domain:', info.domain);
  console.log('Registrar:', info.registrar);
  console.log('Organization:', info.organization);
  console.log('Country:', info.country);
  console.log('Created:', info.createdDate);
  console.log('Expires:', info.expiresDate);
  console.log('Name Servers:', info.nameServers);
} catch (error) {
  console.error('WHOIS lookup failed:', error.message);
}
```

### Hunter.io API - Email Discovery

```typescript
import { 
  domainSearch, 
  emailFinder, 
  verifyEmail,
  companyEnrichment,
  isHunterConfigured,
  filterByConfidence 
} from '@/lib/api/hunter';

// Check if configured
if (!isHunterConfigured()) {
  console.error('HUNTER_API_KEY not set');
  return;
}

// 1. Find all emails for a domain
try {
  const emails = await domainSearch('stripe.com', {
    limit: 10,
    type: 'personal' // or 'generic'
  });
  
  // Filter high-confidence emails
  const verified = filterByConfidence(emails, 70);
  
  console.log('Found emails:', verified);
} catch (error) {
  console.error('Domain search failed:', error.message);
}

// 2. Find specific person's email
try {
  const result = await emailFinder('stripe.com', 'Patrick', 'Collison');
  console.log('Email:', result.data.email);
  console.log('Confidence:', result.data.confidence);
} catch (error) {
  console.error('Email finder failed:', error.message);
}

// 3. Verify an email address
try {
  const verification = await verifyEmail('test@stripe.com');
  console.log('Status:', verification.data.status);
  console.log('Result:', verification.data.result);
  console.log('Score:', verification.data.score);
} catch (error) {
  console.error('Email verification failed:', error.message);
}

// 4. Get company information
try {
  const company = await companyEnrichment('stripe.com');
  console.log('Company:', company.data.company);
  console.log('Industry:', company.data.industry);
  console.log('Headcount:', company.data.headcount);
  console.log('LinkedIn:', company.data.linkedin_url);
} catch (error) {
  console.error('Company enrichment failed:', error.message);
}
```

## API Integration Features

### WhoisXML API (`lib/api/whois.ts`)
- ✅ Domain WHOIS lookup
- ✅ Registrar information
- ✅ Organization details
- ✅ Contact information
- ✅ Name server data
- ✅ Domain dates (created, updated, expires)
- ✅ Error handling with custom error class
- ✅ Configuration check function

### Hunter.io API (`lib/api/hunter.ts`)
- ✅ Domain email search
- ✅ Email finder (by name)
- ✅ Email verification
- ✅ Company enrichment
- ✅ Person enrichment
- ✅ Combined enrichment
- ✅ Social media discovery
- ✅ Confidence filtering
- ✅ Email pattern extraction
- ✅ Error handling with custom error class

## Security Features

✅ **Environment Variables:** All keys use `process.env`
✅ **No Hardcoded Secrets:** Keys never in code
✅ **Gitignore Protection:** `.env.local` is gitignored
✅ **Type Safety:** Full TypeScript support
✅ **Error Handling:** Secure error messages (no key exposure)
✅ **Configuration Checks:** `isConfigured()` functions

## Troubleshooting

### "API key not set" Error
**Solution:** Ensure keys are in `.env.local` and restart dev server

### API Request Fails
**Solution:** 
1. Check keys are correct in `.env.local`
2. Verify keys are active in provider dashboard
3. Check rate limits

### Vercel Deployment Issues
**Solution:**
1. Verify environment variables are added to Vercel
2. Redeploy after adding variables
3. Check Vercel deployment logs

## API Rate Limits

### WhoisXML API
- Free tier: 500 requests/month
- Check your usage: https://user.whoisxmlapi.com/

### Hunter.io API
- Free tier: 25 searches/month, 50 verifications/month
- Check your usage: https://hunter.io/users/subscription

## Next Steps

1. ✅ Keys rotated and secured
2. ✅ Add keys to `.env.local`
3. ✅ Add keys to Vercel
4. ✅ Test integrations locally
5. ✅ Deploy to production
6. ✅ Monitor API usage

## Documentation

- **WhoisXML Docs:** https://www.whoisxmlapi.com/documentation/api
- **Hunter.io Docs:** https://hunter.io/api-documentation/v2
- **Security Guide:** SECURITY_INCIDENT_RESPONSE.md

---

**Remember:** Never commit `.env.local` to Git. Your keys are safe now! 🔒
