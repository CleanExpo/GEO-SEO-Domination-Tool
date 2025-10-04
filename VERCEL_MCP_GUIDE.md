# Vercel MCP Integration Guide

## What is Vercel MCP?

The Vercel Model Context Protocol (MCP) server provides AI agents with secure access to Vercel's platform through natural language prompts.

**MCP Endpoint:** `https://mcp.vercel.com`
**Project-specific:** `https://mcp.vercel.com/<teamSlug>/<projectSlug>`
**Authentication:** OAuth 2.1 (automatic)

---

## ✅ Already Configured

This project has been set up with Vercel MCP support:

- ✅ **Claude Code** - Added locally via `claude mcp add`
- ✅ **VS Code** - Configuration in `.vscode/mcp.json`
- ✅ **Service Wrapper** - `src/services/vercel-mcp.ts`
- ✅ **OAuth Authentication** - Automatic and secure

---

## Available Tool Categories

### Public Tools (No Authentication Required)

**Documentation Search:**
- Search Vercel documentation
- Navigate documentation pages
- List documentation categories

**Example Prompts:**
```
- "Search Vercel docs for 'edge functions'"
- "How do I set up environment variables in Vercel?"
- "Show me documentation about ISR in Next.js"
- "Find information about Vercel's pricing plans"
- "What are the limits for serverless functions?"
```

---

### Authenticated Tools (OAuth Required)

#### 1. Project Management
Manage your Vercel projects and configurations.

**Example Prompts:**
```
- "List all my Vercel projects"
- "Show me details for project 'my-awesome-app'"
- "Create a new project called 'portfolio-site'"
- "Update the framework preset for my project"
- "Delete old test project 'prototype-v1'"
```

#### 2. Deployment Management
Create, monitor, and manage deployments.

**Example Prompts:**
```
- "Deploy my project to production"
- "List all deployments from the last 7 days"
- "Show me the status of deployment xyz123"
- "Cancel the currently running deployment"
- "Redeploy the last successful build"
- "Show me failed deployments from this week"
```

#### 3. Log Analysis
Access and analyze deployment and runtime logs.

**Example Prompts:**
```
- "Show me deployment logs for the latest build"
- "Find all errors in production logs from today"
- "Analyze build failures from the last deployment"
- "Get runtime logs for my API route /api/users"
- "Show me all 500 errors in the last 24 hours"
- "What caused the last deployment to fail?"
```

#### 4. Environment Variables
Manage environment variables across environments.

**Example Prompts:**
```
- "List all environment variables for production"
- "Add API_KEY to production environment"
- "Update DATABASE_URL for staging"
- "Delete old LEGACY_TOKEN environment variable"
- "Show me which environment variables are encrypted"
- "Copy all env vars from production to preview"
```

#### 5. Domain Management
Configure and verify custom domains.

**Example Prompts:**
```
- "List all domains for my project"
- "Add custom domain 'example.com' to my project"
- "Verify domain 'example.com'"
- "Show DNS configuration for 'example.com'"
- "Remove domain 'old-domain.com' from my project"
```

---

## Setup for Different AI Agents

### Claude Code (Already Done ✅)

The MCP server has been added to your local Claude Code configuration:

```bash
claude mcp add --transport http vercel https://mcp.vercel.com
```

**Project-specific setup (recommended):**
```bash
claude mcp add --transport http vercel-myapp https://mcp.vercel.com/my-team/my-project
```

**Usage:**
Just write prompts in Claude Code! For example:
```
List all my Vercel projects and show which ones have failed deployments
```

---

### VS Code (Already Done ✅)

MCP configuration file created at `.vscode/mcp.json`:

```json
{
  "$schema": "https://modelcontextprotocol.io/schema/mcp.json",
  "mcpServers": {
    "vercel": {
      "url": "https://mcp.vercel.com",
      "description": "Vercel MCP server for project and deployment management"
    }
  }
}
```

**Setup Steps:**
1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Run: `MCP: List Servers`
3. Select `Vercel`
4. Click `Start Server`
5. Click `Allow` when authentication dialog appears
6. Complete OAuth flow in browser

**Usage:**
1. Open VS Code in this project
2. MCP server auto-connects with OAuth
3. Use AI features with Vercel access

---

### Cursor

**One-Click Setup:**
Click the button in Vercel docs or add manually to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "vercel": {
      "url": "https://mcp.vercel.com"
    }
  }
}
```

**Authorization:**
1. Cursor will show "Needs login" prompt
2. Click the prompt to authorize
3. Complete OAuth flow

**Usage:**
Ask Cursor questions like:
```
Analyze my deployment logs and find what's causing the 500 errors
```

---

### ChatGPT (Pro/Plus)

**Setup:**
1. Enable Developer mode in Settings → Connectors → Advanced settings
2. Open ChatGPT settings
3. In Connectors tab, create new connector:
   - Name: `Vercel`
   - MCP server URL: `https://mcp.vercel.com`
   - Authentication: `OAuth`
4. Click Create

**Usage:**
The Vercel connector will appear in "Developer mode" tool during conversations.

---

### Windsurf

Add to your `mcp_config.json`:

```json
{
  "mcpServers": {
    "vercel": {
      "serverUrl": "https://mcp.vercel.com"
    }
  }
}
```

---

### Other Supported Clients

**Devin:**
- Navigate to Settings > MCP Marketplace
- Search for "Vercel"
- Click Install

**Raycast:**
- Run "Install Server" command
- Name: `Vercel`
- Transport: `HTTP`
- URL: `https://mcp.vercel.com`

**Goose:**
Use one-click installation from Vercel docs.

**Gemini Code Assist & CLI:**
Add to `~/.gemini/settings.json`:
```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp.vercel.com"]
    }
  }
}
```

---

## Project-Specific Access (Recommended)

For better performance and automatic context, use project-specific URLs:

**Format:**
```
https://mcp.vercel.com/<teamSlug>/<projectSlug>
```

**Benefits:**
- ✅ Automatic project and team context
- ✅ Improved tool performance
- ✅ Better error handling
- ✅ No manual parameter input needed

**Finding Your Slugs:**

1. **Team Slug:**
   - Vercel Dashboard → Team Settings → General
   - Or check URL: `https://vercel.com/<team-slug>`

2. **Project Slug:**
   - Vercel Dashboard → Project Settings → General
   - Or check URL: `https://vercel.com/<team-slug>/<project-slug>`

3. **Via Vercel CLI:**
   ```bash
   vercel projects ls
   ```

**Example:**
```
https://mcp.vercel.com/acme-corp/my-awesome-app
```

**Update Configuration:**
```json
{
  "mcpServers": {
    "vercel-myapp": {
      "url": "https://mcp.vercel.com/acme-corp/my-awesome-app"
    }
  }
}
```

---

## Available MCP Tools

The AI agent will use these tools automatically:

### Public Tools
- `search_documentation` - Search Vercel docs
- `get_documentation_page` - Get specific doc page
- `list_documentation_categories` - List doc categories

### Project Tools
- `list_projects` - Get all accessible projects
- `get_project` - Get project details
- `create_project` - Create new project
- `update_project` - Update project settings
- `delete_project` - Delete project

### Deployment Tools
- `list_deployments` - Get all deployments
- `get_deployment` - Get deployment details
- `create_deployment` - Trigger new deployment
- `cancel_deployment` - Cancel running deployment
- `get_deployment_logs` - Get deployment logs
- `analyze_deployment_logs` - Analyze logs for issues

### Environment Variable Tools
- `list_environment_variables` - List all env vars
- `get_environment_variable` - Get specific env var
- `create_environment_variable` - Add new env var
- `update_environment_variable` - Update env var
- `delete_environment_variable` - Remove env var

### Domain Tools
- `list_domains` - List all domains
- `get_domain` - Get domain details
- `add_domain` - Add custom domain
- `remove_domain` - Remove domain
- `verify_domain` - Verify domain ownership

You don't need to call these directly - just use natural language!

---

## Example Use Cases

### 1. Automated Deployment Monitoring

**Prompt:**
```
Monitor my Vercel deployments and notify me via Slack when a production
deployment fails, including error logs and suggested fixes
```

**What happens:**
- AI agent watches deployment status in real-time
- Detects production deployment failures
- Extracts error logs and analyzes root cause
- Sends formatted alert to Slack with actionable insights

---

### 2. Environment Variable Management

**Prompt:**
```
Copy all environment variables from my production environment to staging,
but exclude any variables containing 'PROD' or 'SECRET'
```

**What happens:**
- Lists all production env vars
- Filters out excluded variables
- Creates matching variables in staging environment
- Reports what was copied

---

### 3. Deployment Log Analysis

**Prompt:**
```
Analyze all failed deployments from the last week, categorize errors by type,
and create a summary report with recommended fixes
```

**What happens:**
- Retrieves failed deployment logs
- Uses AI to categorize error types (build, runtime, configuration)
- Identifies patterns and root causes
- Generates markdown report with recommendations

---

### 4. Automated Documentation Search

**Prompt:**
```
I'm getting an error about edge runtime limits. Search Vercel docs and
show me relevant information about edge function limitations
```

**What happens:**
- Searches Vercel documentation for edge runtime limits
- Retrieves relevant doc pages
- Summarizes key information
- Provides links for further reading

---

### 5. Domain Configuration Assistant

**Prompt:**
```
Add 'example.com' to my project, verify it, and show me the DNS
configuration I need to add to my domain registrar
```

**What happens:**
- Adds domain to Vercel project
- Initiates domain verification
- Retrieves DNS configuration (A/CNAME records)
- Formats configuration in easy-to-follow steps

---

## Security Best Practices

### OAuth Authentication
- ✅ OAuth is automatic and secure
- ✅ Tokens are managed by the AI client
- ✅ No need to store credentials manually

### Confused Deputy Protection
- ✅ Vercel MCP requires explicit user consent for each client
- ✅ Prevents unauthorized access via malicious authorization requests
- ✅ Each connection must be approved by you

### Human Confirmation
- ✅ Enable human confirmation for destructive operations
- ✅ Review deployment and environment variable changes
- ✅ Approve domain additions/removals manually

### Prompt Injection Awareness
- ✅ Be cautious of untrusted input in AI prompts
- ✅ Review AI actions before they execute
- ✅ Don't share sensitive deployment logs publicly

### Data Protection
- ✅ Vercel MCP only operates within your Vercel account
- ✅ External tools could share data outside Vercel
- ✅ Review permissions before connecting third-party agents

---

## Troubleshooting

### OAuth Errors

**Error:** "Redirect URI not allowed"

**Solution:**
- Only approved AI clients can connect to Vercel MCP
- Check the list of supported clients above
- Contact Vercel Support if your client should be supported

---

### Connection Issues

**Error:** "Cannot connect to MCP server"

**Solution:**
1. Verify URL is correct: `https://mcp.vercel.com`
2. Check your AI client supports OAuth 2.1
3. Ensure AI client supports streamable HTTP transport
4. Try restarting your AI client

---

### Missing Tools

If Vercel MCP tools aren't available:

**Solution:**
1. Verify authentication completed successfully
2. Check you're logged into the correct Vercel account
3. Ensure your account has access to projects
4. Try disconnecting and reconnecting

---

### Tool Execution Errors

**Error:** "Project slug and Team slug are required"

**Solution:**
- Use project-specific URL instead of general endpoint
- Or manually provide team and project slugs in prompts
- Example: "List deployments for team 'acme' and project 'app'"

---

## Example Prompts Library

### Documentation & Learning
```
- "Search Vercel docs for 'edge middleware'"
- "How do I configure custom domains in Vercel?"
- "Show me documentation about incremental static regeneration"
- "What are the limits for serverless functions?"
- "Explain how Vercel Analytics works"
```

### Project Management
```
- "List all my Vercel projects"
- "Show me details for project 'my-nextjs-app'"
- "Create a new project called 'awesome-portfolio'"
- "Update the framework preset for my project to Next.js"
- "Which of my projects are using Next.js 14?"
```

### Deployment Automation
```
- "Deploy my project to production"
- "List all deployments from the last week"
- "Show me the status of the latest deployment"
- "Cancel the currently running deployment"
- "Redeploy the last successful build"
- "Which deployments failed in the last 24 hours?"
```

### Log Analysis
```
- "Show me deployment logs for the latest build"
- "Find all errors in production logs from today"
- "Analyze build failures from the last deployment"
- "Get runtime logs for my API route /api/users"
- "Show me all 500 errors in the last 24 hours"
- "What caused my last deployment to fail?"
```

### Environment Variables
```
- "List all environment variables for production"
- "Add DATABASE_URL to all environments"
- "Update API_KEY for staging environment"
- "Delete old LEGACY_TOKEN environment variable"
- "Show me which environment variables are encrypted"
- "Copy env vars from production to preview"
```

### Domain Management
```
- "List all domains for my project"
- "Add custom domain 'example.com' to my project"
- "Verify domain 'example.com'"
- "Show DNS configuration for 'example.com'"
- "Remove domain 'old-domain.com' from my project"
- "Which domains are verified and which are pending?"
```

### Team Collaboration
```
- "List all projects in my team 'acme-corp'"
- "Show deployment activity for the last sprint"
- "Which projects were deployed this month?"
- "Show me all projects with failed deployments"
- "Get deployment frequency for each project"
```

---

## Integration in Generated Projects

When generating new projects with the Project Generator:

1. Select a template (React + Vite, Next.js, etc.)
2. Check "Vercel MCP" in integrations
3. Generate project

**Auto-configured:**
- ✅ `.vscode/mcp.json` with Vercel MCP server
- ✅ `vercel-mcp.config.ts` with service wrapper
- ✅ `VERCEL_MCP_SETUP.md` with instructions
- ✅ Ready to use in VS Code, Claude Code, Cursor

---

## Supported AI Clients

- ✅ Claude Code
- ✅ Claude.ai and Claude Desktop (Pro/Max/Team/Enterprise)
- ✅ ChatGPT (Pro/Plus)
- ✅ Cursor
- ✅ VS Code with Copilot
- ✅ Devin
- ✅ Raycast
- ✅ Goose
- ✅ Windsurf
- ✅ Gemini Code Assist
- ✅ Gemini CLI

Additional clients will be added over time.

---

## API Limits and Rate Limiting

**Vercel API Rate Limits:**
- Varies by plan (Hobby, Pro, Enterprise)
- Typically 100-1000 requests per minute
- Check your Vercel plan for specific limits

**Best Practices:**
- Use project-specific URLs to reduce API calls
- Batch related operations when possible
- Monitor usage via Vercel dashboard
- Cache results for frequently accessed data

---

## Support & Resources

**Documentation:**
- [Vercel MCP Documentation](https://vercel.com/docs/mcp)
- [MCP Tools Reference](https://vercel.com/docs/mcp/tools)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Vercel API Documentation](https://vercel.com/docs/rest-api)

**Need Help?**
- Vercel Support (for MCP/API issues)
- AI Agent Documentation (for setup issues)
- MCP Community (for protocol questions)

**Feedback:**
Vercel MCP is in Beta. Submit feedback via Vercel Support or community forums.

---

## Quick Start Checklist

- [x] Vercel MCP added to Claude Code
- [x] VS Code MCP configuration created
- [ ] Test with simple prompt: "List all my Vercel projects"
- [ ] Complete OAuth authentication flow
- [ ] Test deployment management: "Show latest deployment status"
- [ ] Try documentation search: "Search docs for edge functions"
- [ ] Set up project-specific URL (optional but recommended)
- [ ] Integrate into your workflow!

**You're all set! Start automating Vercel with AI agents.** 🚀

---

## Disclaimer

**AI-Generated Responses:**

Vercel MCP brings deployment and project data into AI agents for automation and insights. AI responses may be incomplete or inaccurate, so always verify them before making critical deployment decisions.

Vercel cannot guarantee the accuracy or reliability of AI agents and is not liable for outcomes based on their use.

**Beta Agreement:**

Vercel MCP is in Public Beta. Your use is subject to Vercel's Public Beta Agreement and AI Product Terms.
