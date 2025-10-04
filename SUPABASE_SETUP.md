# Supabase Database Setup Guide

## 🎯 Overview

This guide will help you set up the Supabase database for the GEO-SEO Domination Tool. The application uses Supabase (PostgreSQL) as its database backend for storing companies, keywords, rankings, audits, and all other data.

---

## 📋 Prerequisites

1. **Supabase Account**: Sign up at [https://supabase.com](https://supabase.com) (free tier available)
2. **Vercel Account**: Your application is deployed on Vercel
3. **Access to Vercel Environment Variables**: You can set these in Project Settings → Environment Variables

---

## 🚀 Step-by-Step Setup

### Step 1: Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: `geo-seo-domination` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the region closest to your users
4. Click **"Create new project"**
5. Wait 2-3 minutes for your project to be provisioned

### Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, click **Settings** (gear icon) in the sidebar
2. Go to **API** section
3. You'll see two important values:

   **Project URL**:
   ```
   https://xyzabc123.supabase.co
   ```

   **Anon/Public Key** (also called `anon public`):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Copy both values** - you'll need them for Vercel

### Step 3: Run the Database Schema

1. In your Supabase project dashboard, click **SQL Editor** in the sidebar
2. Click **"New Query"**
3. Open the file `web-app/supabase-schema.sql` from this repository
4. **Copy all the SQL** from that file
5. **Paste it** into the Supabase SQL Editor
6. Click **"Run"** (or press Ctrl/Cmd + Enter)
7. Wait for the query to complete (you should see "Success. No rows returned")

This will create:
- ✅ All database tables (companies, keywords, rankings, audits, etc.)
- ✅ Proper indexes for performance
- ✅ Foreign key relationships
- ✅ Automatic `updated_at` timestamp triggers
- ✅ All CRM, project, and resource tables

### Step 4: Verify Tables Were Created

1. In Supabase, click **Table Editor** in the sidebar
2. You should see all the following tables:
   - `companies`
   - `keywords`
   - `rankings`
   - `seo_audits`
   - `projects`
   - `project_notes`
   - `github_repos`
   - `crm_contacts`
   - `crm_deals`
   - `crm_tasks`
   - `crm_events`
   - `resource_prompts`
   - `resource_components`
   - `resource_ai_tools`
   - `resource_tutorials`
   - `notification_preferences`
   - `notification_queue`
   - `notification_history`

### Step 5: Configure Vercel Environment Variables

1. Go to your Vercel dashboard: [https://vercel.com](https://vercel.com)
2. Select your **geo-seo-domination-tool** project
3. Click **Settings** → **Environment Variables**
4. Add the following two variables:

   **Variable 1:**
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Your Supabase Project URL (from Step 2)
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development

   **Variable 2:**
   - **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: Your Supabase Anon/Public Key (from Step 2)
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development

5. Click **"Save"** for each variable

### Step 6: Redeploy Your Application

1. Go to your Vercel project **Deployments** tab
2. Click the **⋮** menu on the latest deployment
3. Click **"Redeploy"**
4. Wait for the deployment to complete

**OR** simply push a new commit to trigger automatic deployment:
```bash
git commit --allow-empty -m "Trigger deployment with Supabase credentials"
git push
```

---

## ✅ Testing the Connection

### Test 1: Add a Company

1. Go to your deployed application URL
2. Navigate to **Companies** page
3. Click **"Create campaign"** button
4. Fill in the form:
   - **Company Name**: Test Company
   - **Website**: https://example.com
   - **Industry**: Technology
   - **Location**: San Francisco, CA
5. Click **"Create Company"**
6. ✅ **Success**: The company should appear in the list
7. ❌ **Failure**: Check browser console for errors

### Test 2: Verify in Supabase

1. Go to your Supabase dashboard
2. Click **Table Editor**
3. Select the **companies** table
4. You should see your test company in the table
5. Note the `id` (UUID) - this proves the connection is working!

### Test 3: Add Keywords

1. Click on your test company
2. Navigate to **Keywords** tab
3. Add a test keyword
4. Verify it appears in the `keywords` table in Supabase

---

## 🔍 Troubleshooting

### Issue: "Companies won't save" or "Nothing happens when I submit"

**Solution:**
1. Open browser developer console (F12)
2. Look for errors in the **Console** tab
3. Check the **Network** tab for failed API requests
4. Common issues:
   - Environment variables not set correctly in Vercel
   - Wrong Supabase URL or key
   - Tables not created (re-run the SQL schema)

### Issue: "Error: Failed to fetch companies"

**Solution:**
1. Verify Supabase credentials are correct in Vercel
2. Check that tables exist in Supabase Table Editor
3. Ensure you clicked **all three checkboxes** (Production, Preview, Development) when adding environment variables

### Issue: Database connection timeout

**Solution:**
1. Check your Supabase project is not paused (free tier pauses after inactivity)
2. Go to Supabase dashboard and wake up the project
3. Try again

### Issue: "Cannot read property 'from' of undefined"

**Solution:**
1. The Supabase client isn't initialized properly
2. Double-check environment variable names:
   - Must be exactly: `NEXT_PUBLIC_SUPABASE_URL`
   - Must be exactly: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Must include the `NEXT_PUBLIC_` prefix
3. Redeploy after fixing

---

## 📊 Database Schema Overview

### Core Tables

**companies**
- Stores client company information
- Primary entity that others reference

**keywords**
- Stores SEO keywords being tracked
- Linked to companies via `company_id`

**rankings**
- Stores historical ranking data
- Linked to both keywords and companies

**seo_audits**
- Stores comprehensive SEO audit results
- Includes Lighthouse scores, E-E-A-T metrics
- Stores recommendations as JSON

### CRM Tables

**crm_contacts** - Contact information
**crm_deals** - Sales pipeline management
**crm_tasks** - Task tracking
**crm_events** - Calendar events

### Project Management Tables

**projects** - Project information
**project_notes** - Project notes and documentation
**github_repos** - GitHub repository tracking

### Resource Tables

**resource_prompts** - AI prompts library
**resource_components** - Code components library
**resource_ai_tools** - AI tools directory
**resource_tutorials** - Tutorial library

### Notification Tables

**notification_preferences** - User notification settings
**notification_queue** - Pending notifications
**notification_history** - Sent notification log

---

## 🔐 Security Notes

### Row Level Security (RLS)

The schema file includes commented-out RLS enablement. If you plan to add user authentication:

1. Uncomment the RLS lines in `supabase-schema.sql`
2. Add authentication policies based on your auth setup
3. Use Supabase Auth or another authentication provider

Example policy (add after enabling RLS):
```sql
-- Allow users to read all companies
CREATE POLICY "Allow public read access to companies"
  ON companies FOR SELECT
  USING (true);

-- Allow authenticated users to insert companies
CREATE POLICY "Allow authenticated insert to companies"
  ON companies FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

### API Keys

- ⚠️ **Never commit** Supabase credentials to git
- ✅ **Always use** environment variables
- ✅ **Rotate keys** if they're ever exposed
- ✅ **Use RLS policies** for production applications

---

## 🎨 Database Diagram

```
companies (1) ─────── (N) keywords
    │                      │
    │                      │
    │                      ▼
    │                 rankings (N)
    │
    ├─────── (N) seo_audits
    │
    ├─────── (N) projects
    │            │
    │            └──── (N) project_notes
    │            └──── (N) github_repos
    │
    └─────── (N) crm_contacts
                 │
                 ├──── (N) crm_deals
                 ├──── (N) crm_tasks
                 └──── (N) crm_events
```

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)
- [SQL Editor Best Practices](https://supabase.com/docs/guides/database/overview)

---

## ✅ Verification Checklist

Before considering your setup complete, verify:

- [ ] Supabase project created
- [ ] Database password saved securely
- [ ] SQL schema executed successfully in SQL Editor
- [ ] All 17 tables visible in Table Editor
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set in Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in Vercel
- [ ] Environment variables applied to all environments
- [ ] Application redeployed on Vercel
- [ ] Successfully added a test company
- [ ] Test company visible in Supabase Table Editor
- [ ] No errors in browser console

---

## 🚀 Next Steps

Once your database is set up and working:

1. **Configure API Integrations** (optional):
   - Add Firecrawl API key for web scraping
   - Add Anthropic API key for AI analysis
   - Add SEMrush API key for competitor data
   - Add Perplexity API key for AI citations

2. **Test All Features**:
   - Add companies
   - Track keywords
   - Monitor rankings
   - Run SEO audits
   - Use CRM features
   - Create projects

3. **Set Up Automated Jobs**:
   - Configure cron jobs for ranking checks
   - Set up weekly report generation
   - Enable audit automation

4. **Enable Notifications**:
   - Configure email service (Resend or SendGrid)
   - Set up notification preferences
   - Test alert system

---

**Need Help?**

If you encounter issues not covered in this guide, check:
1. Vercel deployment logs for errors
2. Supabase logs in the Logs section
3. Browser console for client-side errors
4. The `DEPLOYMENT_CHECKPOINT.md` file for build-related issues

**Your database is now ready! Happy SEO tracking! 🎉**
