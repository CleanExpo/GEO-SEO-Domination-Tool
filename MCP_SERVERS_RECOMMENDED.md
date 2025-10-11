# Recommended MCP Servers for GEO-SEO Domination Tool

## What Are MCP Servers?

MCP (Model Context Protocol) servers extend Claude's capabilities with specialized tools. They're particularly useful for:
- Database operations
- API integrations
- File system operations
- Web scraping
- Development tools

---

## 🎯 Essential MCP Servers for This Project

### 1. **Supabase MCP Server** (HIGHEST PRIORITY)

**Why**: Direct database access for credentials, tasks, and audit data

**Install**:
```bash
npx @modelcontextprotocol/server-supabase
```

**Config** (add to Claude Desktop config):
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://qwoggbbavikzhypzodcr.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key_here"
      }
    }
  }
}
```

**Capabilities**:
- Query `website_credentials` table
- Create/update `agent_tasks`
- Read audit results
- Manage automation rules

### 2. **Playwright MCP Server** (ALREADY INSTALLED ✅)

**Why**: Test automation, website verification, screenshot capture

**Capabilities**:
- Test credential connections
- Capture before/after screenshots
- Verify task completion
- Navigate WordPress admin

**Already configured** - no action needed!

### 3. **GitHub MCP Server**

**Why**: Manage code-based sites, create PRs for fixes

**Install**:
```bash
npx @modelcontextprotocol/server-github
```

**Config**:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "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"
      }
    }
  }
}
```

**Capabilities**:
- Create branches for SEO fixes
- Commit schema markup changes
- Create PRs for review
- Manage GitHub repos

### 4. **Filesystem MCP Server**

**Why**: Direct file access for FTP operations, image optimization

**Install**:
```bash
npx @modelcontextprotocol/server-filesystem
```

**Config**:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "D:\\GEO_SEO_Domination-Tool",
        "D:\\websites"
      ]
    }
  }
}
```

**Capabilities**:
- Read/write website files
- Optimize images locally
- Create robots.txt, sitemap.xml
- Theme modifications

### 5. **PostgreSQL MCP Server** (Alternative to Supabase)

**Why**: Direct SQL access if you prefer PostgreSQL over Supabase client

**Install**:
```bash
npx @modelcontextprotocol/server-postgres
```

**Config**:
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://postgres.qwoggbbavikzhypzodcr:3McFC5u51nUOJ2IB@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres"
      }
    }
  }
}
```

### 6. **Brave Search MCP Server**

**Why**: Research competitors, find keyword opportunities

**Install**:
```bash
npx @modelcontextprotocol/server-brave-search
```

**Config**:
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your_brave_api_key"
      }
    }
  }
}
```

**Capabilities**:
- Keyword research
- Competitor analysis
- SERP analysis
- Content gap identification

---

## 🔧 Quick Setup Command

Add the most essential MCP servers at once:

```bash
# 1. Supabase (database access)
claude mcp add supabase

# 2. GitHub (code-based site fixes)
claude mcp add github

# 3. Filesystem (file operations)
claude mcp add filesystem

# Optional: PostgreSQL (alternative database access)
# claude mcp add postgres

# Optional: Brave Search (SEO research)
# claude mcp add brave-search
```

---

## 📋 Configuration File Location

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Full Example Config**:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://qwoggbbavikzhypzodcr.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGci..."
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_..."
      }
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "D:\\GEO_SEO_Domination-Tool"
      ]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/playwright"]
    }
  }
}
```

---

## 🎯 Use Cases with Our Automation System

### With Supabase MCP:
```typescript
// Query pending tasks
SELECT * FROM agent_tasks WHERE status = 'pending' ORDER BY priority;

// Create new task
INSERT INTO agent_tasks (company_id, task_type, instructions, ...)
VALUES ('uuid', 'add_h1_tag', '{"action": "add_element", ...}', ...);

// Get credentials for WordPress site
SELECT * FROM website_credentials WHERE company_id = 'uuid' AND platform_type = 'wordpress';
```

### With GitHub MCP:
```typescript
// Create branch for SEO fixes
github.createBranch('feature/seo-schema-markup');

// Commit schema markup
github.commitFile('app/services/page.tsx', content, 'feat: add LocalBusiness schema');

// Create PR
github.createPullRequest('Add SEO improvements', 'Automated schema markup and meta tags');
```

### With Filesystem MCP:
```typescript
// Optimize images
filesystem.readFile('/public/images/hero.jpg');
// ... optimize with Sharp ...
filesystem.writeFile('/public/images/hero-optimized.jpg', optimized);

// Create robots.txt
filesystem.writeFile('/public/robots.txt', robotsTxtContent);
```

### With Playwright MCP:
```typescript
// Test WordPress login
playwright.navigate('https://example.com/wp-admin');
playwright.fill('#user_login', 'admin');
playwright.fill('#user_pass', 'password');
playwright.click('#wp-submit');
// Verify successful login
```

---

## 🚀 Recommended Setup Order

1. **Supabase MCP** (for database operations) - **DO THIS FIRST**
2. **Playwright MCP** (already installed for testing)
3. **GitHub MCP** (for code-based sites)
4. **Filesystem MCP** (for file operations)

---

## 📚 Additional Resources

- [Official MCP Documentation](https://modelcontextprotocol.io/docs)
- [MCP Server Registry](https://github.com/modelcontextprotocol/servers)
- [Build Custom MCP Servers](../docs/build-assistant-tools/mcp-server-guide.md)

---

## ⚠️ Security Notes

1. **Never commit MCP config to Git** - contains sensitive tokens
2. **Use environment variables** where possible
3. **Rotate tokens regularly** (every 90 days)
4. **Limit MCP server permissions** to minimum required

---

**Next Step**: Run `claude mcp add supabase` to enable database access for the automation system!
