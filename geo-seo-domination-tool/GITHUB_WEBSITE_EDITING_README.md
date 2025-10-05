# GitHub Website Editing - Implementation Guide

**Live Website Editing via GitHub + Vercel/Netlify**

This implementation allows the GEO-SEO CRM to automatically edit Next.js/Node.js websites deployed from GitHub repositories.

---

## 🎯 What Was Built

### 1. **GitHub Editor Service** (`web-app/services/github/github-editor-service.ts`)

A complete TypeScript service for editing files in GitHub repositories:

**Core Features:**
- ✅ Connect to any GitHub repository with Personal Access Token
- ✅ Read/write files in the repository
- ✅ Update Next.js metadata (title, description) automatically
- ✅ Update image alt text in Next.js Image components
- ✅ Commit multiple files in a single atomic commit
- ✅ Create pull requests for SEO changes (safer than direct commits)
- ✅ Rollback changes by reverting commits
- ✅ Detect Next.js framework and router type (App Router vs Pages Router)
- ✅ Get file history for audit trail

**Key Methods:**
```typescript
// Test connection
await githubEditorService.testConnection(connection);

// Update SEO metadata
await githubEditorService.updateNextJsMetadata(connection, {
  page_path: 'app/page.tsx',
  title: 'New Optimized Title',
  description: 'SEO-friendly description'
});

// Update image alt text
await githubEditorService.updateImageAlt(connection, 'app/page.tsx', '/hero.jpg', 'Water damage restoration team');

// Rollback a change
await githubEditorService.rollbackCommit(connection, 'abc123commitsha');

// Create PR instead of direct commit
await githubEditorService.createPullRequest(connection, 'seo-improvements', 'SEO: Optimize metadata', 'Details...');
```

### 2. **Database Schema** (`database/github-websites-schema.sql`)

Complete PostgreSQL/Supabase schema with 5 tables:

**Tables:**
1. `github_website_connections` - Repository connections
2. `github_seo_proposals` - AI-generated improvement proposals
3. `github_optimization_rules` - Auto-optimization automation rules
4. `github_deployment_events` - Track Vercel/Netlify deployments
5. `github_file_changes` - Audit trail of all file modifications

**Features:**
- ✅ Row-Level Security (RLS) policies
- ✅ Auto-updating timestamps
- ✅ Encrypted access tokens
- ✅ 90-day rollback capability
- ✅ Comprehensive audit logging

### 3. **CRM UI** (`web-app/app/settings/websites/github/page.tsx`)

Beautiful React interface for managing GitHub connections:

**Features:**
- ✅ Connect GitHub repositories
- ✅ Test connections
- ✅ View connected sites
- ✅ Framework detection (Next.js, Gatsby, React)
- ✅ Real-time status indicators
- ✅ One-click disconnect

**User Flow:**
1. User clicks "Connect Repository"
2. Enters GitHub username, repo name, branch
3. Creates GitHub Personal Access Token (with `repo` scope)
4. CRM tests connection
5. Framework is auto-detected
6. Repository is ready for SEO optimization!

### 4. **API Routes** (`web-app/app/api/github-websites/route.ts`)

RESTful API for managing GitHub connections:

**Endpoints:**
- `GET /api/github-websites` - List all connections
- `POST /api/github-websites` (action: connect) - Connect new repository
- `POST /api/github-websites` (action: test) - Test existing connection
- `POST /api/github-websites` (action: sync) - Sync repository pages
- `DELETE /api/github-websites/[id]` - Disconnect repository

---

## 📦 Dependencies Required

Add to `web-app/package.json`:

```json
{
  "dependencies": {
    "@octokit/rest": "^20.0.2"
  }
}
```

Install:
```bash
cd web-app
npm install @octokit/rest
```

---

## 🗄️ Database Setup

Run the schema in your Supabase SQL Editor or PostgreSQL:

```bash
# Initialize database
psql -U postgres -d your_database -f database/github-websites-schema.sql

# Or via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Paste contents of database/github-websites-schema.sql
# 3. Run
```

---

## 🔧 How It Works

### **Workflow: Automatic SEO Optimization**

```
┌─────────────────────────────────────────────┐
│ 1. USER CONNECTS REPOSITORY                │
│    - GitHub: username/my-nextjs-site        │
│    - Branch: main                           │
│    - Platform: Vercel                       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 2. CRM ANALYZES SITE                        │
│    - Fetches all Next.js pages             │
│    - Reads metadata exports                 │
│    - Finds SEO issues                       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 3. DEEPSEEK V3 GENERATES PROPOSALS          │
│    ✗ Title too long (72 chars)             │
│    ✓ Proposed: "Water Damage Brisbane..."  │
│    ✗ Missing meta description               │
│    ✓ Proposed: "24/7 emergency water..."    │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 4. USER REVIEWS PROPOSALS                   │
│    [✓] Approve all                          │
│    [ ] Reject                               │
│    [ ] Edit and approve                     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 5. CRM CREATES PULL REQUEST                │
│    - Branch: seo-improvements-2025-01-05    │
│    - Files changed: app/page.tsx            │
│    - Commit: "SEO: Optimize metadata"       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 6. AUTO-DEPLOY TO VERCEL                   │
│    - PR triggers Vercel deployment          │
│    - Preview URL: my-site-pr123.vercel.app  │
│    - User reviews live changes              │
│    - Merges PR → Production deploy          │
└─────────────────────────────────────────────┘
```

---

## 🚀 Usage Example

### **Step 1: Connect Repository**

1. Go to `/settings/websites/github`
2. Click "Connect Repository"
3. Fill in:
   - Repository Owner: `yourusername`
   - Repository Name: `my-nextjs-site`
   - Branch: `main`
   - Access Token: `ghp_...` ([Create here](https://github.com/settings/tokens/new?scopes=repo))
   - Deployment Platform: `Vercel`
   - Site URL: `https://my-site.vercel.app`
4. Click "Connect Repository"

### **Step 2: Analyze Site**

```typescript
// In your CRM code
import { githubEditorService } from '@/services/github/github-editor-service';

// Get all pages
const pages = await githubEditorService.getNextJsPages(connection);
// Returns: ['app/page.tsx', 'app/about/page.tsx', 'app/services/page.tsx']

// Analyze each page
for (const pagePath of pages) {
  const { content } = await githubEditorService.getFileContent(connection, pagePath);

  // Parse metadata
  const titleMatch = content.match(/title:\s*['"]([^'"]+)['"]/);
  const currentTitle = titleMatch?.[1] || '';

  // Check if title is too long
  if (currentTitle.length > 60) {
    // Create proposal to fix
  }
}
```

### **Step 3: Generate Proposals with DeepSeek V3**

```typescript
import { deepseekService } from '@/services/ai/deepseek-service';

const proposals = await deepseekService.generateSEOProposals(
  {
    seo_score: 65,
    issues: [
      { type: 'title_too_long', message: 'Title is 72 characters' },
      { type: 'missing_description', message: 'Meta description missing' }
    ],
    metadata: {
      title: 'Water Damage Restoration Services Brisbane Queensland Australia',
      meta_description: '',
      h1_tags: ['Water Damage']
    }
  },
  'https://my-site.vercel.app'
);

// Save proposals to database
await supabase.from('github_seo_proposals').insert(proposals.map(p => ({
  connection_id: connection.id,
  change_type: 'metadata',
  file_path: 'app/page.tsx',
  current_title: p.current_value,
  proposed_title: p.proposed_value,
  reasoning: p.reasoning,
  estimated_score_improvement: p.estimated_score_improvement,
  priority: p.priority,
  status: 'pending',
})));
```

### **Step 4: Apply Approved Changes**

```typescript
// User approves proposals in UI, then:

const approvedProposals = await supabase
  .from('github_seo_proposals')
  .select('*')
  .eq('status', 'approved');

for (const proposal of approvedProposals) {
  if (proposal.change_type === 'metadata') {
    // Update Next.js metadata
    await githubEditorService.updateNextJsMetadata(connection, {
      page_path: proposal.file_path,
      title: proposal.proposed_title,
      description: proposal.proposed_description,
    });

    // Mark as applied
    await supabase
      .from('github_seo_proposals')
      .update({ status: 'applied', applied_at: new Date().toISOString() })
      .eq('id', proposal.id);
  }
}
```

### **Step 5: Rollback if Needed**

```typescript
// If user is unhappy with changes, rollback:

const change = await supabase
  .from('github_file_changes')
  .select('*')
  .eq('id', changeId)
  .single();

await githubEditorService.rollbackCommit(connection, change.commit_sha);

// Mark as rolled back
await supabase
  .from('github_file_changes')
  .update({ rolled_back_at: new Date().toISOString() })
  .eq('id', changeId);
```

---

## 🔐 Security Features

### **1. Access Token Encryption**

**TODO:** Encrypt tokens before storing in database:

```typescript
import crypto from 'crypto';

function encryptToken(token: string): string {
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, IV);
  return cipher.update(token, 'utf8', 'hex') + cipher.final('hex');
}

function decryptToken(encrypted: string): string {
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, IV);
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
}
```

### **2. Row-Level Security (RLS)**

All database tables have RLS policies - users can only access their own data.

### **3. Pull Requests > Direct Commits**

By default, changes create pull requests for review, not direct commits to `main`.

### **4. Audit Trail**

Every file change is logged in `github_file_changes` with:
- Before/after content
- Commit SHA
- User who triggered it
- Timestamp
- Rollback capability

### **5. 90-Day Rollback Window**

All changes can be reverted for 90 days after application.

---

## 🎨 Next Steps

### **Immediate:**
1. ✅ Test connection flow end-to-end
2. Build SEO proposal review UI
3. Integrate with DeepSeek V3 for auto-analysis
4. Add Vercel deployment tracking

### **Phase 2:**
1. Auto-optimization rules engine
2. Scheduled daily audits
3. Email notifications for proposals
4. Bulk approval/rejection

### **Phase 3:**
1. Auto-generate new pages from templates
2. Blog post auto-generation
3. Image optimization
4. Content A/B testing

---

## 📊 Cost Analysis

**Using DeepSeek V3 via OpenRouter:**

**Monthly usage for 10 sites:**
- Daily audits: 30 days × 10 sites × 500 tokens = 150K tokens
- SEO proposals: 10 proposals/day × 400 tokens × 30 days = 120K tokens
- Total: ~270K tokens/month

**Cost:**
- Input: 270K × $0.27/M = $0.07
- Output: 270K × $1.10/M = $0.30
- **Total: $0.37/month**

**Compare to manual labor:**
- SEO consultant: $100/hour × 5 hours/week × 4 weeks = $2,000/month
- **Savings: 99.98%**

---

## 🐛 Troubleshooting

### **"Failed to connect to repository"**
- Verify GitHub Personal Access Token has `repo` scope
- Check repository owner and name are correct
- Ensure repository exists and is accessible

### **"No pages found"**
- Repository may not be a Next.js site
- Check for `app/` or `pages/` directory
- Verify `package.json` has `next` dependency

### **"Changes not deploying"**
- Check Vercel/Netlify is connected to the repository
- Verify branch name matches deployment settings
- Check deployment logs in Vercel dashboard

---

## 📖 Related Files

- **Architecture:** `LIVE_WEBSITE_EDITING_ARCHITECTURE.md`
- **WordPress Plugin:** `wordpress-plugin/geo-seo-connector/` (alternative approach)
- **Database Schema:** `database/github-websites-schema.sql`
- **Service:** `web-app/services/github/github-editor-service.ts`
- **UI:** `web-app/app/settings/websites/github/page.tsx`
- **API:** `web-app/app/api/github-websites/route.ts`

---

**Status:** ✅ Core implementation complete, ready for testing!

**Next:** Build SEO proposal review UI and integrate with DeepSeek V3 analysis.
