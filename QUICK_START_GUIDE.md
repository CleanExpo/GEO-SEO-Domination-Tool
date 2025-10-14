# GEO-SEO Domination Tool - Quick Start Guide

## 🎯 Overview

Your SEO automation platform is now streamlined and focused on **client management with full automation**. The system captures client credentials during onboarding and automatically sets up SEO monitoring, audits, and optimization workflows.

---

## 🚀 Getting Started

### 1. Access the Application

**Local Development:**
```bash
npm run dev
```

Visit: http://localhost:3000

**Production:**
Visit your Vercel deployment URL

### 2. Navigate the Simplified Interface

The sidebar now has **only 8 items** (down from 26!):

#### **Client Management**
- **Dashboard** - Overview of all clients and activity
- **New Client Onboarding** - Start here! (Badge: "START HERE")
- **My Clients** - View all active clients
- **Task Inbox** - Automated tasks from AI agents (Badge: "AUTO")
- **Reports** - Client performance reports

#### **Automation**
- **AI Agents** - View autonomous agents working for you
- **SEO Monitor** - Real-time SEO tracking

#### **Help & Support**
- **Support** - Get help when needed

---

## 📋 Adding a New Client (The Main Workflow)

### Step-by-Step Process

#### **Option 1: From Homepage**
1. Visit http://localhost:3000
2. Click **"Add New Client"** (big green button)

#### **Option 2: From Sidebar**
1. Click **"New Client Onboarding"** in the sidebar

### The 10-Step Onboarding Form

The onboarding process captures everything needed for full automation:

#### **Steps 0-4: Business Data (Required)**

**Step 0: Business Info**
- Business name, contact name, email, phone
- Business address, industry

**Step 1: Website Details**
- Website URL
- Website platform (WordPress, Shopify, etc.)

**Step 2: SEO Goals**
- Primary SEO objectives (traffic, rankings, leads, etc.)
- Target keywords (one per line)
- Target locations

**Step 3: Content Strategy**
- Content types (blog posts, landing pages, etc.)
- Content frequency (daily, weekly, monthly)
- Brand voice description

**Step 4: Services & Budget**
- Selected services (SEO audit, keyword research, etc.)
- Monthly budget

#### **Steps 5-9: Credential Capture (Optional but Powerful)**

These steps enable **full automation**. All credentials are encrypted with **AES-256-GCM** before storage.

**Step 5: Website Access**
- Hosting account (cPanel, Plesk, AWS, etc.)
- CMS admin (WordPress, Drupal, etc.)
- FTP/SFTP credentials
- DNS management (Cloudflare, etc.)
- Database access

**Step 6: Social Media**
- Facebook Business / Pages
- Instagram Business
- LinkedIn
- Twitter/X
- YouTube
- TikTok
- Pinterest

**Step 7: Google Ecosystem**
- Google Business Profile
- Google Analytics 4
- Google Search Console
- Google Ads
- Google Tag Manager

**Step 8: Marketing Tools**
- Email marketing (Mailchimp, Klaviyo, etc.)
- CRM (HubSpot, Salesforce, etc.)
- Call tracking (CallRail, CTM)
- Hotjar (heat maps)

**Step 9: Advertising Platforms**
- Google Ads Manager
- Facebook Ads Manager
- Microsoft Ads (Bing)

### What Happens After Submission?

When you click **"Complete Onboarding"** on Step 9:

1. **Company Created** - Client profile set up in database
2. **Credentials Encrypted** - All access credentials secured with military-grade encryption
3. **Initial Audit Scheduled** - Comprehensive SEO audit queued immediately
4. **Automation Activated** - AI agents begin monitoring and optimization

You're redirected to: `/companies/{company-id}/dashboard`

---

## 🔐 Security Features

### Credential Encryption

All captured credentials use **AES-256-GCM encryption** (military-grade):
- **Encryption Key**: 256-bit randomly generated
- **Initialization Vector (IV)**: Unique per credential
- **Authentication Tag**: Prevents tampering
- **Storage**: PostgreSQL/Supabase with encrypted fields

### Audit Trail

Every credential access is logged:
- Who accessed it
- When it was accessed
- What action was performed (read/write/delete)
- Success/failure status

View audit logs in database table: `credential_access_log`

---

## 🤖 Automated Workflows

Once credentials are captured, the system automatically:

### **Website Management**
- ✅ Update meta tags for SEO optimization
- ✅ Fix broken links
- ✅ Optimize images (compress, add alt text)
- ✅ Implement schema markup
- ✅ Update robots.txt and sitemaps
- ✅ Monitor site performance (Core Web Vitals)
- ✅ Schedule automatic backups
- ✅ Install security updates

### **Social Media Automation**
- ✅ Schedule and publish content
- ✅ Track engagement metrics
- ✅ Monitor brand mentions
- ✅ Respond to comments (with approval)
- ✅ Analyze competitor activity
- ✅ Generate performance reports

### **Google Services Integration**
- ✅ Monitor GBP insights and reviews
- ✅ Track GA4 traffic and conversions
- ✅ Alert on Search Console errors
- ✅ Optimize Google Ads campaigns
- ✅ Tag Manager event tracking

### **Marketing Automation**
- ✅ Email campaign performance tracking
- ✅ CRM contact synchronization
- ✅ Call tracking and analysis
- ✅ Heatmap and session recording insights

### **Advertising Optimization**
- ✅ Monitor ad spend and ROI
- ✅ Track campaign performance
- ✅ Identify high-performing keywords
- ✅ Alert on budget thresholds

---

## 📊 Viewing Client Data

### Client Dashboard

After onboarding, access the client dashboard at:
```
/companies/{company-id}/dashboard
```

From here you can:
- View SEO audit results
- Check keyword rankings
- See automation tasks
- Access all captured credentials (decrypted)
- Run manual audits
- Generate reports

### Running an SEO Audit

1. Navigate to client dashboard
2. Click **"Run Comprehensive Audit"**
3. Wait 30-60 seconds for completion
4. View results:
   - Overall SEO score
   - Lighthouse performance
   - Technical SEO issues
   - E-E-A-T score
   - Backlink analysis
   - Keyword opportunities
   - Competitor analysis

---

## 🗄️ Database Structure

### Key Tables

**Companies** (`companies`)
- Client business information
- Website URL
- Contact details

**Credentials** (`client_credentials`)
- Encrypted credential data
- Platform type and name
- Encryption IV and auth tag
- Status (active/inactive/expired)

**Audits** (`seo_audits`)
- Lighthouse scores
- SEO analysis results
- Issues and recommendations

**Keywords** (`keywords`)
- Target keywords per company
- Search volume and difficulty

**Rankings** (`rankings`)
- Keyword position tracking
- Historical data

**Tasks** (`agent_tasks`)
- Automated tasks from AI agents
- Status and priority

---

## 🛠️ Advanced Configuration

### Environment Variables

Required in `.env.local`:

```env
# Supabase (Production Database)
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Encryption (CRITICAL - Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=your-64-char-hex-key-here

# AI Services (Cascading: Qwen → Claude Opus → Sonnet 4.5)
QWEN_API_KEY=sk-xxx...                  # Primary (cheapest)
ANTHROPIC_API_KEY=sk-ant-...            # Fallback
OPENAI_API_KEY=sk-...                   # Legacy
PERPLEXITY_API_KEY=pplx-...             # Citations

# SEO Tools
FIRECRAWL_API_KEY=fc-...
GOOGLE_API_KEY=...

# Email Service
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_...
EMAIL_FROM=noreply@example.com
```

### Running Database Migrations

```bash
# Initialize database
npm run db:init

# Run pending migrations
npm run db:migrate

# Check migration status
npm run db:migrate:status
```

### Checking Database Data

```bash
# Check if companies exist
node scripts/check-companies.js

# Requires env vars to be loaded manually (see script output)
```

---

## 🐛 Troubleshooting

### "Company not found" Error

**Cause**: Accessing a company page without a valid company ID

**Solution**:
1. Complete the onboarding form first
2. Use the redirect URL provided after submission
3. Or access via "My Clients" sidebar menu

### "No audit data available"

**Cause**: No SEO audit has been run for this client yet

**Solution**:
1. Click **"Run Comprehensive Audit"** button
2. Wait 30-60 seconds for completion
3. Refresh page to see results

### Build Errors

**Always check**:
1. `npm run dev` output for TypeScript errors
2. Environment variables are set correctly
3. Database migrations are up to date (`npm run db:migrate:status`)

### Credential Storage Failing

**Check**:
1. `ENCRYPTION_KEY` environment variable is set
2. Supabase credentials are valid
3. `client_credentials` table exists in database

---

## 📈 Next Steps

### Immediate Actions

1. ✅ **Delete old test companies** (you already did this!)
2. ✅ **Test new onboarding flow** - Add a test client with real data
3. ✅ **Verify credentials storage** - Check Supabase `client_credentials` table
4. ✅ **Run an SEO audit** - Test the audit system
5. ✅ **Check automation** - Verify AI agents are working

### Future Enhancements

- Add more social media platforms
- Integrate additional marketing tools
- Build custom automation workflows
- Create client portal for self-service
- Add white-label reporting

---

## 💡 Tips for Success

1. **Always use /onboarding** - This is your main entry point
2. **Capture as many credentials as possible** - More automation = better results
3. **Review audit results** - The AI provides actionable insights
4. **Monitor the Task Inbox** - See what automation is doing
5. **Check credentials expire** - Some OAuth tokens need refresh

---

## 📚 Additional Resources

- **CLAUDE.md** - Full technical documentation
- **COMPLETE_SYSTEM_FLOW.md** - Credential capture architecture
- **MOUNTAIN_CONQUERED.md** - Recent fixes and improvements
- **TROUBLESHOOTING_CHECKLIST.md** - Debugging guide

---

## 🎉 You're Ready!

Your streamlined SEO automation platform is now set up and ready to manage clients. Start by adding your first client through the onboarding flow and watch the automation take over!

**Questions?** Check the support page or review the documentation files listed above.
