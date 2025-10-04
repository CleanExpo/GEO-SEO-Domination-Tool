# 🚀 Quick Start: Vercel Environment Setup

**⏱️ Time Required**: 15-30 minutes  
**Production URL**: https://geo-seo-domination-tool.vercel.app

---

## ✅ Current Status

```
✅ Local Development: PostgreSQL + Redis running (41 tables initialized)
✅ Production Deployed: Live and accessible
✅ Basic Features: Company management working
⏳ Environment Variables: Need configuration
```

---

## 🎯 Three Ways to Setup

### Option 1: Automated PowerShell Script (EASIEST)
```powershell
cd d:\GEO_SEO_Domination-Tool\geo-seo-domination-tool
.\setup-vercel-env.ps1
```
**Pros**: Interactive, guides you through each step, auto-generates secrets  
**Time**: 15 minutes

### Option 2: Manual CLI Commands (RECOMMENDED)
```bash
cd d:\GEO_SEO_Domination-Tool\geo-seo-domination-tool\web-app

# Add each variable interactively
vercel env add OPENAI_API_KEY production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add DATABASE_URL production

# Deploy
vercel --prod
```
**Pros**: Full control, clear understanding of each step  
**Time**: 20 minutes

### Option 3: Vercel Dashboard (VISUAL)
1. Visit: https://vercel.com/unite-group/web-app/settings/environment-variables
2. Click "Add New" for each variable
3. Redeploy via dashboard or push to GitHub

**Pros**: Visual interface, easy to see all variables  
**Time**: 25 minutes

---

## 📋 Required API Keys Checklist

### Phase 1: Must Have (15 min)
- [ ] **OPENAI_API_KEY** - Get from https://platform.openai.com/api-keys
- [ ] **NEXT_PUBLIC_SUPABASE_URL** - Get from https://supabase.com/dashboard
- [ ] **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Supabase Settings → API
- [ ] **SUPABASE_SERVICE_ROLE_KEY** - Supabase Settings → API
- [ ] **DATABASE_URL** - Supabase Settings → Database

### Phase 2: Should Have (10 min)
- [ ] **SEMRUSH_API_KEY** - For SEO analysis
- [ ] **JWT_SECRET** - Generate with script or https://generate-secret.vercel.app/32
- [ ] **SESSION_SECRET** - Generate with script

### Phase 3: Nice to Have (15 min)
- [ ] **PERPLEXITY_API_KEY** - Enhanced AI search
- [ ] **FIRECRAWL_API_KEY** - Web scraping
- [ ] **GOOGLE_API_KEY** - Google integrations

---

## ⚡ Fastest Path (10 minutes)

**Just want AI features working?**

1. **Get OpenAI API Key**:
   - Visit https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)

2. **Add to Vercel**:
   ```bash
   cd d:\GEO_SEO_Domination-Tool\geo-seo-domination-tool\web-app
   vercel env add OPENAI_API_KEY production
   # Paste your key when prompted
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Test**:
   - Visit https://geo-seo-domination-tool.vercel.app
   - Try AI features

**Done!** You can add database and other features later.

---

## 🗺️ Complete Setup Path (30 minutes)

### Step 1: Prepare Your API Keys (10 min)

Open these tabs in your browser:
1. https://platform.openai.com/api-keys (OpenAI)
2. https://supabase.com/dashboard (Supabase)
3. https://www.semrush.com/api/ (SEMrush - optional)

Create accounts and get API keys ready.

### Step 2: Run Setup Script (10 min)

```powershell
cd d:\GEO_SEO_Domination-Tool\geo-seo-domination-tool
.\setup-vercel-env.ps1
```

Follow the interactive prompts. The script will:
- Guide you through each variable
- Auto-generate security secrets
- Offer to deploy automatically

### Step 3: Initialize Database (5 min)

1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/editor
2. Click "SQL Editor"
3. Copy contents of `web-app/supabase-schema.sql`
4. Paste and click "Run"

### Step 4: Verify & Test (5 min)

```bash
# Check variables
vercel env ls

# View logs
vercel logs

# Test app
# Visit: https://geo-seo-domination-tool.vercel.app
```

---

## 🆘 Common Issues & Solutions

### Issue: "vercel: command not found"
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login
```

### Issue: "No access to project"
```bash
# Link to project
cd d:\GEO_SEO_Domination-Tool\geo-seo-domination-tool\web-app
vercel link
```

### Issue: Changes not reflecting
```bash
# Force redeploy
vercel --prod --force

# Or via git
git add .
git commit -m "Update environment"
git push origin main
```

### Issue: Database connection errors
- Double-check DATABASE_URL format
- Ensure Supabase project is active
- Verify IP allowlist in Supabase (allow all: 0.0.0.0/0)

---

## 📞 Quick Reference Commands

```bash
# Add environment variable
vercel env add VARIABLE_NAME production

# List all variables
vercel env ls

# Remove a variable
vercel env rm VARIABLE_NAME production

# Pull variables locally
vercel env pull .env.local

# Deploy to production
vercel --prod

# View deployment logs
vercel logs

# Check deployment status
vercel ls
```

---

## 📚 Documentation Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `QUICK_START_VERCEL.md` | You are here! Quick reference | Getting started |
| `VERCEL_SETUP_ACTION_PLAN.md` | Detailed step-by-step guide | Full setup |
| `VERCEL_ENVIRONMENT_SETUP.md` | Complete variable reference | Reference |
| `setup-vercel-env.ps1` | Automated setup script | Easy setup |
| `SUPABASE_SETUP.md` | Database configuration | Database setup |

---

## 🎯 What Happens After Setup?

Once environment variables are configured:

✅ **AI Features** - Chat, content generation, analysis  
✅ **Data Persistence** - Companies, keywords, reports saved to cloud  
✅ **SEO Tools** - Competitor analysis, keyword research  
✅ **Advanced Features** - Web scraping, integrations, automation  

Your production app will be fully functional and ready for real use!

---

## 💡 Pro Tips

1. **Start Small**: Add OPENAI_API_KEY first, test, then add more
2. **Use Dashboard**: Visual interface is easier for beginners
3. **Save Keys Securely**: Use a password manager for API keys
4. **Test Locally First**: Pull env variables to test locally before production
5. **Monitor Usage**: Check API usage on provider dashboards

---

## ⏭️ Next Steps After Setup

1. **Test All Features**: Go through each section of the app
2. **Add Your Data**: Import companies, keywords, competitors
3. **Configure Integrations**: Connect external services
4. **Set Up Monitoring**: Enable error tracking and analytics
5. **Optimize Performance**: Review and optimize as needed

---

**Need Help?**
- See `VERCEL_SETUP_ACTION_PLAN.md` for detailed instructions
- Check deployment logs: `vercel logs`
- Visit Vercel dashboard: https://vercel.com/unite-group/web-app

**Ready? Let's go! 🚀**

Choose your path above and start the setup. You'll have a fully functional production app in 15-30 minutes!
