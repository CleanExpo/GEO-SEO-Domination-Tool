# Product Requirements Document: Post-Audit Automation System

**Priority**: P0 - Critical
**Status**: In Development
**Owner**: AI Automation Team
**Last Updated**: January 11, 2025

---

## 1. Executive Summary

After an SEO audit completes with identified issues and recommendations, the system should automatically create actionable agent tasks and enable AI agents to directly fix website issues. This requires secure storage of website credentials (FTP, WP-Admin, hosting panel, GitHub) and a task orchestration system.

**Goal**: Reduce manual intervention from "audit results → fixes deployed" from hours/days to minutes.

---

## 2. Problem Statement

### Current State (Manual Process)

1. ✅ Audit runs and identifies issues (e.g., "Missing H1 tag on /services page")
2. ❌ **Human manually reviews audit report**
3. ❌ **Human logs into website** (WordPress, cPanel, FTP, GitHub)
4. ❌ **Human makes changes** (adds H1 tag, optimizes images, fixes meta descriptions)
5. ❌ **Human verifies changes** (re-runs audit)

**Time**: 2-4 hours per client
**Scalability**: Limited to human capacity
**Consistency**: Varies by person

### Desired State (Automated Process)

1. ✅ Audit runs and identifies issues
2. ✅ **System maps issues to agent tasks** (e.g., "Add H1: 'Professional Water Damage Restoration' to /services")
3. ✅ **Agent connects to website** using stored credentials (auto-selected based on site platform)
4. ✅ **Agent executes fix** (modifies page content, updates images, adds schema markup)
5. ✅ **System verifies fix** (re-audits changed pages)
6. ✅ **Client receives summary** (before/after comparison with improvements highlighted)

**Time**: 10-15 minutes (automated)
**Scalability**: Hundreds of clients simultaneously
**Consistency**: 100% - same fix applied the same way every time

---

## 3. Core Features

### 3.1 Website Credentials Management

**Table**: `website_credentials`

Store encrypted credentials for various access methods:

| Access Method | Use Case | Fields Required |
|--------------|----------|-----------------|
| **WordPress REST API** | Best for WP sites | `wp_url`, `wp_username`, `wp_app_password` |
| **WP-Admin Login** | Fallback for WP | `wp_url`, `wp_username`, `wp_password` |
| **FTP/SFTP** | Direct file access | `ftp_host`, `ftp_port`, `ftp_username`, `ftp_password`, `ftp_root_path` |
| **cPanel API** | Hosting management | `cpanel_url`, `cpanel_username`, `cpanel_api_token` |
| **GitHub** | Code-based sites | `github_repo`, `github_token`, `github_branch` |
| **Vercel** | Next.js/Jamstack | `vercel_project_id`, `vercel_token` |
| **Shopify** | E-commerce | `shopify_store_url`, `shopify_access_token` |

**Security Requirements**:
- ✅ All credentials encrypted at rest (AES-256)
- ✅ Encryption keys stored in Vercel environment variables
- ✅ Access logs for audit trail
- ✅ Per-user permissions (only company owner can view/edit)
- ✅ Optional: Rotate credentials every 90 days (auto-reminder)

### 3.2 Audit-to-Task Mapper

**Purpose**: Convert audit findings into structured agent tasks

**Input**: Audit results from `seo_audits` table
```typescript
{
  issues: [
    {
      type: 'error',
      category: 'meta',
      message: 'Missing H1 tag',
      impact: 'high',
      page: '/services'
    }
  ],
  recommendations: [
    "Add descriptive H1 headings to all pages",
    "Optimize image file sizes (reduce by 60%)",
    "Add alt text to 12 images missing descriptions"
  ]
}
```

**Output**: Structured agent tasks in `agent_tasks` table
```typescript
{
  task_id: 'uuid',
  company_id: 'uuid',
  audit_id: 'uuid',
  task_type: 'add_h1_tag',
  priority: 'high',
  status: 'pending',
  page_url: '/services',
  instructions: {
    action: 'add_element',
    element: 'h1',
    content: 'Professional Water Damage Restoration Services',
    position: 'before_first_paragraph'
  },
  estimated_time_seconds: 15,
  agent_type: 'claude_computer_use' // or 'github_copilot', 'custom_script'
}
```

**Task Types** (20+ common fixes):

| Task Type | Category | Auto-Fixable? | Agent Required |
|-----------|----------|---------------|----------------|
| `add_h1_tag` | Content | ✅ Yes | WordPress REST API |
| `optimize_images` | Performance | ✅ Yes | FTP + Image API |
| `add_alt_text` | Accessibility | ✅ Yes | WordPress REST API |
| `add_meta_description` | SEO | ✅ Yes | WordPress REST API |
| `fix_broken_link` | Content | ✅ Yes | WordPress REST API |
| `add_schema_markup` | SEO | ✅ Yes | FTP / GitHub |
| `minify_css` | Performance | ✅ Yes | FTP / Build Pipeline |
| `lazy_load_images` | Performance | ⚠️ Partial | Theme modification |
| `add_ssl_redirect` | Security | ✅ Yes | .htaccess / Nginx config |
| `fix_mobile_viewport` | Mobile | ✅ Yes | WordPress / Theme |
| `improve_page_speed` | Performance | ⚠️ Partial | Multiple fixes |
| `add_internal_links` | SEO | 🤖 AI-assisted | Content analysis |
| `rewrite_content_seo` | Content | 🤖 AI-assisted | Claude/GPT |
| `create_blog_post` | Content | 🤖 AI-assisted | Claude/GPT |
| `optimize_keywords` | SEO | 🤖 AI-assisted | Content analysis |

### 3.3 Agent Task Queue System

**Table**: `agent_tasks`

**Lifecycle**:
1. **Pending** - Task created, waiting for execution
2. **In Progress** - Agent actively working on task
3. **Completed** - Task finished successfully
4. **Failed** - Task failed (with error details)
5. **Requires Review** - Task completed but needs human approval

**Queue Priority**:
- **P0 Critical** (red): Broken functionality, major SEO issues
- **P1 High** (orange): Missing H1, slow page speed, broken links
- **P2 Medium** (yellow): Missing alt text, suboptimal meta descriptions
- **P3 Low** (green): Nice-to-haves, content improvements

**Execution Strategy**:
- **Sequential**: Execute tasks one at a time (safer, slower)
- **Parallel**: Execute multiple tasks simultaneously (faster, requires careful conflict management)
- **Batched**: Group related tasks (e.g., all image optimizations together)

### 3.4 Agent Integration Framework

**Supported Agents**:

#### Option 1: Claude Computer Use (Recommended)
**API**: Anthropic Claude with Computer Use MCP
**Best For**: Complex multi-step fixes, visual tasks, WordPress admin navigation
**Credentials Required**: WP-Admin login, FTP
**Example Use Case**:
```typescript
{
  agent: 'claude_computer_use',
  task: 'Add H1 tag to /services page',
  instructions: `
    1. Navigate to ${wp_admin_url}/wp-admin
    2. Login with provided credentials
    3. Go to Pages → Edit "Services"
    4. Find the main content area
    5. Add H1 heading: "Professional Water Damage Restoration"
    6. Click "Update"
    7. Verify change on live site
  `,
  credentials: { /* encrypted */ }
}
```

#### Option 2: WordPress REST API (Fastest)
**API**: Native WordPress REST API
**Best For**: Simple content changes, meta updates
**Credentials Required**: WP App Password
**Example Use Case**:
```typescript
POST /wp-json/wp/v2/pages/123
Authorization: Basic base64(username:app_password)
{
  "title": "Water Damage Services Brisbane",
  "content": "<h1>Professional Water Damage Restoration</h1>..."
}
```

#### Option 3: GitHub Copilot / OpenAI Codex (Code Changes)
**API**: GitHub API + Codex
**Best For**: Code-based sites (Next.js, React, static sites)
**Credentials Required**: GitHub token
**Example Use Case**:
```typescript
{
  agent: 'github_copilot',
  task: 'Add schema markup to service page',
  instructions: `
    1. Checkout branch: feature/seo-improvements
    2. Open file: app/services/page.tsx
    3. Add LocalBusiness schema JSON-LD to <head>
    4. Commit: "feat: add LocalBusiness schema markup"
    5. Create PR for review
  `,
  credentials: { github_token: '...' }
}
```

#### Option 4: Custom Scripts (Specialized Tasks)
**Best For**: Repetitive tasks, bulk operations, image optimization
**Example**: Bulk image optimization using Sharp + FTP

### 3.5 Progress Tracking & Verification

**Real-Time Progress Updates** (WebSocket or polling):
```typescript
{
  task_id: 'uuid',
  status: 'in_progress',
  progress_pct: 65,
  current_step: 'Uploading optimized images (8/12)',
  estimated_seconds_remaining: 45,
  logs: [
    '✓ Logged into WordPress',
    '✓ Navigated to Media Library',
    '⏳ Optimizing image: hero-banner.jpg (2.1MB → 450KB)',
  ]
}
```

**Verification**:
- **Automatic**: Re-audit affected pages after task completion
- **Visual Diff**: Screenshot before/after for visual changes
- **Performance Check**: Page speed before/after for optimization tasks
- **Link Check**: Verify internal/external links work after updates

**Rollback Capability**:
- Store backup of original content before making changes
- One-click revert if something breaks
- Automatic rollback if verification fails

### 3.6 Client Notification System

**Triggers**:
- ✅ Audit completed
- ✅ All automated fixes completed
- ⚠️ Some fixes require manual review
- ❌ Fix failed (with error details)

**Notification Channels**:
- Email (default)
- In-app notification
- Webhook (for integrations)
- SMS (for critical issues)

**Email Template Example**:
```
Subject: 🎉 Your Website Just Got 23% Faster!

Hi [Client],

Good news! We've automatically improved your website based on today's SEO audit.

✅ Fixes Applied (12 total):
  • Added H1 headings to 4 pages
  • Optimized 18 images (reduced size by 3.2MB)
  • Fixed 6 broken internal links
  • Added meta descriptions to 5 pages

📊 Results:
  • Performance Score: 67 → 87 (+20 points)
  • SEO Score: 78 → 92 (+14 points)
  • Page Load Time: 4.2s → 1.8s (-57%)

⚠️ Requires Your Review (2 tasks):
  • Content rewrite recommendation for /about page
  • SSL certificate expiring in 14 days

View Full Report: [link]

- Your GEO-SEO Domination Tool
```

---

## 4. Database Schema

### 4.1 Website Credentials

```sql
CREATE TABLE IF NOT EXISTS website_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Platform type
  platform_type TEXT NOT NULL, -- 'wordpress', 'shopify', 'custom', 'static'
  primary_access_method TEXT NOT NULL, -- 'wp_rest_api', 'ftp', 'github', 'cpanel'

  -- WordPress
  wp_url TEXT,
  wp_username TEXT,
  wp_app_password_encrypted TEXT, -- Recommended
  wp_password_encrypted TEXT, -- Fallback

  -- FTP/SFTP
  ftp_host TEXT,
  ftp_port INTEGER DEFAULT 21,
  ftp_username TEXT,
  ftp_password_encrypted TEXT,
  ftp_root_path TEXT DEFAULT '/',
  ftp_protocol TEXT DEFAULT 'ftp', -- 'ftp', 'sftp', 'ftps'

  -- cPanel
  cpanel_url TEXT,
  cpanel_username TEXT,
  cpanel_api_token_encrypted TEXT,

  -- GitHub
  github_repo TEXT, -- 'owner/repo'
  github_token_encrypted TEXT,
  github_branch TEXT DEFAULT 'main',

  -- Vercel
  vercel_project_id TEXT,
  vercel_token_encrypted TEXT,

  -- Shopify
  shopify_store_url TEXT,
  shopify_access_token_encrypted TEXT,

  -- SSH (advanced)
  ssh_host TEXT,
  ssh_port INTEGER DEFAULT 22,
  ssh_username TEXT,
  ssh_private_key_encrypted TEXT,

  -- Metadata
  notes TEXT,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,

  CONSTRAINT unique_company_platform UNIQUE(company_id, platform_type)
);

CREATE INDEX idx_website_credentials_company_id ON website_credentials(company_id);
```

### 4.2 Agent Tasks

```sql
CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  audit_id UUID REFERENCES seo_audits(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Task details
  task_type TEXT NOT NULL, -- 'add_h1_tag', 'optimize_images', etc.
  category TEXT NOT NULL, -- 'content', 'performance', 'seo', 'accessibility'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'requires_review'

  -- Execution details
  page_url TEXT,
  element_selector TEXT, -- CSS selector for targeted changes
  instructions JSONB NOT NULL,
  estimated_time_seconds INTEGER,

  -- Agent details
  agent_type TEXT, -- 'claude_computer_use', 'wp_rest_api', 'github_copilot', 'custom_script'
  agent_execution_logs JSONB DEFAULT '[]',

  -- Results
  success BOOLEAN,
  error_message TEXT,
  before_snapshot TEXT, -- URL to screenshot or content backup
  after_snapshot TEXT,
  performance_impact JSONB, -- { score_before: 67, score_after: 87 }

  -- Approval workflow
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,

  -- Rollback
  rollback_data JSONB, -- Backup data for reverting changes
  rolled_back_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT valid_priority CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'requires_review', 'rolled_back'))
);

CREATE INDEX idx_agent_tasks_company_id ON agent_tasks(company_id);
CREATE INDEX idx_agent_tasks_audit_id ON agent_tasks(audit_id);
CREATE INDEX idx_agent_tasks_status ON agent_tasks(status) WHERE status IN ('pending', 'in_progress');
CREATE INDEX idx_agent_tasks_priority ON agent_tasks(priority);
```

### 4.3 Task Execution Logs

```sql
CREATE TABLE IF NOT EXISTS task_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  log_level TEXT NOT NULL, -- 'info', 'warning', 'error', 'success'
  message TEXT NOT NULL,
  step_number INTEGER,
  progress_pct INTEGER,

  metadata JSONB, -- Additional context (URLs, file paths, API responses)

  CONSTRAINT valid_log_level CHECK (log_level IN ('info', 'warning', 'error', 'success'))
);

CREATE INDEX idx_task_execution_logs_task_id ON task_execution_logs(task_id);
CREATE INDEX idx_task_execution_logs_timestamp ON task_execution_logs(timestamp DESC);
```

---

## 5. API Endpoints

### 5.1 Credentials Management

**POST /api/companies/[id]/credentials**
```typescript
// Create/update website credentials
{
  platform_type: 'wordpress',
  primary_access_method: 'wp_rest_api',
  wp_url: 'https://example.com',
  wp_username: 'admin',
  wp_app_password: 'xxxx xxxx xxxx xxxx' // Will be encrypted
}
// Response: { id: 'uuid', created_at: '2025-01-11...' }
```

**GET /api/companies/[id]/credentials**
```typescript
// Retrieve credentials (returns encrypted fields masked)
// Response: { platform_type: 'wordpress', wp_username: 'admin', wp_app_password: '****' }
```

**DELETE /api/companies/[id]/credentials/[credentialId]**
```typescript
// Remove credentials
// Response: { success: true }
```

### 5.2 Task Management

**POST /api/agent-tasks/create-from-audit**
```typescript
// Auto-generate tasks from audit results
{
  audit_id: 'uuid',
  auto_execute: false, // If true, immediately start executing tasks
  require_approval: true // If true, tasks wait for approval before executing
}
// Response: { tasks_created: 12, task_ids: ['uuid1', 'uuid2', ...] }
```

**GET /api/agent-tasks?company_id=uuid&status=pending**
```typescript
// List tasks with filtering
// Response: { tasks: [...], total: 12, pending: 8, completed: 4 }
```

**POST /api/agent-tasks/[id]/execute**
```typescript
// Execute a specific task
// Response: { status: 'in_progress', progress_url: '/api/agent-tasks/uuid/progress' }
```

**GET /api/agent-tasks/[id]/progress**
```typescript
// Get real-time progress (SSE or WebSocket)
// Response: { progress_pct: 45, current_step: '...', logs: [...] }
```

**POST /api/agent-tasks/[id]/approve**
```typescript
// Approve a task that requires review
// Response: { approved: true, will_execute_at: '2025-01-11T14:30:00Z' }
```

**POST /api/agent-tasks/[id]/rollback**
```typescript
// Revert changes made by a task
// Response: { rolled_back: true, reverted_to_state: {...} }
```

---

## 6. Implementation Phases

### Phase 1: Foundation (Week 1)
- ✅ Database schema for credentials and tasks
- ✅ Credentials management API endpoints
- ✅ Basic encryption/decryption utilities
- ✅ Credentials UI in company settings

### Phase 2: Task Mapping (Week 2)
- ✅ Audit-to-task mapper algorithm
- ✅ 10 common task types implemented
- ✅ Task queue system
- ✅ Task creation API endpoints

### Phase 3: Agent Integration (Week 3-4)
- ✅ WordPress REST API executor
- ✅ FTP file manipulation executor
- ✅ Claude Computer Use integration (basic)
- ✅ Task execution logging

### Phase 4: Verification & Rollback (Week 5)
- ✅ Before/after screenshot capture
- ✅ Re-audit verification
- ✅ Rollback functionality
- ✅ Success metrics tracking

### Phase 5: UI & Notifications (Week 6)
- ✅ Task progress dashboard
- ✅ Real-time task monitoring
- ✅ Email notifications
- ✅ Approval workflow UI

---

## 7. Success Metrics

### Technical Metrics
- **Task Success Rate**: >90% of tasks complete without errors
- **Execution Time**: Average <2 minutes per task
- **Verification Pass Rate**: >95% of tasks pass re-audit
- **Rollback Rate**: <5% of tasks require rollback

### Business Metrics
- **Time Savings**: 2-4 hours → 10-15 minutes per audit
- **Client Satisfaction**: >4.5/5 stars for automated fixes
- **Scale**: 100+ clients automated simultaneously
- **ROI**: 10x reduction in manual labor costs

---

## 8. Security Considerations

1. ✅ **Encryption at Rest**: All credentials encrypted with AES-256
2. ✅ **Key Management**: Encryption keys in Vercel environment (never in code)
3. ✅ **Access Control**: Only company owners can view/edit credentials
4. ✅ **Audit Trail**: Log all credential access and task executions
5. ✅ **Rotate Credentials**: Prompt to rotate every 90 days
6. ✅ **Principle of Least Privilege**: Use app passwords (not admin passwords) when possible
7. ✅ **Backup Before Modify**: Always create rollback point before changes
8. ✅ **Approval Workflow**: High-risk changes require human approval

---

**Status**: Ready to implement Phase 1
**Next Steps**: Database migration for credentials table
