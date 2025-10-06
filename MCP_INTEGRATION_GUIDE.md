# MCP (Model Context Protocol) Integration Guide

**Date**: 2025-10-06
**Status**: ✅ MCP Server Deployed

---

## Overview

MetaCoder Sandbox now exposes an MCP (Model Context Protocol) server that allows AI assistants like Claude Desktop, Cursor, and other MCP clients to interact with the sandbox programmatically.

### What is MCP?

Model Context Protocol (MCP) is an open standard by Anthropic that enables AI assistants to:
- Access external data sources
- Execute tools and commands
- Integrate with platforms like Supabase, GitHub, Vercel
- Extend AI capabilities beyond training data

Think of it like **REST API for AI agents** - a standardized way for LLMs to interact with your applications.

---

## Deployed MCP Server

### Endpoint
```
https://geo-seo-domination-tool.vercel.app/api/mcp
```

### Transport
- **GET**: Tool discovery and resource listing
- **POST**: Tool execution and streaming responses

### Framework
- Built with **Vercel `mcp-handler`**
- Runs on Next.js Edge Runtime
- Serverless with global distribution

---

## Available Tools

### 1. create_sandbox_session

**Description**: Creates a new MetaCoder sandbox session

**Parameters**:
```typescript
{
  session_name: string,      // Name of the session
  description?: string       // Optional description
}
```

**Example**:
```typescript
{
  "session_name": "React Dashboard Project",
  "description": "Building analytics dashboard with charts"
}
```

**Returns**:
```
✅ Created sandbox session: React Dashboard Project
Session ID: 550e8400-e29b-41d4-a716-446655440000
Access at: https://geo-seo-domination-tool.vercel.app/sandbox
```

---

### 2. submit_coding_task

**Description**: Submits a code generation task to AI agents

**Parameters**:
```typescript
{
  session_id: string,              // UUID of sandbox session
  prompt: string,                  // Coding task description
  agent?: 'claude' | 'codex' | 'cursor' | 'gemini' | 'opencode',
  install_dependencies?: boolean,  // Install npm packages
  max_duration?: number           // Max duration (1-30 minutes)
}
```

**Example**:
```typescript
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "prompt": "Create a React component with Recharts bar chart for SEO metrics",
  "agent": "claude",
  "install_dependencies": true,
  "max_duration": 10
}
```

**Returns**:
```
✅ Task submitted successfully!
Task ID: 660e8400-e29b-41d4-a716-446655440000
Agent: claude
Status: pending
View at: https://geo-seo-domination-tool.vercel.app/sandbox
```

---

### 3. list_sandbox_sessions

**Description**: Lists all sandbox sessions

**Parameters**:
```typescript
{
  active_only?: boolean,  // Only show active sessions (default: true)
  limit?: number         // Max sessions to return (1-50, default: 10)
}
```

**Example**:
```typescript
{
  "active_only": false,
  "limit": 20
}
```

**Returns**:
```
📋 Sandbox Sessions (3):

• React Dashboard Project (🟢 Active)
  ID: 550e8400-e29b-41d4-a716-446655440000
  Created: 10/6/2025, 2:30:00 PM

• SEO Analytics App (🟢 Active)
  ID: 660e8400-e29b-41d4-a716-446655440001
  Created: 10/5/2025, 10:15:00 AM

• Landing Page Generator (⚪ Inactive)
  ID: 770e8400-e29b-41d4-a716-446655440002
  Created: 10/4/2025, 4:45:00 PM
```

---

### 4. get_task_status

**Description**: Gets current status and logs of a task

**Parameters**:
```typescript
{
  task_id: string  // UUID of the task
}
```

**Example**:
```typescript
{
  "task_id": "660e8400-e29b-41d4-a716-446655440000"
}
```

**Returns**:
```
⚙️ Task Status

ID: 660e8400-e29b-41d4-a716-446655440000
Status: processing
Progress: 65%
Agent: claude
Model: claude-sonnet-4-5-20250929

Prompt:
Create a React component with Recharts bar chart for SEO metrics

Recent Logs:
Installing dependencies...
Generating component structure...
Adding Recharts integration...
Optimizing code...
Running tests...

Created: 10/6/2025, 2:35:00 PM
```

---

### 5. generate_pwa_manifest

**Description**: Generates PWA manifest.json for Progressive Web App

**Parameters**:
```typescript
{
  app_name?: string,          // Default: "MetaCoder Sandbox"
  short_name?: string,        // Default: "Sandbox"
  theme_color?: string,       // Default: "#10b981" (emerald)
  background_color?: string   // Default: "#ffffff"
}
```

**Example**:
```typescript
{
  "app_name": "GEO-SEO Sandbox",
  "short_name": "GEO Sandbox",
  "theme_color": "#0891b2",
  "background_color": "#f0fdfa"
}
```

**Returns**:
```json
{
  "name": "GEO-SEO Sandbox",
  "short_name": "GEO Sandbox",
  "description": "AI-powered code generation sandbox with Claude Code, GPT-5 Codex, and more",
  "start_url": "/sandbox",
  "display": "standalone",
  "theme_color": "#0891b2",
  "background_color": "#f0fdfa",
  "icons": [...],
  "orientation": "portrait-primary",
  "categories": ["development", "productivity", "utilities"]
}
```

---

## Available Resources

### sandbox://analytics

**Description**: Real-time analytics for all sandbox sessions

**Format**: `application/json`

**Access**: Read-only

**Example Response**:
```json
{
  "total_tasks": 127,
  "by_status": {
    "completed": 95,
    "processing": 8,
    "pending": 12,
    "error": 12
  },
  "by_agent": {
    "claude": 78,
    "codex": 32,
    "gemini": 12,
    "cursor": 5
  },
  "total_tokens": 1245789,
  "total_cost": 45.67
}
```

---

## Client Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "geo-seo-sandbox": {
      "url": "https://geo-seo-domination-tool.vercel.app/api/mcp"
    }
  }
}
```

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### Cursor

Add to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "geo-seo-sandbox": {
      "url": "https://geo-seo-domination-tool.vercel.app/api/mcp"
    }
  }
}
```

### Generic MCP Client

Use the provided `mcp-config.json` file in the repository root.

---

## Integration with Supabase MCP

You can combine GEO-SEO Sandbox MCP with Supabase MCP for enhanced capabilities:

```json
{
  "mcpServers": {
    "geo-seo-sandbox": {
      "url": "https://geo-seo-domination-tool.vercel.app/api/mcp"
    },
    "supabase": {
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
```

This allows AI assistants to:
1. Query Supabase database directly (via Supabase MCP)
2. Create sandbox sessions and submit tasks (via GEO-SEO MCP)
3. Analyze sandbox analytics
4. Generate PWA configurations

---

## Use Cases

### 1. Automated Code Generation Workflow

**Scenario**: Create a React dashboard from natural language

**Claude Desktop Example**:
```
User: Create a new sandbox session called "Analytics Dashboard"
Claude: [Uses create_sandbox_session]
        ✅ Session created with ID: abc123

User: Generate a React dashboard with charts for SEO metrics
Claude: [Uses submit_coding_task with session_id=abc123]
        ✅ Task submitted, generating code with Claude Code...

User: What's the status?
Claude: [Uses get_task_status]
        Status: completed ✅
        Preview: https://geo-seo-domination-tool.vercel.app/sandbox
```

### 2. PWA Generation

**Scenario**: Generate PWA manifest and service worker

```
User: Generate a PWA manifest for MetaCoder Sandbox with cyan theme
Claude: [Uses generate_pwa_manifest]
        ✅ Here's your manifest.json...
```

### 3. Analytics and Monitoring

**Scenario**: Check sandbox usage and costs

```
User: Show me sandbox analytics
Claude: [Reads sandbox://analytics resource]
        📊 Analytics:
        - Total tasks: 127
        - Completed: 95 (75%)
        - Most used agent: Claude (61%)
        - Total cost: $45.67
```

---

## Architecture

### Request Flow

```
┌─────────────────┐
│  MCP Client     │
│  (Claude/Cursor)│
└────────┬────────┘
         │
         │ HTTPS POST
         ↓
┌─────────────────────────┐
│  Vercel Edge Function   │
│  /api/mcp/route.ts      │
└────────┬────────────────┘
         │
         ├─────────────────┐
         │                 │
         ↓                 ↓
┌────────────────┐  ┌──────────────┐
│  Supabase DB   │  │  AI Providers│
│  (Sessions,    │  │  (Claude,    │
│   Tasks)       │  │   GPT, etc.) │
└────────────────┘  └──────────────┘
```

### Tool Execution Flow

1. **Client Request**: MCP client calls tool with parameters
2. **Validation**: Zod schema validates input
3. **Database**: Query/insert to Supabase
4. **Response**: Formatted markdown/JSON response
5. **Streaming**: Server-Sent Events for real-time updates

---

## Security

### Authentication

**Current**: Public MCP server (no auth required)

**Production Recommendation**: Add OAuth 2.0 with `withMcpAuth()`:

```typescript
import { withMcpAuth } from 'mcp-handler/auth'

const handler = createMcpHandler((server) => {
  // ... tools
})

export const { GET, POST } = withMcpAuth(handler, {
  verifyToken: async (token) => {
    // Verify JWT or API key
  },
  requiredScopes: ['sandbox:read', 'sandbox:write'],
})
```

### Rate Limiting

Recommended: Add Vercel Firewall rules or middleware:

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Rate limiting logic
}

export const config = {
  matcher: '/api/mcp/:path*',
}
```

### Database Security

- ✅ Uses Supabase Row Level Security (RLS)
- ✅ Anon key with restricted permissions
- ✅ No sensitive data exposed in MCP responses

---

## Testing

### Local Testing with MCP Inspector

1. Start Next.js dev server:
```bash
cd web-app
npm run dev
```

2. Run MCP Inspector:
```bash
npx @modelcontextprotocol/inspector@latest
```

3. Connect to local MCP server:
```
http://localhost:3000/api/mcp
```

4. Test tools in the inspector UI

### Production Testing

Use Claude Desktop or Cursor configured with production URL:
```json
{
  "mcpServers": {
    "geo-seo-sandbox": {
      "url": "https://geo-seo-domination-tool.vercel.app/api/mcp"
    }
  }
}
```

---

## Deployment

### Vercel Configuration

The MCP server is automatically deployed with the Next.js app.

**Edge Runtime**: ✅ Enabled in `route.ts`
```typescript
export const runtime = 'edge'
```

**Benefits**:
- Global CDN distribution
- Low latency
- Automatic scaling
- Zero cold starts

### Environment Variables

Required in Vercel:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## Monitoring

### Vercel Analytics

- Request count
- Response times
- Error rates
- Geographic distribution

### Supabase Dashboard

- Database queries
- Storage usage
- Auth events

### Custom Analytics

Access via `sandbox://analytics` resource:
- Task completion rates
- Agent usage distribution
- Cost tracking

---

## Troubleshooting

### Error: "Tool not found"

**Solution**: Ensure MCP client config has correct URL:
```json
{
  "url": "https://geo-seo-domination-tool.vercel.app/api/mcp"
}
```

### Error: "Failed to create session"

**Check**:
1. Database migration 011 is applied
2. Supabase environment variables are set
3. RLS policies allow inserts

### Error: "Connection timeout"

**Solution**: MCP server uses Edge runtime with 30s timeout. For long-running tasks, check:
1. Task is submitted (not stuck in processing)
2. Use `get_task_status` to poll for updates

---

## Roadmap

### Phase 1 (Current) ✅
- Basic MCP server with 5 tools
- Supabase integration
- PWA manifest generation
- Analytics resource

### Phase 2 (Week 4)
- OAuth 2.0 authentication
- WebSocket support for streaming logs
- File upload tool
- Deployment tool (Vercel integration)

### Phase 3 (Week 5+)
- Multi-user sessions
- Collaboration tools
- Git integration
- Advanced analytics

---

## Resources

### Documentation
- **MCP Specification**: https://modelcontextprotocol.io/specification
- **Vercel MCP Handler**: https://github.com/vercel/mcp-handler
- **Supabase MCP**: https://supabase.com/docs/guides/getting-started/mcp

### Example Projects
- **Vercel MCP Template**: https://vercel.com/templates/next.js/model-context-protocol-mcp-with-next-js
- **MCP Servers Collection**: https://github.com/modelcontextprotocol/servers

### Tools
- **MCP Inspector**: `npx @modelcontextprotocol/inspector@latest`
- **Claude Desktop**: https://claude.ai/download

---

## Summary

✅ **Deployed**: MCP server at `/api/mcp`
✅ **Tools**: 5 tools for session/task management and PWA generation
✅ **Resources**: Real-time analytics
✅ **Integration**: Works with Claude Desktop, Cursor, and other MCP clients
✅ **Production-Ready**: Edge runtime, global distribution

**Next Steps**:
1. Configure Claude Desktop or Cursor with MCP server
2. Test tools in MCP Inspector
3. Add OAuth authentication (Phase 2)
4. Monitor usage in Vercel Analytics

---

**Status**: Ready for AI assistant integration 🤖
