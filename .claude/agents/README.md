# GEO-SEO Domination Tool - Agent System

This directory contains specialized AI agents for building and maintaining the GEO-SEO platform.

## 🎯 Agent Overview

**Total Agents: 12**
- 1 Orchestrator (Orchestra)
- 11 Specialized Workers (Site Builder, Site Builder Bootstrap, Full Build Pipeline, Evaluator & Fixer, DevOps Deployer, Navigation, UI, SEMrush, Deployment, Database, Performance)

### 1. Orchestra (Orchestrator)
**File:** `orchestra.json`
**Role:** Master coordinator for all worker agents
**Purpose:** Plans, routes, and synthesizes work across all specialized agents

**When to Use:**
- Starting a new feature that requires multiple systems (navigation + UI + data)
- Coordinating major updates across the platform
- Need end-to-end validation of build → navigation → UI → data flow

**Example:**
```bash
# Launch Orchestra to build complete feature
claude-code --agent orchestra --input '{"projectPath": "./web-app", "domain": "disasterrecovery.com.au"}'
```

### 2. Site Builder
**File:** `site_builder.json`
**Role:** Next.js page and route scaffolder
**Purpose:** Creates pages, layouts, and routing structure

**When to Use:**
- Adding new pages to the application
- Creating dynamic routes for resources (companies, keywords, audits)
- Setting up layouts for new sections
- Need SEO metadata implementation

**Example:**
```bash
# Create new dashboard section
claude-code --agent site_builder --input '{
  "projectPath": "./web-app",
  "routes": ["/analytics", "/analytics/competitor", "/analytics/keywords"],
  "withLayouts": true,
  "withMetadata": true
}'
```

### 3. Site Builder Bootstrap
**File:** `site_builder_bootstrap.json`
**Role:** New project scaffolder
**Purpose:** Creates a brand new Next.js project from scratch with Tailwind and baseline structure

**When to Use:**
- Starting a completely new Next.js project
- Bootstrapping a new GEO-SEO application
- Setting up Tailwind CSS from scratch
- Creating initial app shell and layout
- Need a clean slate Next.js + Tailwind setup

**Example:**
```bash
# Bootstrap new project
claude-code --agent site_builder_bootstrap --input '{
  "workspacePath": "D:/Projects",
  "projectName": "MyGeoSeoApp"
}'
```

### 4. Full Build Pipeline (Runner)
**File:** `runner_full_build.json`
**Role:** Complete end-to-end project builder
**Purpose:** Runs the full pipeline from project creation to build validation with mock data

**When to Use:**
- Need a fully functional project in one step
- Creating demo environments with mock SEMrush data
- Quick project setup with navigation and UI components
- End-to-end pipeline testing
- Onboarding new developers with working template

**Example:**
```bash
# Create complete GEO-SEO project in one step
claude-code --agent runner_full_build --input '{
  "workspacePath": "D:/Projects",
  "projectName": "MyGeoSeoApp",
  "domain": "disasterrecoveryqld.au",
  "scaffoldRoutes": true
}'
```

**What it creates:**
- Next.js project with Tailwind CSS
- Navigation map with typed structure
- Sidebar component with active states
- StatCard component for metrics
- All placeholder routes (/seo, /pipeline, /resources, etc.)
- Mock SEMrush dataset with keywords and rankings
- Verified production build

### 5. Evaluator & Fixer
**File:** `evaluator_fixer.json`
**Role:** Quality assurance and auto-fix agent
**Purpose:** Validates builds, fixes configuration issues, scaffolds missing routes

**When to Use:**
- After running any agent that modifies project structure
- Post-deployment validation
- Debugging build failures
- Route consistency validation
- Configuration drift detection
- As final step in orchestrator workflows

**Example:**
```bash
# Validate and auto-fix project issues
claude-code --agent evaluator_fixer --input '{
  "projectPath": "./web-app",
  "domain": "disasterrecoveryqld.au",
  "autoScaffoldMissingRoutes": true
}'
```

**What it checks:**
- Build success (npm run build)
- Tailwind content paths configuration
- SEO dataset JSON structure
- Navigation routes existence
- Missing page.tsx files

**What it fixes:**
- Tailwind content paths → Updates to scan src/**
- Missing routes → Creates placeholder page.tsx
- Missing Tailwind directives → Adds to globals.css
- Generates .qa-report.txt with detailed results

### 6. DevOps Deployer
**File:** `devops_deployer.json`
**Role:** Vercel preview deployment automation
**Purpose:** Runs preflight checks, builds locally, and deploys to Vercel preview with URL capture

**When to Use:**
- Automated preview deployments in CI/CD
- Quick testing of feature branches
- Sharing work-in-progress with stakeholders
- Pre-production validation
- Integration testing with real URLs

**Example:**
```bash
# Deploy to Vercel preview
claude-code --agent devops_deployer --input '{
  "projectPath": "./web-app",
  "vercelProjectName": "geo-seo-app",
  "vercelToken": "${{ secrets.VERCEL_TOKEN }}"
}'
```

**What it does:**
- Verifies Node.js, npm, and Vercel CLI installed
- Sets VERCEL_TOKEN for non-interactive auth
- Creates .vercel/project.json if needed
- Builds project locally first
- Deploys to Vercel preview environment
- Captures and returns preview URL

**Security:**
- Never stores secrets in code
- Uses environment variables for tokens
- Supports GitHub Actions integration
- Follows Vercel security best practices

### 7. Navigation Bar Connections
**File:** `navigation_bar_connections.json`
**Role:** Navigation link validator and implementer
**Purpose:** Ensures all navigation links work and have proper active states

**When to Use:**
- After adding new pages/routes
- Fixing broken navigation links
- Implementing active state highlighting
- Need to generate navigation map documentation
- Improving accessibility of navigation

**Example:**
```bash
# Audit and fix navigation
claude-code --agent navigation_bar_connections --input '{
  "projectPath": "./web-app",
  "sidebarPath": "components/Sidebar.tsx",
  "generateNavMap": true
}'
```

### 8. UI-shadcn
**File:** `ui_shadcn.json`
**Role:** Design system implementer
**Purpose:** Adds shadcn/ui components and ensures UI consistency

**When to Use:**
- Need to add new UI components (dialogs, tables, forms)
- Implementing design system across pages
- Adding dark mode support
- Ensuring responsive design
- Need accessibility improvements

**Example:**
```bash
# Install components and update design
claude-code --agent ui_shadcn --input '{
  "projectPath": "./web-app",
  "components": ["dialog", "table", "dropdown-menu", "toast"],
  "darkMode": false,
  "designTokens": {
    "primaryColor": "emerald",
    "radius": "0.5rem"
  }
}'
```

### 9. SEMrush Analytical Finder
**File:** `semrush_analytical_finder.json`
**Role:** SEO data integration specialist
**Purpose:** Integrates SEMrush API for keyword research and competitor analysis

**When to Use:**
- Setting up SEMrush API integration
- Adding keyword research features
- Implementing competitor tracking
- Creating SEO dashboards with real data
- Building data export features

**Example:**
```bash
# Integrate SEMrush for domain
claude-code --agent semrush_analytical_finder --input '{
  "projectPath": "./web-app",
  "domain": "disasterrecovery.com.au",
  "mockData": true,
  "features": ["keywords", "domain_overview", "competitors"]
}'
```

### 10. Vercel Deployment Manager
**File:** `vercel_deployment_manager.json`
**Role:** Production deployment and health monitoring
**Purpose:** Manages Vercel deployments, validates production health, handles rollbacks

**When to Use:**
- Deploying to production or preview
- Validating deployment succeeded
- Checking environment variables are configured
- Monitoring deployment health
- Rolling back failed deployments
- Troubleshooting deployment issues

**Example:**
```bash
# Deploy to production with validation
claude-code --agent vercel_deployment_manager --input '{
  "projectPath": "./web-app",
  "environment": "production",
  "validateEndpoints": ["/", "/api/health/check", "/companies"],
  "autoRollback": true
}'

# Deploy preview for testing
claude-code --agent vercel_deployment_manager --input '{
  "projectPath": "./web-app",
  "environment": "preview",
  "autoRollback": false
}'
```

### 11. Database Schema Manager
**File:** `database_schema_manager.json`
**Role:** Database schema management and validation
**Purpose:** Manages Supabase schemas, generates TypeScript types, validates data integrity

**When to Use:**
- Validating database schema structure
- Generating TypeScript types from database
- Adding missing indexes for performance
- Creating ERD documentation
- Checking foreign key relationships
- Implementing RLS policies
- Creating database migrations

**Example:**
```bash
# Validate schema and generate types
claude-code --agent database_schema_manager --input '{
  "projectPath": "./",
  "schemaFile": "web-app/supabase-schema.sql",
  "generateTypes": true,
  "validateIntegrity": true,
  "addIndexes": true,
  "generateERD": true
}'

# Quick schema validation only
claude-code --agent database_schema_manager --input '{
  "projectPath": "./",
  "generateTypes": false,
  "validateIntegrity": true
}'
```

### 12. Performance Monitor
**File:** `performance_monitor.json`
**Role:** Performance analysis and optimization
**Purpose:** Monitors performance metrics, identifies bottlenecks, implements optimizations

**When to Use:**
- Auditing application performance
- Optimizing Core Web Vitals
- Reducing bundle size
- Implementing performance monitoring
- Setting performance budgets
- Optimizing images and fonts
- Analyzing and fixing slow API calls

**Example:**
```bash
# Full performance audit and optimization
claude-code --agent performance_monitor --input '{
  "projectPath": "./web-app",
  "targetUrl": "https://geo-seo-domination-tool.vercel.app",
  "runLocal": true,
  "analyzeBundle": true,
  "implementMonitoring": true,
  "optimizeImages": true,
  "performanceBudget": {
    "maxBundleSize": 500,
    "maxImageSize": 200,
    "maxApiResponseTime": 500
  }
}'

# Quick Lighthouse audit only
claude-code --agent performance_monitor --input '{
  "projectPath": "./web-app",
  "targetUrl": "https://your-site.vercel.app",
  "analyzeBundle": false,
  "implementMonitoring": false
}'
```

## 🔄 Typical Workflow

### Building a New Feature (Full Stack)

**Step 1: Orchestrate**
```bash
claude-code --agent orchestra --input '{
  "projectPath": "./web-app",
  "domain": "yourdomain.com"
}'
```
Orchestra will coordinate all agents in sequence.

### OR Manual Agent Sequence:

**Step 2: Build Pages**
```bash
claude-code --agent site_builder --input '{
  "projectPath": "./web-app",
  "routes": ["/your-feature"]
}'
```

**Step 3: Wire Navigation**
```bash
claude-code --agent navigation_bar_connections --input '{
  "projectPath": "./web-app"
}'
```

**Step 4: Apply UI Components**
```bash
claude-code --agent ui_shadcn --input '{
  "projectPath": "./web-app",
  "components": ["button", "card"]
}'
```

**Step 5: Add SEO Data**
```bash
claude-code --agent semrush_analytical_finder --input '{
  "projectPath": "./web-app",
  "domain": "yourdomain.com"
}'
```

**Step 6: Validate Database Schema**
```bash
claude-code --agent database_schema_manager --input '{
  "projectPath": "./",
  "generateTypes": true
}'
```

**Step 7: Deploy Preview for Testing**
```bash
claude-code --agent devops_deployer --input '{
  "projectPath": "./web-app"
}'
```

**Step 8: Deploy to Production**
```bash
claude-code --agent vercel_deployment_manager --input '{
  "projectPath": "./web-app",
  "environment": "production"
}'
```

**Step 9: Validate & Fix Issues**
```bash
claude-code --agent evaluator_fixer --input '{
  "projectPath": "./web-app",
  "autoScaffoldMissingRoutes": true
}'
```

**Step 10: Monitor & Optimize Performance**
```bash
claude-code --agent performance_monitor --input '{
  "projectPath": "./web-app",
  "targetUrl": "https://your-production-url.vercel.app"
}'
```

### OR Bootstrap New Project:

**Option A: Site Builder Bootstrap (Minimal)**
```bash
# Create minimal Next.js + Tailwind project
claude-code --agent site_builder_bootstrap --input '{
  "workspacePath": "D:/Projects",
  "projectName": "MyNewGeoSeoApp"
}'
```

**Option B: Full Build Pipeline (Complete)**
```bash
# Create complete project with navigation, components, and mock data
claude-code --agent runner_full_build --input '{
  "workspacePath": "D:/Projects",
  "projectName": "MyGeoSeoApp",
  "domain": "disasterrecoveryqld.au",
  "scaffoldRoutes": true
}'
```

## 📋 Agent Inputs & Outputs

Each agent has defined input/output schemas. See individual JSON files for details.

### Common Inputs
- `projectPath`: Path to web-app directory (required)
- `domain`: Your domain for SEO analysis
- `mockData`: Use mock data instead of real APIs

### Common Outputs
- `summary`: Description of work completed
- `artifacts`: List of files created/modified
- `errors`: Any errors encountered
- `build_status`: Whether build succeeded

## 🛑 Stop Conditions

All agents have built-in stop conditions to prevent infinite loops:

- **Max Iterations**: Default 3-6 attempts
- **Success Checks**: Specific validation criteria
- **Build Validation**: npm run build must succeed

## 🎨 Agent Patterns Used

Based on Anthropic's effective agent patterns:

1. **Orchestrator-Workers** (Orchestra + Specialists)
2. **Prompt Chaining** (Sequential agent execution)
3. **Parallelization** (Orchestra can run agents in parallel)
4. **Evaluator-Optimizer** (Validation loops in each agent)

## 📊 Monitoring Agent Progress

Each agent logs:
- ✅ Success checks passed
- ❌ Validation failures
- 🔄 Current iteration
- 📝 Files modified
- 🏗️ Build status

## 🚀 Quick Start

1. **Install dependencies:**
```bash
cd web-app
npm install
```

2. **Run Orchestra to set up everything:**
```bash
claude-code --agent orchestra
```

3. **Or run individual agents as needed**

## 📚 Additional Resources

- [Anthropic Agent Patterns](https://www.anthropic.com/research/building-effective-agents)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [SEMrush API Docs](https://www.semrush.com/api-documentation/)

---

**Need Help?**

Check agent logs for detailed error messages and validation results. Each agent provides actionable feedback for fixing issues.
