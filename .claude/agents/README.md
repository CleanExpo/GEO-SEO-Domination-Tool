# GEO-SEO Domination Tool - Agent System

This directory contains specialized AI agents for building and maintaining the GEO-SEO platform.

## 🎯 Agent Overview

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

### 3. Navigation Bar Connections
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

### 4. UI-shadcn
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

### 5. SEMrush Analytical Finder
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
