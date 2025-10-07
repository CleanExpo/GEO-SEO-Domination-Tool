## Client Onboarding Flow - Complete End-to-End Automation

## Overview

The Client Onboarding Flow is a comprehensive, fully automated system that transforms a simple form submission into a complete, production-ready client workspace with SEO audits, content calendars, and automated workflows—all without manual intervention.

**Time to complete**: 2-5 minutes (automated)
**Manual effort required**: Zero (after form submission)

## Features

### 🎯 5-Step Automated Workflow

1. **Create Company Record** - Database entry with all client details
2. **Setup Workspace** - Isolated directory structure with configs
3. **Run SEO Audit** - Lighthouse + E-E-A-T analysis (if website exists)
4. **Generate Content Calendar** - 30/60/90-day plan based on frequency
5. **Send Welcome Email** - Dashboard access and next steps

### 📋 Client Intake Form

**Multi-step form with validation** ([`components/onboarding/ClientIntakeForm.tsx`](../components/onboarding/ClientIntakeForm.tsx)):

**Step 1: Business Information**
- Business name *
- Industry
- Contact name *
- Email *
- Phone
- Address

**Step 2: Website Details**
- Has existing website checkbox
- Website URL *
- Platform (WordPress, Shopify, etc.)

**Step 3: SEO Goals**
- Primary goals (checkboxes):
  - Increase organic traffic
  - Improve search rankings
  - Generate more leads
  - Boost local visibility
  - Enhance brand awareness
  - Drive online sales
- Target keywords (add multiple)
- Target locations (add multiple)
- Competitors (add URLs)

**Step 4: Content Preferences**
- Content types (checkboxes):
  - Blog posts
  - Landing pages
  - Product descriptions
  - Service pages
  - Case studies
  - News articles
  - FAQ content
  - Video scripts
- Content frequency:
  - Daily
  - Weekly (recommended)
  - Bi-weekly
  - Monthly
- Brand voice/tone (free text)

**Step 5: Services & Budget**
- Services (checkboxes with descriptions):
  - SEO Audit & Optimization
  - Content Creation
  - Local SEO
  - Link Building
  - Reporting & Analytics
  - Social Media Management
- Monthly budget:
  - Under $1,000/month
  - $1,000 - $2,500/month
  - $2,500 - $5,000/month
  - $5,000+/month

### 🤖 Onboarding Orchestrator

**Workflow engine** ([`services/onboarding/onboarding-orchestrator.ts`](../services/onboarding/onboarding-orchestrator.ts)):

#### Architecture
```typescript
class OnboardingOrchestrator extends EventEmitter {
  // Public API
  async startOnboarding(request: OnboardingRequest): Promise<string>
  getProgress(onboardingId: string): OnboardingProgress | undefined

  // Private workflow
  private async processOnboarding(id, request): Promise<void>
  private async executeStep(id, index, handler): Promise<void>

  // Step implementations
  private async createCompanyRecord(request): Promise<string>
  private async setupWorkspace(companyId, request): Promise<string>
  private async runInitialSEOAudit(companyId, request): Promise<any>
  private async generateContentCalendar(companyId, request): Promise<any>
  private async sendWelcomeEmail(companyId, request): Promise<void>
}
```

#### Event System
Emits real-time progress events:
- `progress` - Overall progress update
- `step_started` - Step begins
- `step_completed` - Step finishes successfully
- `step_failed` - Step encounters error
- `completed` - Entire workflow done
- `failed` - Workflow failed

### 📊 Real-Time Status Dashboard

**Live progress tracking** ([`app/onboarding/[id]/page.tsx`](../app/onboarding/[id]/page.tsx)):

- Step-by-step visual progress
- Status indicators (pending, running, completed, failed)
- Timestamps for each step
- Results display (audit scores, calendar items)
- Error messages with details
- Auto-redirect to dashboard when complete

**Polling mechanism**: Refreshes every 2 seconds

### 🗄️ Database Schema

**Tables** ([`database/onboarding-schema.sql`](../database/onboarding-schema.sql)):

#### onboarding_sessions
```sql
id, company_id, business_name, email, status, current_step,
request_data (JSON), steps_data (JSON), error,
created_at, started_at, completed_at
```

#### content_calendar
```sql
id, company_id, publish_date, title, content_type, target_keyword,
content, excerpt, meta_title, meta_description, slug,
status, assigned_to, published_url, published_at,
views, conversions, created_at, updated_at
```

#### workspace_configs
```sql
id, company_id, workspace_path, workspace_id, config_data (JSON),
features_enabled (JSON), access_level, storage_used_mb, storage_limit_mb,
active, created_at, updated_at
```

#### onboarding_templates (future enhancement)
```sql
id, name, description, industry, template_data (JSON),
default_content_types (JSON), default_frequency, default_goals (JSON),
active, featured, times_used, created_at, updated_at
```

#### onboarding_notifications
```sql
id, onboarding_id, type, recipient, subject, message,
status, error, provider, provider_message_id,
opened, opened_at, clicked, clicked_at, created_at, sent_at
```

**Views**:
- `v_recent_onboardings` - Recent onboarding sessions with progress
- `v_content_calendar_summary` - Content stats per company
- `v_workspace_usage` - Storage and access levels

## Usage

### Starting Onboarding

**Via UI**:
1. Click "New Client" in sidebar (marked with AUTO badge)
2. Fill out 5-step intake form
3. Click "Start Onboarding"
4. Redirected to status page

**Via API**:
```typescript
POST /api/onboarding/start
Content-Type: application/json

{
  "businessName": "Acme Corporation",
  "industry": "E-commerce",
  "contactName": "John Doe",
  "email": "john@acme.com",
  "phone": "+1 (555) 123-4567",
  "address": "123 Main St, City, State",
  "website": "https://www.acme.com",
  "hasExistingWebsite": true,
  "websitePlatform": "WordPress",
  "primaryGoals": ["Increase organic traffic", "Generate more leads"],
  "targetKeywords": ["digital marketing", "seo services", "content strategy"],
  "targetLocations": ["New York, NY", "Los Angeles, CA"],
  "competitors": ["https://competitor1.com", "https://competitor2.com"],
  "contentTypes": ["Blog posts", "Landing pages", "Case studies"],
  "contentFrequency": "weekly",
  "brandVoice": "Professional, authoritative, helpful",
  "selectedServices": ["SEO Audit & Optimization", "Content Creation", "Local SEO"],
  "budget": "2500-5000"
}

Response:
{
  "success": true,
  "onboardingId": "onboarding_1234567890_abc123",
  "message": "Onboarding started successfully"
}
```

### Checking Progress

```typescript
GET /api/onboarding/{onboardingId}

Response:
{
  "success": true,
  "progress": {
    "onboardingId": "onboarding_1234567890_abc123",
    "companyId": "company_1234567890",
    "status": "in_progress",
    "currentStep": "Run SEO Audit",
    "steps": [
      {
        "name": "Create Company Record",
        "status": "completed",
        "startedAt": "2025-01-07T10:00:00Z",
        "completedAt": "2025-01-07T10:00:05Z",
        "result": { "companyId": "company_1234567890" }
      },
      {
        "name": "Setup Workspace",
        "status": "completed",
        "startedAt": "2025-01-07T10:00:05Z",
        "completedAt": "2025-01-07T10:00:08Z",
        "result": { "workspacePath": "D:/GEO_SEO_Domination-Tool/workspaces/company_1234567890" }
      },
      {
        "name": "Run SEO Audit",
        "status": "running",
        "startedAt": "2025-01-07T10:00:08Z"
      },
      { "name": "Generate Content Calendar", "status": "pending" },
      { "name": "Send Welcome Email", "status": "pending" }
    ],
    "startedAt": "2025-01-07T10:00:00Z"
  }
}
```

## Workspace Structure

When a client is onboarded, the following directory structure is created:

```
workspaces/
└── {companyId}/
    ├── README.md
    ├── configs/
    │   └── workspace.json
    ├── content/
    │   ├── blog/
    │   ├── pages/
    │   └── drafts/
    ├── assets/
    │   └── images/
    └── reports/
        ├── seo/
        └── analytics/
```

**workspace.json**:
```json
{
  "companyId": "company_1234567890",
  "businessName": "Acme Corporation",
  "website": "https://www.acme.com",
  "createdAt": "2025-01-07T10:00:00Z",
  "targetKeywords": ["digital marketing", "seo services"],
  "contentFrequency": "weekly",
  "brandVoice": "Professional, authoritative, helpful"
}
```

## SEO Audit Automation

If client has existing website, automated Lighthouse audit runs:

**Audit Results**:
```json
{
  "url": "https://www.acme.com",
  "timestamp": "2025-01-07T10:00:10Z",
  "lighthouse": {
    "performance": 85,
    "accessibility": 92,
    "bestPractices": 88,
    "seo": 95,
    "overall": 90
  },
  "eeat": {
    "experience": 78,
    "expertise": 82,
    "authoritativeness": 75,
    "trustworthiness": 88,
    "overall": 81
  },
  "issues": [
    {
      "severity": "high",
      "category": "Performance",
      "description": "Large images not optimized",
      "recommendation": "Compress images and use modern formats (WebP)"
    }
  ],
  "recommendations": [
    "Optimize images for faster loading",
    "Add schema markup for better SERP appearance",
    "Improve mobile responsiveness"
  ]
}
```

Saved to `seo_audits` table with full details.

## Content Calendar Generation

Based on client's content frequency, generates 90-day plan:

**Example for "weekly" frequency**:
- 13 content items (90 days ÷ 7 days)
- Rotates through target keywords
- Rotates through selected content types
- Scheduled on same day of week

**Generated Items**:
```json
{
  "id": "content_1234567890_0",
  "publishDate": "2025-01-14T00:00:00Z",
  "title": "digital marketing - Blog posts",
  "contentType": "Blog posts",
  "targetKeyword": "digital marketing",
  "status": "planned",
  "assignedTo": null
}
```

All items saved to `content_calendar` table.

## Email Notifications

**Welcome email sent automatically**:

```html
<h1>Welcome, John!</h1>
<p>Your SEO workspace for Acme Corporation is ready.</p>

<strong>What we've done:</strong>
<ul>
  <li>Created your isolated workspace</li>
  <li>Ran initial SEO audit</li>
  <li>Generated your 90-day content calendar</li>
  <li>Set up tracking for 3 target keywords</li>
</ul>

<a href="https://yourdomain.com/dashboard/company_1234567890">
  Access Your Dashboard
</a>
```

## Integration Points

### With Existing Systems

**Companies Table**:
- Onboarding creates company record
- Links to contacts, audits, content calendar

**SEO Audits Table**:
- Initial audit saved with `audit_type = 'initial'`
- Visible in company dashboard immediately

**Content Calendar**:
- Integrated with content management workflow
- Can be edited, assigned, published through UI

**Autonomous Agents**:
- SEO audit agent can monitor onboarded clients
- Content generation agent can execute calendar items

## Error Handling

**Graceful failure**:
- Each step wrapped in try/catch
- Errors captured in step data
- Overall status set to 'failed'
- User notified with clear error message
- Can retry or contact support

**Common errors**:
1. **Database connection failure** - Retry mechanism
2. **Workspace permission denied** - Check disk permissions
3. **Audit timeout** - Website unreachable or slow
4. **Email send failure** - Email service unavailable

## Performance

**Expected timing**:
- Step 1 (Create Company): 1-2 seconds
- Step 2 (Setup Workspace): 1-2 seconds
- Step 3 (Run SEO Audit): 30-60 seconds (if website exists)
- Step 4 (Generate Calendar): 5-10 seconds
- Step 5 (Send Email): 1-2 seconds

**Total**: 40-77 seconds for full onboarding with audit

**Without website audit**: 10-20 seconds

## Monitoring & Analytics

**Track onboarding metrics**:
```sql
-- Onboarding success rate
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM onboarding_sessions), 2) as percentage
FROM onboarding_sessions
GROUP BY status;

-- Average completion time
SELECT
  AVG(julianday(completed_at) - julianday(created_at)) * 24 * 60 as avg_minutes
FROM onboarding_sessions
WHERE status = 'completed';

-- Recent onboardings
SELECT * FROM v_recent_onboardings LIMIT 10;
```

## Future Enhancements

### Planned Features
- [ ] **Onboarding Templates** - Pre-configured workflows by industry
- [ ] **Custom Branding** - White-label form and emails
- [ ] **Team Assignment** - Auto-assign account manager
- [ ] **Slack Integration** - Notify team in Slack
- [ ] **Welcome Video** - Personalized video walkthrough
- [ ] **Drip Email Campaign** - 7-day onboarding sequence
- [ ] **Competitor Analysis** - Automated competitor research
- [ ] **Keyword Research** - Expand keyword list with AI
- [ ] **Social Media Setup** - Connect social accounts
- [ ] **Analytics Setup** - Google Analytics/Search Console

### Enhancement Ideas
- **Multi-language Support** - i18n for intake form
- **Client Portal** - Self-service onboarding
- **Progress Webhooks** - Notify external systems
- **Onboarding Reports** - PDF summary of setup
- **Checklist System** - Post-onboarding tasks
- **Integration Marketplace** - Connect tools during onboarding

## Troubleshooting

### Issue: Form submission fails
**Solution**: Check required fields, ensure valid email format

### Issue: Workspace creation fails
**Solution**: Verify disk space and write permissions on `workspaces/` directory

### Issue: SEO audit times out
**Solution**: Check website is accessible, increase timeout in orchestrator

### Issue: Content calendar empty
**Solution**: Verify target keywords and content types were provided

### Issue: Email not sent
**Solution**: Configure email service (Resend/SendGrid), check API key

### Issue: Progress not updating
**Solution**: Check that onboarding process is running, verify database connection

## API Reference

### POST /api/onboarding/start
Start new client onboarding

**Request Body**: ClientIntakeData (see above)

**Response**: `{ success, onboardingId, message }`

### GET /api/onboarding/:id
Get onboarding progress

**Response**: `{ success, progress: OnboardingProgress }`

## Component Reference

- **ClientIntakeForm** - 5-step intake form with validation
- **OnboardingOrchestrator** - Workflow engine and step executor
- **OnboardingStatusPage** - Real-time progress dashboard

## Database Queries

### Get all active onboardings
```sql
SELECT * FROM v_recent_onboardings
WHERE status = 'in_progress'
ORDER BY created_at DESC;
```

### Get company's content calendar
```sql
SELECT * FROM content_calendar
WHERE company_id = ?
ORDER BY publish_date ASC;
```

### Get workspace usage stats
```sql
SELECT * FROM v_workspace_usage
WHERE storage_usage_percentage > 80;
```

---

**Version**: 1.0.0
**Last Updated**: 2025-01-07
**Maintainer**: GEO-SEO Development Team
