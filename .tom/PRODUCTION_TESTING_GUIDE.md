# 🧪 PRODUCTION TESTING GUIDE
**Production URL**: https://geo-seo-domination-tool-qybjjcrlj-unite-group.vercel.app
**Deployment**: d472ed9 (October 11, 2025)
**Status**: ✅ DEPLOYED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📋 CRITICAL USER FLOWS TO TEST

### 1. Onboarding Flow (5 Steps)

**Test Path**: Homepage → "Get Started" → Complete 5-step onboarding

**Steps to Test**:

1. **Business Info (Step 0)**
   - URL: `/onboarding?step=0`
   - Fields: Business name, website URL, location
   - Expected: Form validation, proceed to step 1

2. **Website Details (Step 1)**
   - URL: `/onboarding?step=1`
   - Fields: Industry, target audience, competitors
   - Expected: Form validation, proceed to step 2

3. **SEO Goals (Step 2)**
   - URL: `/onboarding?step=2`
   - Fields: Primary goals (rankings, traffic, conversions)
   - Expected: Multi-select checkboxes, proceed to step 3

4. **Content Strategy (Step 3)**
   - URL: `/onboarding?step=3`
   - Fields: Content types, publishing frequency
   - Expected: Form validation, proceed to step 4

5. **Services & Budget (Step 4)**
   - URL: `/onboarding?step=4`
   - Fields: Services needed, monthly budget
   - Expected: Final submission, redirect to dashboard

**Expected Result**: Company created, redirected to dashboard with welcome message

**API Endpoints Used**:
- `POST /api/onboarding/start` - Create company
- `GET /api/companies/[id]` - Load company data

**How to Test**:

\`\`\`bash
# Open production URL in browser
open https://geo-seo-domination-tool-qybjjcrlj-unite-group.vercel.app

# OR use curl for API testing
curl -X POST https://geo-seo-domination-tool-qybjjcrlj-unite-group.vercel.app/api/onboarding/start \\
  -H "Content-Type: application/json" \\
  -d '{
    "businessName": "Test Company",
    "website": "https://testcompany.com",
    "location": "Brisbane, Australia",
    "industry": "Home Services"
  }'
\`\`\`

### 2. Run SEO Audit

**Test Path**: Dashboard → Select company → Click "Run Audit"

**Steps to Test**:

1. Navigate to `/dashboard`
2. Click on a company
3. Click "Run Audit" button
4. Wait for audit to complete
5. View results

**Expected Result**:
- Audit initiated successfully
- Loading state displayed
- Audit results shown with scores
- E-E-A-T score calculated
- Technical issues listed

**API Endpoints Used**:
- `POST /api/seo-audits` - Trigger audit
- `GET /api/seo-audits` - Fetch audit results
- `GET /api/companies/[id]` - Get company details

**How to Test (curl)**:

\`\`\`bash
# Replace [companyId] with actual company ID
COMPANY_ID="your-company-id-here"

# Trigger audit
curl -X POST https://geo-seo-domination-tool-qybjjcrlj-unite-group.vercel.app/api/seo-audits \\
  -H "Content-Type: application/json" \\
  -d "{
    \"companyId\": \"$COMPANY_ID\",
    \"url\": \"https://testcompany.com\"
  }"

# Fetch audit results
curl https://geo-seo-domination-tool-qybjjcrlj-unite-group.vercel.app/api/seo-audits?companyId=$COMPANY_ID
\`\`\`

### 3. CRM Contacts Management

**Test Path**: Dashboard → CRM → Contacts

**Steps to Test**:

1. Navigate to `/crm/contacts`
2. Click "Add Contact" button
3. Fill in contact details (name, email, company)
4. Click "Save"
5. Verify contact appears in list
6. Click contact to view details
7. Edit contact
8. Delete contact

**Expected Result**:
- Contact created successfully
- Contact displayed in list
- Contact details editable
- Contact deleteable

**API Endpoints Used**:
- `GET /api/crm/contacts` - List contacts
- `POST /api/crm/contacts` - Create contact
- `GET /api/crm/contacts/[id]` - Get contact
- `PUT /api/crm/contacts/[id]` - Update contact
- `DELETE /api/crm/contacts/[id]` - Delete contact

**How to Test (curl)**:

\`\`\`bash
# Create contact
curl -X POST https://geo-seo-domination-tool-qybjjcrlj-unite-group.vercel.app/api/crm/contacts \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "company": "Example Corp",
    "phone": "+61 123 456 789"
  }'

# List contacts
curl https://geo-seo-domination-tool-qybjjcrlj-unite-group.vercel.app/api/crm/contacts

# Search contacts
curl "https://geo-seo-domination-tool-qybjjcrlj-unite-group.vercel.app/api/crm/contacts?search=John"
\`\`\`

### 4. Autonomous Agent Status

**Test Path**: Dashboard → Autonomous Agent → Status

**Steps to Test**:

1. Navigate to `/agents/autonomous-seo` (or wherever agent dashboard is)
2. View agent status (running/paused/error)
3. View current task
4. View statistics (audits today, content generated, etc.)
5. View recent audits
6. View alerts

**Expected Result**:
- Agent status displayed
- Statistics shown
- Recent activity visible
- Alerts listed (if any)

**API Endpoints Used**:
- `GET /api/agents/autonomous-seo?action=status` - Agent status
- `GET /api/agents/autonomous-seo?action=schedules` - List schedules
- `GET /api/agents/autonomous-seo?action=alerts` - Get alerts
- `GET /api/agents/autonomous-seo?action=recent-audits` - Recent audits

**How to Test (curl)**:

\`\`\`bash
# Get agent status
curl "https://geo-seo-domination-tool-qybjjcrlj-unite-group.vercel.app/api/agents/autonomous-seo?action=status"

# List schedules
curl "https://geo-seo-domination-tool-qybjjcrlj-unite-group.vercel.app/api/agents/autonomous-seo?action=schedules"

# Get alerts
curl "https://geo-seo-domination-tool-qybjjcrlj-unite-group.vercel.app/api/agents/autonomous-seo?action=alerts"

# Recent audits
curl "https://geo-seo-domination-tool-qybjjcrlj-unite-group.vercel.app/api/agents/autonomous-seo?action=recent-audits&limit=10"
\`\`\`

### 5. Per-Company Autopilot

**Test Path**: Company Details → Autopilot Tab → Enable/Disable

**Steps to Test**:

1. Navigate to `/clients/[id]/autopilot`
2. View current autopilot status
3. Click "Enable Autopilot"
4. Select schedule (daily/weekly)
5. Select features (audits, content, technical, rankings)
6. Click "Save"
7. Verify autopilot enabled
8. Click "Run Now" to trigger immediate run
9. Click "Disable Autopilot"

**Expected Result**:
- Autopilot status displayed
- Configuration saved
- Manual run triggered
- Autopilot disable successful

**API Endpoints Used**:
- `GET /api/clients/[companyId]/autopilot/status` - Get status
- `POST /api/clients/[companyId]/autopilot/enable` - Enable autopilot
- `POST /api/clients/[companyId]/autopilot/disable` - Disable autopilot
- `POST /api/clients/[companyId]/autopilot/run-now` - Trigger run

**How to Test (curl)**:

\`\`\`bash
COMPANY_ID="your-company-id-here"

# Get autopilot status
curl "https://geo-seo-domination-tool-qybjjcrlj-unite-group.vercel.app/api/clients/$COMPANY_ID/autopilot/status"

# Enable autopilot
curl -X POST "https://geo-seo-domination-tool-qybjjcrlj-unite-group.vercel.app/api/clients/$COMPANY_ID/autopilot/enable" \\
  -H "Content-Type: application/json" \\
  -d '{
    "schedule": "daily",
    "features": ["audits", "content", "technical"]
  }'

# Trigger immediate run
curl -X POST "https://geo-seo-domination-tool-qybjjcrlj-unite-group.vercel.app/api/clients/$COMPANY_ID/autopilot/run-now"

# Disable autopilot
curl -X POST "https://geo-seo-domination-tool-qybjjcrlj-unite-group.vercel.app/api/clients/$COMPANY_ID/autopilot/disable"
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🆕 NEW ENDPOINTS TO TEST (38 Total)

### CRM System (9 Endpoints)

**Contacts**:
- ✅ `GET /api/crm/contacts` - List with search
- ✅ `POST /api/crm/contacts` - Create
- ✅ `GET /api/crm/contacts/[id]` - Get single
- ✅ `PUT /api/crm/contacts/[id]` - Update
- ✅ `DELETE /api/crm/contacts/[id]` - Delete

**Deals**:
- ✅ `GET /api/crm/deals` - List deals
- ✅ `POST /api/crm/deals` - Create deal
- ✅ `PUT /api/crm/deals/[id]` - Update deal
- ✅ `DELETE /api/crm/deals/[id]` - Delete deal

**Tasks**:
- ✅ `GET /api/crm/tasks` - List tasks
- ✅ `POST /api/crm/tasks` - Create task
- ✅ `PUT /api/crm/tasks/[id]` - Update task
- ✅ `DELETE /api/crm/tasks/[id]` - Delete task

**Portfolio**:
- ✅ `GET /api/crm/portfolio` - List portfolio items
- ✅ `POST /api/crm/portfolio` - Add portfolio item
- ✅ `PUT /api/crm/portfolio/[id]` - Update item
- ✅ `DELETE /api/crm/portfolio/[id]` - Delete item

### Resources Library (5 Endpoints)

**AI Tools**:
- ✅ `GET /api/resources/ai-tools` - List AI tools
- ✅ `POST /api/resources/ai-tools` - Add tool
- ✅ `GET/PUT/DELETE /api/resources/ai-tools/[id]`

**Components**:
- ✅ `GET /api/resources/components` - List components
- ✅ `POST /api/resources/components` - Add component
- ✅ `GET/PUT/DELETE /api/resources/components/[id]`

**Prompts**:
- ✅ `GET /api/resources/prompts` - List prompts
- ✅ `POST /api/resources/prompts` - Add prompt
- ✅ `GET/PUT/DELETE /api/resources/prompts/[id]`

### Project Management (8 Endpoints)

**Projects**:
- ✅ `GET /api/projects` - List projects
- ✅ `POST /api/projects` - Create project
- ✅ `GET/PUT/DELETE /api/projects/[id]`

**GitHub**:
- ✅ `GET /api/projects/github` - List repos
- ✅ `GET /api/projects/github/[repo]` - Repo details
- ✅ `POST /api/projects/github/deploy` - Deploy

**Jobs**:
- ✅ `GET /api/jobs` - List jobs
- ✅ `GET /api/jobs/[id]` - Job details
- ✅ `POST /api/jobs/[id]/run` - Run job

**Analytics & Deploy**:
- ✅ `GET /api/analytics` - Dashboard
- ✅ `GET /api/analytics/export` - Export CSV
- ✅ `POST /api/deploy` - Deploy to Vercel
- ✅ `GET /api/deploy/status` - Status
- ✅ `POST /api/deploy/rollback` - Rollback

### Autonomous Agent (7+ Endpoints)

**Agent Management**:
- ✅ `GET /api/agents/autonomous-seo?action=status`
- ✅ `GET /api/agents/autonomous-seo?action=schedules`
- ✅ `GET /api/agents/autonomous-seo?action=alerts`
- ✅ `GET /api/agents/autonomous-seo?action=recent-audits`
- ✅ `POST /api/agents/autonomous-seo` - Create schedule

**Schedules**:
- ✅ `PUT /api/agents/autonomous-seo/schedules/[id]`
- ✅ `DELETE /api/agents/autonomous-seo/schedules/[id]`

**Alerts**:
- ✅ `POST /api/agents/autonomous-seo/alerts/[id]/acknowledge`
- ✅ `POST /api/agents/autonomous-seo/alerts/configure`

**Per-Company Autopilot**:
- ✅ `GET /api/clients/[companyId]/autopilot/status`
- ✅ `POST /api/clients/[companyId]/autopilot/enable`
- ✅ `POST /api/clients/[companyId]/autopilot/disable`
- ✅ `POST /api/clients/[companyId]/autopilot/run-now`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ✅ TESTING CHECKLIST

### Critical Flows
- [ ] Complete 5-step onboarding (create test company)
- [ ] Run SEO audit on test company
- [ ] View audit results
- [ ] Create CRM contact
- [ ] View CRM contact list
- [ ] Check autonomous agent status

### CRM System
- [ ] Create contact
- [ ] Edit contact
- [ ] Delete contact
- [ ] Create deal
- [ ] Update deal stage
- [ ] Create task
- [ ] Mark task complete
- [ ] Add portfolio item

### Resources Library
- [ ] List AI tools
- [ ] Add new AI tool
- [ ] List components
- [ ] Add component
- [ ] List prompts
- [ ] Add prompt

### Projects
- [ ] List projects
- [ ] Create project
- [ ] View project details
- [ ] List GitHub repos
- [ ] Trigger deployment

### Autonomous Agent
- [ ] Get agent status
- [ ] List schedules
- [ ] Create schedule
- [ ] Get alerts
- [ ] Enable autopilot for company
- [ ] Trigger manual run
- [ ] Disable autopilot

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🐛 KNOWN ISSUES & WORKAROUNDS

### Issue: Database Migration Not Applied

**Symptom**: Agent endpoints return errors about missing tables

**Workaround**: Apply Supabase migration manually (see [SUPABASE_MIGRATION_GUIDE.md](SUPABASE_MIGRATION_GUIDE.md))

**Status**: Migration file created, needs manual application

### Issue: TODO Comments in Endpoints

**Symptom**: Some endpoints have incomplete implementations (marked with TODO)

**Affected Endpoints**:
- `/api/agents/autonomous-seo` (actual execution logic)
- `/api/clients/[companyId]/autopilot/run-now` (actual execution logic)
- Various analytics endpoints

**Workaround**: Endpoints return placeholder data, won't execute actual tasks yet

**Status**: Low priority, non-blocking

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📊 EXPECTED TEST RESULTS

### Successful Test Indicators

✅ **Onboarding**:
- Company created in database
- Redirect to dashboard
- Company appears in companies list

✅ **SEO Audit**:
- Audit initiated (status: "running")
- Audit completes (status: "completed")
- Results displayed with scores (performance, accessibility, SEO, etc.)

✅ **CRM**:
- Contacts CRUD operations work
- Search functionality works
- Data persists across page refreshes

✅ **Agent**:
- Status returns (even if "paused")
- No 404 errors
- JSON responses valid

### Failure Indicators

❌ **404 Errors**: Endpoint not found (check Next.js routing)
❌ **500 Errors**: Server error (check Vercel logs, database connection)
❌ **CORS Errors**: Cross-origin issue (check middleware configuration)
❌ **RLS Errors**: "row-level security policy" errors (check admin client usage)
❌ **Database Errors**: "relation does not exist" (apply migration)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔍 DEBUGGING TIPS

### Check Vercel Logs

\`\`\`bash
# View real-time logs
vercel logs geo-seo-domination-tool

# Filter by function
vercel logs geo-seo-domination-tool --follow --scope=production
\`\`\`

### Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors during API calls
4. Check Network tab for failed requests

### Verify Environment Variables

Ensure production has all required env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin client)
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`
- `FIRECRAWL_API_KEY`

### Test Database Connection

\`\`\`bash
# If you have direct Supabase access
psql "postgresql://[connection-string]" -c "SELECT COUNT(*) FROM companies;"
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Testing Guide Created**: October 11, 2025, 12:08 PM
**Production URL**: https://geo-seo-domination-tool-qybjjcrlj-unite-group.vercel.app
**Deployment**: d472ed9
**Status**: Ready for testing
