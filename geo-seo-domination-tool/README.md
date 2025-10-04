# GEO CRM — Vercel-style Builder Platform

Welcome! This repo gives you a Vercel-like experience in your own CRM:
- **CRM UI** for blueprints, builders, deploys, release monitor.
- **MCP server** powering Claude-driven code generation.
- **`geo` CLI** mirroring Vercel commands (init, link, env, deploy, logs, release).

Advanced local SEO and GEO ranking analysis tool integrating Claude AI and SEMrush APIs to identify gaps, optimize E-E-A-T signals, and dominate Google's Local 3-Pack.

## 🚀 Features

### Core SEO Analysis
- Company & Individual Profile Builder
- Lighthouse Website Audits (Performance, Accessibility, SEO, Best Practices)
- E-E-A-T Score Calculation
- Local Pack Tracking & Share of Local Voice (SoLV)
- Competitor Analysis (SEMrush + Claude AI)
- Citation Management & NAP Consistency
- Comprehensive Reporting (PDF, Excel, HTML, JSON)

### AI Search Optimization
- **7 Proven Strategies** (120%-20,000% growth case studies)
- **Claude AI Integration** for content discovery & analysis
- **AI Visibility Tracking** across Claude, ChatGPT, Google AI
- **Campaign Management** with multi-platform targeting
- **Topic Cluster & Buyer Journey Mapping**
- **Seasonality & Authority Building Tools**

## 📋 Quickstart (Windows + VS Code)

1. **Clone** and open in VS Code.
2. **Run bootstrap** (installs deps, builds MCP/Web, links CLI, health check):
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/bootstrap.ps1
   ```
3. Open **Run and Debug → Run All: Web + MCP + Worker** (or Tasks: *Web: dev*, *MCP: start*).
4. Visit **http://localhost:3000** → **/projects/catalog**, **/settings/integrations**, **/release/monitor**, **/health**.
5. (Optional) One-shot scaffold:
   ```bash
   geo init --id saas-starter --owner YOUR_ORG --repo my-saas
   ```

## What's inside
- **web-app/** Next.js CRM
- **tools/geo-builders-mcp/** MCP server (TypeScript)
- **tools/geo-cli/** `geo` CLI
- **infra/docker/** Docker & compose
- **blueprints/** Turn-key stacks

See **docs/ARCHITECTURE.md** and **docs/OPERATIONS.md** for deeper details.

## 📋 Legacy Setup (Original SEO Tool)

   Add your API keys to `.env`:
   ```
   SEMRUSH_API_KEY=your_semrush_key
   ANTHROPIC_API_KEY=your_anthropic_key
   GOOGLE_API_KEY=your_google_key
   ```

3. **Run development:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build:win
   ```

## 🛠️ Tech Stack

- **Frontend:** Electron + React + TypeScript + TailwindCSS
- **Backend:** Express.js + SQLite
- **APIs:** SEMrush, Anthropic Claude, Google PageSpeed Insights

## 📚 Documentation

See `docs/AI_SEARCH_SEO_INTEGRATION.md` for comprehensive AI Search strategies and implementation guide.

## 🔗 Links

- **GitHub:** https://github.com/CleanExpo/GEO-SEO-Domination-Tool
- **Live Demo:** https://geo-seo-domination-tool-nk30afugb-unite-group.vercel.app
