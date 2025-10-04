# Semrush MCP Integration Guide

## What is Semrush MCP?

The Semrush Model Context Protocol (MCP) server provides AI agents with secure access to Semrush's public APIs through natural language prompts.

**MCP Endpoint:** `https://mcp.semrush.com/v1/mcp`
**Authentication:** OAuth 2.1 (automatic redirect to Semrush login)

---

## ✅ Already Configured

This project has been set up with Semrush MCP support:

- ✅ **Claude Code** - Added locally via `claude mcp add`
- ✅ **VS Code** - Configuration in `.vscode/mcp.json`
- ✅ **Service Wrapper** - `src/services/semrush-mcp.ts`
- ✅ **Environment Variables** - SEMRUSH_API_KEY in `.env`

---

## Available APIs

### 1. Trends API
Access keyword and backlink data based on your subscription level.

**Example Prompts:**
```
- "List domains in the human resources industry for July 2025"
- "Give me a traffic comparison for nike.com and adidas.com"
- "Show me keyword trends for 'digital marketing' in the US"
```

### 2. Analytics API v3
Get comprehensive domain, keyword, and URL reports.

**Example Prompts:**
```
- "Get organic search data for example.com"
- "Show me backlink profile for competitor.com"
- "Compare domain authority between site1.com and site2.com"
```

### 3. Projects API v3
Read-only access to your Semrush projects.

**Example Prompts:**
```
- "List all my Semrush projects"
- "Show position tracking data for project X"
- "Get site audit results for my website"
```

---

## Setup for Different AI Agents

### Claude Code (Already Done ✅)

The MCP server has been added to your local Claude Code configuration:

```bash
claude mcp add --transport http semrush https://mcp.semrush.com/v1/mcp
```

**Usage:**
Just write prompts in Claude Code! For example:
```
Get domain overview for example.com in the US database
```

---

### VS Code (Already Done ✅)

MCP configuration file created at `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "semrush": {
      "url": "https://mcp.semrush.com/v1/mcp"
    }
  }
}
```

**Usage:**
1. Open VS Code in this project
2. MCP server auto-connects
3. Use AI features with Semrush data access

---

### Cursor

**Setup:**
1. Open Cursor Settings
2. Navigate to: Settings → Cursor Settings → MCP & Integrations
3. Add this configuration:

```json
{
  "mcpServers": {
    "semrush": {
      "url": "https://mcp.semrush.com/v1/mcp"
    }
  }
}
```

**Usage:**
Ask Cursor questions like:
```
Compare traffic for competitor1.com and competitor2.com for the last 6 months
```

---

### Claude (Browser/Desktop)

**Setup:**
1. Open Claude (browser or desktop app)
2. Navigate to: Settings → Connectors
3. Click "Add custom connector"
4. Enter:
   - **Name:** Semrush
   - **URL:** `https://mcp.semrush.com/v1/mcp`
5. Save

**Usage:**
Chat with Claude and ask Semrush-related questions!

---

## Example Use Cases

### 1. Daily Competitor Monitoring

**Prompt:**
```
Scan keyword and backlink data for competitor.com daily and alert me
when their rankings drop or they gain significant backlinks
```

**What happens:**
- AI agent queries Semrush MCP for latest data
- Compares with previous day
- Highlights changes and opportunities

---

### 2. Automated SEO Reports

**Prompt:**
```
Generate a monthly traffic and SEO report for my-website.com and
save it to Google Docs
```

**What happens:**
- Fetches organic traffic data from Semrush
- Gets keyword rankings and backlink metrics
- Formats into report
- Saves to Google Docs automatically

---

### 3. Industry Analysis

**Prompt:**
```
Find all major players in the "health and wellness" industry with
over 100K monthly traffic and show me their top keywords
```

**What happens:**
- Queries Trends API for industry domains
- Filters by traffic threshold
- Returns top keywords for each domain

---

### 4. Keyword Gap Analysis

**Prompt:**
```
Show me keywords that competitor.com ranks for but my-site.com doesn't,
focusing on keywords with high search volume and low difficulty
```

**What happens:**
- Compares organic keywords for both domains
- Identifies gaps
- Filters by volume and difficulty
- Returns opportunities

---

## API Unit Consumption

Semrush MCP uses the same unit-based system as Semrush API.

**Check Your Balance:**
1. Go to Semrush → My Profile → Subscription Info
2. View Standard API units and Trends API units

**Typical Consumption:**
- Domain overview: 10 units
- Keyword report (100 keywords): 10 units
- Backlinks overview: 1 unit
- Organic search report: 10 units

**Refer to:**
- [Trends API Reference](https://www.semrush.com/api-documentation/)
- [API Limits & Consumption](https://www.semrush.com/kb/845-api-units)

---

## Access Requirements

**Minimum Required:**
- SEO Business plan (Standard API access), OR
- Any Trends API subscription (Basic or Premium)

**Not Included:**
- SEO plans below Business tier
- Free accounts

**Check your plan:** My Profile → Subscription Info → Summary

---

## Available MCP Tools

The AI agent will use these tools automatically:

1. **semrush_report** - Fetch specific Semrush reports
2. **semrush_report_list** - List available report types
3. **semrush_report_schema** - Get report structure/fields

You don't need to call these directly - just use natural language!

---

## Troubleshooting

### OAuth Errors

**Error:** "Redirect URI not allowed"
- Contact Semrush Support with your AI agent name
- They'll whitelist the redirect URI

### Connection Issues

**Check:**
1. MCP server URL is correct: `https://mcp.semrush.com/v1/mcp`
2. AI agent supports OAuth 2.1
3. AI agent supports streamable HTTP transport

### No Data Returned

**Verify:**
1. You have access to the API (check subscription)
2. You have enough API units (check balance)
3. Authentication completed successfully
4. Query syntax is correct

### Missing Tools

If `semrush_report`, `semrush_report_list`, or `semrush_report_schema` aren't available:

1. Verify authentication completed
2. Check Semrush access level
3. Look for errors in AI agent console

---

## Example Prompts Library

### Competitor Analysis
```
- Compare organic traffic for [site1.com] and [site2.com] over 6 months
- List top 10 competitors in the [industry] industry
- Show competitor keyword gaps for [my-site.com] vs [competitor.com]
- Track competitor [domain] traffic sources and alert on changes
```

### Keyword Research
```
- Find high-volume low-competition keywords for "[topic]"
- Get search trends for "[keyword]" in [country] for 2024
- Show related keywords for "[seed keyword]" with volume data
- Identify seasonal keyword opportunities for [industry]
```

### Backlink Analysis
```
- Get backlink profile for [domain]
- Find new backlinks for [my-site.com] in the last 30 days
- Compare backlink authority between [site1] and [site2]
- Identify toxic backlinks for [domain]
```

### Traffic Analytics
```
- Show traffic sources for [competitor.com]
- Get monthly visit trends for [my-site.com]
- Compare traffic between Q1 and Q2 for [domain]
- Analyze audience demographics for [competitor]
```

### Project Monitoring
```
- List all my Semrush projects
- Show position tracking changes for project "[name]"
- Get site audit errors and warnings for my latest project
- Track ranking improvements for target keywords
```

---

## Integration in Generated Projects

When generating new projects with the Project Generator:

1. Select a template (React + Vite, Next.js, etc.)
2. Check "Semrush MCP" in integrations
3. Generate project

**Auto-configured:**
- ✅ `.vscode/mcp.json` created
- ✅ `SEMRUSH_API_KEY` in `.env`
- ✅ `semrush-mcp.config.ts` with service wrapper
- ✅ `SEMRUSH_MCP_SETUP.md` with instructions
- ✅ Ready to use in VS Code, Claude Code, Cursor

---

## Support & Resources

**Documentation:**
- [Semrush MCP Overview](https://www.semrush.com/api-documentation/semrush-mcp/)
- [Trends API Reference](https://www.semrush.com/api-documentation/trends/)
- [Analytics API Reference](https://www.semrush.com/api-documentation/analytics/)

**Need Help?**
- Semrush Support (for API/MCP issues)
- AI Agent Documentation (for setup issues)

**Feedback:**
Each MCP integration request is reviewed individually. Contact Semrush Support to discuss custom use cases.

---

## Disclaimer

**AI-Generated Responses:**

The Semrush MCP brings API data into AI agents for information and guidance. AI responses may be incomplete or inaccurate, so always verify them before using for decisions, publication, or other critical tasks.

Semrush cannot guarantee the accuracy or reliability of AI agents and is not liable for outcomes based on their use.

---

## Quick Start Checklist

- [x] Semrush MCP added to Claude Code
- [x] VS Code MCP configuration created
- [x] SEMRUSH_API_KEY in environment variables
- [ ] Test with simple prompt: "Get domain overview for semrush.com"
- [ ] Verify OAuth authentication completes
- [ ] Check API unit consumption
- [ ] Explore example prompts above
- [ ] Integrate into your workflow!

**You're all set! Start using Semrush data in your AI agents.** 🚀
