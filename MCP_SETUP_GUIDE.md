# MCP Servers Setup Guide

**Branch**: `feature/mcp-integrations`
**Date**: October 8, 2025
**Status**: In Progress

## Overview

Model Context Protocol (MCP) servers extend Claude Code's capabilities by providing specialized tools and integrations.

## Currently Configured MCP Servers

### ✅ Already Installed

1. **Playwright MCP** - Browser automation
   - Tools: `browser_navigate`, `browser_click`, `browser_type`, `browser_wait_for`, `browser_snapshot`, `browser_console_messages`, `browser_network_requests`
   - Use: Automated browser testing, web scraping, UI testing

2. **Vercel MCP** - Deployment management
   - Tools: `list_deployments`, `deploy_to_vercel`, `get_project`, `list_projects`, `get_deployment`, `get_deployment_build_logs`, `list_teams`
   - Use: Deploy to Vercel, check deployment status, manage projects

3. **SEMrush MCP** - SEO analytics
   - Tools: `semrush_toolkit_info`, `semrush_report_schema`, `semrush_report`
   - Use: SEO research, keyword analysis, competitor research

4. **Shadcn-UI MCP** - Component library
   - Tools: Component scaffolding for shadcn/ui
   - Use: Add UI components to Next.js projects

5. **Shadcn MCP** - Component registry
   - Tools: Access to shadcn component registry
   - Use: Install and manage UI components

## MCP Servers To Add

### 🔧 Supabase MCP

**Purpose**: Database management, authentication, storage

**Configuration** (add to Claude Code MCP settings):
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server",
        "--project-url",
        "${NEXT_PUBLIC_SUPABASE_URL}",
        "--api-key",
        "${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
      ]
    }
  }
}
```

**Environment Variables Needed**:
- `NEXT_PUBLIC_SUPABASE_URL` - Already set ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Already set ✅

**Tools Provided**:
- Database queries (SELECT, INSERT, UPDATE, DELETE)
- Table schema inspection
- Authentication user management
- Storage bucket operations
- Real-time subscriptions

**Use Cases**:
- Query saved_onboarding table
- Manage user accounts
- Upload/download files
- Check database schema
- Monitor real-time changes

### 🔧 Perplexity MCP

**Purpose**: AI-powered web search with citations

**Configuration**:
```json
{
  "mcpServers": {
    "perplexity": {
      "command": "npx",
      "args": [
        "-y",
        "@perplexity/mcp-server"
      ],
      "env": {
        "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}"
      }
    }
  }
}
```

**Environment Variables Needed**:
- `PERPLEXITY_API_KEY` - Already set ✅

**Tools Provided**:
- Web search with AI-generated answers
- Source citations
- Real-time information
- Follow-up questions

**Use Cases**:
- Research latest SEO trends
- Find current best practices
- Get answers with sources
- Verify information
- Discover new tools/techniques

### 🔧 Context7 MCP

**Purpose**: Code context and documentation analysis

**Configuration**:
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "context7-mcp-server"
      ]
    }
  }
}
```

**Tools Provided**:
- Code analysis
- Documentation extraction
- Dependency mapping
- Context-aware suggestions

**Use Cases**:
- Understand codebase structure
- Generate documentation
- Find related code
- Analyze dependencies

### 🔧 Additional Recommended MCP Servers

#### GitHub MCP
**Purpose**: GitHub repository management

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

**Environment Variables**:
- `GITHUB_TOKEN` - Already set ✅

**Tools**:
- Create/manage issues
- Pull request operations
- Repository search
- File operations
- Branch management

#### Filesystem MCP
**Purpose**: Enhanced file operations

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "D:\\GEO_SEO_Domination-Tool"
      ]
    }
  }
}
```

**Tools**:
- Read/write files
- Directory operations
- File search
- Glob patterns

#### Google Maps MCP
**Purpose**: Local SEO and location data

```json
{
  "mcpServers": {
    "google-maps": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-google-maps"
      ],
      "env": {
        "GOOGLE_API_KEY": "${GOOGLE_API_KEY}"
      }
    }
  }
}
```

**Environment Variables**:
- `GOOGLE_API_KEY` - Already set ✅

**Tools**:
- Geocoding
- Place details
- Nearby search
- Directions
- Distance matrix

**Use Cases for GEO-SEO Tool**:
- Validate business locations
- Find competitors
- Calculate service areas
- Local pack tracking
- GEO ranking analysis

## Installation Methods

### Method 1: Manual Configuration (Recommended)

1. **Open Claude Code settings**: `.claude/settings.local.json`
2. **Add MCP server config** to the file
3. **Restart Claude Code** to load new servers
4. **Test** using the tools in chat

### Method 2: Smithery CLI (Requires API Key)

```bash
npx -y @smithery/cli install <server-name> --client claude
```

**Note**: Requires Smithery API key from https://smithery.ai

### Method 3: NPX Direct (One-time Use)

```bash
npx -y <mcp-package-name>
```

**Note**: Server runs once, not persistent

## Complete MCP Configuration

Here's the complete `.claude/mcp.json` configuration file to create:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server",
        "--project-url",
        "https://qwoggbbavikzhypzodcr.supabase.co",
        "--api-key",
        "your-supabase-anon-key-here"
      ]
    },
    "perplexity": {
      "command": "npx",
      "args": ["-y", "@perplexity/mcp-server"],
      "env": {
        "PERPLEXITY_API_KEY": "pplx-your-api-key-here"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_your-github-token-here"
      }
    },
    "google-maps": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-google-maps"],
      "env": {
        "GOOGLE_API_KEY": "AIzaSyDStJB2YvcQ9_2PgbuUbZHJNEyNN24zZi8"
      }
    }
  }
}
```

## Testing MCP Servers

### Test Supabase MCP
```
Ask Claude: "Can you query the saved_onboarding table in Supabase?"
Expected: List of saved onboarding records
```

### Test Perplexity MCP
```
Ask Claude: "Search Perplexity for the latest Next.js 15 features"
Expected: AI-generated answer with sources
```

### Test GitHub MCP
```
Ask Claude: "List the open issues in this repository"
Expected: List of GitHub issues
```

### Test Google Maps MCP
```
Ask Claude: "Find businesses near Sydney Opera House"
Expected: List of nearby businesses with details
```

## Benefits for GEO-SEO Tool

### With Supabase MCP:
- ✅ Direct database queries without writing SQL
- ✅ User management through Claude
- ✅ File storage operations
- ✅ Real-time data monitoring

### With Perplexity MCP:
- ✅ Latest SEO trends research
- ✅ Competitor analysis with sources
- ✅ Find current best practices
- ✅ Verify SEO advice

### With GitHub MCP:
- ✅ Automated issue creation
- ✅ Pull request management
- ✅ Code search across repos
- ✅ Branch operations

### With Google Maps MCP:
- ✅ Validate business locations
- ✅ Local competitor research
- ✅ GEO ranking analysis
- ✅ Service area calculation

## Security Notes

⚠️ **Important**: The MCP configuration file contains API keys!

**Best Practices**:
1. ✅ Add `.claude/mcp.json` to `.gitignore`
2. ✅ Use environment variables when possible
3. ✅ Never commit API keys to git
4. ✅ Rotate keys if exposed
5. ✅ Use separate keys for dev/prod

## Troubleshooting

### Server Not Loading
1. Check Claude Code console for errors
2. Verify package name is correct
3. Ensure environment variables are set
4. Restart Claude Code

### Permission Denied
1. Add tool to `settings.local.json` permissions
2. Check API key is valid
3. Verify server is enabled in config

### Tools Not Appearing
1. Restart Claude Code
2. Check server is in `enabledMcpjsonServers` array
3. Verify MCP config syntax is valid JSON

## Next Steps

1. ✅ Create `.claude/mcp.json` config file
2. ✅ Add Supabase MCP server
3. ✅ Add Perplexity MCP server
4. ⏳ Test each server
5. ⏳ Document usage examples
6. ⏳ Update permissions in settings.local.json
7. ⏳ Commit to feature branch

## Resources

- **MCP Documentation**: https://modelcontextprotocol.io/
- **Smithery Registry**: https://smithery.ai/
- **Claude Code Docs**: https://docs.claude.com/claude-code
- **Supabase MCP**: https://github.com/supabase/mcp-server
- **Perplexity API**: https://docs.perplexity.ai/

---

**Status**: Ready to configure MCP servers
**Branch**: feature/mcp-integrations
**Next Action**: Create `.claude/mcp.json` file
